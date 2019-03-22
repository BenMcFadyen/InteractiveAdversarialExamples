import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ModelService } from '../model.service';


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
	modelsLoading = false;

	modelsToLoad:string[] = []

  	constructor(private modelService: ModelService,
  				public dialogRef: MatDialogRef<ModelSelectDialogComponent>, 
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
		// TODO: Alert if no models selected?
		// TODO: Prevent user clicking additional checkbox once clicked
		// TODO: Set loaded status once loaded? -> prevent loading again??? allow us to UNLOAD?
		// TODO: Format Model stats (commas)
		
		var t0 = performance.now();
		this.modelsLoading = true;

		this.modelService.loadModels(this.modelsToLoad).then(()=>
		{
			this.modelsLoading = false;
		    this.dialogRef.close(this.modelsToLoad);
			console.log('All models finished loading')
		})
	}

	onModelSelectChange(val)
	{
		val.requestLoad = !val.requestLoad 	

		this.totalSize = 0.0
		this.modelsToLoad = []

		for (let model of this.modelData)
		{
			if(model.requestLoad)
			{
				this.modelsToLoad.push(model.name)
				this.totalSize += model.size
			}
		}

		this.totalSize = Math.round(this.totalSize * 100) / 100
	}



	//TODO: Move this into a helper service (duplicated 3 times)
	/** Log the time taken to perform complete a given action */
	logTime(t0:number, t1:number, message: string)
	{
		console.log(message + ', time taken: ' + ((t1 - t0)/1000).toFixed(2) + " (ms).")
	}

	// 
}
