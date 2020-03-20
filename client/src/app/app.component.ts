import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { takeUntil, finalize, filter, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import QRCode from 'qrcode';

import { UrlShortenerService } from './url-shortener.service';

// reader
// npm install --save qr-scanner

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <h1>URL Shortener Service</h1>
  <p>Enter a url you wish to shorten.  A QR code will also be generated.</p>
  <form [formGroup]="form" (submit)="create()">
    <div class="row">
      <mat-form-field appearance="outline" class="url">
        <input formControlName="url" type="text" matInput/>
        <mat-hint>Enter a url</mat-hint>
      </mat-form-field>
      <button [disabled]="form.invalid" mat-stroked-button type="submit">Create</button>
    </div>
  </form>
  <svg width="200" height="200" [innerHTML]="svg"></svg>
  <div class="rows">
    <div *ngFor="let item of urls$ | async" class="row">
      <svg width="80" height="80" [innerHTML]="item.qr"></svg>
      <span>{{item.url}}</span>
      <a [href]="item.link">{{item.id}}</a>
    </div>
  </div>
  `,
  styles: [
    `
    :host {
      display: block;
      margin: 10px;
    }
    form > .row > .url {
      width: 400px;
    }
    form > .row {
    }
    form > .row > *:not(:first-child) {
      margin-left: 8px;
    }
    .rows {
      display: flex;
      flex-direction: column;
    }
    .rows > .row {
      display: flex;
      flex-direction: row;
    }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  refresh$ = new BehaviorSubject(null);
  urls$: Observable<{url: string, id: string}[]> = this.refresh$.pipe(
    switchMap(() => this.service.list()),
    switchMap(urls => Promise.all(urls.map(async (url) => {
      const link = `${window.location.origin}/u/${url.id}`;
      url.link = link;
      url.qr = await this.getQRCode(link);
    })).then(() => urls))
  );

  form = this.fb.group({url: ['', Validators.compose([Validators.required, Validators.minLength(3)])]});

  destroyed$ = new Subject();

  svg: SafeHtml;

  svg$: Observable<string> = this.form.get('url').valueChanges.pipe(
    filter(text => text != null && text.length > 0),
    switchMap(text => this.getQRCode(text)),
    tap(svg => this.svg = svg),
    takeUntil(this.destroyed$),
  );

  getQRCode(text: string): Promise<string> {
    return QRCode.toString(text, { errorCorrectionLevel: 'H', type: 'svg' })
      .then(result => this.sanitizer.bypassSecurityTrustHtml(result));
  }

  constructor(
    public fb: FormBuilder,
    public sanitizer: DomSanitizer,
    public service: UrlShortenerService) {}

  ngOnInit() {
    this.svg$.subscribe();
    this.refresh();
  }
  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  delete(id: string) {
    this.service.delete(id).pipe(
      finalize(() => this.refresh()),
    ).subscribe();
  }

  create() {
    if (this.form.valid) {
      const { url } = this.form.value;
      this.service.create(url).pipe(
        finalize(() => {
          this.refresh();
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.form.reset({url: ''});
        }),
      ).subscribe();
    }
  }

  refresh() {
    this.refresh$.next(null);
  }
}
