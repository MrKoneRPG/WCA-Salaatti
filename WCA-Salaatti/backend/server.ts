import express from "express";
import cors from "cors";

type ProductData = {
  productCode: number;
  EAN: number;
  productName: string;
  category: string;
  packageSize: number;
  GnSize: string;
  price: number;
  imageUrl: string;
};

const app = express();
app.use(cors());
const PORT = 3001;

const entries: ProductData[] = [
  {
    productCode: 95429,
    EAN: 6406510954293,
    productName: "Ananas suikale tuore",
    category: "Hedelmät",
    packageSize: 1.00,
    GnSize: "GN 1/4",
    price: 5.60,
    imageUrl: "HeeHee",
  },
  {
    productCode: 95429,
    EAN: 6406510954293,
    productName: "Ananas suikale tuore",
    category: "Hedelmät",
    packageSize: 1.00,
    GnSize: "GN 1/4",
    price: 5.60,
    imageUrl: "HeeHee",
  }
];

app.get("/api/entries", (req, res) => {
  res.json(entries);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});