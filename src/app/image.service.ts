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
	* Normalise a tensor from pixel values between [0-255] to [-1,1]
	*/
	normaliseIMGTensor(tensor: tf.Tensor)
	{
		return tf.tidy(()=>
		{
	  	  	let normalisationOffset = tf.scalar(127.5);
	        var normalised = tensor.toFloat().sub(normalisationOffset).div(normalisationOffset);

	        return normalised
        })
	}	

	drawTensorToCanvas(canvasIDorObject:string | HTMLCanvasElement, tensor:tf.Tensor3D | tf.Tensor4D, height: number = null, width:number = null )
	{
		let canvas = this.getCanvasObject(canvasIDorObject)
		let context = canvas.getContext('2d');
		let alignCorners = false

		tf.tidy(()=>
		{
			if(tensor.shape.length == 4)
				tensor = <tf.Tensor3D> tf.reshape(tensor, [tensor.shape[1], tensor.shape[2], tensor.shape[3]])

			// if desired canvas height is not specified, draw to the given tensors shape
			if(height == null || width == null)
			{
				height = tensor.shape[0]
				width = tensor.shape[1]
			}

			// set the size of the canvas to the desired (or the tensor)
			canvas.height = height
			canvas.width = width

			// check if the tensor needs to be resized before drawing to the canvas
			if(height != tensor.shape[0] || width != tensor.shape[1])
			{
				canvas.height = height
				canvas.width = width
			    tensor = tf.image.resizeBilinear(tensor, [height, width], alignCorners)
			}

			let imgArray = Uint8ClampedArray.from(tensor.dataSync())
			let imgData = context.createImageData(height, width)
			imgData.data.set(imgArray)
			context.putImageData(imgData, 0, 0)
		})
	}

	/* Returns a tensor of the given canvas
	*  Defaults to 4 channels and the given canvas height/width
	*/
	getTensorFromCanvas(canvasIDorObject:string | HTMLCanvasElement, numChannels:number = 4, height:number = null, width:number = null, batch:boolean=false)
	{
		let canvas = this.getCanvasObject(canvasIDorObject)
		let alignCorners = false

		if(height == null || width == null)
		{
			height = canvas.height
			width = canvas.width
		}

		return tf.tidy(()=>
		{
			let tensor = tf.fromPixels(canvas, numChannels)

			if(height != canvas.height || width != canvas.width)
			{
			    tensor = tf.image.resizeBilinear(tensor, [height, width], alignCorners) //DO NOT ALIGN CORNERS FOR ADVERSARIAL IMAGE CLASSIFICATION
			}

			if(batch)
			{
				let batchedTensor = <tf.Tensor4D> tf.reshape(tensor, [1, height, width, numChannels])
				return tf.cast(batchedTensor, 'float32')	
			}

			return tf.cast(tensor, 'float32')	
		})

	}

	/**
	* Applys an alpha layer to a Tensor of rank 3 or 4
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	createAndApplyAlphaChannelToTensor(tensorIMG:tf.Tensor3D | tf.Tensor4D, alphaValue:number = 0)
	{		
		return tf.tidy(()=>
		{
		 	let imgHeight = tensorIMG.shape[0]
			let imgWidth = tensorIMG.shape[1]
			let tensorShape = [imgHeight, imgWidth, 1]
			let concatAxis = 2

			if(tensorIMG.shape.length == 4)
			{
			 	imgHeight = tensorIMG.shape[1]
				imgWidth = tensorIMG.shape[2]
				tensorShape = [1, imgHeight, imgWidth, 1]
				concatAxis = 3				
			}

			var arraySize = imgHeight * imgWidth 
			const filler = new Uint8Array(arraySize).fill(alphaValue)
			let alphaChannel = tf.tensor(filler, tensorShape)

			let tensorWithAlpha = tf.concat([tensorIMG, alphaChannel], concatAxis)

			return <tf.Tensor3D | tf.Tensor4D> tensorWithAlpha
		})
	} 

	/** creates a tensor of given shape, filled with given value*/
	createFilledTensor(shape:Array<number>, fillValue:number = 255)
	{
		if(shape.length < 3 || shape.length > 4)
			throw 'Cannot create empty tensor, given shape: ' + shape + ' is not of length 3/4'

		return tf.tidy(()=>
		{
		 	let imgHeight = shape[0]
			let imgWidth = shape[1]
			let imgChannels = shape[2]
			let tensorShape = [imgHeight, imgWidth, imgChannels]

			if(shape.length == 4)
			{
			 	imgHeight = shape[1]
				imgWidth = shape[2]
				imgChannels = shape[3]				
				tensorShape = [1, imgHeight, imgWidth, imgChannels]
			}

			var arraySize = imgHeight * imgWidth * imgChannels
			const fillerArray = new Uint8Array(arraySize).fill(fillValue)
			let filledTensor = tf.tensor(fillerArray, shape)

			return <tf.Tensor3D | tf.Tensor4D> filledTensor
		})
	}

	/* Checks if passed canvasIDorObject is a string, if so grabs the canvas object and returns it */
	getCanvasObject(canvasIDorObject:string | HTMLCanvasElement) :HTMLCanvasElement
	{
		if(typeof(canvasIDorObject) == 'string')
	 		canvasIDorObject = <HTMLCanvasElement> document.getElementById(canvasIDorObject) 
		
		return <HTMLCanvasElement> canvasIDorObject
	}


	/* Clear any data within the given canvas */
	resetCanvas(canvasIDorObject:string | HTMLCanvasElement)
	{
		let canvas = this.getCanvasObject(canvasIDorObject)
		const context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
	}






}
