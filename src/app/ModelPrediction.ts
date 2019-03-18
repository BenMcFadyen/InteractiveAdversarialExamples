import { Prediction } from './Prediction';

export class ModelPrediction 
{
	modelName:string;
	originalPredictions: Prediction[]
	differencePredictions: Prediction[]
	adversarialPredictions: Prediction[]

	/**
	* @constructor
 	* @param {string} modelName
 	* @param {Prediction[]} originalPredictions
 	* @param {Prediction[]} differencePredictions 
 	* @param {Prediction[]} adversarialPredictions
	*/
	constructor(modelName:string, originalPredictions:Prediction[], differencePredictions:Prediction[], adversarialPredictions:Prediction[])
	{
		this.modelName = modelName;
		this.originalPredictions = originalPredictions;
		this.differencePredictions = differencePredictions;
		this.adversarialPredictions = adversarialPredictions;
	}	
}
