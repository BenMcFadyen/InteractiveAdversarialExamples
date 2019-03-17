import { Component, OnInit } from '@angular/core';
import { ModelService } from '../model.service';
import { ImageService } from '../image.service';
import { AdvService } from '../adv.service';
import { TransferService } from '../transfer.service';
import { ModelData } from '../ModelData';
import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from '../ImageNetClasses';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { Prediction } from '../Prediction';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit 
{
	imgURL: string = 'assets/images/lion.jpg'
	epsilon: number = 5
	selectedModel: string = 'MobileNet'
	targetClass: string = 'hen'

	numBytes:number
	numTensors:number

	imageNet: string[]

	attackMethods: string[] = 
	[
	'FGSM',
	'T-FGSM'
	]

	selectedAttackMethod: string = 'T-FGSM'

	allModelsLoaded: boolean;

  	constructor(private modelService: ModelService,
		  		private imgService: ImageService,
		  		private transferService: TransferService,
		  		private advService: AdvService)
	{

	}

	ngOnInit() 
	{
		this.parseIMAGENET()

		setInterval(()=> { this.updateMemory() }, 1 * 1000);


		var t0 = performance.now();

		this.modelService.loadAllModels().then(()=>
		{
			this.allModelsLoaded = true;
			var t1 = performance.now();
			console.log("All models Loaded (and warmed) in: " + ((t1 - t0)/1000).toFixed(3) + " (ms).")

		})
	}


	updateMemory()
	{
		let mem = tf.memory()
		this.numBytes = Math.round((mem.numBytes / 1000000))
		this.numTensors = mem.numTensors
	}

	parseIMAGENET()
	{
		this.imageNet = new Array()

		for(var i = 0; i < 1000; i++)
		{
			this.imageNet.push(IMAGENET_CLASSES[i])
		}
	}

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

	onPredictButtonClick()
	{
		var selectedModelName = this.selectedModel

		if(this.imgURL == null)
		{
			console.error("No image selected");
			return;
		}


		this.applyCurrentlySelectedAttackMethod()		
	}


	//TODO: split this function up, too big
	applyCurrentlySelectedAttackMethod()
	{

		var selectedModelName = this.selectedModel
		var selectedAttackMethod = this.selectedAttackMethod

		var canvasOriginal = 'canvasOriginal'
		var canvasDifference = 'canvasDifference'		
		var canvasAdversarial = 'canvasAdversarial'

		let canvasSize = 500
		let tensorSize = 224

		var selectedModel = this.modelService.getModelDataObjectFromName(selectedModelName)
		if(selectedModel == null)
			return

		let topX = 5
		let desiredCanvasImgSize = 500

		var t0 = performance.now();

		// Get and set the classification results of the original image
		let modelOutput = this.modelService.tryPredict(selectedModel, canvasOriginal, undefined)
		let predictions = this.modelService.decodeOutput(selectedModel, modelOutput, topX)
		this.transferService.setOriginalPredictions(predictions)

		var t1 = performance.now();
		console.log("Prediction complete in:" + ((t1 - t0)/1000).toFixed(3) + " (ms).")

		let topPrediction = predictions[0]
		
		const img3 = <tf.Tensor3D> this.imgService.getTensorFromCanvas(canvasOriginal, 3, selectedModel.imgHeight, selectedModel.imgWidth, selectedModel.batchInput)
		const img4 = <tf.Tensor4D> this.imgService.getTensorFromCanvas(canvasOriginal, 4, selectedModel.imgHeight, selectedModel.imgWidth, selectedModel.batchInput)	

	    if(!this.attackMethods.includes(selectedAttackMethod))
	    	return console.error('Attack method' + selectedAttackMethod + ' is not valid')
	    
		if(selectedAttackMethod == 'T-FGSM' && this.targetClass==null)
		{
			this.targetClass = this.selectRandomImageNetClass()
			console.log('T-FGSM selected, but no target class selected, random class selected.')
		}		    

		switch(selectedAttackMethod)
	    {
			case 'FGSM':
				var attackMethodFunctionResult = this.advService.FGSM(selectedModel, selectedModel.classLabels, topPrediction.className, img3, img4, this.epsilon);
				break;

			case 'T-FGSM':
				var attackMethodFunctionResult = this.advService.Targeted_FGSM(selectedModel, selectedModel.classLabels, this.targetClass, img3, img4, this.epsilon);
				break;
		}

		// Get and set the classification results of this adversarial image, once the attackMethod has completed
		attackMethodFunctionResult.then(async (adversarialImgTensor) => 
		{	

			this.imgService.drawTensorToCanvas(canvasAdversarial, adversarialImgTensor, 224, 224)	

			let adversarialModelOutput = this.modelService.tryPredict(selectedModel, canvasAdversarial, undefined)

			let predictions = this.modelService.decodeOutput(selectedModel, adversarialModelOutput, topX)
			this.transferService.setAdversarialPredictions(predictions)		


			this.imgService.drawTensorToCanvas(canvasAdversarial, adversarialImgTensor, 500, 500)		


			var t2 = performance.now();
			console.log("Adversarial image generation complete in:" + ((t2 - t1)/1000).toFixed(3) + " (ms).")
				
		})	
	}



	onEpsilonChange(value)
	{
		// TODO: Should max epsilon value be 100?
		if(value > 100)
			value = 100

		this.epsilon = value

		this.applyCurrentlySelectedAttackMethod()		
	}


	onRandomClick()
	{
		this.targetClass = this.selectRandomImageNetClass()
		this.applyCurrentlySelectedAttackMethod()
	}


	selectRandomImageNetClass()
	{
		let randomNumber = Math.floor((Math.random() * 100)); //Random number between 0 & 1000
		return IMAGENET_CLASSES[randomNumber] 
	}
	
	onIMGLoad()
	{
		let img = <HTMLImageElement> document.getElementById('fileSelectImg')

		this.imgService.drawImageToCanvas(img, 'canvasOriginal', 500, 500)
		//this.imgService.drawImageToCanvas(img, 'canvasDifference', 299, 299)
		this.imgService.drawImageToCanvas(img, 'canvasAdversarial', 500, 500)

		//this.imgService.drawImageToCanvas(img, 'canvasOriginal_TableTest', 299, 299)
		//this.imgService.drawImageToCanvas(img, 'canvasDifference_TableTest', 299, 299)
		//this.imgService.drawImageToCanvas(img, 'canvasAdversarial_TableTest', 299, 299)

	}
}
