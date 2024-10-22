import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

import { ImageFileNames } from './../classes/ImageFileNames';
import { UtilsService } from './../services/utils.service';


@Injectable({
  providedIn: 'root'
})
export class ImageService 
{
	animalImageUrls: string[] = []
	objectImageUrls: string[] = []
	foodImageUrls: string[] = []

	imageSelectImagePathsInitialised = false


	constructor(private utils:UtilsService) 
	{
		if(!this.imageSelectImagePathsInitialised)
			this.initialiseImageSelectImagePaths()
	}

	getRandomImageUrl()
	{
		let allImageUrls = this.animalImageUrls.concat(this.objectImageUrls).concat(this.foodImageUrls) 
		let rnd = Math.floor((Math.random() * allImageUrls.length)); //Random number between 0 & imgCount
		return allImageUrls[rnd]
	}

	/** Returns true if the given canvas is blank */
	isCanvasBlank(canvasIDorObject:string | HTMLCanvasElement,)
	{
		let canvas = this.getCanvasObject(canvasIDorObject)
		if(canvas == null)
			return true
		return !canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(channel => channel !== 0);
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
	normaliseIMGTensor(tensor: tf.Tensor3D)
	{
		return tf.tidy(()=>
		{
	  	  	let normalisationOffset = tf.scalar(127.5);
	        var normalised = <tf.Tensor3D> tensor.toFloat().sub(normalisationOffset).div(normalisationOffset);

	        return normalised
        })
	}	

	/**
	* Normalise a tensor from pixel values between [-1,1] to [0-255]
	*/
	reverseIMGTensorNormalisation(tensor: tf.Tensor3D)
	{
		return tf.tidy(()=>
		{
	  	  	let normalisationOffset = tf.scalar(127.5);
	        var reverseNormalised = <tf.Tensor3D> tensor.toFloat().mul(normalisationOffset).add(normalisationOffset);

	        return reverseNormalised
        })
	}		

	async drawTensorToCanvas(canvasIDorObject:string | HTMLCanvasElement, tensor:tf.Tensor3D | tf.Tensor4D, height: number = null, width:number = null )
	{
		let canvas = this.getCanvasObject(canvasIDorObject)
		if(canvas == null)
			return
		let context = canvas.getContext('2d');
		let alignCorners = false

		tensor = tf.tidy(()=>
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

			return tensor
		})


		await tensor.data().then((tensorData)=>
		{
			tf.tidy(()=>
			{
				let imgArray = Uint8ClampedArray.from(tensorData)
				let imgData = context.createImageData(height, width)
				imgData.data.set(imgArray)
				context.putImageData(imgData, 0, 0)
				tensor.dispose()
			})
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
			let tensor = tf.browser.fromPixels(canvas, numChannels)

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

		if(canvas == null)
			return

		const context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	initialiseImageSelectImagePaths()
	{

		if(this.imageSelectImagePathsInitialised)
			return

		let imageFileNames = new ImageFileNames()
		let basePath: string = './assets/images/'
		let fileExtension:string = '.jpg'

		let imageGroupArray = [this.animalImageUrls, this.objectImageUrls, this.foodImageUrls]
		let imageGroupArraySource = [imageFileNames.animals, imageFileNames.objects, imageFileNames.food]
		let imageGroupFilePath = ['animals/', 'objects/', 'food/']

		for(let i = 0; i < imageGroupArraySource.length; i++)
		{
			for(let fileName of imageGroupArraySource[i])
			{
				let url = basePath + imageGroupFilePath[i] + fileName + fileExtension
				imageGroupArray[i].push(url)
			}			
		}

		this.utils.shuffleArray(this.animalImageUrls)
		this.utils.shuffleArray(this.objectImageUrls)
		this.utils.shuffleArray(this.foodImageUrls)	
			
		this.imageSelectImagePathsInitialised = true
	}














//
}
