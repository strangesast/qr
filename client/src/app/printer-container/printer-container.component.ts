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
      <printed-label [url]="result.item.url" [link]="result.item.link" [title]="result.item.title"></printed-label>
    </ng-container>
    <ng-template #notFound>No record with id: <span>{{result.id}}</span></ng-template>
  </ng-container>
  <ng-template #loading><span>Loading...</span></ng-template>
  `,
  styles: []
})
export class PrinterContainerComponent implements OnInit {

  id$ = this.route.params.pipe(pluck('id'));

  result$ = this.id$.pipe(
    switchMap(id => this.service.get(id).pipe(catchError(() => of(null)), map(item => ({id, item})))),
  );

  constructor(public route: ActivatedRoute, public service: UrlShortenerService) { }

  ngOnInit(): void {
    console.log('printer init');
  }

}
