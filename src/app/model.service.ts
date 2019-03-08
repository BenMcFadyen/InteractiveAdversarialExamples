import { Injectable } from '@angular/core';
import { ModelData } from './ModelData';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';


@Injectable({
  providedIn: 'root'
})
export class ModelService 
{
	MNIST = new ModelData('MNIST', 				28, 28, 1)
	MobileNet = new ModelData('MobileNet',		224, 224, 3)
	//ResNet50 = new ModelData('ResNet50',			224, 224, 3)
	//InceptionV3 = new ModelData('InceptionV3',	299, 299, 3)
	//Xception = new ModelData('Xception',			299, 299, 3)

	allModels : ModelData[] = 
	[
		this.MNIST,
		this.MobileNet,
		// this.ResNet50,
		// this.InceptionV3,
		// this.Xception
	]

	constructor()
	{

	}


	loadAllModels()
	{
		for(var i = 0; i < this.allModels.length; i++)
		{
			this.loadModel(this.allModels[i])
		}
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

}
