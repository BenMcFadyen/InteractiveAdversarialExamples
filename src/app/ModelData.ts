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
	normaliseImage:boolean

	constructor(name:string, imgHeight:number, 
				imgWidth:number, imgChannels:number, 
				classLabels:Array<any>, normaliseImage:boolean = true)
	{
		this.name = name;
		this.imgHeight = imgHeight;
		this.imgWidth = imgWidth;	
		this.imgChannels = imgChannels;
		this.classLabels = classLabels;
		this.normaliseImage = normaliseImage;
	}
}