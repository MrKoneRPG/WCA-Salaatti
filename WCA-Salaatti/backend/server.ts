import "dotenv/config";
import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import express from "express";
import cors from "cors";
import type { plan } from "../src/types/plan";
import { validatePlan } from "./validators/planValidators";

const PRODUCT_COLUMNS = `
  id,
  productCode,
  ean AS EAN,
  productName,
  gnSize AS GnSize,
  price,
  image AS imageUrl,
  packageSize,
  dietaryInfo
`;

function toProduct(row: RowDataPacket) {
  return { ...row, price: Number(row.price) };
}

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true
});
const PORT = 3001;

function isPlanInput(value: unknown): value is plan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim() !== "" &&
    typeof candidate.cartId === "string" &&
    candidate.cartId.trim() !== "" &&
    Array.isArray(candidate.positions) &&
    candidate.positions.every(
      position =>
        typeof position === "object" &&
        position !== null &&
        Number.isInteger(position.positionNumber) &&
        (position.productId === null ||
          (Number.isInteger(position.productId) && position.productId > 0))
    )
  );
}

app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ${PRODUCT_COLUMNS} FROM products
       ORDER BY id`
    );

    res.json(rows);
  } catch (error) {
    console.error("Database query failed:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not load the backend" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ error: "Product id must be a positive whole number" });
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.status(200).json(toProduct(rows[0]));
  } catch (error) {
    console.error("Database query failed:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not load the product" });
  }
});

app.post("/api/products", async (req, res) => {
  const { productCode, ean, productName, gnSize, price, image, packageSize, dietaryInfo } = req.body;

  const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
  const isOptionalString = (v: unknown) => v === undefined || v === null || typeof v === "string";

  if (
    !isNonEmptyString(productCode) ||
    typeof ean !== "string" || !/^\d{8}(\d{5})?$/.test(ean.trim()) ||
    !isNonEmptyString(productName) ||
    !isNonEmptyString(gnSize) ||
    typeof price !== "number" || !Number.isFinite(price) || price < 0 ||
    !isOptionalString(image) ||
    !isNonEmptyString(packageSize) ||
    !isOptionalString(dietaryInfo)
  ) {
    return res.status(400).json({ error: "Invalid product entry" });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO products
       (productCode, ean, productName, gnSize, price, image, packageSize, dietaryInfo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productCode.trim(),
        ean.trim(),
        productName.trim(),
        gnSize.trim(),
        price,
        image?.trim() || null,
        packageSize.trim(),
        dietaryInfo?.trim() || null,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Could not save entry:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not save entry" });
  }
});

app.get("/api/categories", async (req, res) => {
  try{
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, productCategories
      FROM productCategories
      ORDER BY id`
    );
    res.json(rows);
  }
  catch(error){
    console.error("Database quary failed:", error instanceof Error ? error.message : "Unknow Error");
    res.status(500).json({error : "Could not load the backend"})
  }
});

app.get("/api/carts", async (req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, capacity FROM carts ORDER BY id`
    );
    res.json(rows);
  } catch (error) {
    console.error("Database query failed:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not load the carts" });
  }
});

app.get("/api/plans", async (req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, cart_id AS cartId FROM plans ORDER BY id`
    );
    res.json(rows);
  } catch (error) {
    console.error("Database query failed:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not load the plans" });
  }
});

app.post("/api/plans", async (req, res) => {
  if (!isPlanInput(req.body)) {
    return res.status(400).json({ error: "Invalid plan entry" });
  }

  const newPlan: plan = {
    name: req.body.name.trim(),
    cartId: req.body.cartId.trim(),
    positions: req.body.positions
  };

  let validation;
  try {
    validation = await validatePlan(newPlan, pool);
  } catch (error) {
    console.error("Plan validation query failed:", error instanceof Error ? error.message : "Unknown error");
    return res.status(500).json({ error: "Could not validate the plan" });
  }

  if (!validation.valid) {
    return res.status(400).json({ error: "Invalid plan entry", details: validation.errors });
  }

  let connection: Awaited<ReturnType<typeof pool.getConnection>> | undefined;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO plans (name, cart_id) VALUES (?, ?)`,
      [newPlan.name, newPlan.cartId]
    );

    for (const position of newPlan.positions) {
      if (position.productId === null) {
        continue;
      }

      await connection.execute<ResultSetHeader>(
        `INSERT INTO plan_positions (plan_id, position_number, product_id) VALUES (?, ?, ?)`,
        [result.insertId, position.positionNumber, position.productId]
      );
    }

    await connection.commit();
    transactionStarted = false;
    res.status(201).json({ ...newPlan, id: result.insertId });
  } catch (error) {
    if (transactionStarted && connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Plan transaction rollback failed:", rollbackError instanceof Error ? rollbackError.message : "Unknown error");
      }
    }
    console.error("Could not save plan:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not save the plan" });
  } finally {
    connection?.release();
  }
});

app.get("/api/plans/:id" , async (req,res) =>{
  const { id } = req.params;

  if(!/^[1-9]\d*$/.test(id))
  {
    return res.status(400).json({
      error: "Plan id must be a positive whole number"
    });
  }
  try{
    const [planRows] = await pool.execute<RowDataPacket[]>(
  `SELECT id, name, cart_id
   FROM plans
   WHERE id = ?`,
  [Number(id)]
);

if (planRows.length === 0) {
  return res.status(404).json({
    error: "Plan not found"
  });
}

const plan = planRows[0];
    const [cartRows] = await pool.execute<RowDataPacket[]>(
      `SELECT capacity
      FROM carts
      WHERE id = ?`,
      [plan.cart_id]
     );
     const capacity = Number(cartRows[0].capacity);

     const [positionRows] =
     await pool.execute<RowDataPacket[]>(
      `SELECT position_number, product_id
      FROM plan_positions
      WHERE plan_id = ?
      ORDER BY position_number`,
    [plan.id]);

    const positions = [];
    for (let i = 1;i <= capacity;i++)
    {
      positions.push({
        positionNumber: i,
        productId: null
      });
    }
    for (const row of positionRows)
    {
      positions[row.position_number - 1] = {
        positionNumber: row.position_number,
        productId: row.product_id
      };
    }
    return res.json({
    id: plan.id,
    name: plan.name,
    cartId: plan.cart_id,
    positions
  });
}
  catch(error){
   console.error(
      "Database quary failed:",
      error instanceof Error
      ? error.message
      : "Unknown error"
    );

    return res.status(500).json({
      error: "Could not load plan"
    });
  }
  });
  


app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
