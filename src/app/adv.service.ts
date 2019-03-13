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
		var labelClasses = IMAGENET_CLASSES //TODO: Add modularity here

		// Sets the ID of the targetClass in buffer to a value of 1
		Object.keys(labelClasses).forEach(function(key) 
		{
			if (labelClasses[key].valueOf() == targetClass.valueOf()) 
				tbuffer.set(1, parseInt(key));
		})

  		const oneHotLabels = tbuffer.toTensor()


  		const getModelLogits = x => model.infer(x.toFloat(), 'conv_preds').as1D()

	    const lossFunction = x => tf.losses.softmaxCrossEntropy(oneHotLabels, getModelLogits(x))

	    const gradientFunction = tf.grad(lossFunction)

	    var gradient = gradientFunction(img3)


	    console.log(img3)
	   	  									
		var perturbation = this.scaleGradient(gradient, epsilon)

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
		// apply alpha layer to the perturbation
		let perturbationWithAlpha = this.applyAlphaChannel(perturbation)

		if(combineMethod == CombineMethod.Add)
			return tf.add(tf.cast(img4,'float32'), perturbationWithAlpha)
		
		return tf.sub(tf.cast(img4,'float32'), perturbationWithAlpha)

	}

	/**
	* TODO: Assumes Rank3 img tensor, Add modularity here
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	private applyAlphaChannel(tensorIMG, numberToFillWith:number = 0)
	{
		var arraySize = tensorIMG.shape[0] * tensorIMG.shape[1] //TODO: Assumes Rank3 img tensor
		const filler = new Uint8Array(arraySize).fill(numberToFillWith)
		// concat the all-zeros alpha channel with 3-channel gradients from tf.gradients()		
		let alphaChannel = tf.tensor3d(filler, [tensorIMG.shape[0], tensorIMG.shape[1], 1])// [0, 0,... 0, 0] (227)
		let tensorWithAlpha = tf.concat([tensorIMG, alphaChannel], 2) // 227,227,4   
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
