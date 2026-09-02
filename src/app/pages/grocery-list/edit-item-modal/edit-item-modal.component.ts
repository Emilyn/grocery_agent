import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';
import { GROCERY_CATEGORIES, GroceryItem } from '../../../models/grocery-item.model';

export interface GroceryItemEdits {
  name: string;
  quantity: number;
  category: string;
}

@Component({
  selector: 'app-edit-item-modal',
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
    IonInput,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './edit-item-modal.component.html'
})
export class EditItemModalComponent implements OnInit {
  @Input({ required: true }) item!: GroceryItem;

  private readonly modalController = inject(ModalController);

  readonly categories = GROCERY_CATEGORIES;

  name = '';
  quantity = 1;
  category: string = GROCERY_CATEGORIES[0];

  ngOnInit(): void {
    this.name = this.item.name;
    this.quantity = this.item.quantity;
    this.category = this.item.category;
  }

  get canSave(): boolean {
    return this.name.trim().length > 0;
  }

  cancel(): void {
    void this.modalController.dismiss(null, 'cancel');
  }

  save(): void {
    if (!this.canSave) return;
    const edits: GroceryItemEdits = {
      name: this.name.trim(),
      quantity: this.quantity > 0 ? Math.floor(this.quantity) : 1,
      category: this.category
    };
    void this.modalController.dismiss(edits, 'confirm');
  }
}
