import { Component, OnInit } from '@angular/core';
import { ModelService } from '../model.service';
import { ImageService } from '../image.service';

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

  	constructor(private modelService: ModelService, private imageService: ImageService) 
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

		console.log("Predicting: "  + selectedModelName)



		// figure out what model is to be executed
		// check an image has been loaded/selected?		
		// figure our what image size is needed
		// resize/recanvas the image? //do this when uploaded?

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

		this.imageService.drawIMGToCanvas(img, 'canvasOriginal', 299, 299)
		this.imageService.drawIMGToCanvas(img, 'canvasDifference', 299, 299)
		this.imageService.drawIMGToCanvas(img, 'canvasAdversarial', 299, 299)


		this.imageService.drawIMGToCanvas(img, 'canvasOriginal_TableTest', 299, 299)
		this.imageService.drawIMGToCanvas(img, 'canvasDifference_TableTest', 299, 299)
		this.imageService.drawIMGToCanvas(img, 'canvasAdversarial_TableTest', 299, 299)

	}
}
