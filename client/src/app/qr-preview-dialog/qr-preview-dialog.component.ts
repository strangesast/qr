import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UrlShortenerService } from '../url-shortener.service';

export interface DialogData {
  link: string;
  title: string;
}


@Component({
  selector: 'app-qr-preview-dialog',
  template: `
  <div mat-dialog-content>
    <div class="content">
      <img [src]="data.link + '.svg'"/>
      <h1>{{data.title}}</h1>
      <p><a [href]="data.link">{{data.link}}</a></p>
    </div>
  </div>
  <div mat-dialog-actions>
    <button mat-button (click)="service.print(data)">Print</button>
  </div>
  `,
  styles: [
    `
    .content {
      display: grid;
      grid-template-columns: auto auto;
      grid-template-rows: auto auto;
      grid-gap: 12px;
    }
    .content > img {
      grid-row: 1 / 3;
    }
    .content > h1 {
      margin: 0;
      align-self: flex-end;
    }
    .content > p {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    `,
  ]
})
export class QrPreviewDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<QrPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public service: UrlShortenerService,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {}

}
