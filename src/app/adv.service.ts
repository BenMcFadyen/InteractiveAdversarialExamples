import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { ModelService } from './model.service';
import { ModelData } from './ModelData';

import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from './ImageNetClasses';

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
	private async singleStepAttack(modelObj: ModelData, targetClass, img3, epsilon)
	{
		return tf.tidy(()=>
		{
			let tbuffer = tf.buffer([1000]) // used for storing the one-hot label

			// one-hot encode the target class  //TODO: Use tf.oneHot?
			Object.keys(modelObj.classLabels).forEach(function(key) 
			{
				if (modelObj.classLabels[key].valueOf() == targetClass.valueOf()) 
					tbuffer.set(1, parseInt(key));
			})
		
	  		const oneHotClassLabels = tbuffer.toTensor()

	  		if(modelObj.normaliseImage)
	  			img3 = this.imgService.normaliseIMGTensor(img3)

	  		let model = modelObj.model

	  		// if a predictionOutpulLayer is set, use this as the model to ensure we get the needed logits before any activation function
	  		if(modelObj.predictionOutputLayer != null)
	  			 model = this.getModelAtSpecificEndpoint(modelObj.model, modelObj.predictionOutputLayer)

	  		const getModelLogits = x => (<tf.Tensor> model.predict(x.toFloat())).as1D() //must be the RAW prediction logits, BEFORE any activation functions, or the gradient calculated will not be correct
		    const lossFunction = x => tf.losses.softmaxCrossEntropy(oneHotClassLabels, getModelLogits(x))
		    const gradientFunction = tf.grad(lossFunction)
		    var gradient = gradientFunction(img3)
			var perturbation = this.scaleTensor(gradient, epsilon)

			return perturbation
		})
	}

	/** Used to create a model sliced at one of its layers (used to retreive the model logits before any activation function is applied*/
	getModelAtSpecificEndpoint(model: tf.LayersModel, endpoint:string)
	{
		return tf.model({inputs:model.inputs, outputs:model.getLayer(endpoint).output})
	}


	async FGSM(modelObj: ModelData, orginalPrediction: string, img3, img4, epsilon = 1)
	{		
		return this.singleStepAttack(modelObj, orginalPrediction, img3, epsilon).then(perturbation =>
		{
			let differenceScaleValue = 50; //TODO: Let the user control this value
			this.drawPerturbationToCanvas(perturbation, differenceScaleValue)

			// For FGSM ADD the perturbation to the img (move AWAY from the gradient)			
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Add).then(perturbedImgTensor => 
			{
				perturbation.dispose()
				return <tf.Tensor3D | tf.Tensor4D> perturbedImgTensor
			})
		})
	}

	async Targeted_FGSM(modelObj: ModelData, targetPrediction:string, img3, img4, epsilon = 1)
	{
		return this.singleStepAttack(modelObj, targetPrediction, img3, epsilon).then(perturbation =>
		{	
			let differenceScaleValue = 50; //TODO: Let the user control this value
			this.drawPerturbationToCanvas(perturbation, differenceScaleValue)

			// For Targeted-FGSM SUBTRACT the perturbation from the img (move TOWARDS the gradient)
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Subtract).then(perturbedImgTensor => 
			{
				perturbation.dispose()
				return <tf.Tensor3D | tf.Tensor4D> perturbedImgTensor
			})
		})
	}


	/**
	* As canvas' are transparant by default the perturbation cannot be drawn to the canvas by default
	* Here the perturbation is combined with an all-white tensor, so the perturbation is visible when drawn
	*/
	drawPerturbationToCanvas(perturbation:tf.Tensor3D | tf.Tensor4D, differenceScaleValue:number = 50)
	{
		tf.tidy(()=>
		{
			// scale the perturbation as required (low epsilon must be scaled to be visible)
			let scaledPerturbation = this.scaleTensor(perturbation, differenceScaleValue) 

			// apply alpha channel to perturbation (ensure it is the correct shape for canvas display)
			let perturbationWithAlpha = this.imgService.createAndApplyAlphaChannelToTensor(scaledPerturbation, 255)

			// Create the all-white tensor (pixel-value: 255)
			let whiteTensor = this.imgService.createFilledTensor(perturbationWithAlpha.shape, 255)

			// combine the white-tensor with the perturbed one; draw to canvas
			let whitePerturbedTensor = <tf.Tensor3D | tf.Tensor4D> whiteTensor.add(perturbationWithAlpha)
			this.imgService.drawTensorToCanvas('canvasDifference', whitePerturbedTensor, 350, 350)		
		})
	}

	/**
	* TODO..
	* @param {epsilon} determines the amount of perturbation applied
	* @return {tf.Tensor} perturbed img tensor
	*/
	private async combineImgAndPerturbation(img4, perturbation, combineMethod:CombineMethod)
	{
		return tf.tidy(()=>
		{
			// apply alpha layer to the perturbation
			let perturbationWithAlpha = this.imgService.createAndApplyAlphaChannelToTensor(perturbation, 0)

			if(combineMethod == CombineMethod.Add)
				return <tf.Tensor3D | tf.Tensor4D> tf.add(tf.cast(img4,'float32'), perturbationWithAlpha)
			
			return <tf.Tensor3D | tf.Tensor4D> tf.sub(tf.cast(img4,'float32'), perturbationWithAlpha)
		})
	}

	/**
	* Scale the given tensor according to the given epsilon value
	* Example: tensor = [-0.01, 1, -0.1, 3], epsilon = 10
	* 		   scaled = [-10, 10, -10, 10]
	* @param {epsilon} determines the scale of the perturbation
	* @return {tf.Tensor} perturbed img tensor
	*/
	private scaleTensor(tensor, epsilon) 
	{
		return tf.tidy(()=>
		{
			const tensorData = tensor.dataSync()

			const scaledTensor = tensorData.map(x => 
			{
				return epsilon * Math.sign(x)
			})

			return tf.tensor(scaledTensor).reshapeAs(tensor)
		})
	}	

	/** Experimental (not used) */
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
}
