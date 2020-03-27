import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError, pluck, tap, map, switchMap } from 'rxjs/operators';

import { UrlShortenerService } from '../url-shortener.service';

@Component({
  selector: 'app-printer-container',
  template: `
  <ng-container *ngIf="result$ | async as result; else loading">
    <ng-container *ngIf="result != null; else notFound">
      <printed-label *ngFor="let item of result" [includeUrl]="includeUrl" [url]="item.url" [link]="item.link" [title]="item.title"></printed-label>
      <div class="actions noprint">
        <mat-slide-toggle [checked]="includeUrl" (change)="includeUrl = !includeUrl">Include url</mat-slide-toggle>
        <button mat-stroked-button (click)="print()">Print</button>
      </div>
    </ng-container>
    <ng-template #notFound>No record with id: <span>{{result.id}}</span></ng-template>
  </ng-container>
  <ng-template #loading><span>Loading...</span></ng-template>
  `,
  styles: [
    `
    .actions {
      display: flex;
      flex-wrap: wrap;
      margin: 12px;
      align-items: center;
    }
    .actions > * {
      margin-right: 8px;
    }
    @media print {
      .noprint {
        display: none;
      }
    }
    `,
  ]
})
export class PrinterContainerComponent implements OnInit {
  includeUrl = true;

  id$ = this.route.queryParams.pipe(
    pluck('q'),
    map(ids => Array.isArray(ids) ? ids : [ids]),
  );

  result$ = this.id$.pipe(
    switchMap(ids => this.service.getMany(ids).pipe(
      catchError(() => of(null)),
    )),
  )

  constructor(public route: ActivatedRoute, public service: UrlShortenerService) { }

  ngOnInit(): void {
    console.log('printer init');
  }

  print() {
    window.print();
  }
}
