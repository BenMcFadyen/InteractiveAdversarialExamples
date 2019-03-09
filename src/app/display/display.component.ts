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

 	originalPredictions: Prediction[]
 	differencePredictions: Prediction[]
 	adversarialPredictions: Prediction[]

	constructor(private transferService: TransferService) 
	{
		
	}

	ngOnInit() 
	{
		this.transferService.currentoriginalPredictions.subscribe(originalPredictions => this.originalPredictions = originalPredictions)
		this.transferService.currentdifferencePredictions.subscribe(differencePredictions => this.differencePredictions = differencePredictions)
		this.transferService.currentadversarialPredictionsSource.subscribe(adversarialPredictions => this.adversarialPredictions = adversarialPredictions)
	}



}
