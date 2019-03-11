import { Component, OnInit } from '@angular/core';
import { ModelService } from '../model.service';
import { ImageService } from '../image.service';
import { AdvService } from '../adv.service';
import { TransferService } from '../transfer.service';
import { ModelData } from '../ModelData';
import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from '@tensorflow-models/mobilenet/dist/imagenet_classes';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit 
{
	imgURL: string = 'assets/images/cat299.jpg'
	epsilon: number = 5
	selectedModel: string
	targetClass: string

	imageNet: string[]

	attackMethods: string[] = 
	[
	'FGSM',
	'T-FGSM'
	]

	selectedAttackMethod: string


  	constructor(private modelService: ModelService,
		  		private imageService: ImageService,
		  		private transferService: TransferService,
		  		private advService: AdvService) 
  	{ 

  	}

	ngOnInit() 
	{
		this.modelService.loadAllModels()
		this.parseIMAGENET()
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

		this.applyAttackMethod()		
	}



	applyAttackMethod()
	{

		var selectedModelName = this.selectedModel
		var selectedAttackMethod = this.selectedAttackMethod

		var originalCanvas = <HTMLCanvasElement> document.getElementById('canvasOriginal')

		var selectedModel = this.modelService.getModelDataObjectFromName(selectedModelName)
		if(selectedModel == null)
			return

		this.modelService.tryPredict(selectedModel, originalCanvas).then(modelOutput =>
		{
			let predictions = this.modelService.decodeOutput(selectedModel, modelOutput, 5)

			this.transferService.setOriginalPredictions(predictions)

			console.log('Top X predictions: ')
			console.log(predictions)

			var canvasOriginal = <HTMLCanvasElement> document.getElementById('canvasOriginal')
			var canvasDifference = <HTMLCanvasElement> document.getElementById('canvasDifference')			
			var canvasAdversarial = <HTMLCanvasElement> document.getElementById('canvasAdversarial')

			//TODO WHY 227
		    // 3-channel img for concat
		    const img3 = tf.image.resizeBilinear(tf.fromPixels(canvasOriginal, 3), [227, 227])
		    // 4-channel img with alpha
		    const img4 = tf.image.resizeBilinear(tf.fromPixels(canvasOriginal, 4), [227, 227])		


		    switch(selectedAttackMethod)
		    {
			  case 'FGSM':
			    
			    var attackMethodFunctionResult = this.advService.FGSM(selectedModel.model, predictions[0].className, img3, img4, this.epsilon);
			    break;

			  case 'T-FGSM':

  			    if(this.targetClass == null)
  			    {
					this.targetClass = this.selectRandomImageNetClass()
		    		console.log('T-FGSM selected, but no target class selected, selecting random class...')
  			    }

    			var attackMethodFunctionResult = this.advService.Targeted_FGSM(selectedModel.model, this.targetClass, img3, img4, this.epsilon);

			    break;

			  default:
			    return console.error('No attack method selected')
			}

			// Generate the adversarial image
			attackMethodFunctionResult.then(adversarialImgTensor => 
			{	
				this.imageService.drawTensorToCanvas('canvasAdversarial', adversarialImgTensor, 500, 500)		

				// TODO: re-classification SHOULD be done with the raw peturbedIMGTensor, re-sizing for canvas will break things?
				// Currently it is being done with the re-sized canvas??
				this.modelService.tryPredict(selectedModel, canvasAdversarial).then(modelOutput =>
				{
					let predictions = this.modelService.decodeOutput(selectedModel, modelOutput, 5)
					this.transferService.setAdversarialPredictions(predictions)							
				})	
							
			})
		})
	}



	onEpsilonChange(value)
	{
		// TODO: Should max epsilon value be 100?
		if(value > 100)
			value = 100

		this.epsilon = value

		this.applyAttackMethod()		
	}


	onRandomClick()
	{
		this.targetClass = this.selectRandomImageNetClass()
		this.applyAttackMethod()
	}


	selectRandomImageNetClass()
	{
		let randomNumber = Math.floor((Math.random() * 100)); //Random number between 0 & 1000
		return IMAGENET_CLASSES[randomNumber] 
	}
	
	onIMGLoad()
	{
		let img = <HTMLImageElement> document.getElementById('fileSelectImg')

		this.imageService.drawImageToCanvas(img, 'canvasOriginal', 500, 500)
		//this.imageService.drawImageToCanvas(img, 'canvasDifference', 299, 299)
		this.imageService.drawImageToCanvas(img, 'canvasAdversarial', 500, 500)

		//this.imageService.drawImageToCanvas(img, 'canvasOriginal_TableTest', 299, 299)
		//this.imageService.drawImageToCanvas(img, 'canvasDifference_TableTest', 299, 299)
		//this.imageService.drawImageToCanvas(img, 'canvasAdversarial_TableTest', 299, 299)

	}
}
