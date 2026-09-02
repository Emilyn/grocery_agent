import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/grocery-list/grocery-list.page').then((m) => m.GroceryListPage)
  }
];
