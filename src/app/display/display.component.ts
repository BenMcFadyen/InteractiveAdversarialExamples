import { Component, OnInit } from '@angular/core';
import { Prediction } from '../Prediction';
import { ModelPrediction } from '../ModelPrediction';
import { ImageService } from '../image.service';


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

	columnsToDisplay = ['className', 'confidence']

	amplification = 0

	adversarialCanvasIsBlank = (()=> 
	{
		return this.imgService.isCanvasBlank('canvasAdversarial')
	})

	constructor(private tferService: TransferService, private imgService: ImageService) 
	{
	}

	ngOnInit() 
	{
		this.tferService.currentAllModelPredictionsSource.subscribe(allModelPredictions => this.allModelPredictions = allModelPredictions)
		this.tferService.currentAdversarialImageModelNameSource.subscribe(adversarialImageModelNameSource => this.adversarialImageModelNameSource = adversarialImageModelNameSource)
	}


	onAmplificationChange()
	{
		//TODO:send to transfer service

	}
}
