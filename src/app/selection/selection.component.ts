import { Component, OnInit } from '@angular/core';
import { ModelService } from '../model.service';
import { ImageService } from '../image.service';
import { TransferService } from '../transfer.service';

import { ModelData } from '../ModelData';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit 
{
	imgURL: string = 'assets/images/cat299.jpg'
	epsilon: number = 1
	selectedModel: string

  	constructor(
		private modelService: ModelService,
  		private imageService: ImageService,
  		private transferService: TransferService) 
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

	onPredictButtonClick(modelSelection)
	{
		var selectedModelName = this.selectedModel

		if(this.imgURL == null)
		{
			console.error("No image selected");
			return;
		}

		var originalCanvas = <HTMLCanvasElement> document.getElementById('canvasOriginal')

		this.modelService.tryPredict(selectedModelName, originalCanvas).then(modelOutput =>
		{
			let predictions = this.modelService.decodeOutput(selectedModelName, modelOutput, 5)

			this.transferService.setPredictions(new Array(predictions, predictions, predictions))

			console.log('Top X predictions: ')
			console.log(predictions)
	
		})

	}


	onEpsilonChange(value)
	{
		// TODO: Should max epsilon value be 100?
		if(value > 100)
			value = 100

		this.epsilon = value
	}

	
	onIMGLoad()
	{
		let img = <HTMLImageElement> document.getElementById('fileSelectImg')

		this.imageService.drawImageToCanvas(img, 'canvasOriginal', 299, 299)
		this.imageService.drawImageToCanvas(img, 'canvasDifference', 299, 299)
		this.imageService.drawImageToCanvas(img, 'canvasAdversarial', 299, 299)


		this.imageService.drawImageToCanvas(img, 'canvasOriginal_TableTest', 299, 299)
		this.imageService.drawImageToCanvas(img, 'canvasDifference_TableTest', 299, 299)
		this.imageService.drawImageToCanvas(img, 'canvasAdversarial_TableTest', 299, 299)

	}
}
