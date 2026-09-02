import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonBadge,
  IonFab,
  IonFabButton,
  ModalController
} from '@ionic/angular';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { InventoryService } from '../../services/inventory.service';
import { InventoryItem } from '../../models/inventory-item.model';
import { daysUntil } from '../../utils/date';
import { AddInventoryItemModalComponent } from './add-inventory-item-modal/add-inventory-item-modal.component';

@Component({
  selector: 'app-inventory',
  host: { class: 'ion-page' },
  imports: [
    CurrencyPipe,
    ListHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonBadge,
    IonFab,
    IonFabButton
  ],
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss'
})
export class InventoryPage {
  private readonly inventory = inject(InventoryService);
  private readonly modalController = inject(ModalController);

  readonly items = this.inventory.items;

  constructor() {
    addIcons({ addOutline, trashOutline });
  }

  expiryLabel(item: InventoryItem): string {
    const days = daysUntil(item.expiryDate);
    if (days < 0) return `Expired ${Math.abs(days)}d ago`;
    if (days === 0) return 'Expires today';
    return `${days}d left`;
  }

  expiryColor(item: InventoryItem): string {
    const days = daysUntil(item.expiryDate);
    if (days < 0) return 'danger';
    if (days <= 3) return 'warning';
    return 'success';
  }

  removeItem(id: string): void {
    void this.inventory.removeItem(id);
  }

  async openAddModal(): Promise<void> {
    const modal = await this.modalController.create({ component: AddInventoryItemModalComponent });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      await this.inventory.addItem(data);
    }
  }
}
