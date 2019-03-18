import { Component, OnInit } from '@angular/core';
import { Prediction } from '../Prediction';
import { TransferService } from '../transfer.service';

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit
{

 	originalPredictionModel: string
 	adversarialPredictionModel: string

 	originalPredictions: Prediction[]
 	differencePredictions: Prediction[]
 	adversarialPredictions: Prediction[]

	constructor(private tferService: TransferService) 
	{
		
	}

	ngOnInit() 
	{
		this.tferService.currentOriginalPredictions.subscribe(originalPredictions => this.originalPredictions = originalPredictions)
		this.tferService.currentDifferencePredictions.subscribe(differencePredictions => this.differencePredictions = differencePredictions)
		this.tferService.currentAdversarialPredictionsSource.subscribe(adversarialPredictions => this.adversarialPredictions = adversarialPredictions)

		this.tferService.currentOriginalPredictionModelSource.subscribe(originalPredictionModel => this.originalPredictionModel = originalPredictionModel)
		this.tferService.currentAdversarialPredictionModelSource.subscribe(adversarialPredictionModel => this.adversarialPredictionModel = adversarialPredictionModel)

	}

}
