import {Component, OnInit} from '@angular/core';
import {SwPush} from "@angular/service-worker";
import {HttpClient} from "@angular/common/http";
import {lastValueFrom, tap} from "rxjs";

const PUBLIC_VAPID_KEY_OF_SERVER = {
  "publicKey": "BKMBshDExl6CQiJLloq5d_w7F67jCwh_p84kP07U3OEUxRpjIJEbfTEXZdCcBZfibGBvkm1i5S4m5eckrXl33mk",
  "privateKey": "LjxT-QJI8V3X0cjokh8qelmGJ3U1_Mu-hBjcdEYlWF8"
}

interface SubscriptionItem {
  info: string;
  subscription: PushSubscription;
  id: number
}

// const apiPath = 'http://localhost:4000'
const apiPath = 'https://web-push-demo-api.onrender.com'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'web-push';
  message = '';

  allSubscriptions: SubscriptionItem[] = [];
  currentSubscription: PushSubscription | null = null;

  constructor(public swPush: SwPush, private httpClient: HttpClient) {
  }

  async ngOnInit() {
    await this.loadSubscriptions();

    this.swPush.subscription.subscribe(res => {
      this.currentSubscription = res;
      console.log('current subscription: ', res);
    });

    this.swPush.messages.subscribe(res => console.log('push message: ', res))
  }

  subscribe() {
    this.subscribeToPush();
  }

  unsubscribe() {
    if (this.currentSubscription) {
      this.swPush.unsubscribe().then(res => {
        console.log('unsubscribed')
      }, err => {
        console.error('unsubscribe failed', err)
      });

      this.httpClient.post(`${apiPath}/api/remove-subscription`, this.currentSubscription).subscribe(res => {
        this.loadSubscriptions();
      });
    } else {
      console.warn('no current subscription')
    }
  }

  removeAll() {
    this.swPush.unsubscribe().then(res => {
      console.log('unsubscribed')
    }, err => {
      console.error('unsubscribe failed', err)
    });

    this.httpClient.post(`${apiPath}/api/clear`, null).subscribe(res => {
      this.loadSubscriptions();
    });
  }

  async push(item: SubscriptionItem) {
    this.httpClient.post(`${apiPath}/api/send-notification`, {id: item.id, message: this.message}).subscribe(res => {
      this.message = '';
    });
  }

  private async subscribeToPush() {
    if (!this.currentSubscription) {
      try {
        const sub = await this.swPush.requestSubscription({
          serverPublicKey: PUBLIC_VAPID_KEY_OF_SERVER.publicKey,
        });

        console.log('new subscription: ', sub);

        await this.saveSubscription(sub)
        await this.loadSubscriptions();
        console.log(this.allSubscriptions);
      } catch (err) {
        console.error('Could not subscribe due to:', err);
      }
    }
  }

  async saveSubscription(subscription: PushSubscription) {
    return lastValueFrom(this.httpClient.post(`${apiPath}/api/save-subscription`, {
      subscription,
      info: navigator.userAgent
    }))
  };

  async loadSubscriptions() {
    return lastValueFrom(this.httpClient.get<SubscriptionItem[]>(`${apiPath}/api/subscriptions`)).then(res => {
      this.allSubscriptions = res
    });
  }
}
