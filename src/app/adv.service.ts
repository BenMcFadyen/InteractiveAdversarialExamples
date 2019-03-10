import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { ModelService } from './model.service';
import { ModelData } from './ModelData';

import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from '@tensorflow-models/mobilenet/dist/imagenet_classes';

@Injectable({
  providedIn: 'root'
})

export class AdvService 
{
	// Adversarial Stuff
	MAX_PIXEL_VALUE = 1.0;
	MIN_PIXEL_VALUE = 0.0;
	LEARNING_RATE = 0.1;
	TRAIN_STEPS = 100;
	IMAGE_SIZE = 227;
	optimizer = tf.train.sgd(this.LEARNING_RATE);

	constructor(private imageService:ImageService) 
	{

	}

	/**
	* TODO
	* @return {tf.Tensor} perturbed img tensor
	*/
	async genAdvPerturbation(modelObject: ModelData, orginalPrediction: string, img3, img4, epsilon = 0.025)
	{
		var model = modelObject.model

		let tbuffer = tf.buffer([1000]) // create a one dimensional tf.buffer of length 1000

		var imagenet = IMAGENET_CLASSES

		// Sets the ID of the top prediction in the buffer to a value of 1
		Object.keys(imagenet).forEach(function(key) 
		{
			if (imagenet[key].valueOf() == orginalPrediction.valueOf()) 
			{
				tbuffer.set(1, parseInt(key));
				console.log("Found OG prediction")
			}
		})

  		const oglabel = tbuffer.toTensor()

	    // x_to_y - A Rank 1 tensor (Vector) of size 1000 - Contains the raw prediction results 
		// infer: Computes the logits (or the embedding) for the provided image. //prediction?	    
	    const xtoy = x => { return model.infer(x.toFloat(), 'conv_preds').flatten()} 

		// y_loss - Rank 0 tensor (Scalar) - Contains the top 1 prediction %
		// SoftmaxCrossEntropy: Normalises numbers into a probability distribition that sums to 1
	    const yloss = (gt, x) => tf.losses.softmaxCrossEntropy(gt, xtoy(x))

	    // TODO: are these functions  neccesarry due to the way in which the tf.gradients function works?
	    var loss_func = function(x) { return yloss(oglabel, x)}
	    let _grad_func = function () { return loss_func(img3)}

		/**
		* Returns gradients of `f` with respect to each of the `xs`. The gradients
		* returned are of the same length as `xs`, but some might be null if `f` was
		* not a function of that `x`. It also takes optional dy to multiply the
		* gradient, which defaults to `1`.
		*/		    
	    var _im = tf.environment.ENV.engine.gradients(_grad_func, [img3]) 	// var g = tf.grads(_grad_func);
	    let im_gradients = _im.grads[0]	  									// let test = g([img3])		

		var perturbations = this.scaleGradient(im_gradients, epsilon)

		return perturbations
	}



	async genAdvPerturbationFGSMTargeted(modelObject: ModelData, targetPrediction:string, img3, img4, epsilon = 0.025)
	{
		var model = modelObject.model

		let tbuffer = tf.buffer([1000]) // create a one dimensional tf.buffer of length 1000

		var imagenet = IMAGENET_CLASSES

		// Sets the ID of the top prediction in the buffer to a value of 1
		Object.keys(imagenet).forEach(function(key) 
		{
			if (imagenet[key].valueOf() == targetPrediction.valueOf()) 
			{
				tbuffer.set(1, parseInt(key));
				console.log("Found targeted prediction")
			}
		})

  		const targetLabel = tbuffer.toTensor()

	    // x_to_y - A Rank 1 tensor (Vector) of size 1000 - Contains the raw prediction results 
		// infer: Computes the logits (or the embedding) for the provided image. //prediction?	    
	    const xtoy = x => { return model.infer(x.toFloat(), 'conv_preds').flatten()} 

		// y_loss - Rank 0 tensor (Scalar) - Contains the top 1 prediction %
		// SoftmaxCrossEntropy: Normalises numbers into a probability distribition that sums to 1
	    const yloss = (gt, x) => tf.losses.softmaxCrossEntropy(gt, xtoy(x))

	    // TODO: are these functions  neccesarry due to the way in which the tf.gradients function works?
	    var loss_func = function(x) { return yloss(targetLabel, x)}
	    let _grad_func = function () { return loss_func(img3)}

		/**
		* Returns gradients of `f` with respect to each of the `xs`. The gradients
		* returned are of the same length as `xs`, but some might be null if `f` was
		* not a function of that `x`. It also takes optional dy to multiply the
		* gradient, which defaults to `1`.
		*/		    
	    var _im = tf.environment.ENV.engine.gradients(_grad_func, [img3]) 	// var g = tf.grads(_grad_func);
	    let im_gradients = _im.grads[0]	  									// let test = g([img3])		

		var perturbations = this.scaleGradient(im_gradients, epsilon)

		return perturbations
	}


	/**
	* TODO..
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	async combineImgAndPerturbation(img4, perturbation)
	{
		const zeroes = new Uint8Array(51529).fill(0)

		// concat the all-zeros alpha channel with 3-channel gradients from tf.gradients()
		let alphaChannel = tf.tensor3d(zeroes, [227, 227, 1])  // [0, 0,... 0, 0] (227)
		let perturbationWithAlpha = tf.concat([perturbation, alphaChannel], 2) // 227,227,4   
		//let perturbedImg = tf.add(tf.cast(img4,'float32'), perturbationWithAlpha)

		//console.log('image before')
		//console.log(tf.cast(img4,'float32').print())

		let perturbedImg = tf.sub(tf.cast(img4,'float32'), perturbationWithAlpha)

		//console.log('Perturbed image after')
		//console.log(perturbedImg.print())

		return perturbedImg
	}

	/**
	* TODO..
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	applyAlphaChannel(tensorIMG)
	{
		const empty255 = new Uint8Array(51529).fill(255)
		let alphaChannel = tf.tensor3d(empty255, [227, 227, 1])
		let tensorWithAlpha = tf.concat([tensorIMG, alphaChannel], 2)
		return tensorWithAlpha
	}


	/**
	* TODO..
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	scaleGradient(gradient, epsilon) 
	{
		const gradientData = gradient.dataSync()

		const normalizedGradient = gradientData.map(x => 
		{
			return epsilon * Math.sign(x)
		})

		return tf.tensor(normalizedGradient).reshapeAs(gradient)
	}	
}
