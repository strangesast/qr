import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';

import { LabelComponent, LABEL_COMPONENT_SELECTOR } from './label/label.component';
import { UrlShortenerService } from './url-shortener.service';
// import QRCode from 'qrcode';

// reader
// npm install --save qr-scanner

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet></router-outlet>`,
  styles: [
    `
    :host {
      display: block;
      height: 100%;
      overflow: auto;
    }
    `,
  ],
})
export class AppComponent {
  constructor(injector: Injector, service: UrlShortenerService) {
    const labelComponent = createCustomElement(LabelComponent, { injector });
    customElements.define(LABEL_COMPONENT_SELECTOR, labelComponent);
    service.labelElement = {selector: LABEL_COMPONENT_SELECTOR, component: labelComponent};
  }

}
