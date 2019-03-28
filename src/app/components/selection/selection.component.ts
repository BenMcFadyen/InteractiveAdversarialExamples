import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from "@angular/material";
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';


import { ImageSelectDialogComponent } from '../../dialogs/image-select-dialog/image-select-dialog.component';
import { ModelSelectDialogComponent } from '../../dialogs/model-select-dialog/model-select-dialog.component';
import { TransferService } from '../../services/transfer.service';
import { IMAGENET_CLASSES } from '../../classes/ImageNetClasses';
import { ModelPrediction } from '../../classes/ModelPrediction';
import { ModelService } from '../../services/model.service';
import { ImageService } from '../../services/image.service';
import { AdvService } from '../../services/adv.service';
import { Prediction } from '../../classes/Prediction';
import { ModelData } from '../../classes/ModelData';

import * as tf from '@tensorflow/tfjs';


@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
})

export class SelectionComponent implements OnInit 
{
	private adversarialModel = new FormControl({value: '', disabled:true }, [Validators.required]);
	private predictionModels = new FormControl({value: '', disabled: true}, [Validators.required]);
	private attackMethod = new FormControl({value: '', disabled: true}, [Validators.required]);
	private targetClass = new FormControl({value: '', disabled: false}, [Validators.required]);
	private epsilon = new FormControl({value: 3, disabled: true});


	private imgURL: string = 'assets/images/lion.jpg'
	private numBytes:number
	private numTensors:number

	private topPrediction:string
	private targetClassPredDisplay: string

	private imageNetClasses: string[]
	private filteredImageNetClasses: Observable<string[]>;	

	readonly canvasSize:number = 250
	readonly differenceCanvasSize:number = 250
	readonly topX = 3



	private epsilonMax:number = 10;
	private epsilonStep:number = 0.25;

	private perturbationAmplification:number=25


	private availableAttackMethods: string[] = 
	[
		'FGSM',
		'T-FGSM'
	]

	private loadedModels: string[] = []
	private loadedAdversarialModels: string[] = []

	private canvasOriginal:string = 'canvasOriginal'
	private canvasDifference:string = 'canvasDifference'		
	private canvasAdversarial:string = 'canvasAdversarial'

  	constructor(private modelService: ModelService,
		  		private imgService: ImageService,
		  		private transferService: TransferService,
		  		private advService: AdvService,
		  		private dialog: MatDialog)
	{

	}

	ngOnInit() 
	{
		this.createImageNetArray()

		/** Updates the tf memory stats once every second */
		setInterval(()=> { this.updateMemory() }, 1 * 1000);

		this.filteredImageNetClasses = this.targetClass.valueChanges.pipe(startWith(''),map(value => this._filter(value)));

		// when a new prediction model is selected (or unselected)
		this.predictionModels.valueChanges.subscribe(val => {this.onPredictionModelsChange()})

		this.epsilon.valueChanges.subscribe(val => {this.onEpsilonChange()})

		this.transferService.currentPerturbationAmplificationSource.subscribe(perturbationAmplification => this.perturbationAmplification = perturbationAmplification)

		
		if(tf.getBackend() == 'cpu')
		{
			alert('WebGL is not supported on this device')
			console.error('WebGL is not supported on this device')
		}

	}



	/** Opens a dialog where the user can select which models they would like to load */
	private openModelSelectDialog()
	{
		const dialogConfig = new MatDialogConfig()

        dialogConfig.disableClose = false
        dialogConfig.autoFocus = true
        dialogConfig.hasBackdrop = true
		dialogConfig.minWidth = 1000

	    dialogConfig.data = this.modelService.allModelStats
	  
  		const dialogRef = this.dialog.open(ModelSelectDialogComponent, dialogConfig)

	    dialogRef.afterClosed().subscribe(modelsLoaded => 
    	{
    		if(modelsLoaded != null)
    		{
    			this.adversarialModel.enable()
    			this.predictionModels.enable()
    			this.attackMethod.enable()
    			this.epsilon.enable()

    			// currently it is possible to close the dialog, then load a different model
    			// NOT possible to unload a model (yet) TODO: When added will need to check here for model unloading
    			for(let loadedModel of modelsLoaded)
    			{

    				// only allow models flagged as ok for adversarial image generation
    				let modelObject = this.modelService.getModelDataObjectFromName(loadedModel)
    				if(modelObject.availableForAdversarialGeneration)
    					this.loadedAdversarialModels.push(loadedModel)

    				this.loadedModels.push(loadedModel) 
    			}
    		}
    	});  	
	} 	


