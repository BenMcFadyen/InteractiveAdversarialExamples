import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';


@Injectable({
  providedIn: 'root'
})
export class ImageService 
{
	constructor() 
	{
		
	}

	drawIMGToCanvas(img:HTMLImageElement, canvasID:string, desiredCanvasHeight:number, desiredCanvasWidth:number)
	{
		var canvas = <HTMLCanvasElement> document.getElementById(canvasID);
		canvas.height = desiredCanvasHeight;
		canvas.width = desiredCanvasWidth;		
		var context = canvas.getContext("2d");
		context.drawImage(img,0,0,desiredCanvasHeight,desiredCanvasWidth);
	}	


    getTensorFromCanvas(reqTensorHeight: number, reqTensorWidth, reqNumberChannels: number)
	{
		var canvas = <HTMLCanvasElement> document.getElementById('tensorCanvas')

		// Convert the canvas pixels to a Tensor of the matching shape
		let tensor = tf.fromPixels(canvas, reqNumberChannels);
		var reshapedTensor = tf.reshape(tensor, [1, reqHeightWidth, reqHeightWidth, channels]);
		reshapedTensor = tf.cast(reshapedTensor, 'float32');
		console.log(reshapedTensor);	

		return reshapedTensor;
	}
}
