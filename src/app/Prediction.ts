export class Prediction 
{
	className:string;
	confidence: number;

	constructor(className, confidence)
	{
		this.className = className;
		this.confidence = confidence;
	}	
}
