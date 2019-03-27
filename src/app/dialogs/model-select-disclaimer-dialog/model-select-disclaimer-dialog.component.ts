import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-model-select-disclaimer-dialog',
  templateUrl: './model-select-disclaimer-dialog.component.html',
  styleUrls: ['./model-select-disclaimer-dialog.component.scss']
})
export class ModelSelectDisclaimerDialogComponent implements OnInit {

	constructor(public dialogRef: MatDialogRef<ModelSelectDisclaimerDialogComponent>) 
	{ 

	}

	ngOnInit() 
	{

	}

	onOkButtonClick()
	{
		this.dialogRef.close()
	}

//
}
