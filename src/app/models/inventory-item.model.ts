export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weightValue: number | null;
  weightUnit: string | null;
  expiryDate: string; // YYYY-MM-DD
  purchaseDate: string | null; // YYYY-MM-DD
  price: number | null;
}

export const WEIGHT_UNITS = ['g', 'kg', 'lb', 'oz'] as const;

export interface NewInventoryItem {
  name: string;
  quantity: number;
  weightValue: number | null;
  weightUnit: string | null;
  expiryDate: string;
  purchaseDate: string | null;
  price: number | null;
}