	/** Predict the original image using the model(s) which have been selected by the user
	* 	Also predict the adversarial image if this has been drawn to the canvas
	*	Sends prediction results to be displayed by the Display component.
	*/
	private predictAllSelectedModels()
	{
		let canvasSize = this.canvasSize

		this.validatePrediction()

		// Get the modelObjects of all the models selected by the user
		var allPredictionModelObjects = this.modelService.getModelDataObjectsFromNames(this.predictionModels.value)

		// get the predictions of the original image, for all selected models
		let allModelOriginalPredictions = this.getAllPredictions(allPredictionModelObjects, this.canvasOriginal, this.topX) 

		// initialise the array to null, to allow original predictions to be passed without displaying adversarial (if canvas is blank)
		let allModelAdversarialPredictions: Prediction[][] = new Array(allPredictionModelObjects.length).fill(null);

		// Set the adversarial predictions, again if an adversarial image is drawn (the canvas isn't blank)
		if(!this.imgService.isCanvasBlank(this.canvasAdversarial))
			allModelAdversarialPredictions = this.getAllPredictions(allPredictionModelObjects, this.canvasAdversarial, this.topX) 
	

		let allModelsAllPredictions: ModelPrediction[] = []

		// compile the model predictions
		for(let i= 0; i < allPredictionModelObjects.length; i++)
		{
			allModelsAllPredictions.push(new ModelPrediction(allPredictionModelObjects[i].name,  
															allModelOriginalPredictions[i],
															null, // Predictions on the difference/perturbation go here
															allModelAdversarialPredictions[i],
															this.targetClassPredDisplay))
		}

		this.transferService.setModelPredictions(allModelsAllPredictions)

	}

	/** Gets [topX] predictions of the given [modelObject], for the image within [canvas], logs time taken to console */
	private getPredictions(modelObject:ModelData, canvas:string | HTMLCanvasElement, topX: number = 3) : Prediction[]
	{
		let t0 = performance.now();

		// Get and decode the model prediction results of the given image
		let modelOutput = this.modelService.tryPredict(modelObject, canvas, undefined)
		let predictions = this.modelService.decodeOutput(modelObject, modelOutput, topX)
		modelOutput.dispose()
		this.logTime(t0, performance.now(), 'Prediction complete')

		return predictions
	}

	/** Gets [topX] predictions of the given [modelObjects], for the image within [canvas], logs time taken to console */
	private getAllPredictions(modelObjects:ModelData[], canvas:string | HTMLCanvasElement, topX:number = 3) : Prediction[][]
	{
		let allPredictions:Prediction[][] = []

		for(let modelObject of modelObjects)
		{
			allPredictions.push(this.getPredictions(modelObject, canvas, topX))
		}

		return allPredictions
	}	

	/** Generates an adversarial image as per the selected parameters*/
	private async executeAttackMethod()
	{
		this.validateGeneration()
		var adversarialPredictionModelObject = this.modelService.getModelDataObjectFromName(this.adversarialModel.value)

		return await this.generateAndDrawAdversarialImage(adversarialPredictionModelObject, this.attackMethod.value, this.canvasOriginal, this.canvasAdversarial, this.topPrediction).then(()=>
		{
			// set the model name (to be displayed next to the adversarial image)
			this.transferService.setAdversarialImageModelName(adversarialPredictionModelObject.name)
			return
		})
	}	

	/** Generate an adversarial image using the given model and attack method, for the given source canvas, then draw it to the given target canvas */
	private async generateAndDrawAdversarialImage(modelObject: ModelData, selectedAttackMethod:string, sourceCanvas:string|HTMLCanvasElement, targetCanvas:string|HTMLCanvasElement, topPredictionFGSM:string = null)
	{
		let t0 = performance.now()

		const img3 = <tf.Tensor3D> this.imgService.getTensorFromCanvas(sourceCanvas, 3, modelObject.imgHeight, modelObject.imgWidth, modelObject.batchInput)
		const img4 = <tf.Tensor4D> this.imgService.getTensorFromCanvas(sourceCanvas, 4, modelObject.imgHeight, modelObject.imgWidth, modelObject.batchInput)	

		switch(selectedAttackMethod)
	    {
			case 'FGSM':

				if(topPredictionFGSM == null)
					throw 'FGSM cannot be executed without a prediction'

				var attackMethodFunctionResult = this.advService.FGSM(modelObject, topPredictionFGSM, img3, img4, this.epsilon.value, true, this.perturbationAmplification);
				this.targetClassPredDisplay = null // passed to the transfer service, and used to ensure predictions are colour properly: TODO: Re-factor, hacky
				break;

			case 'T-FGSM':
				var attackMethodFunctionResult = this.advService.Targeted_FGSM(modelObject, this.targetClass.value, img3, img4, this.epsilon.value, true, this.perturbationAmplification);
				this.targetClassPredDisplay = this.targetClass.value // passed to the transfer service, and used to ensure predictions are colour properly:  TODO: Re-factor, hacky						
				break;
		}

		// Draw the adversarial image to the canvas
		return await attackMethodFunctionResult.then(adversarialImgTensor => 
		{	
			return this.imgService.drawTensorToCanvas(targetCanvas, adversarialImgTensor, this.canvasSize, this.canvasSize).then(()=>
			{
				this.logTime(t0, performance.now(), 'Adversarial example generated')
				// cleanup img tensors
				img3.dispose()
				img4.dispose()
				adversarialImgTensor.dispose()			
				return
			})
		})
	}	

