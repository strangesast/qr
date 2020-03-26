import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError, pluck, map, switchMap } from 'rxjs/operators';

import { UrlShortenerService } from '../url-shortener.service';

@Component({
  selector: 'app-printer-container',
  template: `
  <ng-container *ngIf="result$ | async as result; else loading">
    <ng-container *ngIf="result.item != null; else notFound">
      <printed-label [includeUrl]="includeUrl" [url]="result.item.url" [link]="result.item.link" [title]="result.item.title"></printed-label>
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

  id$ = this.route.params.pipe(pluck('id'));

  result$ = this.id$.pipe(
    switchMap(id => this.service.get(id).pipe(
      catchError(() => of(null)),
      map(item => ({id, item})))
    ),
  );

  constructor(public route: ActivatedRoute, public service: UrlShortenerService) { }

  ngOnInit(): void {
    console.log('printer init');
  }

  print() {
    window.print();
  }
}
