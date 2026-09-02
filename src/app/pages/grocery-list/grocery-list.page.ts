import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  add,
  trashOutline,
  trashBinOutline,
  basketOutline,
  leafOutline,
  waterOutline,
  pizzaOutline,
  fishOutline,
  fileTrayStackedOutline,
  snowOutline,
  homeOutline,
  ellipsisHorizontalOutline
} from 'ionicons/icons';
import {
  IonContent,
  IonList,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonCheckbox,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonButton,
  IonBadge,
  IonFooter,
  IonToolbar,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonItemGroup,
  ModalController
} from '@ionic/angular';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { GroceryListService } from '../../services/grocery-list.service';
import { GROCERY_CATEGORIES, GroceryItem } from '../../models/grocery-item.model';
import { categoryIcon } from '../../utils/category-icons';
import { EditItemModalComponent } from './edit-item-modal/edit-item-modal.component';

@Component({
  selector: 'app-grocery-list',
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    ListHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonCheckbox,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonButton,
    IonBadge,
    IonFooter,
    IonToolbar,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonItemGroup
  ],
  templateUrl: './grocery-list.page.html',
  styleUrl: './grocery-list.page.scss'
})
export class GroceryListPage {
  private readonly groceryList = inject(GroceryListService);
  private readonly modalController = inject(ModalController);

  readonly categories = GROCERY_CATEGORIES;
  readonly categoryIcon = categoryIcon;
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
    addIcons({
      add,
      trashOutline,
      trashBinOutline,
      basketOutline,
      leafOutline,
      waterOutline,
      pizzaOutline,
      fishOutline,
      fileTrayStackedOutline,
      snowOutline,
      homeOutline,
      ellipsisHorizontalOutline
    });
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

  async editItem(item: GroceryItem): Promise<void> {
    const modal = await this.modalController.create({
      component: EditItemModalComponent,
      componentProps: { item }
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      await this.groceryList.updateItem(item.id, data);
    }
  }
}
