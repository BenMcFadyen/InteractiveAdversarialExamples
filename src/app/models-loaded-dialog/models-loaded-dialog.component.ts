import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-models-loaded-dialog',
  templateUrl: './models-loaded-dialog.component.html',
  styleUrls: ['./models-loaded-dialog.component.scss']
})

export class ModelsLoadedDialogComponent implements OnInit
{
	constructor(public dialogRef: MatDialogRef<ModelsLoadedDialogComponent>)
	{ 
	}

	ngOnInit() 
	{

	}

	onSelectAdditionalButtonClick()
	{
		this.dialogRef.close('selectAdditional')
	}

	onSelectOkButtonClick()
	{
		this.dialogRef.close('close')
	}

}
