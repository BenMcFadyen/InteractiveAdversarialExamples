import { Prediction } from './Prediction';

export class ModelPrediction 
{
	modelName:string;
	originalPredictions: Prediction[]
	differencePredictions: Prediction[]
	adversarialPredictions: Prediction[]
	targetClass:string

	/**
	* @constructor
 	* @param {string} modelName
 	* @param {Prediction[]} originalPredictions
 	* @param {Prediction[]} differencePredictions 
 	* @param {Prediction[]} adversarialPredictions
 	* @param {targetClass} targetClass - The target class of the adversarialPredictions (if T-FGSM was used) 	
	*/
	constructor(modelName:string, originalPredictions:Prediction[], differencePredictions:Prediction[], adversarialPredictions:Prediction[], targetClass:string = null)
	{
		this.modelName = modelName
		this.originalPredictions = originalPredictions
		this.differencePredictions = differencePredictions
		this.adversarialPredictions = adversarialPredictions
		this.targetClass = targetClass
	}	
}
