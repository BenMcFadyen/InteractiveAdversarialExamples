import { Injectable } from '@angular/core';
import { Prediction } from './Prediction';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransferService 
{

	private originalPredictionModel:string
	private adversarialPredictionModel:string

 	private originalPredictions: Prediction[] = [new Prediction('A', 1),
										 		 new Prediction('C', 2),
										 		 new Prediction('E', 3)]

 	private differencePredictions: Prediction[] = [new Prediction('1',2),
										 		   new Prediction('3', 4),
										 		   new Prediction('5', 6)] 	

 	private adversarialPredictions: Prediction[] = [new Prediction('7', 8),
											 		new Prediction('9', 10),
											 		new Prediction('11', 12)]


	private originalPredictionModelSource = new BehaviorSubject(this.originalPredictionModel);
	private adversarialPredictionModelSource = new BehaviorSubject(this.adversarialPredictionModel);

	currentOriginalPredictionModelSource = this.originalPredictionModelSource.asObservable();
	currentAdversarialPredictionModelSource = this.adversarialPredictionModelSource.asObservable();

	private originalPredictionsSource = new BehaviorSubject(this.originalPredictions);
	private differencePredictionsSource = new BehaviorSubject(this.differencePredictions);
	private adversarialPredictionsSource = new BehaviorSubject(this.adversarialPredictions);

	currentOriginalPredictions = this.originalPredictionsSource.asObservable();
	currentDifferencePredictions = this.differencePredictionsSource.asObservable();
	currentAdversarialPredictionsSource = this.adversarialPredictionsSource.asObservable();

	constructor() 
	{ 

	}

	setOriginalPredictionModel(originalPredictionModel: string)
	{
		this.originalPredictionModelSource.next(originalPredictionModel)
	}

	getOriginalPredictionModel() : string
	{
		return this.originalPredictionModel
	}


	setAdversarialPredictionModel(adversarialPredictionModel: string)
	{
		this.adversarialPredictionModelSource.next(adversarialPredictionModel)
	}

	getAdversarialPredictionModel() : string
	{
		return this.adversarialPredictionModel
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
