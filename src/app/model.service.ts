import { Injectable } from '@angular/core';
import { ModelData } from './ModelData';
import { ModelStats } from './ModelStats';

import { ImageService } from './image.service';
import { Prediction } from './Prediction';
import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from './ImageNetClasses';


@Injectable({
  providedIn: 'root'
})
export class ModelService 
{
	readonly MOBILETNET_STATS 	=  <ModelStats> {name: 'MobileNet', 	size: 14.2,  top1: 70.4, top5: 89.5, parameters: 4253864,  requestLoad:false}
	readonly MOBILENETV2_STATS 	=  <ModelStats> {name: 'MobileNetV2',	size: 24.5,  top1: 71.3, top5: 90.1, parameters: 3538984,  requestLoad:false}
	readonly NASNETMOBILE_STATS =  <ModelStats> {name: 'NASNetMobile', 	size: 24.1,  top1: 74.4, top5: 91.9, parameters: 5326716,  requestLoad:false}
	readonly RESNET50_STATS 	=  <ModelStats> {name: 'ResNet50',     	size: 100.6, top1: 74.9, top5: 92.1, parameters: 25636712, requestLoad:false}
	readonly DENSENET121_STATS 	=  <ModelStats> {name: 'DenseNet121',  	size: 32.6,  top1: 82.4, top5: 92.3, parameters: 8062504,  requestLoad:false}
	readonly DENSENET169_STATS 	=  <ModelStats> {name: 'DenseNet169',  	size: 57.4,  top1: 82.4, top5: 93.2, parameters: 14307880, requestLoad:false}
	readonly XCEPTION_STATS 	=  <ModelStats> {name: 'Xception',  	size: 89.9,  top1: 79.0, top5: 94.5, parameters: 22910480, requestLoad:false}
	readonly INCEPTIONV3_STATS 	=  <ModelStats> {name: 'InceptionV3',  	size: 94.0,  top1: 77.9, top5: 93.7, parameters: 23851784, requestLoad:false}

	MobileNet 	 = new ModelData('MobileNet', 	this.MOBILETNET_STATS,	224, 224, 3, IMAGENET_CLASSES, false, 'conv_preds', true) //do not apply softmax, batch = true
	MobileNetV2  = new ModelData('MobileNetV2',	this.MOBILENETV2_STATS, 224, 224, 3, IMAGENET_CLASSES, false, null, true)
	NASNetMobile = new ModelData('NASNetMobile',this.NASNETMOBILE_STATS,224, 224, 3, IMAGENET_CLASSES, false, null, true)
	ResNet50 	 = new ModelData('ResNet50',	this.RESNET50_STATS,	224, 224, 3, IMAGENET_CLASSES, false, null, true, false) //do not normalise input for ResNet50
	DenseNet121  = new ModelData('DenseNet121',	this.DENSENET121_STATS, 224, 224, 3, IMAGENET_CLASSES, false, null, true)
	DenseNet169  = new ModelData('DenseNet169', this.DENSENET169_STATS, 224, 224, 3, IMAGENET_CLASSES, false, null, true)
	Xception 	 = new ModelData('Xception',	this.XCEPTION_STATS,	299, 299, 3, IMAGENET_CLASSES, false, null, true)
	InceptionV3  = new ModelData('InceptionV3',	this.INCEPTIONV3_STATS, 299, 299, 3, IMAGENET_CLASSES, false, null, true)

	// NOT IN USE
	// MNIST = new ModelData('MNIST', 28, 28, 1, new Array(0,1,2,3,4,5,6,7,8,9)) (Softmax|PredLayer|Batch|Normalise)
	// MobileNetV2_10 = new ModelData('MobileNetV2_10',  224, 224, 3, IMAGENET_CLASSES, false, null, true)

	allModels : ModelData[] = 
	[
		this.MobileNet,
		this.MobileNetV2,
		this.NASNetMobile,	
		this.ResNet50,	
		this.DenseNet121,			
		this.DenseNet169,	
		this.InceptionV3,	
		this.Xception,
	]

	allModelStats : ModelStats[] = 
	[
		this.MOBILETNET_STATS,
		this.MOBILENETV2_STATS,
		this.NASNETMOBILE_STATS,	
		this.RESNET50_STATS,	
		this.DENSENET121_STATS,			
		this.DENSENET169_STATS,	
		this.XCEPTION_STATS,	
		this.INCEPTIONV3_STATS,
	]

	constructor(private imageService: ImageService)
	{

	}


	async loadModel(modelName: string)
	{
		return await this.loadModels([modelName])
	}

