import { Component, OnInit } from '@angular/core';
import { ModelService } from '../model.service';
import { ImageService } from '../image.service';
import { AdvService } from '../adv.service';
import { TransferService } from '../transfer.service';
import { ModelData } from '../ModelData';
import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from '../ImageNetClasses';
import { ModelPrediction } from '../ModelPrediction';
import { Prediction } from '../Prediction';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
})

export class SelectionComponent implements OnInit 
{
	imgURL: string = 'assets/images/lion.jpg'
	epsilon: number = 5
	selectedPredictionModel: string = 'MobileNet'
	selectedAdversarialPredictionModel: string = 'MobileNet'
	selectedAttackMethod: string = 'T-FGSM'

	targetClass: string = 'hen'
	topPrediction:string

	numBytes:number
	numTensors:number

	imageNet: string[]

	canvasSize:number = 350
	differenceCanvasSize:number = 224

	adversarialImageGenerated: boolean

	attackMethods: string[] = 
	[
		'FGSM',
		'T-FGSM'
	]

	allModelsLoaded: boolean;

	canvasOriginal:string = 'canvasOriginal'
	canvasDifference:string = 'canvasDifference'		
	canvasAdversarial:string = 'canvasAdversarial'

  	constructor(private modelService: ModelService,
		  		private imgService: ImageService,
		  		private transferService: TransferService,
		  		private advService: AdvService)
	{

	}

	ngOnInit() 
	{
		this.createImageNetArray()

		/** Updates the tf memory stats once every second */
		setInterval(()=> { this.updateMemory() }, 1 * 1000);


		var t0 = performance.now();
		this.modelService.loadAllModels().then(()=>
		{
			this.allModelsLoaded = true;
			this.logTime(t0, performance.now(), 'All models loaded and warmed')
		})
	}



	/** TODO: Rename **/
	getPrediction(modelObject:ModelData, canvas:string | HTMLCanvasElement, topX: number = 3)
	{
		let t0 = performance.now();

		// Get and decode the model prediction results of the given image
		let modelOutput = this.modelService.tryPredict(modelObject, canvas, undefined)
		let predictions = this.modelService.decodeOutput(modelObject, modelOutput, topX)

		this.logTime(t0, performance.now(), 'Prediction complete')

		return predictions
	}


	/** generate an adversarial example using the given model and attack method, for the given source canvas, then draw it to the given target canvas */
	async generateAndDrawAdversarialImage(modelObject: ModelData, selectedAttackMethod:string, sourceCanvas:string|HTMLCanvasElement, targetCanvas:string|HTMLCanvasElement, topPredictionFGSM:string = null)
	{
		let t0 = performance.now()

		const img3 = <tf.Tensor3D> this.imgService.getTensorFromCanvas(sourceCanvas, 3, modelObject.imgHeight, modelObject.imgWidth, modelObject.batchInput)
		const img4 = <tf.Tensor4D> this.imgService.getTensorFromCanvas(sourceCanvas, 4, modelObject.imgHeight, modelObject.imgWidth, modelObject.batchInput)	

		switch(selectedAttackMethod)
	    {
			case 'FGSM':
				var attackMethodFunctionResult = this.advService.FGSM(modelObject, topPredictionFGSM, img3, img4, this.epsilon);
				break;

			case 'T-FGSM':
				var attackMethodFunctionResult = this.advService.Targeted_FGSM(modelObject, this.targetClass, img3, img4, this.epsilon);
				break;
		}

		// Draw the adversarial image to the canvas
		return await attackMethodFunctionResult.then(adversarialImgTensor => 
		{	
			this.imgService.drawTensorToCanvas(targetCanvas, adversarialImgTensor, this.canvasSize, this.canvasSize) //TODO OG MODEL OUTPUT HERE? ARE WE AFFECT TENSOR
			this.logTime(t0, performance.now(), 'Adversarial example generated')

			// cleanup img tensors
			img3.dispose()
			img4.dispose()
			adversarialImgTensor.dispose()			
			return
		})
	}


