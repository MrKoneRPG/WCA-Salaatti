import "dotenv/config";
import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import express from "express";
import cors from "cors";

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

app.get("/api/entries", async (req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, productCode, ean, productName, gnSize,
              price, image, packageSize, dietaryInfo
       FROM opiskelijanumero_wcasalad
       ORDER BY id`
    );

    res.json(rows);
  } catch (error) {
    console.error("Database query failed:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Could not load the backend" });
  }
});

app.post("/api/entries", async (req, res) => {
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
      `INSERT INTO opiskelijanumero_wcasalad
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

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});