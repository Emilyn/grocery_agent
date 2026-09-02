import { Injectable, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../core/app-config';
import { InventoryItem, InventoryStatus, NewInventoryItem } from '../models/inventory-item.model';
import { ListSessionService } from './list-session.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly session = inject(ListSessionService);

  readonly items = signal<InventoryItem[]>([]);

  constructor() {
    this.session.on<InventoryItem[]>('inventory', (items) => this.items.set(items));
  }

  async addItem(input: NewInventoryItem): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  }

  async updateItem(id: string, patch: Partial<Omit<InventoryItem, 'id'>>): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }

  async setStatus(id: string, status: InventoryStatus): Promise<void> {
    await this.updateItem(id, { status });
  }

  async removeItem(id: string): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/inventory/${id}`, { method: 'DELETE' });
  }

  async clearUsed(): Promise<void> {
    const code = this.session.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/inventory/clear-used`, { method: 'POST' });
  }
}
