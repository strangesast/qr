import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { filter, last, switchMap, takeUntil, finalize, pluck, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';

import { QrPreviewDialogComponent, DialogData } from '../qr-preview-dialog/qr-preview-dialog.component';
import { UrlShortenerService } from '../url-shortener.service';

@Component({
  selector: 'app-new-container',
  template: `
  <header class="form-header">
    <h1>URL Shortener Service</h1>
    <p>Enter a url you wish to shorten.  A QR code will also be generated.</p>
  </header>
  <form [formGroup]="form" (submit)="create()">
    <div class="form-fields">
      <mat-form-field appearance="outline" class="url">
        <input formControlName="url" type="url" matInput/>
        <mat-hint>Enter a url</mat-hint>
      </mat-form-field>
      <mat-form-field appearance="outline" class="title">
        <input formControlName="title" type="text" matInput/>
        <mat-hint>Title (optional)</mat-hint>
      </mat-form-field>
    </div>
    <div class="actions">
      <button [disabled]="form.invalid" mat-stroked-button type="submit">Create</button>
    </div>
  </form>
  <ng-container *ngIf="urls$ | async as data">
    <header class="table-header">
      <h1>{{data.stats.length}} Urls, {{data.stats.countTotal}} Clicks</h1>
      <mat-slide-toggle [checked]="selectMultiple" (change)="toggleSelectMultiple()">Select multiple</mat-slide-toggle>
    </header>
    <mat-table [dataSource]="data.urls">
			<ng-container matColumnDef="select">
        <mat-cell *matCellDef="let item">
          <mat-checkbox (click)="$event.stopPropagation()"
                        (change)="$event ? selection.toggle(item) : null"
                        [checked]="selection.isSelected(item)">
          </mat-checkbox>
        </mat-cell>
			</ng-container>
      <ng-container matColumnDef="qr">
        <mat-cell *matCellDef="let item">
          <div class="img-container">
            <img [src]="'/u/' + item.id + '.svg'"/>
          </div>
        </mat-cell>
      </ng-container>
      <ng-container matColumnDef="title">
        <mat-cell *matCellDef="let item">
          <a [title]="item.url" [href]="item.link" (click)="$event.stopPropagation()">{{item.title || item.url}}</a>
        </mat-cell>
      </ng-container>
      <ng-container matColumnDef="count">
        <mat-cell *matCellDef="let item">
          <span>{{item.count}}</span>
        </mat-cell>
      </ng-container>
      <ng-container matColumnDef="actions">
        <mat-cell *matCellDef="let item">
          <button mat-icon-button aria-label="Edit" (click)="edit(item); $event.stopPropagation()">
            <mat-icon>create</mat-icon>
          </button>
          <button mat-icon-button aria-label="Print" (click)="print(item); $event.stopPropagation()">
            <mat-icon>print</mat-icon>
          </button>
        </mat-cell>
      </ng-container>
      <mat-row mat-row *matRowDef="let item; columns: tableColumns;" (click)="openDialog(item)"></mat-row>
    </mat-table>
  </ng-container>
  `,
  styles: [
    `
    :host {
      display: block;
    }
    header {
      margin: 40px 12px 12px 20px;
    }
    form > div.form-fields {
      display: grid;
      max-width: 800px;
      min-width: 0;
      margin: 0 20px;
      grid-gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
    form > div.actions {
      margin: 12px 20px;
    }
    mat-table {
      max-width: 800px;
    }
    mat-table .img-container {
      display: flex;
      align-items: center;
      justify-content: center;
      max-height: 40px;
    }
    mat-table .img-container > img {
      width: 32px;
      height: 32px;
    }
    mat-table .mat-column-select {
      flex: 0 0 48px;
    }
    mat-table .mat-column-qr {
      flex: 0 0 48px;
    }
    mat-table .mat-column-actions{
      display: flex;
      justify-content: center;
      flex: 0 0 96px;
    }
    mat-table .mat-column-count {
      display: flex;
      justify-content: center;
      flex: 0 0 40px;
    }
    mat-table mat-row {
      cursor: pointer;
    }
    `,
  ]
})
export class NewContainerComponent implements OnInit, OnDestroy {
  selection = new SelectionModel<any>(true, []);
  selectMultiple = false;
  tableColumns = ['qr', 'title', 'count', 'actions'];
  destroyed$ = new Subject();
  refresh$ = new BehaviorSubject(null);
  urls$ = this.refresh$.pipe(switchMap(() => this.service.list()), takeUntil(this.destroyed$));
  form = this.fb.group({
    url: ['', Validators.compose([
      Validators.required,
      Validators.pattern(/^(ftp|http|https):\/\/[^ "]+$/),
    ])],
    title: [''],
  });

  // svg: SafeHtml;
  // svg$: Observable<string> = this.form.get('url').valueChanges.pipe(
  //   filter(text => text != null && text.length > 0),
  //   switchMap(text => this.getQRCode(text)),
  //   takeUntil(this.destroyed$),
  // );

  constructor(
    public fb: FormBuilder,
    public service: UrlShortenerService,
    public router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    // hideous
    // this.svg$.subscribe(svg => this.svg = svg);
    this.urls$.pipe(tap(urls => console.log(urls))).subscribe();
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

  openDialog(item): void {
    const dialogRef = this.dialog.open(QrPreviewDialogComponent, {
      width: '400px',
      data: {
        title: item.title || item.url,
        link: item.link,
        id: item.id
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
    });
  }

  toggleSelectMultiple() {
    this.selectMultiple = !this.selectMultiple;
    if (this.selectMultiple) {
      this.tableColumns.unshift('select');
    } else {
      this.tableColumns.splice(this.tableColumns.indexOf('select'), 1);
    }
  }

  create() {
    if (this.form.valid) {
      const { url, title } = this.form.value;
      this.service.create(url, title).pipe(
        last(),
        pluck('exists'),
        tap(exists => {
          this.refresh();
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.form.reset({url: ''});
          if (!exists) {
            this.snackBar.open(`link for ${title || url} saved`, '', {duration: 5000});
          } else {
            this.snackBar.open(`link for ${title || url} already exists`, '', {duration: 5000});
          }
        }),
      ).subscribe();
    }
  }

  edit(item) {
    this.router.navigate(['/edit'], {state: {item}});
  }

  print(item) {
    if (this.selectMultiple && this.selection.selected.length) {
      this.service.print(this.selection.selected);
    } else if (item != null) {
      this.service.print(item);
    }
  }

  refresh() {
    this.refresh$.next(null);
  }
}
