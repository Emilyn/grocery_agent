import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { addCircleOutline, trashOutline, trashBinOutline } from 'ionicons/icons';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonButton,
  IonFooter,
  IonToolbar,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonItemGroup
} from '@ionic/angular';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { GroceryListService } from '../../services/grocery-list.service';
import { GROCERY_CATEGORIES, GroceryItem } from '../../models/grocery-item.model';

@Component({
  selector: 'app-grocery-list',
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    ListHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonButton,
    IonFooter,
    IonToolbar,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonItemGroup
  ],
  templateUrl: './grocery-list.page.html',
  styleUrl: './grocery-list.page.scss'
})
export class GroceryListPage {
  private readonly groceryList = inject(GroceryListService);

  readonly categories = GROCERY_CATEGORIES;
  newItemName = '';
  newItemQuantity = 1;
  newItemCategory: string = GROCERY_CATEGORIES[0];

  readonly groupedItems = computed(() => {
    const groups: Array<[string, GroceryItem[]]> = [];
    for (const category of this.categories) {
      const items = this.groceryList.items().filter((item) => item.category === category);
      if (items.length) groups.push([category, items]);
    }
    return groups;
  });

  readonly checkedCount = computed(
    () => this.groceryList.items().filter((item) => item.checked).length
  );

  constructor() {
    addIcons({ addCircleOutline, trashOutline, trashBinOutline });
  }

  async addItem(): Promise<void> {
    const name = this.newItemName.trim();
    if (!name) return;
    await this.groceryList.addItem(name, this.newItemQuantity, this.newItemCategory);
    this.newItemName = '';
    this.newItemQuantity = 1;
  }

  toggleChecked(item: GroceryItem): void {
    void this.groceryList.toggleChecked(item.id, !item.checked);
  }

  removeItem(id: string): void {
    void this.groceryList.removeItem(id);
  }

  clearChecked(): void {
    void this.groceryList.clearChecked();
  }
}
