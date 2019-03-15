export class Prediction 
{
	className:string;
	confidence: number;

	constructor(className:string, confidence:number)
	{
		this.className = className;
		this.confidence = confidence;
	}	
}
