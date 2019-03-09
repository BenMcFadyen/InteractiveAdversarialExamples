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

	/**
	* Draws the given [img] to the given canvasID
	*/
	drawIMGToCanvas(img:HTMLImageElement, canvasID:string, desiredCanvasHeight:number = 299, desiredCanvasWidth:number = 299)
	{
		var canvas = <HTMLCanvasElement> document.getElementById(canvasID);
		canvas.height = desiredCanvasHeight;
		canvas.width = desiredCanvasWidth;		
		var context = canvas.getContext("2d");
		context.drawImage(img,0,0,desiredCanvasHeight,desiredCanvasWidth);
	}




	resizeExistingCanvas(canvasID:string, desiredCanvasHeight:number = 299, desiredCanvasWidth:number = 299)
	{	
		/*
		* create a temporary canvas element
		* re-draw the existing canvas to this element (at the desired resize)
		* re-draw this to the original canvas	
		*/

		var canvas = <HTMLCanvasElement> document.getElementById(canvasID);
		var tempCanvas = <HTMLCanvasElement> document.createElement('canvas');
		tempCanvas.id = 'tempCanvas';
		tempCanvas.height = desiredCanvasHeight;
		tempCanvas.width = desiredCanvasWidth;		

		var tempContext = tempCanvas.getContext("2d");
		tempContext.drawImage(canvas, 0, 0, desiredCanvasHeight, desiredCanvasWidth);

		canvas.height = desiredCanvasHeight;
		canvas.width = desiredCanvasWidth;		
		var context = canvas.getContext("2d");	
		context.drawImage(tempCanvas, 0, 0, desiredCanvasHeight, desiredCanvasWidth);

		// cleanup the temporary canvas
		tempCanvas.remove();	
	}	



	/**
	* Grabs image data from given canvas, returns tf.tensor
	* @returns reshapedTensor
	*/
    getTensorFromCanvas(canvasID: string, reqTensorHeight: number, reqTensorWidth: number, reqNumberChannels: number)
	{
		var canvas = <HTMLCanvasElement> document.getElementById(canvasID)

		// Convert the canvas pixels to a Tensor of the matching shape
		let tensor = tf.fromPixels(canvas, reqNumberChannels);

		var reshapedTensor = tf.reshape(tensor, [1, reqTensorHeight, reqTensorWidth, reqNumberChannels]);
		reshapedTensor = tf.cast(reshapedTensor, 'float32');

		console.log(reshapedTensor)
		return reshapedTensor;
	}
}
