import { Component, OnInit, inject } from '@angular/core';
import { ListSessionService } from '../../services/list-session.service';
import { JoinListPage } from '../join-list/join-list.page';
import { GroceryListPage } from '../grocery-list/grocery-list.page';
import { InventoryPage } from '../inventory/inventory.page';

@Component({
  selector: 'app-home',
  imports: [JoinListPage, GroceryListPage, InventoryPage],
  template: `
    @if (session.listCode()) {
      @switch (session.activeTab()) {
        @case ('inventory') {
          <app-inventory />
        }
        @default {
          <app-grocery-list />
        }
      }
    } @else {
      <app-join-list />
    }
  `
})
export class HomePage implements OnInit {
  readonly session = inject(ListSessionService);

  async ngOnInit(): Promise<void> {
    await this.session.init();
  }
}
