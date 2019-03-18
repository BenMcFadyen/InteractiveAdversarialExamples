import { Injectable } from '@angular/core';
import { Prediction } from './Prediction';
import { ModelPrediction } from './ModelPrediction';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransferService 
{

 	private placeholderPredictions: Prediction[] = [new Prediction('A', 50),
											 		 new Prediction('B', 25),
											 		 new Prediction('C', 25)]

	private placeholderModelPrediction = new ModelPrediction('Placeholder', this.placeholderPredictions, this.placeholderPredictions, this.placeholderPredictions)

	private allModelPredictions:ModelPrediction[] = null //= [this.placeholderModelPrediction]
	private allModelPredictionsSource = new BehaviorSubject(this.allModelPredictions);
	currentAllModelPredictionsSource = this.allModelPredictionsSource.asObservable();


	private adversarialImageModelName:string
	private adversarialImageModelNameSource = new BehaviorSubject(this.adversarialImageModelName);
	currentAdversarialImageModelNameSource = this.adversarialImageModelNameSource.asObservable();

	constructor() 
	{ 

	}

	setAdversarialImageModelName(adversarialImageModelName:string)
	{
		this.adversarialImageModelNameSource.next(adversarialImageModelName)
	}

	getAdversarialImageModelName() : string
	{
		return this.adversarialImageModelName
	}


	addNewModelPrediction(newModelPrediction: ModelPrediction, clearPrevious:boolean)
	{

		if(clearPrevious)
		{	
			// if newModelPrediction is null, clear the prediction array, this will hide the prediction table
			if(newModelPrediction == null)
			{
				this.allModelPredictions == null
				this.allModelPredictionsSource.next(null)
				return
			}

			this.allModelPredictionsSource.next([newModelPrediction])
			return
		}

		if(this.allModelPredictions == null)
			this.allModelPredictions = new Array()

		this.allModelPredictions.push(newModelPrediction)
		this.allModelPredictionsSource.next(this.allModelPredictions)
	}


	getAllModelPredictions() : ModelPrediction[]
	{
		return this.allModelPredictions
	}

}
