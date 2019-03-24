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
	modelLoadProgress = 0;
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

	onCloseButtonPress() 
	{
	    this.dialogRef.close();
	}


	onLoadButtonPress() 
	{
		// TODO: Format Model stats (commas)
		
		let modelsLoaded = 0
		this.modelLoadProgress = 0

		if(this.modelsToLoad.length == 0)
			return console.error('Error: cannot load models, none selected')

		for(let i = 0; i < this.modelsToLoad.length; i++)
		{
			if(this.modelService.hasModelBeenLoaded(this.modelsToLoad[i]))
			{
				console.error("Error: " + this.modelsToLoad[i] + ' has already been loaded')
				this.modelsToLoad.splice(i,1) //remove the element from the array
				i-- // decrement i, as we removed an element from the array we are iterating
			}
		}

		let totalModelsToLoad = this.modelsToLoad.length

		if(totalModelsToLoad == 0)
			return console.error('Error: cannot load models, none selected')


		var t0 = performance.now();
		this.modelsLoading = true;		
		
		for(let i = 0; i < totalModelsToLoad; i++)
		{
			this.modelService.loadModel(this.modelsToLoad[i]).then(()=>
			{
				modelsLoaded++
				this.modelLoadProgress += (100/totalModelsToLoad) 

				console.log('returned')
				if(i == totalModelsToLoad-1)
				{
					this.modelsLoading = false;
			   		this.dialogRef.close(this.modelsToLoad);
				}
			})
		}
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
