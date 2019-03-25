import { Injectable } from '@angular/core';
import { Prediction } from './Prediction';
import { ModelPrediction } from './ModelPrediction';
import { BehaviorSubject } from 'rxjs';

import * as tf from '@tensorflow/tfjs';


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


	private perturbationAmplification:number
	private perturbationAmplificationSource = new BehaviorSubject(this.perturbationAmplification);
	currentPerturbationAmplificationSource = this.perturbationAmplificationSource.asObservable();	


	private perturbation:tf.Tensor3D|tf.Tensor4D = null
	private perturbationSource = new BehaviorSubject(this.perturbation);
	currentPerturbationSource = this.perturbationSource.asObservable();		

	constructor() 
	{ 

	}

	setPerturbation(perturbation: tf.Tensor3D|tf.Tensor4D)
	{
		// dispose old tensor from memory
		if(this.perturbationSource.getValue() != null)
			this.perturbationSource.getValue().dispose()
		

		this.perturbationSource.next(perturbation)
	}


	setPerturbationAmplification(perturbationAmplification:number)
	{
		this.perturbationAmplificationSource.next(perturbationAmplification)
	}
	

	setAdversarialImageModelName(adversarialImageModelName:string)
	{
		this.adversarialImageModelNameSource.next(adversarialImageModelName)
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
			this.setAdversarialPredictionColouring()

			return
		}

		if(this.allModelPredictions == null)
			this.allModelPredictions = new Array()

		// checks if newModelPrediction is already a prediction, if it is, removes this.
		this.checkDuplicateModel(newModelPrediction.modelName)

		// push the new prediction to the array, then set the source
		this.allModelPredictions.push(newModelPrediction)
		this.allModelPredictionsSource.next(this.allModelPredictions.reverse())
		this.setAdversarialPredictionColouring()
	}



	/**	Set the adversarialPredictions styles to be displayed with the following rules:
	*	T-FGSM (Targeted-Fast Gradient Sign Method)
	*		 Green  -> Adversarial Top1 = Target Class
	*		 Orange -> Adversarial Top2-Top5 = Target Class
	*		 Red 	-> Adversarial Top1 = Original Top1
	*
	*	FGSM 
	*		 Green  -> Adversarial Top1 != Original Top1-5 (The top 1 prediction is not any of the top 1-5 adversarial predictions)
	*		 Orange -> Adversarial Top1 != Original Top2-5  (The top 1 prediction is not the top1 prediction, but is )
	*		 Red 	-> Adversarial Top1 = Original Top 1
	*/
	setAdversarialPredictionColouring()
	{
		if(this.allModelPredictions == null)
			return

		if(this.allModelPredictions[0].adversarialPredictions == null)
			return

		for (let modelPrediction of this.allModelPredictions) 
		{

			if(modelPrediction.targetClass != null) //target class is set, must be T-FGSM
			{
				// if adv_top1 == target, colour = green 0
				if(modelPrediction.adversarialPredictions[0].className == modelPrediction.targetClass)
				{
					modelPrediction.adversarialPredictions[0].colour = 'green'		
				}
				else if(modelPrediction.adversarialPredictions[0].className != modelPrediction.originalPredictions[0].className)
				{
					modelPrediction.adversarialPredictions[0].colour = 'orange'
				}

				// if adv_top1 == original_top1, colour = red 
				if(modelPrediction.adversarialPredictions[0].className == modelPrediction.originalPredictions[0].className)
				{
					modelPrediction.adversarialPredictions[0].colour = 'red'
				}

				// if adv_top5/x == target, colour = orange  (not top 1)
				for(let i = 1; (i <  5 && i < modelPrediction.adversarialPredictions.length); i++)
				{
					if(modelPrediction.adversarialPredictions[i].className == modelPrediction.targetClass)
					{
						modelPrediction.adversarialPredictions[i].colour = 'orange'
					}		
				}

	  		}
	  		else //target class is not set
	  		{
  				// if adv_top1 != original_top1, colour = green 
				if(modelPrediction.adversarialPredictions[0].className != modelPrediction.originalPredictions[0].className)
				{
					modelPrediction.adversarialPredictions[0].colour = 'green'
				}
				else if(modelPrediction.adversarialPredictions[0].className == modelPrediction.originalPredictions[0].className)
				{
					// if adv_top1 == original_top1, colour = red
					modelPrediction.adversarialPredictions[0].colour = 'red'
					return
				}

  				// if the original top1 is still in the adversarial top 2-5/x range, colour = orange
				for(let i = 1; (i <  5 && i < modelPrediction.adversarialPredictions.length); i++)
				{
					if(modelPrediction.adversarialPredictions[i].className == modelPrediction.originalPredictions[0].className)
					{
						modelPrediction.adversarialPredictions[i].colour = 'orange'
					}
					else
					{
						modelPrediction.adversarialPredictions[i].colour = null
					}	
				}
	  		}
	  	}
	}

	getAllModelPredictions() : ModelPrediction[]
	{
		return this.allModelPredictions
	}

}
