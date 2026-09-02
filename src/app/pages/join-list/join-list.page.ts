import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { basket, addCircleOutline, keyOutline, peopleOutline } from 'ionicons/icons';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonButton,
  IonInput,
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/angular';
import { ListSessionService } from '../../services/list-session.service';

@Component({
  selector: 'app-join-list',
  host: { class: 'ion-page' },
  imports: [
    FormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonButton,
    IonInput,
    IonIcon,
    IonText,
    IonSpinner
  ],
  templateUrl: './join-list.page.html',
  styleUrl: './join-list.page.scss'
})
export class JoinListPage {
  readonly session = inject(ListSessionService);

  joinCode = '';

  constructor() {
    addIcons({ basket, addCircleOutline, keyOutline, peopleOutline });
  }

  createList(): void {
    void this.session.createList();
  }

  joinList(): void {
    void this.session.joinList(this.joinCode);
  }
}
