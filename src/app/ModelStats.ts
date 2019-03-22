export class ModelStats
{
	name: string
	size: number
	top1: number
	top5:number
	parameters:number
	requestLoad:boolean

	constructor(name:string, size:number, top1:number, top5:number, parameters:number, requestLoad:boolean)
	{
		this.name = name
		this.size = size
		this.top1 = top1
		this.top5 = top5
		this.parameters = parameters
		this.requestLoad = requestLoad
	}
}