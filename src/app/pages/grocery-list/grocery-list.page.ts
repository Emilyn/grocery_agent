import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  trashOutline,
  trashBinOutline,
  shareSocialOutline,
  exitOutline
} from 'ionicons/icons';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
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
  IonButtons,
  IonFooter,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonItemGroup,
  AlertController
} from '@ionic/angular';
import { GroceryListService } from '../../services/grocery-list.service';
import { GROCERY_CATEGORIES, GroceryItem } from '../../models/grocery-item.model';

@Component({
  selector: 'app-grocery-list',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
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
    IonButtons,
    IonFooter,
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
  private readonly alertController = inject(AlertController);

  readonly categories = GROCERY_CATEGORIES;
  readonly listCode = this.groceryList.listCode;
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
    addIcons({ addCircleOutline, trashOutline, trashBinOutline, shareSocialOutline, exitOutline });
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

  async showShareCode(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Share this list',
      message: `Give this code to anyone you want to share the list with:\n\n${this.listCode()}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async leaveList(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Leave this list?',
      message: "You'll need the share code again to rejoin.",
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Leave', role: 'destructive', handler: () => void this.groceryList.leaveList() }
      ]
    });
    await alert.present();
  }
}
