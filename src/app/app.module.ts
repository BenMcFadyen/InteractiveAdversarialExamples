import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './components/nav/nav.component';
import { SelectionComponent } from './components/selection/selection.component';
import { DisplayComponent } from './components/display/display.component';
import { AboutComponent } from './components/about/about.component';
import { HomeComponent } from './components/home/home.component';

import { MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material';
import { MatInputModule } from '@angular/material';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoMaterialModule } from './material-module';

import { ImageSelectDialogComponent } from './dialogs/image-select-dialog/image-select-dialog.component';
import { ModelSelectDialogComponent } from './dialogs/model-select-dialog/model-select-dialog.component';
import { ModelsLoadedDialogComponent } from './dialogs/models-loaded-dialog/models-loaded-dialog.component';
import { ModelSelectDisclaimerDialogComponent } from './dialogs/model-select-disclaimer-dialog/model-select-disclaimer-dialog.component';
import { LandingDialogComponent } from './dialogs/landing-dialog/landing-dialog.component';

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
    ModelSelectDisclaimerDialogComponent,
    ImageSelectDialogComponent,
    LandingDialogComponent,
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
  entryComponents:
   [  
    ModelSelectDialogComponent,
    ModelsLoadedDialogComponent,
    ImageSelectDialogComponent,
    ModelSelectDisclaimerDialogComponent,
    LandingDialogComponent,
   ],
})
export class AppModule { }
