import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { takeUntil, filter, switchMap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import QRCode from 'qrcode';

// reader
// npm install --save qr-scanner


@Component({
  selector: 'app-root',
  template: `
  <form [formGroup]="form">
    <mat-form-field appearance="outline">
      <input formControlName="input" type="text" matInput/>
    </mat-form-field>
  </form>
  <svg width="200" height="200" [innerHTML]="svg"></svg>
  `,
  styles: [
    `
    :host {
      display: block;
      margin: 10px;
    }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  form = this.fb.group({input: ['', Validators.required]});

  destroyed$ = new Subject();

  svg: SafeHtml;

  svg$: Observable<string> = this.form.get('input').valueChanges.pipe(
    filter(text => text.length > 0),
    switchMap(text => QRCode.toString(text, { errorCorrectionLevel: 'H', type: 'svg' }) as Promise<string>),
  );

  constructor(public fb: FormBuilder, public sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.svg$.pipe(takeUntil(this.destroyed$)).subscribe(svg => this.svg = this.sanitizer.bypassSecurityTrustHtml(svg));
  }
  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
