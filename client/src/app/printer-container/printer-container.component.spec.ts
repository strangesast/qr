import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterContainerComponent } from './printer-container.component';

describe('PrinterContainerComponent', () => {
  let component: PrinterContainerComponent;
  let fixture: ComponentFixture<PrinterContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrinterContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrinterContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
