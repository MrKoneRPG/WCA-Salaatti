export type ProductData = {
  id: number,
  productCode: number;
  EAN: number;
  productName: string;
  category: string;
  categoryId: number | null;
  packageSize: number;
  GnSize: string;
  price: number;
  imageUrl?: string;
}