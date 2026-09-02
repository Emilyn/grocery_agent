import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  add,
  trashOutline,
  trashBinOutline,
  cubeOutline,
  scaleOutline,
  calendarOutline,
  cashOutline,
  ellipseOutline,
  timeOutline,
  checkmarkCircle,
  cartOutline
} from 'ionicons/icons';
import {
  IonContent,
  IonList,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonButton,
  IonBadge,
  IonFab,
  IonFabButton,
  IonItemGroup,
  ModalController,
  AlertController
} from '@ionic/angular';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { InventoryService } from '../../services/inventory.service';
import { InventoryItem, InventoryStatus } from '../../models/inventory-item.model';
import { daysUntil } from '../../utils/date';
import { AddInventoryItemModalComponent } from './add-inventory-item-modal/add-inventory-item-modal.component';

const NEXT_STATUS: Record<InventoryStatus, InventoryStatus> = {
  unused: 'opened',
  opened: 'used',
  used: 'unused'
};

const STATUS_ICON: Record<InventoryStatus, string> = {
  unused: 'ellipse-outline',
  opened: 'time-outline',
  used: 'checkmark-circle'
};

const STATUS_COLOR: Record<InventoryStatus, string> = {
  unused: 'medium',
  opened: 'warning',
  used: 'success'
};

@Component({
  selector: 'app-inventory',
  host: { class: 'ion-page' },
  imports: [
    CurrencyPipe,
    NgTemplateOutlet,
    ListHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonButton,
    IonBadge,
    IonFab,
    IonFabButton,
    IonItemGroup
  ],
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss'
})
export class InventoryPage {
  private readonly inventory = inject(InventoryService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  readonly unusedItems = computed(() =>
    this.inventory.items().filter((item) => item.status === 'unused')
  );
  readonly openedItems = computed(() =>
    this.inventory.items().filter((item) => item.status === 'opened')
  );
  readonly usedItems = computed(() =>
    this.inventory.items().filter((item) => item.status === 'used')
  );

  constructor() {
    addIcons({
      add,
      trashOutline,
      trashBinOutline,
      cubeOutline,
      scaleOutline,
      calendarOutline,
      cashOutline,
      ellipseOutline,
      timeOutline,
      checkmarkCircle,
      cartOutline
    });
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

  statusIcon(item: InventoryItem): string {
    return STATUS_ICON[item.status];
  }

  statusColor(item: InventoryItem): string {
    return STATUS_COLOR[item.status];
  }

  async advanceStatus(item: InventoryItem): Promise<void> {
    if (item.status !== 'opened') {
      void this.inventory.setStatus(item.id, NEXT_STATUS[item.status]);
      return;
    }

    // The moment an item would become "used", let the user decide what
    // happens to it instead of just flipping a status flag.
    const alert = await this.alertController.create({
      header: `Finished with ${item.name}?`,
      message: 'Add it to the shopping list to buy more, or delete it for good.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete permanently',
          role: 'destructive',
          handler: () => void this.inventory.removeItem(item.id)
        },
        {
          text: 'Add to shopping list',
          handler: () => void this.inventory.finishItem(item.id)
        }
      ]
    });
    await alert.present();
  }

  removeItem(id: string): void {
    void this.inventory.removeItem(id);
  }

  finishItem(id: string): void {
    void this.inventory.finishItem(id);
  }

  clearUsed(): void {
    void this.inventory.clearUsed();
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
