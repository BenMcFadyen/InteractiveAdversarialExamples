import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { ModelService } from './model.service';
import { ModelData } from './ModelData';

import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from '@tensorflow-models/mobilenet/dist/imagenet_classes';

enum CombineMethod 
{
  Add,
  Subtract,
}


@Injectable({
  providedIn: 'root'
})


export class AdvService 
{
	constructor(private imageService:ImageService) 
	{
 

 	}

	/**
	* Generates perturbation in respect to the provided targetClass
	* @return {tf.Tensor} perturbed img tensor
	*/
	private async singleStepAttack(model: tf.Model, targetClass: string, img3, img4, epsilon = 1)
	{
		let tbuffer = tf.buffer([1000]) // create a one dimensional tf.buffer of length 1000

		var imagenet = IMAGENET_CLASSES

		// Sets the ID of the targetClass in buffer to a value of 1
		Object.keys(imagenet).forEach(function(key) 
		{
			if (imagenet[key].valueOf() == targetClass.valueOf()) 
				tbuffer.set(1, parseInt(key));
		})

  		const targetLabel = tbuffer.toTensor()

	    // x_to_y - A Rank 1 tensor (Vector) of size 1000 - Contains the raw prediction results 
		// infer: Computes the logits (or the embedding) for the provided image. //prediction?	    
	    const xtoy = x => { return model.infer(x.toFloat(), 'conv_preds').flatten()} 

		// y_loss - Rank 0 tensor (Scalar) - Contains the top 1 prediction %
		// SoftmaxCrossEntropy: Normalises numbers into a probability distribition that sums to 1
	    const yloss = (gt, x) => tf.losses.softmaxCrossEntropy(gt, xtoy(x))

	    // TODO: are these functions necessary due to the way in which the tf.gradients function works?
	    var lossFunction = function(x) { return yloss(targetLabel, x)}
	    let gradientFunction = function () { return lossFunction(img3)}

		/**
		* Returns gradients of `f` with respect to each of the `xs`. The gradients
		* returned are of the same length as `xs`, but some might be null if `f` was
		* not a function of that `x`. It also takes optional dy to multiply the
		* gradient, which defaults to `1`.
		*/		    
	    var imgGradients = tf.environment.ENV.engine.gradients(gradientFunction, [img3]) 	// var g = tf.grads(_grad_func); let test = g([img3])		
	   	  									
		var perturbation = this.scaleGradient(imgGradients.grads[0], epsilon)

		return perturbation
	}



	async FGSM(model: tf.Model, orginalPrediction: string, img3, img4, epsilon = 0.025)
	{
		return this.singleStepAttack(model, orginalPrediction, img3, img4, epsilon).then(perturbation =>
		{
			// For FGSM ADD the perturbation to the img (move AWAY the gradient)			
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Add).then(perturbedImgTensor => 
			{
				return perturbedImgTensor
			})
		})
	}



	async Targeted_FGSM(model: tf.Model, targetPrediction:string, img3, img4, epsilon = 0.025)
	{
		return this.singleStepAttack(model, targetPrediction, img3, img4, epsilon).then(perturbation =>
		{
			// For Targeted-FGSM SUBTRACT the perturbation from the img (move TOWARDS the gradient)
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Subtract).then(perturbedImgTensor => 
			{
				return perturbedImgTensor
			})
		})
	}



	/**
	* TODO..
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	private async combineImgAndPerturbation(img4, perturbation, combineMethod:CombineMethod)
	{
		const zeroes = new Uint8Array(51529).fill(0)

		// concat the all-zeros alpha channel with 3-channel gradients from tf.gradients()
		let alphaChannel = tf.tensor3d(zeroes, [227, 227, 1])  // [0, 0,... 0, 0] (227)
		let perturbationWithAlpha = tf.concat([perturbation, alphaChannel], 2) // 227,227,4   

		if(combineMethod == CombineMethod.Add)
			return tf.add(tf.cast(img4,'float32'), perturbationWithAlpha)
		
		return tf.sub(tf.cast(img4,'float32'), perturbationWithAlpha)

	}

	/**
	* TODO..
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	private applyAlphaChannel(tensorIMG)
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
	private scaleGradient(gradient, epsilon) 
	{
		const gradientData = gradient.dataSync()

		const normalizedGradient = gradientData.map(x => 
		{
			return epsilon * Math.sign(x)
		})

		return tf.tensor(normalizedGradient).reshapeAs(gradient)
	}	
}
