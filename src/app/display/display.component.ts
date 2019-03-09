import { Component, OnInit } from '@angular/core';
import { Prediction } from '../Prediction';

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit
{

 	originalPredictions: Prediction[] = [new Prediction('test', 'test2')]
 	differencePredictions: Prediction[]
 	adversarialPredictions: Prediction[]

	constructor() 
	{
		
	}

	ngOnInit() 
	{

	}

}
