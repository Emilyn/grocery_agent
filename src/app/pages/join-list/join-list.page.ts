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
import { ListSessionService } from '../../services/list-session.service';

@Component({
  selector: 'app-join-list',
  host: { class: 'ion-page' },
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
  readonly session = inject(ListSessionService);

  joinCode = '';

  createList(): void {
    void this.session.createList();
  }

  joinList(): void {
    void this.session.joinList(this.joinCode);
  }
}
