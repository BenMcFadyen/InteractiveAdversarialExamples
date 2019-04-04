import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-landing-dialog',
  templateUrl: './landing-dialog.component.html',
  styleUrls: ['./landing-dialog.component.scss']
})
export class LandingDialogComponent implements OnInit {

	constructor(public dialogRef: MatDialogRef<LandingDialogComponent>)
	{ 
	}

	ngOnInit() 
	{
		this.dialogRef.updatePosition({top:'250px'})
	}

	onExploreButtonClick()
	{
		this.dialogRef.close()
	}

	onLearnButtonClick()
	{
		this.dialogRef.close()
	}

}
