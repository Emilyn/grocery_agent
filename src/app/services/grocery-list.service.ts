import { Injectable, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../core/app-config';
import { GroceryItem } from '../models/grocery-item.model';
import { ListSessionService } from './list-session.service';

@Injectable({ providedIn: 'root' })
export class GroceryListService {
  private readonly session = inject(ListSessionService);

  readonly items = signal<GroceryItem[]>([]);

  constructor() {
    this.session.on<GroceryItem[]>('items', (items) => this.items.set(items));
  }

  async addItem(name: string, quantity: number, category: string): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, quantity, category })
    });
  }

  async toggleChecked(id: string, checked: boolean): Promise<void> {
    await this.updateItem(id, { checked });
  }

  async updateItem(id: string, patch: Partial<Omit<GroceryItem, 'id'>>): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }

  async removeItem(id: string): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/items/${id}`, { method: 'DELETE' });
  }

  async clearChecked(): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/clear-checked`, { method: 'POST' });
  }
}
