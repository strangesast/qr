import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector, DoBootstrap, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { NewContainerComponent } from './new-container/new-container.component';
import { AdvancedContainerComponent } from './advanced-container/advanced-container.component';
import { EditComponentComponent } from './edit-component/edit-component.component';
import { QrPreviewDialogComponent } from './qr-preview-dialog/qr-preview-dialog.component';
import { PrinterContainerComponent } from './printer-container/printer-container.component';
import { LabelComponent } from './label/label.component';

@NgModule({
  declarations: [
    AppComponent,
    NewContainerComponent,
    AdvancedContainerComponent,
    EditComponentComponent,
    QrPreviewDialogComponent,
    PrinterContainerComponent,
    LabelComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpClientModule,
  ],
  entryComponents: [LabelComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {}
