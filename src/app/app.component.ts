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

  constructor(public swPush: SwPush, private httpClient: HttpClient) {
  }

  async ngOnInit() {
    await this.loadSubscriptions();

    console.log('subscription', this.swPush.subscription);

    this.swPush.messages.subscribe(res => console.log('push message: ', res))
  }

  subscribe() {
    this.subscribeToPush();
  }

  async push(item: SubscriptionItem) {
    const SERVER_URL = `${apiPath}/api/send-notification`;
    const response = await fetch(SERVER_URL, {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({id: item.id, message: this.message})
    });

    this.message = '';
  }

  private async subscribeToPush() {
    try {
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: PUBLIC_VAPID_KEY_OF_SERVER.publicKey,
      });

      console.log(sub);

      await this.saveSubscription(sub)
      await this.loadSubscriptions();

      console.log(this.allSubscriptions);
    } catch (err) {
      console.error('Could not subscribe due to:', err);
    }
  }

  async saveSubscription(subscription: PushSubscription)  {
    const SERVER_URL = `${apiPath}/api/save-subscription`;
    const response = await fetch(SERVER_URL, {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({subscription, info: navigator.userAgent})
    });

    return response.json();
  };

  async loadSubscriptions() {
    return lastValueFrom(this.httpClient.get<SubscriptionItem[]>(`${apiPath}/api/subscriptions`)).then(res => {
      this.allSubscriptions = res
    });
  }
}
