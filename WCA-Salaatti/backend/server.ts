import "dotenv/config";
import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import express from "express";
import cors from "cors";

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

type ProductData = {
  productCode: number;
  EAN: number;
  productName: string;
  category: string;
  packageSize: number;
  GnSize?: string;
  price: number;
  imageUrl: string;
};

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

app.post("/api/plans", async (req, res) => {
  const { name, cartId, positions } = req.body;

  const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(cartId) ||
    !Array.isArray(positions) ||
    !positions.every(pos => typeof pos === "object" && pos !== null && isNonEmptyString(pos.productCode) &&
     Number.isInteger(pos.slotIndex) && pos.slotIndex >= 0)
  ) {
    return res.status(400).json({ error: "Invalid plan entry" });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO plans (name, CartId, positions) VALUES (?, ?, ?)`,
      [name.trim(), cartId.trim(), JSON.stringify(positions)]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Could not save entry:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not save entry" });
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
