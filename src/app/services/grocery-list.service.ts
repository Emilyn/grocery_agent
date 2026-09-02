import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../core/app-config';
import { GroceryItem } from '../models/grocery-item.model';

const STORAGE_KEY = 'grocery-list-code';

@Injectable({ providedIn: 'root' })
export class GroceryListService {
  readonly items = signal<GroceryItem[]>([]);
  readonly listCode = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private socket: Socket | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) {
      await this.connect(value);
    }
  }

  async createList(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lists`, { method: 'POST' });
      if (!res.ok) throw new Error('Could not create a list');
      const { code } = await res.json();
      await Preferences.set({ key: STORAGE_KEY, value: code });
      await this.connect(code);
    } catch {
      this.error.set('Could not create a list. Check your connection and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async joinList(rawCode: string): Promise<void> {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lists/${code}`);
      if (res.status === 404) throw new Error('not-found');
      if (!res.ok) throw new Error('request-failed');
      await Preferences.set({ key: STORAGE_KEY, value: code });
      await this.connect(code);
    } catch (err) {
      this.error.set(
        err instanceof Error && err.message === 'not-found'
          ? `No list found with code "${code}".`
          : 'Could not join that list. Check your connection and try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async leaveList(): Promise<void> {
    await Preferences.remove({ key: STORAGE_KEY });
    this.socket?.disconnect();
    this.socket = null;
    this.listCode.set(null);
    this.items.set([]);
  }

  async addItem(name: string, quantity: number, category: string): Promise<void> {
    const code = this.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, quantity, category })
    });
  }

  async toggleChecked(id: string, checked: boolean): Promise<void> {
    const code = this.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked })
    });
  }

  async removeItem(id: string): Promise<void> {
    const code = this.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/items/${id}`, { method: 'DELETE' });
  }

  async clearChecked(): Promise<void> {
    const code = this.listCode();
    if (!code) return;
    await fetch(`${API_BASE_URL}/api/lists/${code}/clear-checked`, { method: 'POST' });
  }

  private async connect(code: string): Promise<void> {
    this.socket?.disconnect();
    this.socket = io(API_BASE_URL);
    this.socket.on('items', (items: GroceryItem[]) => this.items.set(items));
    this.socket.emit('join', code);
    this.listCode.set(code);
  }
}
