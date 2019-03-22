import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-model-select-dialog',
  templateUrl: './model-select-dialog.component.html',
  styleUrls: ['./model-select-dialog.component.scss']
})

export class ModelSelectDialogComponent implements OnInit 
{
	columnsToDisplay = ['name', 'size', 'top1', 'top5', 'parameters', 'requestLoad'];
	totalSize = 0.0

	modelData = [
	  {name: 'MobileNet',    size: 14.2,  top1: 70.4, top5: 89.5, parameters: 4253864,  requestLoad:false},
	  {name: 'MobileNetV2',	 size: 24.5,  top1: 71.3, top5: 90.1, parameters: 3538984,  requestLoad:false},
	  {name: 'NASNetMobile', size: 24.1,  top1: 74.4, top5: 91.9, parameters: 5326716,  requestLoad:false},	  
	  {name: 'ResNet50',     size: 100.6, top1: 74.9, top5: 92.1, parameters: 25636712, requestLoad:false},
	  {name: 'DenseNet121',  size: 32.6,  top1: 82.4, top5: 92.3, parameters: 8062504,  requestLoad:false},
	  {name: 'DenseNet169',  size: 57.4,  top1: 82.4, top5: 93.2, parameters: 14307880, requestLoad:false},
	  {name: 'Xception',  	 size: 89.9,  top1: 79.0, top5: 94.5, parameters: 22910480, requestLoad:false},
	  {name: 'InceptionV3',  size: 94.0,  top1: 77.9, top5: 93.7, parameters: 23851784, requestLoad:false},
	];


  	constructor(public dialogRef: MatDialogRef<ModelSelectDialogComponent>, 
  				@Inject(MAT_DIALOG_DATA) data) 
  	{

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
