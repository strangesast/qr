import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-component',
  template: `
    <form [formGroup]="form" (submit)="onUpdate()">
      <h1>Update or create shortened URL</h1>
      <div class="fields">
        <mat-form-field appearance="outline">
          <input formControlName="id" type="text" matInput placeholder="An ID"/>
          <mat-hint>Enter an ID (optional)</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <input formControlName="url" type="text" matInput placeholder="http://some-url"/>
          <mat-hint>Url</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <input formControlName="title" type="text" matInput placeholder="A title."/>
          <mat-hint>Title (optional)</mat-hint>
        </mat-form-field>
      </div>
      <button [disabled]="form.invalid" mat-stroked-button type="submit">Create / Update</button>
    </form>
  `,
  styles: [
    `
    :host {
      display: block;
    }
    form {
      margin: 12px;
      display: grid;
      grid-gap: 12px;
    }
    form > button {
      justify-self: flex-start;
    }
    form > .fields {
      display: grid;
      grid-gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      max-width: 800px;
      min-width: 0;
    }
    form > *:not(:last-child) {
      margin-right: 8px;
    }
    `,
  ]
})
export class EditComponentComponent implements OnInit {
  @Input()
  set value(value) {
    if (value != null) {
      this.form.patchValue(value);
    }
  }

  @Output()
  update = new EventEmitter();

  form = this.fb.group({
    id: [''],
    url: ['', Validators.required],
    title: [''],
  });

  constructor(public fb: FormBuilder) {}

  ngOnInit(): void {
  }

  onUpdate() {
    if (this.form.valid) {
      this.update.emit(this.form.value);
      this.form.markAsPristine();
      this.form.reset();
    }
  }
}
