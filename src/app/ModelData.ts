import * as tf from '@tensorflow/tfjs';

export class ModelData
{
	name: string;
	model: tf.Model;
	loaded: boolean;
	imgHeight:number;
	imgWidth:number;
	imgChannels:number;

	constructor(name, imgHeight, imgWidth, imgChannels)
	{
		this.name = name;
		//this.model = model;
		this.imgHeight = imgHeight;
		this.imgWidth = imgWidth;	
		this.imgChannels = imgChannels;
	}
}