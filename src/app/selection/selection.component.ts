import { Component, OnInit } from '@angular/core';
import { ModelService } from '../model.service';
import { ModelData } from '../ModelData';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit 
{
	imgURL: string
	epsilon: number = 1;
	selectedModel: string

  	constructor(private modelService: ModelService) 
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

	}


	onEpsilonChange(value)
	{
		// TODO: Should max epsilon value be 100?
		if(value > 100)
			value = 100

		this.epsilon = value
	}
}
