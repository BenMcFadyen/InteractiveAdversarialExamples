import * as tf from '@tensorflow/tfjs';

export class ModelData
{
	name: string
	model: tf.Model
	loaded: boolean
	imgHeight:number
	imgWidth:number
	imgChannels:number
	classLabels:Array<any>
	applySoftMax:boolean
	predictionOutputLayer:string
	batchInput:boolean
	normaliseImage:boolean

	constructor(name:string, 	 			imgHeight:number, 
				imgWidth:number, 			imgChannels:number, 
				classLabels, 				applySoftMax:boolean, predictionOutputLayer:string = null,
				batchInput:boolean = true, 	normaliseImage:boolean = true)
	{
		this.name = name
		this.imgHeight = imgHeight
		this.imgWidth = imgWidth
		this.imgChannels = imgChannels
		this.classLabels = classLabels
		this.applySoftMax = applySoftMax
		this.predictionOutputLayer = predictionOutputLayer
		this.batchInput = batchInput
		this.normaliseImage = normaliseImage
	}
}