	async loadModels(modelNames: string[])
	{
		let selectedModelObjects = this.getModelDataObjectsFromNames(modelNames)

		//TODO: See if models can be loaded and predicted in parallel (save time)
	 	return await Promise.all(selectedModelObjects.map(async (currentModel) =>
		{
			let t0 = performance.now()

		 	return await this.loadModelFromFile(currentModel).then((loadedModel)=>
		 	{
		 		currentModel.model = loadedModel
		 		currentModel.loaded = true
				this.logTime(t0, performance.now(), 'Successfully loaded: ' +  currentModel.name)

				t0 = performance.now()

				tf.tidy(()=>
				{
					currentModel.model.predict(tf.zeros([1, currentModel.imgHeight, currentModel.imgWidth, 3]));	
					this.logTime(t0, performance.now(), 'Successfully warmed: ' +  currentModel.name)					
				})
		 	}).catch(e =>
		 	{
		 		console.error("Error loading model: " + e)
		 	})
		}))
	}

	/** Load a tf.model from given file path */
	async loadModelFromFile(modelObject:ModelData)
	{
		let model = modelObject.model

		if(modelObject.loaded)
			throw(modelObject.name + ' has already been loaded')

		try 
		{
			return await tf.loadLayersModel('/assets/models/' + modelObject.name + '/model.json').then(loadedModel=> {return loadedModel})
		}
		catch(e) 
		{
			throw('Error loading layersModel: ' + modelObject.name + ' : ' + e)
		}	
	}

	/** returns true if given model name has been loaded already*/
	hasModelBeenLoaded(modelName:string):boolean
	{
		let modelObject = this.getModelDataObjectFromName(modelName)

		if(modelObject.loaded)
		{	
			return true
		}

		return false
	}


	getModelDataObjectFromName(modelName:string): ModelData
	{
		return this.getModelDataObjectsFromNames([modelName])[0]
	}

	/** Take a string[] of potential model names, 
	* compares them to models defined in allModels,
	* returns modelObjects of found models */
	getModelDataObjectsFromNames(modelNames:string[]) : ModelData[] 
	{
		let modelObjectsToLoad:ModelData[] = new Array()

		for(let i = 0; i < modelNames.length; i++)
		{
			let modelFound = false;

			for(let j = 0; j < this.allModels.length; j++)
			{
				if(modelNames[i] == this.allModels[j].name)
				{
					modelObjectsToLoad.push(this.allModels[j])
					modelFound = true
					break;	
				}
			}

			if(!modelFound)
				console.error('Could not find modelObject: ' + modelNames[i])
		}

		return modelObjectsToLoad
	}


	tryPredict(model:ModelData, originalCanvasObjectorString:HTMLCanvasElement | string, tensor:tf.Tensor)
	{
		if(!model.loaded)
			throw(model.name + " has not been loaded")
		
		try 
		{
			return tf.tidy(()=>
			{
				tensor = tensor || this.imageService.getTensorFromCanvas(originalCanvasObjectorString, model.imgChannels, model.imgHeight, model.imgWidth, model.batchInput)

				if(model.normaliseImage)
					tensor = this.imageService.normaliseIMGTensor(tensor)
		
				let modelOutput = (<tf.Tensor> model.model.predict(tensor)).flatten() as any

				if(!model.applySoftMax) //simply return if softmax does not need to be applied
					return modelOutput

				return tf.softmax(modelOutput) //else apply softmax and return
			})
			
		}
		catch(e) 
		{
			throw("Error predicting: " + model.name + ": " + e)
		}		
	}


	/**
	* Decode the output of a model into a Prediction[] (Classname, Confidence)
	* @returns Prediction[]
	*/
	decodeOutput(model:ModelData, modelOutput, topX: number): Prediction[]
	{
		let predictions = new Array<Prediction>()
		let modelOutputArray = Array.from(modelOutput.arraySync())

		// console.log("Model Output:")
		// console.log(modelOutputArray)

		// Create the array in format: {ClassName, Confidence}
		for(var i = 0; i < modelOutputArray.length; i++)
		{
			predictions[i] = (new Prediction(model.classLabels[i],  this.formatNumber(modelOutputArray[i])))
		}

		// Sort predictions DSC by confidence
		predictions = predictions.sort((a,b) => a.confidence < b.confidence?1:a.confidence >b.confidence?-1:0)
	
		// ensure that topX is not greater than the size of the predictions
		if(topX >= predictions.length)
			return predictions

		predictions = predictions.slice(0, topX)

		return predictions
	}

	/** Round a number to 2 dp */
	formatNumber(num):number 
	{
		return Math.round(num * 100) / 100
	}

	/** Log the time taken to perform complete a given action */
	logTime(t0:number, t1:number, message: string)
	{
		console.log(message + ', time taken: ' + ((t1 - t0)/1000).toFixed(2) + " (ms).")
	}

}
