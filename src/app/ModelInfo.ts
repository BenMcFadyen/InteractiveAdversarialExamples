export class ModelInfo 
{
	name: string;
	model: any;
	loaded: boolean;
	predict:Function;

	constructor(name, model, predict)
	{
		this.name = name;
		this.model = model;
		this.predict = predict;
	}	
}
