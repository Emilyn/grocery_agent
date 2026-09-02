import { Component, OnInit, inject } from '@angular/core';
import { GroceryListService } from '../../services/grocery-list.service';
import { JoinListPage } from '../join-list/join-list.page';
import { GroceryListPage } from '../grocery-list/grocery-list.page';

@Component({
  selector: 'app-home',
  imports: [JoinListPage, GroceryListPage],
  template: `
    @if (groceryList.listCode(); as code) {
      <app-grocery-list />
    } @else {
      <app-join-list />
    }
  `
})
export class HomePage implements OnInit {
  readonly groceryList = inject(GroceryListService);

  async ngOnInit(): Promise<void> {
    await this.groceryList.init();
  }
}
