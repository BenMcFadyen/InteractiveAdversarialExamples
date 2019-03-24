export class ModelStats
{
	name: string
	size: number
	layers:number
	top1: number
	top5:number
	parameters:number
	requestLoad:boolean

	constructor(name:string, size:number, layers:number, top1:number, top5:number, parameters:number, requestLoad:boolean)
	{
		this.name = name
		this.size = size
		this.layers = layers
		this.top1 = top1
		this.top5 = top5
		this.parameters = parameters
		this.requestLoad = requestLoad
	}
}