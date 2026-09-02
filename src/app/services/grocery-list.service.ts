import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { GroceryItem } from '../models/grocery-item.model';

const STORAGE_KEY = 'grocery-list-items';

@Injectable({ providedIn: 'root' })
export class GroceryListService {
  readonly items = signal<GroceryItem[]>([]);
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    this.items.set(value ? JSON.parse(value) : []);
    this.loaded = true;
  }

  async addItem(name: string, quantity: number, category: string): Promise<void> {
    const item: GroceryItem = {
      id: crypto.randomUUID(),
      name,
      quantity,
      category,
      checked: false
    };
    this.items.update((items) => [...items, item]);
    await this.persist();
  }

  async toggleChecked(id: string): Promise<void> {
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
    await this.persist();
  }

  async removeItem(id: string): Promise<void> {
    this.items.update((items) => items.filter((item) => item.id !== id));
    await this.persist();
  }

  async clearChecked(): Promise<void> {
    this.items.update((items) => items.filter((item) => !item.checked));
    await this.persist();
  }

  private async persist(): Promise<void> {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(this.items()) });
  }
}
