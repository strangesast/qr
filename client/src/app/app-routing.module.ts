import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NewContainerComponent } from './new-container/new-container.component';
import { AdvancedContainerComponent } from './advanced-container/advanced-container.component';
import { PrinterContainerComponent } from './printer-container/printer-container.component';


const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: '/new'},
  {path: 'new', component: NewContainerComponent},
  {path: 'edit', component: AdvancedContainerComponent},
  {path: 'print', component: PrinterContainerComponent},
  // {path: '**', redirectTo: '/'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
