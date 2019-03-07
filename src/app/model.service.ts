import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

@Injectable({
  providedIn: 'root'
})
export class ModelService 
{
	constructor() 
	{

	}

	/**
	* Load a tf.model from given file path
	* @returns loaded tf.model
	*/
	async loadModelFromFile(coreFilePath:string, modelName:string)
	{
		let model:tf.Model;

		try 
		{
			model = await tf.loadModel(coreFilePath + modelName + '/model.json');
			console.log('Successfully loaded: ' + modelName);		
			return model;
		}
		catch(e) 
		{
			console.error("Error loading model: " + modelName + " : " + e);
			return;
		}				
	}

}
