import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'app-model-select-dialog',
  templateUrl: './model-select-dialog.component.html',
  styleUrls: ['./model-select-dialog.component.scss']
})

export class ModelSelectDialogComponent implements OnInit 
{
	modelData = []
	columnsToDisplay = ['name', 'size', 'top1', 'top5', 'parameters', 'requestLoad'];
	totalSize = 0.0

  	constructor(public dialogRef: MatDialogRef<ModelSelectDialogComponent>, 
  				@Inject(MAT_DIALOG_DATA) data) 
  	{
    	this.modelData = data;
  	}

    ngOnInit() 
    {


    }

	onCancelButtonPress() 
	{
	    this.dialogRef.close();
	}


	onLoadButtonPress() 
	{
	    this.dialogRef.close('test');
	}

	onModelSelectChange(val)
	{
		val.requestLoad = !val.requestLoad 	

		this.totalSize = 0.0

		for (let model of this.modelData)
		{
			if(model.requestLoad)
				this.totalSize += model.size
		}

		this.totalSize = Math.round(this.totalSize * 100) / 100
	}


	// 
}
