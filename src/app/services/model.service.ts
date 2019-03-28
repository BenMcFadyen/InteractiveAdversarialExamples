import { Injectable } from '@angular/core';
import { ModelData } from './../classes/ModelData';
import { ModelStats } from './../classes/ModelStats';
import { ImageService } from './image.service';
import { Prediction } from './../classes/Prediction';
import { HelperService } from '../services/helper.service';

import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from './../classes/ImageNetClasses';


@Injectable({
  providedIn: 'root'
})
export class ModelService 
{
	readonly MOBILETNET_STATS 	=  <ModelStats> {name: 'MobileNet', 	layers: 93,  size: 14.2,  top1: 70.4, top5: 89.5, parameters: '4,253,864',  requestLoad:false}
	readonly MOBILENETV2_STATS 	=  <ModelStats> {name: 'MobileNetV2',	layers: 157, size: 24.5,  top1: 71.3, top5: 90.1, parameters: '3,538,984',  requestLoad:false}
	// readonly NASNETMOBILE_STATS =  <ModelStats> {name: 'NASNetMobile', 	layers: 771, size: 24.1,  top1: 74.4, top5: 91.9, parameters: '5,326,716',  requestLoad:false}
	// readonly RESNET50_STATS 	=  <ModelStats> {name: 'ResNet50',     	layers: 177, size: 100.6, top1: 74.9, top5: 92.1, parameters: '25,636,712', requestLoad:false}
	// readonly DENSENET121_STATS 	=  <ModelStats> {name: 'DenseNet121',  	layers: 429, size: 32.6,  top1: 82.4, top5: 92.3, parameters: '8,062,504',  requestLoad:false}
	// readonly DENSENET169_STATS 	=  <ModelStats> {name: 'DenseNet169',  	layers: 597, size: 57.4,  top1: 82.4, top5: 93.2, parameters: '14,307,880', requestLoad:false}
	// readonly XCEPTION_STATS 	=  <ModelStats> {name: 'Xception',  	layers: 313, size: 89.9,  top1: 79.0, top5: 94.5, parameters: '22,910,480', requestLoad:false}
	// readonly INCEPTIONV3_STATS 	=  <ModelStats> {name: 'InceptionV3',  	layers: 134, size: 94.0,  top1: 77.9, top5: 93.7, parameters: '23,851,784', requestLoad:false}


 	// name, stats, height, width, channels, classLabels, 										availForAdv, softmax, predictionOutputLayer, batchInput, normalistImageFirst?
	MobileNet 	 = new ModelData('MobileNet', 	this.MOBILETNET_STATS,	224, 224, 3, IMAGENET_CLASSES, true, false, 'conv_preds', true) //do not apply softmax, batch = true
	MobileNetV2  = new ModelData('MobileNetV2',	this.MOBILENETV2_STATS, 224, 224, 3, IMAGENET_CLASSES, true, false, null, true)
	// NASNetMobile = new ModelData('NASNetMobile',this.NASNETMOBILE_STATS,224, 224, 3, IMAGENET_CLASSES, false, false, null, true)
	// ResNet50 	 = new ModelData('ResNet50',	this.RESNET50_STATS,	224, 224, 3, IMAGENET_CLASSES, true, false, null, true, false) //do not normalise input for ResNet50
	// DenseNet121  = new ModelData('DenseNet121',	this.DENSENET121_STATS, 224, 224, 3, IMAGENET_CLASSES, false, false, null, true)
	// DenseNet169  = new ModelData('DenseNet169', this.DENSENET169_STATS, 224, 224, 3, IMAGENET_CLASSES, false, false, null, true)
	// Xception 	 = new ModelData('Xception',	this.XCEPTION_STATS,	299, 299, 3, IMAGENET_CLASSES, true, false, null, true)
	// InceptionV3  = new ModelData('InceptionV3',	this.INCEPTIONV3_STATS, 299, 299, 3, IMAGENET_CLASSES, false, false, null, true)

	// NOT IN USE
	// MNIST = new ModelData('MNIST', 28, 28, 1, new Array(0,1,2,3,4,5,6,7,8,9)) (Softmax|PredLayer|Batch|Normalise)
	// MobileNetV2_10 = new ModelData('MobileNetV2_10',  224, 224, 3, IMAGENET_CLASSES, false, null, true)

	allModels : ModelData[] = 
	[
		this.MobileNet, 
		this.MobileNetV2, 
		// this.NASNetMobile,	 
		// this.ResNet50,
		// this.DenseNet121,		
		// this.DenseNet169,	
		// this.InceptionV3,
		// this.Xception,
	]

	allModelStats : ModelStats[] = 
	[
		this.MOBILETNET_STATS,
		this.MOBILENETV2_STATS,
		// this.NASNETMOBILE_STATS,	
		// this.RESNET50_STATS,	
		// this.DENSENET121_STATS,			
		// this.DENSENET169_STATS,	
		// this.XCEPTION_STATS,	
		// this.INCEPTIONV3_STATS,
	]

	constructor(private imageService: ImageService, 
				private helper:HelperService)
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
			let t0_load = performance.now()

		 	return await this.loadModelFromFile(currentModel).then((loadedModel)=>
		 	{
		 		currentModel.model = loadedModel
		 		currentModel.loaded = true
				this.helper.logTime(t0_load, performance.now(), 'Successfully loaded: ' +  currentModel.name)

				let t0_warmPredict = performance.now()

				// warm the prediction
				tf.tidy(()=>
				{
					currentModel.model.predict(tf.zeros([1, currentModel.imgHeight, currentModel.imgWidth, 3]));	
					this.helper.logTime(t0_warmPredict, performance.now(), 'Successfully warmed prediction: ' +  currentModel.name)					
				})


				let t0_warmGrad = performance.now()

				//warm the gradient function -> only if model has been flagged as available (larger models take too long / use too much memory)
				if(currentModel.availableForAdversarialGeneration)
				{
					tf.tidy(()=>
					{
						let oneHotClassLabels = tf.zeros([1000]) 

						let img3 = tf.zeros([1, currentModel.imgHeight, currentModel.imgWidth, 3])
						let img4 = tf.zeros([1, currentModel.imgHeight, currentModel.imgWidth, 4])

				  		const getModelLogits = x => (<tf.Tensor> currentModel.model.predict(x.toFloat())).as1D() //must be the RAW prediction logits, BEFORE any activation functions, or the gradient calculated will not be correct
					    const lossFunction = x => tf.losses.softmaxCrossEntropy(oneHotClassLabels, getModelLogits(x))
					    const gradientFunction = tf.grad(lossFunction)
					    let gradient = gradientFunction(img3)

						this.helper.logTime(t0_warmGrad, performance.now(), 'Successfully warmed gradient: ' +  currentModel.name)					
					})	
				}		
				return	

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
			return true
	
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
		let modelOutputArray: number[] = Array.from(modelOutput.arraySync())

		// Create the array in format: {ClassName, Confidence}
		for(var i = 0; i < modelOutputArray.length; i++)
		{
			predictions[i] = (new Prediction(model.classLabels[i],  this.helper.roundNumber(modelOutputArray[i], 2)))
		}

		// Sort predictions DSC by confidence
		predictions = predictions.sort((a,b) => a.confidence < b.confidence?1:a.confidence >b.confidence?-1:0)
	
		// ensure that topX is not greater than the size of the predictions
		if(topX >= predictions.length)
			return predictions

		predictions = predictions.slice(0, topX)

		return predictions
	}

//
}