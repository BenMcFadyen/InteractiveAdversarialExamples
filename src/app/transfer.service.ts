import { Injectable } from '@angular/core';
import { Prediction } from './Prediction';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransferService 
{
 	private originalPredictions: Prediction[] = [new Prediction('A', 'B'),
										 		 new Prediction('C', 'D'),
										 		 new Prediction('E', 'F')]

 	private differencePredictions: Prediction[] = [new Prediction('1', '2'),
										 		   new Prediction('3', '4'),
										 		   new Prediction('5', '6')] 	

 	private adversarialPredictions: Prediction[] = [new Prediction('7', '8'),
											 		new Prediction('9', '10'),
											 		new Prediction('11', '12')]


	private originalPredictionsSource = new BehaviorSubject(this.originalPredictions);
	private differencePredictionsSource = new BehaviorSubject(this.differencePredictions);
	private adversarialPredictionsSource = new BehaviorSubject(this.adversarialPredictions);

	currentoriginalPredictions = this.originalPredictionsSource.asObservable();
	currentdifferencePredictions= this.differencePredictionsSource.asObservable();
	currentadversarialPredictionsSource = this.adversarialPredictionsSource.asObservable();

	constructor() 
	{ 

	}

	setOriginalPredictions(originalPredictions: Prediction[])
	{
		this.originalPredictionsSource.next(originalPredictions)
	}

	getOriginalPredictions() : Prediction[]
	{
		return this.originalPredictions
	}

	setDifferencePredictions(differencePredictions: Prediction[])
	{
		this.differencePredictionsSource.next(differencePredictions)
	}

	getDifferencePredictions() : Prediction[]
	{
		return this.differencePredictions
	}

	setAdversarialPredictions(adversarialPredictions: Prediction[])
	{
		this.adversarialPredictionsSource.next(adversarialPredictions)
	}

	getAdversarialPredictions() : Prediction[]
	{
		return this.adversarialPredictions
	}
}
