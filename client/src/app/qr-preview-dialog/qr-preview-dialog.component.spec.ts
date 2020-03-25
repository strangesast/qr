import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QrPreviewDialogComponent } from './qr-preview-dialog.component';

describe('QrPreviewDialogComponent', () => {
  let component: QrPreviewDialogComponent;
  let fixture: ComponentFixture<QrPreviewDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QrPreviewDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QrPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
