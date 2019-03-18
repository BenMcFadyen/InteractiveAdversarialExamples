import { Component, OnInit } from '@angular/core';
import { Prediction } from '../Prediction';
import { ModelPrediction } from '../ModelPrediction';


import { TransferService } from '../transfer.service';

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit
{
 	allModelPredictions:ModelPrediction[]
 	adversarialImageModelNameSource:string 

	constructor(private tferService: TransferService) 
	{


	}

	ngOnInit() 
	{
		this.tferService.currentAllModelPredictionsSource.subscribe(allModelPredictions => this.allModelPredictions = allModelPredictions)
		this.tferService.currentAdversarialImageModelNameSource.subscribe(adversarialImageModelNameSource => this.adversarialImageModelNameSource = adversarialImageModelNameSource)

	}

}
