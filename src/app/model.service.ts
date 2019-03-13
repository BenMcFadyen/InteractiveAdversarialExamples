import { Injectable } from '@angular/core';
import { ModelData } from './ModelData';
import { ImageService } from './image.service';
import { Prediction } from './Prediction';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import {IMAGENET_CLASSES} from '@tensorflow-models/mobilenet/dist/imagenet_classes';


@Injectable({
  providedIn: 'root'
})
export class ModelService 
{
	MNIST = new ModelData('MNIST', 			28, 28, 1, new Array(0,1,2,3,4,5,6,7,8,9))
	MobileNet = new ModelData('MobileNet',	224, 224, 3, IMAGENET_CLASSES)
	//ResNet50 = new ModelData('ResNet50',			224, 224, 3, IMAGENET_CLASSES)
	//InceptionV3 = new ModelData('InceptionV3',	299, 299, 3)
	//Xception = new ModelData('Xception',			299, 299, 3)

	allModels : ModelData[] = 
	[
		this.MNIST,
		this.MobileNet,
		//this.ResNet50,
		// this.InceptionV3,
		// this.Xception
	]

	constructor(private imageService: ImageService)
	{

	}

	async loadAllModels()
	{
		for(var i = 0; i < this.allModels.length; i++)
			await this.loadModel(this.allModels[i])
	}

	async loadModel(model:ModelData)
	{
		if(model.loaded)
		{
			console.error("Error: " + model.name + " has already been loaded")
			return
		}

		if(model.name == 'MobileNet')
		{
			model.model = await mobilenet.load()
			model.loaded = true
			console.log('MobileNet(web) Loaded')
			return
		}

		this.loadModelFromFile(model.name, '/assets/models/').then(loadedModel => 
		{
			model.model = loadedModel
			model.loaded = true
		})
	}

	/**
	* Load a tf.model from given file path
	* @returns loaded tf.model
	*/
	async loadModelFromFile(modelName:string, assetFilePath:string,)
	{
		let model:tf.Model

		try 
		{
			model = await tf.loadModel(assetFilePath + modelName + '/model.json')
			console.log('Successfully loaded: ' + modelName)
			return model
		}
		catch(e) 
		{
			console.error("Error loading model: " + modelName + " : " + e)
			return
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


	async tryPredict(model:ModelData, originalCanvas:HTMLCanvasElement)
	{
		if(!model.loaded)
		{
			console.error(model.name + " has not been loaded")
			return
		}

		try 
		{
			console.log("Predicting: " + model.name)

			var resizedCanvas = this.imageService.getResizedCanvasFromExisting(originalCanvas,
																				model.imgHeight,
																				model.imgWidth)

			let tensor = this.imageService.getTensorFromCanvas(resizedCanvas, model.imgChannels)

			if(model.name == 'MobileNet')
			{
				var output = await model.model.classify(tensor,5) as any
				return output

			}
			else
			{
				var output = await model.model.predict(tensor) as any
				return output
			}
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

		// MobileNet(web) predictions are already decoded
		if(model.name == 'MobileNet')
		{
			for(var i = 0; i < modelOutput.length; i++)
				predictions[i] = (new Prediction(modelOutput[i].className, this.formatNumber(modelOutput[i].probability)))
		
			return predictions
		}

		var classLabels = model.classLabels;
		let modelOutputArray = Array.from(modelOutput.dataSync())

		console.log("Model Output:")
		console.log(modelOutputArray)

		if(classLabels.length != modelOutputArray.length)
		{
			console.error("Error: size of classLabel array does not match modelOutput" + classLabels.length + "!= " + modelOutput.length)			
			return null 
		}

		// Create the array in format: {ClassName, confidence}
		for(var i = 0; i < modelOutputArray.length; i++)
		{
			predictions[i] = (new Prediction(classLabels[i],  this.formatNumber(modelOutputArray[i])))
		}

		// Sort predictions DSC by confidence
		predictions = predictions.sort(function(a,b)
		{
			return a.confidence < b.confidence?1:a.confidence >b.confidence?-1:0
		})

		// ensure that topX is not greater than the size of the predictions
		if(topX >= predictions.length)
			return predictions

		predictions = predictions.slice(0, topX)

		return predictions
	}

	formatNumber(num)
	{
		return num.toFixed(2);
	}

}
