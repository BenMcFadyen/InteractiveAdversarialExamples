import * as tf from '@tensorflow/tfjs';
import { ModelStats } from './ModelStats';

export class ModelData
{
	name: string
	stats:ModelStats
	model: tf.LayersModel
	loaded: boolean
	imgHeight:number
	imgWidth:number
	imgChannels:number
	classLabels:Array<any>
	availableForAdversarialGeneration:boolean
	applySoftMax:boolean
	predictionOutputLayer:string
	batchInput:boolean
	normaliseImage:boolean

	/**
	* @constructor
 	* @param {string} 	name - Name of the model
 	* @param {ModelStats} stats - Stats of the model (size, topX...)
 	* @param {tf.LayersModel} model - tensorflow.js model object, used for prediction
 	* @param {boolean}  loaded - True if model is loaded
 	* @param {number} 	imgHeight - Required image height (pixels) for prediction
 	* @param {number} 	imgWidth - Required image width (pixels) for prediction
 	* @param {number} 	imgChannels - Required image channels for prediction
 	* @param {Array<any>} classLabels - Class labels that match the tf.model returns
 	* @param {boolean} 	availableForAdversarialGeneration - Defines if the model should be used for adversarial image genertation
 	* @param {boolean} 	applySoftMax - Set true if softmax NEEDS applying to model.predict output 	
 	* @param {string} 	predictionOutputLayer - The name of the layer at which model logits can be taken BEFORE an activation is applied (e.g softMax)
 	* @param {boolean} 	batchInput - Set true if model requires input to be batched for prediction
 	* @param {boolean} 	normaliseImage - Set true if images are required to be normalised within the range [-1,1] before prediction 	
	*/
	constructor(name:string, 	 	
				stats:ModelStats,
				imgHeight:number, 			
				imgWidth:number, 			
				imgChannels:number, 		
				classLabels,
				availableForAdversarialGeneration:boolean,
				applySoftMax:boolean, 
				predictionOutputLayer:string = null,
				batchInput:boolean = true, 
				normaliseImage:boolean = true)
	{
		this.name = name
		this.stats = stats,
		this.imgHeight = imgHeight
		this.imgWidth = imgWidth
		this.imgChannels = imgChannels
		this.classLabels = classLabels
		this.availableForAdversarialGeneration = availableForAdversarialGeneration		
		this.applySoftMax = applySoftMax
		this.predictionOutputLayer = predictionOutputLayer
		this.batchInput = batchInput
		this.normaliseImage = normaliseImage
	}
}