	private onPredictButtonClick()
	{	
		this.predictAllSelectedModels()
	}

	//** Generate adversarial image, but don't predict*/
	private async onGenerateButtonClick()	
	{
		this.resetCanvasAndClearPredictions()

		await this.executeAttackMethod()
		//this.predictAllSelectedModels() //TODO: Should prediction happen here? any reason not too?
	}

	//** Set a random target class, calls attack/predict method after*/
	private async onRandomButtonClick()
	{
		this.targetClass.setValue(this.selectRandomImageNetClass())

		this.resetCanvasAndClearPredictions()

		await this.executeAttackMethod()
		this.predictAllSelectedModels()
	}

	//** Set a random target class, calls attack/predict method after*/
	private async onEpsilonChange()
	{
		let epsilon = this.epsilon.value

		// if the user selects the max epsilon, increase the maximum (up to a limit of 150)
		if(epsilon >= this.epsilonMax && this.epsilonMax < 150)
		{	
			if(this.epsilonMax == 1)
			{
				this.epsilonMax = 10
				this.epsilonStep = this.epsilonMax / 400
				return 				
			}

			this.epsilonMax += 10
			this.epsilonStep = this.epsilonMax / 400

		} // if they return to a lower epsion, scale the maximum back down (allow more fine-tuning of epsilon values)
		else if(epsilon < (this.epsilonMax/4)) 
		{
			// if the slider is in the range 0-10, and the user selects a low epsilon (say 0.5)
			// scale the slider range 0-1 (lowest we will go)
			if(this.epsilonMax == 10 && epsilon <= 1)
			{
				this.epsilonMax = 1
				this.epsilonStep = 0.025
			}

			if(this.epsilonMax >= 20) //
			{
				this.epsilonMax -= 10
				this.epsilonStep = this.epsilonMax / 400
			}
		}


		// only update if an adversarial image is drawn
		if(this.imgService.isCanvasBlank(this.canvasAdversarial))
			return

		this.resetCanvasAndClearPredictions()

		await this.executeAttackMethod()
		this.predictAllSelectedModels()
	}	

	/**  Increase the epsilon value by a factor of 10 * the slider step */
	private onIncreaseEpsilonClick()
	{

		let newEs = parseFloat((this.epsilon.value + (this.epsilonStep)).toFixed(3))

		if(newEs >= 150)

			return

		this.epsilon.setValue(newEs)
	}

	/**  Decrease the epsilon value by a factor of 10 * the slider step */
	private onDecreaseEpsilonClick()
	{
		let newEs = parseFloat((this.epsilon.value - (this.epsilonStep)).toFixed(3))

		if(newEs <= 0)
			return

		this.epsilon.setValue(newEs)	
	}

