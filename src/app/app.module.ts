import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { SelectionComponent } from './selection/selection.component';
import { DisplayComponent } from './display/display.component';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { ModelSelectDialogComponent } from './model-select-dialog/model-select-dialog.component';

import { MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material';
import { MatInputModule } from '@angular/material';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoMaterialModule } from './material-module';
import { ModelsLoadedDialogComponent } from './models-loaded-dialog/models-loaded-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    SelectionComponent,
    DisplayComponent,
    AboutComponent,
    HomeComponent,
    ModelSelectDialogComponent,
    ModelsLoadedDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatDialogModule,
    DemoMaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule,  
    BrowserAnimationsModule,
    MatInputModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [ModelSelectDialogComponent, ModelsLoadedDialogComponent],
})
export class AppModule { }
