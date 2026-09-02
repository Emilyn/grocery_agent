const CATEGORY_ICONS: Record<string, string> = {
  Produce: 'leaf-outline',
  Dairy: 'water-outline',
  Bakery: 'pizza-outline',
  'Meat & Seafood': 'fish-outline',
  Pantry: 'file-tray-stacked-outline',
  Frozen: 'snow-outline',
  Household: 'home-outline',
  Other: 'ellipsis-horizontal-outline'
};

export function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? CATEGORY_ICONS['Other'];
}