	private onSelectFileButtonClick()
	{

		this.openImageSelectDialog()

		// this.transferService.setModelPredictions([

		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),		
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),
		// 	new ModelPrediction('B', [new Prediction('test2', 10)], null, [new Prediction('test4', 10)]),																				
		// 	])
	}

	/** Opens a dialog where the user can select an image*/
	private openImageSelectDialog()
	{
		const dialogConfig = new MatDialogConfig()

        dialogConfig.disableClose = false
        dialogConfig.autoFocus = true
        dialogConfig.hasBackdrop = true
		dialogConfig.minWidth = 400

	    //dialogConfig.data = this.modelService.allModelStats
	  
  		const dialogRef = this.dialog.open(ImageSelectDialogComponent, dialogConfig)

	    dialogRef.afterClosed().subscribe((selectedImgUrl)=> 
    	{
    		if(selectedImgUrl !=null)
    		{
    			this.imgURL = selectedImgUrl
    		}
    	});  	
	} 		

	private onPredictionModelsChange()
	{
		// This lets the display componenet that predictions should be cleared
		this.transferService.setModelPredictions(null)
		this.topPrediction = null
	}

	/** Called when the user selects an img file */
	private onSelectFile(event) 
	{ 	
	    const file = event.target.files[0]
		
		if (event.target.files && event.target.files[0]) 
		{
   			const file = event.target.files[0]

			var reader = new FileReader()
			reader.readAsDataURL(event.target.files[0]); // read file as data url

			// called once readAsDataURL is completed
			reader.onload = (event:any) => {this.imgURL = event.target.result;}
		}
	}	



	/** Reset the adversarial and differnce/perturbation canvas' and clears any predictions */
	private resetCanvasAndClearPredictions()
	{
		this.imgService.resetCanvas(this.canvasAdversarial)
		this.imgService.resetCanvas(this.canvasDifference)

		// This lets the display componenet that predictions should be cleared
		this.transferService.setModelPredictions(null)
		this.topPrediction = null
	}

	/** Validate that the parameters required for prediction are set 
	* 	Also handled by the client side HTML disable validation
	*/
	private validatePrediction()
	{
		if(this.imgURL == null)
			throw 'no valid image source found'

		if(this.predictionModels.invalid || this.predictionModels.disabled)
			throw 'no valid prediction model(s) selected'
	}

	/** Validate that the parameters required for adversarial image generation are set 
	* 	Also handled by the client side HTML disable validation
	*/
	private validateGeneration()
	{
		if(this.imgURL == null)
			throw 'no valid image source found'

		if(this.adversarialModel.invalid || this.adversarialModel.disabled)  
			throw 'no adversarial model selected'

	    if(this.attackMethod.invalid || this.attackMethod.disabled)
	    	throw 'no attack method selected'

		if(this.attackMethod.value == 'T-FGSM' && this.targetClass == null)
		{
			this.targetClass.value.set(this.selectRandomImageNetClass())
			console.log('T-FGSM selected, but no target class was selected, random class selected.')
		}		    

		/* For FGSM, the top prediction of the adversarial model on the original image is needed 
		* As it is possible for the user to select:
		*	 Adversarial model: A,
		*	 Prediction models: B & C
		* The below ensures that the top1 prediction of Model A is used for FGSM
		*/
		if(this.attackMethod.value == 'FGSM' && this.topPrediction == null)
		{
			console.log('FGSM selected, but no prediction, making prediction with model: ' + this.adversarialModel.value)
			let adversarialModelObject = this.modelService.getModelDataObjectFromName(this.adversarialModel.value)
			let predictions = this.getPredictions(adversarialModelObject, this.canvasOriginal, 1)
			this.topPrediction = predictions[0].className
		}		
	}	
 
	
	/** Called when an img is loaded (user selection/on initial load)
	*   Draws the image to canvas' */
	private onIMGLoad()
	{
		let img = <HTMLImageElement> document.getElementById('fileSelectImg')

		this.imgService.drawImageToCanvas(img, this.canvasOriginal, this.canvasSize, this.canvasSize)
		this.resetCanvasAndClearPredictions()
	}


	/** Used to filter the imageNetClasses for autocompletion*/
	private _filter(value: string): string[] 
	{
		return this.imageNetClasses.filter(imageNetClass => imageNetClass.toLowerCase().includes(value.toLowerCase()));
	}	

	/** Selects a random class from the imagenet array: */
	private selectRandomImageNetClass()
	{
		let randomNumber = Math.floor((Math.random() * 100)); //Random number between 0 & 1000
		return this.imageNetClasses[randomNumber] 
	}

	/** Creates an array from the IMAGENET_CLASSES.js file, used for the model predictions. */
	private createImageNetArray()
	{
		this.imageNetClasses = new Array()
		for(var i = 0; i < 1000; i++)
			this.imageNetClasses.push(IMAGENET_CLASSES[i])
	}	



	/** Log the time taken to perform complete a given action */
	private logTime(t0:number, t1:number, message: string)
	{
		console.log(message + ', time taken: ' + ((t1 - t0)/1000).toFixed(2) + " (ms).")
	}



	/** Updates the memory variables provided by tf.memory() */
	private updateMemory()
	{
		let mem = tf.memory()
		this.numBytes = Math.round((mem.numBytes / 1000000))
		this.numTensors = mem.numTensors
	}	




	logslider(position) 
	{
		// position will be between 0 and 100
		var minp = 0;
		var maxp = 100;

		// The result should be between 100 an 10000000
		var minv = Math.log(100);
		var maxv = Math.log(10000000);

		// calculate adjustment factor
		var scale = (maxv-minv) / (maxp-minp);

		return Math.exp(minv + scale*(position-minp));
	}





//
}