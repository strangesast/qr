import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import QrScanner from 'qr-scanner';
import { of } from 'rxjs';
import { catchError, delay, tap, mapTo } from 'rxjs/operators';
// import QrScannerWorkerPath from '!!file-loader!./node_modules/qr-scanner/qr-scanner-worker.min.js';
import { UrlShortenerService } from '../url-shortener.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private snackBar: MatSnackBar,
  ) {}

  itemUpdated(item) {
    this.service.update(item).pipe(
      mapTo(true),
      catchError(err => of(false)),
      tap(success => this.snackBar.open(success ? 'updated successfully' : 'failed to update', '', {duration: 5000})),
      delay(1000),
    ).subscribe(() => this.router.navigate(['/']));
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
