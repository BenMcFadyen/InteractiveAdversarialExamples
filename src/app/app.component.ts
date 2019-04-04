import { Component } from '@angular/core';
import { LandingDialogComponent } from './dialogs/landing-dialog/landing-dialog.component';
import { MatDialog, MatDialogConfig } from "@angular/material";
import { TransferService } from './services/transfer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent 
{

	constructor(private dialog: MatDialog, private transferService:TransferService)
	{
		this.openLandingDialog()
	}

	/** Opens a dialog where the user can select which models they would like to load */
	openLandingDialog()
	{
		const dialogConfig = new MatDialogConfig()

        dialogConfig.disableClose = true
        dialogConfig.autoFocus = true
        dialogConfig.hasBackdrop = true

		dialogConfig.panelClass = 'landingDialogPanel'
		dialogConfig.backdropClass = 'landingDialogBackdrop'
	   // dialogConfig.data = this.modelService.allModelStats
	  
  		const dialogRef = this.dialog.open(LandingDialogComponent, dialogConfig)

	    dialogRef.afterClosed().subscribe(() => 
    	{
			this.transferService.setLandingPageDismissed(true)
    	});  	
	} 	
}
