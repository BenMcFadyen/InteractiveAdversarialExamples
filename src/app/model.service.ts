import { Injectable } from '@angular/core';
import { ModelData } from './ModelData';
import { ImageService } from './image.service';
import { Prediction } from './Prediction';
import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from './ImageNetClasses';

@Injectable({
  providedIn: 'root'
})
export class ModelService 
{
	//MNIST = new ModelData('MNIST', 			28, 28, 1, new Array(0,1,2,3,4,5,6,7,8,9))
	MobileNet = new ModelData('MobileNet',		224, 224, 3, IMAGENET_CLASSES, false, 'conv_preds', true) //do not apply softmax, batch = true
	ResNet50 = new ModelData('ResNet50',		224, 224, 3, IMAGENET_CLASSES, true, null, true, false) //do not normalise input for ResNet50
	Xception = new ModelData('Xception',		299, 299, 3, IMAGENET_CLASSES, false, null, true)
	InceptionV3 = new ModelData('InceptionV3',  299, 299, 3, IMAGENET_CLASSES, false, null, true)
	MobileNetV2 = new ModelData('MobileNetV2',  224, 224, 3, IMAGENET_CLASSES, true, null, true)
	DenseNet121 = new ModelData('DenseNet121',  224, 224, 3, IMAGENET_CLASSES, false, null, true)


	allModels : ModelData[] = 
	[
		// this.MNIST,
		this.MobileNet,
		this.MobileNetV2,			
		//this.ResNet50,
		//this.DenseNet121,
		// this.InceptionV3,	
		this.Xception,
	]

	adversarialModels : ModelData[] = 
	[
		 this.MobileNet,
		 this.MobileNetV2,		
		 //this.ResNet50,
		// this.Xception,
	]

	constructor(private imageService: ImageService){}


	async loadAllModels()
	{
		//TODO: See if models can be loaded and predicted in parallel (save time)
	 	await Promise.all(this.allModels.map(async (currentModel) =>
		{
		 	currentModel.model = await this.loadModelFromFile(currentModel)
			currentModel.loaded = true

			// console.log(currentModel.model)
			// console.log(currentModel.name + " layers: " + currentModel.model.layers.length)

	 		//console.log("Model Loaded, starting prediction")
			tf.tidy(()=>
			{
				currentModel.model.predict(tf.zeros([1, currentModel.imgHeight, currentModel.imgWidth, 3]));	
			})
	 		//console.log("Prediction done")

	 		//TODO: Add a timer for each specific model load/prediction
		}))
	}


	/**
	* Load a tf.model from given file path
	*/
	async loadModelFromFile(modelObject:ModelData)
	{
		let model = modelObject.model

		if(modelObject.loaded)
		{
			console.error("Error: " + model.name + " has already been loaded")
			return null
		}	

		try 
		{
			//console.log('Start loading: ' + modelObject.name)			
			return await tf.loadModel('/assets/models/' + modelObject.name + '/model.json').then(loadedModel=>
			{
				console.log('Successfully loaded: ' + modelObject.name)
				return loadedModel
			})
		}
		catch(e) 
		{
			console.error("Error loading model: " + modelObject.name + " : " + e)
			return null
		}	
	}

	getModelDataObjectFromName(modelName:string)
	{
		for(var i = 0; i < this.allModels.length; i++)
		{
			if(this.allModels[i].name != modelName)
				continue

			return this.allModels[i]
		}

		console.error("Could not find model: " + modelName)
		return null
	}


	tryPredict(model:ModelData, originalCanvasObjectorString:HTMLCanvasElement | string, tensor:tf.Tensor)
	{
		if(!model.loaded)
		{
			console.error(model.name + " has not been loaded")
			return
		}

		try 
		{
			return tf.tidy(()=>
			{
				tensor = tensor || this.imageService.getTensorFromCanvas(originalCanvasObjectorString, model.imgChannels, model.imgHeight, model.imgWidth, model.batchInput)	 //TODO BATCH?		

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
		  console.error("Error predicting: " + model.name + ", " + e)
		  return
		}		
	}


	/**
	* Decode the output of a model into a Prediction[] (Classname, Confidence)
	* @returns Prediction[]
	*/
	decodeOutput(model:ModelData, modelOutput, topX: number): Prediction[]
	{
		let predictions = new Array<Prediction>()
		let modelOutputArray = Array.from(modelOutput.dataSync())

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


	formatNumber(num):number 
	{
		return Math.round(num * 100) / 100
	}

}
