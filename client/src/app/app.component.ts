import { ChangeDetectionStrategy, Component } from '@angular/core';
// import QRCode from 'qrcode';

// reader
// npm install --save qr-scanner

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <router-outlet></router-outlet>
  `,
  styles: [
    `
    :host {
      display: block;
    }
    `,
  ],
})
export class AppComponent {}
