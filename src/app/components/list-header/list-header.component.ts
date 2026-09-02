import { Component, Input, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { shareSocialOutline, exitOutline } from 'ionicons/icons';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  AlertController
} from '@ionic/angular';
import { ListSessionService } from '../../services/list-session.service';

@Component({
  selector: 'app-list-header',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel
  ],
  templateUrl: './list-header.component.html'
})
export class ListHeaderComponent {
  @Input() title = '';

  readonly session = inject(ListSessionService);
  private readonly alertController = inject(AlertController);

  constructor() {
    addIcons({ shareSocialOutline, exitOutline });
  }

  setTab(value: string): void {
    if (value === 'shopping' || value === 'inventory') {
      this.session.activeTab.set(value);
    }
  }

  async showShareCode(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Share this list',
      message: `Give this code to anyone you want to share the list with:\n\n${this.session.listCode()}`,
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
        { text: 'Leave', role: 'destructive', handler: () => void this.session.leaveList() }
      ]
    });
    await alert.present();
  }
}
