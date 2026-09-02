export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  checked: boolean;
}

export const GROCERY_CATEGORIES = [
  'Produce',
  'Dairy',
  'Bakery',
  'Meat & Seafood',
  'Pantry',
  'Frozen',
  'Household',
  'Other'
] as const;
