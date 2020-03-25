import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import QrScanner from 'qr-scanner';
// import QrScannerWorkerPath from '!!file-loader!./node_modules/qr-scanner/qr-scanner-worker.min.js';
import { UrlShortenerService } from '../url-shortener.service';

@Component({
  selector: 'app-advanced-container',
  template: `
  <header>
    <h1>Update or create shortened URL</h1>
  </header>
  <app-edit-component [value]="value" (update)="itemUpdated($event)"></app-edit-component>
  <video #video></video>
  `,
  styles: [
    `
    :host {
      display: block;
    }
    header {
      margin: 40px 12px 12px 20px;
    }
    `
  ]
})
export class AdvancedContainerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('video') video: ElementRef;

  state = this.router.getCurrentNavigation().extras.state;

  value;

  qr;

  cb = (e) => console.log(e);

  constructor(
    public fb: FormBuilder,
    public service: UrlShortenerService,
    public router: Router,
  ) {
  }

  itemUpdated(item) {
    this.service.update(item).subscribe(
      res => console.log('updated!', res),
      err => console.log('failed to update'),
      () => this.router.navigate(['/']),
    );
  }

  ngOnInit(): void {
    if (this.state != null && this.state.item) {
      this.value = this.state.item;
    }
  }

  ngAfterViewInit() {
    this.qr = new QrScanner(this.video.nativeElement, this.cb);
  }

  ngOnDestroy() {
    this.qr.destroy();
  }
}