	/** Predict the source image using the selected model, if adv model is also selected, predict this too. */
	predict()
	{
		let topX = 3
		let canvasSize = 500

		this.validateSelectedParameters(false) //adversarial model is not required to be selected at this point
		var selectedOriginalPredictionModelObject = this.modelService.getModelDataObjectFromName(this.selectedPredictionModel)
		var selectedAdvPredictionModelObject = this.modelService.getModelDataObjectFromName(this.selectedAdversarialPredictionModel)	

		// get the predictions from the original canvas
		let originalPredictions = this.getPrediction(selectedOriginalPredictionModelObject, this.canvasOriginal, topX)
		// update the prediction variables, for use within the display component
		//this.transferService.setOriginalPredictions(originalPredictions)		

		// get the top prediction, for use as the target class for FGSM
		this.topPrediction = originalPredictions[0].className		

		// return here if generation has not yet been done
		if(!this.adversarialImageGenerated)
		{
			this.transferService.addNewModelPrediction(new ModelPrediction(selectedOriginalPredictionModelObject.name,  originalPredictions, null, null), false)
			return
		}
		
		// get the predictions from the (newly drawn) adversarial canvas
		let adversarialPredictions = this.getPrediction(selectedOriginalPredictionModelObject, this.canvasAdversarial, topX)
	
		let override = true;
		//set the model prediction for display within the display componenet
		this.transferService.addNewModelPrediction(new ModelPrediction(selectedOriginalPredictionModelObject.name,  originalPredictions, null, adversarialPredictions), override)
	}


	/** TODO: Rename? **/
	async executeAttackMethod()
	{
		this.validateSelectedParameters(false)

		var selectedAdvPredictionModelObject = this.modelService.getModelDataObjectFromName(this.selectedAdversarialPredictionModel)	

		await this.generateAndDrawAdversarialImage(selectedAdvPredictionModelObject, this.selectedAttackMethod, this.canvasOriginal, this.canvasAdversarial, this.topPrediction)

		this.adversarialImageGenerated = true;
		this.transferService.setAdversarialImageModelName('('+ selectedAdvPredictionModelObject.name + ')')

	}

	/** Predict the source image using the selected model, if adv model is also selected, predict this too. */
	onPredictButtonClick()
	{	
		this.predict()
	}

	/** TODO */
	async onGenerateButtonClick()	
	{
		this.executeAttackMethod()
	}


	clearPredictions()
	{
		this.transferService.addNewModelPrediction(null, true)
	}




	/** ensure the parameters required for execution are set*/
	validateSelectedParameters(checkAdversarialModel:boolean = true)
	{
		if(this.imgURL == null)
			throw 'Could not predict: no image selected'

		if(this.selectedPredictionModel == null)
			throw 'Could not predict: no model selected'

		if(this.selectedAdversarialPredictionModel == null && checkAdversarialModel) 
			throw 'Could not predict: no adversarial model selected'

	    if(!this.attackMethods.includes(this.selectedAttackMethod))
	    	throw 'Could not predict: Attack method ' + this.selectedAttackMethod + ' is not valid'

		if(this.selectedAttackMethod == 'T-FGSM' && this.targetClass==null)
		{
			this.targetClass = this.selectRandomImageNetClass()
			console.log('T-FGSM selected, but no target class was selected, random class selected.')
		}		    
	}

	/** Log the time taken to perform complete a given action */
	logTime(t0:number, t1:number, message: string)
	{
		console.log(message + ', time taken: ' + ((t1 - t0)/1000).toFixed(3) + " (ms).")
	}

	/** Updates the memory variables provided by tf.memory() */
	updateMemory()
	{
		let mem = tf.memory()
		this.numBytes = Math.round((mem.numBytes / 1000000))
		this.numTensors = mem.numTensors
	}

	/** Called when the user selects an img file */
	onSelectFile(event) 
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

	onEpsilonChange(value)
	{
		// TODO: Should max epsilon value be 100?
		if(value > 100)
			value = 100

		this.epsilon = value
		this.executeAttackMethod()
		this.predict()

		this.clearPredictions()
	}

	onRandomClick()
	{
		this.targetClass = this.selectRandomImageNetClass()
		this.executeAttackMethod()
		this.predict()		
	}

	selectRandomImageNetClass()
	{
		let randomNumber = Math.floor((Math.random() * 100)); //Random number between 0 & 1000
		return IMAGENET_CLASSES[randomNumber] 
	}
	
	/** Called when an img is loaded (user selection/on initial load)
	*   Draws the image to canvas' */
	onIMGLoad()
	{
		let img = <HTMLImageElement> document.getElementById('fileSelectImg')

		this.imgService.drawImageToCanvas(img, this.canvasOriginal, this.canvasSize, this.canvasSize)

		this.imgService.resetCanvas(this.canvasAdversarial)
		this.clearPredictions()
		//this.imgService.drawImageToCanvas(img, 'canvasDifference', this.differenceCanvasSize, this.differenceCanvasSize)
		//this.imgService.drawImageToCanvas(img, 'canvasAdversarial', this.canvasSize, this.canvasSize)
	}

	/** Creates an array from the IMAGENET_CLASSES.js file, used for the model predictions. */
	createImageNetArray()
	{
		this.imageNet = new Array()
		for(var i = 0; i < 1000; i++)
			this.imageNet.push(IMAGENET_CLASSES[i])
	}	
}
