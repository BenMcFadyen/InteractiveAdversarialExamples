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
	* Draws the given image (HTMLImageElement/HTMLCanvasElement) to the given canvasID
	*/
	drawImageToCanvas(img:HTMLCanvasElement | HTMLImageElement, canvasID:string, desiredCanvasHeight:number = 299, desiredCanvasWidth:number = 299)
	{
		var canvas = <HTMLCanvasElement> document.getElementById(canvasID)
		canvas.height = desiredCanvasHeight
		canvas.width = desiredCanvasWidth
		var context = canvas.getContext("2d")
		context.drawImage(img,0,0,desiredCanvasHeight,desiredCanvasWidth)
	}

	/**
 	* @returns a resized HTMLCanvasElement of the original canvasID
	*/
	getResizedCanvasFromExisting(canvas:HTMLCanvasElement, desiredCanvasHeight:number = 299, desiredCanvasWidth:number = 299)
	{
		var resizedCanvas = <HTMLCanvasElement> document.createElement('canvas')
		resizedCanvas.id = 'resizedCanvas'
		resizedCanvas.height = desiredCanvasHeight
		resizedCanvas.width = desiredCanvasWidth

		var context = resizedCanvas.getContext("2d")
		context.drawImage(canvas, 0, 0, desiredCanvasHeight, desiredCanvasWidth)		
		return resizedCanvas
	}

	/*
		resizes an existing canvas, from itself
	*/
	resizeExistingCanvas(canvasID:string, desiredCanvasHeight:number = 299, desiredCanvasWidth:number = 299)
	{	
		/*
		* create a temporary canvas element
		* re-draw the existing canvas to this element (at the desired resize)
		* re-draw this to the original canvas	
		*/

		var canvas = <HTMLCanvasElement> document.getElementById(canvasID)
		var tempCanvas = this.getResizedCanvasFromExisting(canvas, desiredCanvasHeight, desiredCanvasWidth)

		canvas.height = desiredCanvasHeight
		canvas.width = desiredCanvasWidth
		var context = canvas.getContext("2d")	
		context.drawImage(tempCanvas, 0, 0, desiredCanvasHeight, desiredCanvasWidth)

		// cleanup the temporary canvas
		tempCanvas.remove()	
	}	


	/**
	* Grabs image data from given canvas, returns tf.tensor
	* @returns reshaped tf.tensor object
	*/
    getTensorFromCanvas(canvas: HTMLCanvasElement, reqNumberChannels: number)
	{
		// Convert the canvas pixels to a Tensor of the matching shape
		let tensor = tf.fromPixels(canvas, reqNumberChannels)
		var reshapedTensor = tf.reshape(tensor, [1, canvas.height, canvas.width, reqNumberChannels])
		reshapedTensor = tf.cast(reshapedTensor, 'float32')
		return reshapedTensor
	}

	drawTensorToCanvas(canvasID: string, tensorImg, desiredCanvasHeight:number, desiredCanvasWidth:number)
	{
		var canvas = <HTMLCanvasElement> document.getElementById(canvasID);
		var context = canvas.getContext("2d");

		let tensorIMGHeight = tensorImg.shape[0];
		let tensorIMGWidth = tensorImg.shape[1];

		// draw the tensor to the canvas, with the dimensions of the given tensor
		canvas.height = tensorIMGHeight;
		canvas.width = tensorIMGWidth;	
		let imgArray = Uint8ClampedArray.from(tensorImg.dataSync());
		let imgData = context.createImageData(tensorIMGHeight, tensorIMGWidth);
		imgData.data.set(imgArray);
		context.putImageData(imgData, 0, 0);			

		// if the desired canvas height/shape is different, resize it 
		// Note: resizing the image here will affect the adversarial perturbations
		//  	 this image should only be used for display
		if((tensorIMGHeight != desiredCanvasHeight) || (tensorIMGWidth != desiredCanvasWidth))
			this.resizeExistingCanvas(canvasID, desiredCanvasHeight, desiredCanvasWidth)
		
	}
}
