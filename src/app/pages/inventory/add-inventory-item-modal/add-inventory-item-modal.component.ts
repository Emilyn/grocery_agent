import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  pricetagOutline,
  listOutline,
  scaleOutline,
  calendarOutline,
  cartOutline,
  cashOutline
} from 'ionicons/icons';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';
import { NewInventoryItem, WEIGHT_UNITS } from '../../../models/inventory-item.model';

@Component({
  selector: 'app-add-inventory-item-modal',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './add-inventory-item-modal.component.html'
})
export class AddInventoryItemModalComponent {
  private readonly modalController = inject(ModalController);

  readonly weightUnits = WEIGHT_UNITS;

  constructor() {
    addIcons({ pricetagOutline, listOutline, scaleOutline, calendarOutline, cartOutline, cashOutline });
  }

  name = '';
  quantity = 1;
  weightValue: number | null = null;
  weightUnit: string = WEIGHT_UNITS[0];
  expiryDate = '';
  purchaseDate = '';
  price: number | null = null;

  get canSave(): boolean {
    return this.name.trim().length > 0 && this.expiryDate.length > 0;
  }

  cancel(): void {
    void this.modalController.dismiss(null, 'cancel');
  }

  save(): void {
    if (!this.canSave) return;
    const item: NewInventoryItem = {
      name: this.name.trim(),
      quantity: this.quantity > 0 ? Math.floor(this.quantity) : 1,
      weightValue: this.weightValue,
      weightUnit: this.weightValue != null ? this.weightUnit : null,
      expiryDate: this.expiryDate,
      purchaseDate: this.purchaseDate || null,
      price: this.price
    };
    void this.modalController.dismiss(item, 'confirm');
  }
}
