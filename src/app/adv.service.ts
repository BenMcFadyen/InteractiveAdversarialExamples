import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { ModelService } from './model.service';
import { ModelData } from './ModelData';

import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from './ImageNetClasses';
import * as mobilenet from '@tensorflow-models/mobilenet';

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
	constructor(private imgService:ImageService, private modelService:ModelService) {}

	/**
	* Generates perturbation in respect to the provided targetClass
	* @return {tf.Tensor} perturbed img tensor
	*/
	private async singleStepAttack(modelObj: ModelData, classLabels, targetClass, img3, epsilon)
	{
		return tf.tidy(()=>
		{
			let tbuffer = tf.buffer([1000]) // used for storing the one-hot label

			// one-hot encode the target class  //TODO: Use tf.oneHot?
			Object.keys(classLabels).forEach(function(key) 
			{
				if (classLabels[key].valueOf() == targetClass.valueOf()) 
					tbuffer.set(1, parseInt(key));
			})
		
	  		const oneHotClassLabels = tbuffer.toTensor()

	  		if(modelObj.normaliseImage)
	  			img3 = this.imgService.normaliseIMGTensor(img3)

	  		let model = modelObj.model

	  		// if a predictionOutpulLayer is set, use this as the model to ensure we get the needed logits (before a softmax layer for example)
	  		if(modelObj.predictionOutputLayer != null)
	  			 model = this.getModelAtEndpoint(modelObj.model, modelObj.predictionOutputLayer)

	  		const getModelLogits = x => model.predict(x.toFloat()).as1D() //must be the RAW prediction logits, BEFORE any activation functions, or the gradient calculated will not be correct
		    const lossFunction = x => tf.losses.softmaxCrossEntropy(oneHotClassLabels, getModelLogits(x))
		    const gradientFunction = tf.grad(lossFunction)
		    var gradient = gradientFunction(img3)
			var perturbation = this.scaleGradient(gradient, epsilon)

			return perturbation
		})
	}


	reverseSoftmax(softmaxNums, constant)
	{
		softmaxNums = softmaxNums.dataSync()
		let revSoftMaxNums = new Array()

		for(let i = 0; i < softmaxNums.length; i++)	
		{
			let x = Math.log(softmaxNums[i]) + constant
			revSoftMaxNums.push(x)
		}

		return revSoftMaxNums
	}


	getModelAtEndpoint(model: tf.Model, endpoint:string)
	{
		return tf.model({inputs:model.inputs, outputs:model.getLayer(endpoint).output})
	}


	async FGSM(modelObj: ModelData, classLabels, orginalPrediction: string, img3, img4, epsilon = 1)
	{		
		return this.singleStepAttack(modelObj, classLabels, orginalPrediction, img3, epsilon).then(perturbation =>
		{
			// For FGSM ADD the perturbation to the img (move AWAY from the gradient)			
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Add).then(perturbedImgTensor => 
			{
				return <tf.Tensor3D | tf.Tensor4D> perturbedImgTensor
			})
		})
	}


	async Targeted_FGSM(modelObj: ModelData, classLabels, targetPrediction:string, img3, img4, epsilon = 1)
	{
		return this.singleStepAttack(modelObj, classLabels, targetPrediction, img3, epsilon).then(perturbation =>
		{
			// For Targeted-FGSM SUBTRACT the perturbation from the img (move TOWARDS the gradient)
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Subtract).then(perturbedImgTensor => 
			{
				return <tf.Tensor3D | tf.Tensor4D> perturbedImgTensor
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
		let perturbationWithAlpha = this.imgService.applyAlphaChannelToTensor(perturbation, 0)

		if(combineMethod == CombineMethod.Add)
			return tf.add(tf.cast(img4,'float32'), perturbationWithAlpha)
		
		return tf.sub(tf.cast(img4,'float32'), perturbationWithAlpha)

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
