import * as tf from '@tensorflow/tfjs';

export class ModelData
{
	name: string;
	model: tf.Model;
	loaded: boolean;
	imgHeight:number;
	imgWidth:number;
	imgChannels:number;
	classLabels:Array<any>;

	constructor(name, imgHeight, imgWidth, imgChannels, classLabels)
	{
		this.name = name;
		this.imgHeight = imgHeight;
		this.imgWidth = imgWidth;	
		this.imgChannels = imgChannels;
		this.classLabels = classLabels;
	}
}