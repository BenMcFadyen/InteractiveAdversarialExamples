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
		this.transferService.currentPredictions.subscribe(predictions => 
		{
			this.originalPredictions = predictions[0]
			this.differencePredictions = predictions[1]
			this.adversarialPredictions = predictions[2]
		})
	}



}
