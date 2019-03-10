import { Component, OnInit } from '@angular/core';
import { ModelService } from '../model.service';
import { ImageService } from '../image.service';
import { AdvService } from '../adv.service';
import { TransferService } from '../transfer.service';
import { ModelData } from '../ModelData';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit 
{
	imgURL: string = 'assets/images/cat299.jpg'
	epsilon: number = 0.025
	selectedModel: string

  	constructor(
		private modelService: ModelService,
  		private imageService: ImageService,
  		private transferService: TransferService,
  		private advService: AdvService) 
  	{ 

  	}

	ngOnInit() 
	{
		this.modelService.loadAllModels()
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

		this.generateClassify(selectedModelName)		
	}



	generateClassify(selectedModelName: string)
	{
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

			
			// Generate the raw adversarial perturbation
			this.advService.genAdvPerturbation(selectedModel, predictions[0].className, img3, img4, this.epsilon).then(perturbation => 
			{	
				// Apply an alpha layer to the raw perturbation, to allow it to be seen
				// TODO: this will need to be scaled at low epsilon values, or it will not be noticable
				var drawPerturbation = this.advService.applyAlphaChannel(perturbation)

				// draw the raw perturbation to the canvas: BEFORE it is combined with the original image to generate the full adversarial example
				this.imageService.drawTensorToCanvas('canvasDifference', drawPerturbation, 299, 299)		

				// get prediction for the raw perturbation
				this.modelService.tryPredict(selectedModel, canvasDifference).then(modelOutput =>
				{
					let predictions = this.modelService.decodeOutput(selectedModel, modelOutput, 5)
					this.transferService.setDifferencePredictions(predictions)							
				})	

				// combine the original image and the perturbation
				this.advService.combineImgAndPerturbation(img4, perturbation).then(perturbedImgTensor => 
				{
					this.imageService.drawTensorToCanvas('canvasAdversarial', perturbedImgTensor, 299, 299)		

					// TODO: re-classification SHOULD be done with the raw peturbedIMGTensor, re-sizing for canvas will break things?
					// Currently it is being done with the re-sized canvas
					this.modelService.tryPredict(selectedModel, canvasAdversarial).then(modelOutput =>
					{
						let predictions = this.modelService.decodeOutput(selectedModel, modelOutput, 5)
						this.transferService.setAdversarialPredictions(predictions)							
					})	
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

		this.generateClassify(this.selectedModel)		
	}

	
	onIMGLoad()
	{
		let img = <HTMLImageElement> document.getElementById('fileSelectImg')

		this.imageService.drawImageToCanvas(img, 'canvasOriginal', 299, 299)
		this.imageService.drawImageToCanvas(img, 'canvasDifference', 299, 299)
		this.imageService.drawImageToCanvas(img, 'canvasAdversarial', 299, 299)


		//this.imageService.drawImageToCanvas(img, 'canvasOriginal_TableTest', 299, 299)
		//this.imageService.drawImageToCanvas(img, 'canvasDifference_TableTest', 299, 299)
		//this.imageService.drawImageToCanvas(img, 'canvasAdversarial_TableTest', 299, 299)

	}
}
