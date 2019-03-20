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


	checkDuplicateModel(modelName:string):boolean
	{
		if(this.allModelPredictions == null)
			return 

		for(var i = 0; i < this.allModelPredictions.length; i++)
		{
			if(this.allModelPredictions[i].modelName == modelName)
			{
				this.allModelPredictions.splice(i,1)// remove the element from the array
				return true //TODO potentially insert here too, to prevent the models jumping around when switching
			}
		}

		return false
	}


	addNewModelPrediction(newModelPrediction: ModelPrediction, clearPrevious:boolean)
	{
		if(clearPrevious)
		{	
			// if newModelPrediction is null, set predictions to null, this will hide the prediction div element
			if(newModelPrediction == null)
			{
				this.allModelPredictions = null
				this.allModelPredictionsSource.next(null)
				return
			}

			this.allModelPredictionsSource.next([newModelPrediction])
			return
		}

		if(this.allModelPredictions == null)
			this.allModelPredictions = new Array()

		// checks if newModelPrediction is already a prediction, if it is, removes this.
		this.checkDuplicateModel(newModelPrediction.modelName)

		// push the new prediction to the array, then set the source
		this.allModelPredictions.push(newModelPrediction)
		this.allModelPredictionsSource.next(this.allModelPredictions)
	}


	getAllModelPredictions() : ModelPrediction[]
	{
		return this.allModelPredictions
	}

}
