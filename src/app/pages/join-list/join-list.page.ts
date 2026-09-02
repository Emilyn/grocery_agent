import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonText,
  IonSpinner
} from '@ionic/angular';
import { GroceryListService } from '../../services/grocery-list.service';

@Component({
  selector: 'app-join-list',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonText,
    IonSpinner
  ],
  templateUrl: './join-list.page.html',
  styleUrl: './join-list.page.scss'
})
export class JoinListPage {
  readonly groceryList = inject(GroceryListService);

  joinCode = '';

  createList(): void {
    void this.groceryList.createList();
  }

  joinList(): void {
    void this.groceryList.joinList(this.joinCode);
  }
}
