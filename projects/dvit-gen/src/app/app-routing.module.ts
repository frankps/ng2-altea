import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Ngbs5Component } from './ngbs5/ngbs5.component';

const routes: Routes = [
  { path: "", component: Ngbs5Component },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
