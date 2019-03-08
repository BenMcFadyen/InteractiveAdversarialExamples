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
	epsilon: number = 1;

  	constructor(private modelService: ModelService) 
  	{ 

  	}

	ngOnInit() 
	{
		this.modelService.loadAllModels()
	}


	async onEpsilonChange(value)
	{
		// TODO: Should max epsilon value be 100?
		if(value > 100)
			value = 100

		this.epsilon = value
	}
}
