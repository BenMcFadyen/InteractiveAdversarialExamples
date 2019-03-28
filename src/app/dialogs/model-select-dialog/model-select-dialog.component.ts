import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material';
import { ModelService } from '../../services/model.service';
import { ModelsLoadedDialogComponent } from '../models-loaded-dialog/models-loaded-dialog.component';
import { ModelSelectDisclaimerDialogComponent } from '../model-select-disclaimer-dialog/model-select-disclaimer-dialog.component';


@Component({
  selector: 'app-model-select-dialog',
  templateUrl: './model-select-dialog.component.html',
  styleUrls: ['./model-select-dialog.component.scss']
})

export class ModelSelectDialogComponent implements OnInit 
{
	modelData = []
	columnsToDisplay = ['name', 'size', 'layers', 'top1', 'top5', 'parameters', 'requestLoad'];
	totalSize = 0.0
	modelsLoading = false;
	modelLoadProgress = 0;
	modelsToLoad:string[] = []
	modelsLoaded:string[] = []

	disclaimerShown:boolean = false


  	constructor(private modelService: ModelService,
				public dialog: MatDialog,		
  				public modelSelectDialogRef: MatDialogRef<ModelSelectDialogComponent>, 
  				@Inject(MAT_DIALOG_DATA) data) 
  	{
    	this.modelData = data;
    	this.checkUpdateModelLoadStatus()
  	}

    ngOnInit() 
    {
    }

    // disables model selection if they have already been loaded, unchecks any 'requestLoads' that never actually loaded
    checkUpdateModelLoadStatus()
    {
    	for(let i = 0; i < this.modelData.length; i++)
    	{
    		this.modelData[i].requestLoad = false
    		this.modelData[i]["loaded"] = this.modelService.hasModelBeenLoaded(this.modelData[i].name)
    	}
    }

	onCloseButtonPress() 
	{
	    this.modelSelectDialogRef.close();
	}

	/** Load the selected models*/
	onLoadButtonPress() 
	{		
		let modelsLoaded = 0
		this.modelLoadProgress = 0

		if(this.modelsToLoad.length == 0)
			return console.error('Error: cannot load models, none selected')

		// remove already loaded models from the request array, ensure we don't re-load models
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
			return console.error('Error: All models already loaded')

		var t0 = performance.now();
		this.modelsLoading = true;		

		for(let i = 0; i < totalModelsToLoad; i++)
		{
			this.modelService.loadModel(this.modelsToLoad[i]).then(()=>
			{
				modelsLoaded++
				this.modelsLoaded.push(this.modelsToLoad[i])				
				this.modelLoadProgress += (100/totalModelsToLoad) 

				if(modelsLoaded == totalModelsToLoad)
				{
					this.modelsLoading = false;

					const modelsLoadedDialogRef = this.openModelsLoadedDialog()

					modelsLoadedDialogRef.afterClosed().subscribe(closeRequest => 
					{
						if(closeRequest == null || closeRequest == 'close')
						{
				   			this.modelSelectDialogRef.close(this.modelsLoaded)
						}

						return					
					})
				}
			})
		}
	}


	private openModelsLoadedDialog()
	{
		const dialogConfig = new MatDialogConfig()

        dialogConfig.disableClose = false
        dialogConfig.autoFocus = true
        dialogConfig.hasBackdrop = true
        dialogConfig.minWidth = 325

  		return this.dialog.open(ModelsLoadedDialogComponent, dialogConfig)
	} 	

	private openModelSelectDisclaimerDialog()
	{
		const dialogConfig = new MatDialogConfig()

        dialogConfig.disableClose = false
        dialogConfig.autoFocus = true
        dialogConfig.hasBackdrop = true
        dialogConfig.minWidth = 325
        dialogConfig.maxWidth = 500

  		return this.dialog.open(ModelSelectDisclaimerDialogComponent, dialogConfig)
	} 				


	onModelSelectChange(val)
	{
		val.requestLoad = !val.requestLoad 	

		this.totalSize = 0.0
		this.modelsToLoad = []

		for (let model of this.modelData)
		{
			if(model.requestLoad && !model.loaded)
			{
				this.modelsToLoad.push(model.name)
				this.totalSize += model.size
			}
		}

		this.totalSize = Math.round(this.totalSize * 100) / 100


		// if(!this.disclaimerShown && this.modelsToLoad.length >= 3)
		// {
		// 	let modelSelectDisclaimerDialogRef = this.openModelSelectDisclaimerDialog()

		// 	modelSelectDisclaimerDialogRef.afterClosed().subscribe(() => 
		// 	{
		// 		this.disclaimerShown = true;			
		// 	})			
		// }
	}


// 
}