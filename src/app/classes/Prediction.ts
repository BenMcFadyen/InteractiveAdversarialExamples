export class Prediction 
{
	className:string;
	confidence: number;
	colour: string;

	/**
	* @constructor
 	* @param {string} className - The name of the class to which this prediction belongs
 	* @param {number} confidence - The confidence (%) of the predicted className
	*/
	constructor(className:string, confidence:number)
	{
		this.className = className;
		this.confidence = confidence;
	}	
}
