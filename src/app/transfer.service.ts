import { Injectable } from '@angular/core';
import { Prediction } from './Prediction';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransferService 
{
 	private predictions: Prediction[][] = 
 	[
 		[new Prediction('A', 'B'),
 		 new Prediction('C', 'D'),
 		 new Prediction('E', 'F')],

 		[new Prediction('1', '2'),
 		 new Prediction('3', '4'),
 		 new Prediction('5', '6')],

 		[new Prediction('7', '8'),
 		 new Prediction('9', '10'),
 		 new Prediction('11', '12')],
	]

	private predictionsSource = new BehaviorSubject(this.predictions);
	currentPredictions = this.predictionsSource.asObservable();

	constructor() 
	{ 

	}


	setPredictions(predictions: Prediction[][])
	{
		this.predictionsSource.next(predictions)
	}

	getPredictions() : Prediction[][]
	{
		return this.predictions
	}
}
