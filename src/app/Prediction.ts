export class Prediction 
{
	className:string;
	probability: number;

	constructor(className, probability)
	{
		this.className = className;
		this.probability = probability;
	}	
}
