import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { ModelService } from './model.service';
import { ModelData } from './ModelData';
import { TransferService } from './transfer.service';

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
	perturbationAmplification:number=0

	constructor(private imgService:ImageService, private modelService:ModelService, private transferService:TransferService) {}


	/**
	* Generates perturbation in respect to the provided targetClass
	* @return {tf.Tensor} perturbed img tensor
	*/
	private async singleStepAttack(modelObj: ModelData, targetClass, img3, epsilon)
	{
		let gradient = tf.tidy(()=>
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
		    let gradient = gradientFunction(img3)
		    
		    return gradient
		})


		return await this.scaleTensor(gradient, epsilon).then((perturbation )=>
		{
			gradient.dispose()
			return perturbation
		})
		
	}

	/** Used to create a model sliced at one of its layers (used to retreive the model logits before any activation function is applied*/
	getModelAtSpecificEndpoint(model: tf.LayersModel, endpoint:string)
	{
		return tf.model({inputs:model.inputs, outputs:model.getLayer(endpoint).output})
	}


	async FGSM(modelObj: ModelData, orginalPrediction: string, img3, img4, epsilon = 1, drawToCanvas:boolean = true, perturbAmpli:number = 25)
	{		
		return this.singleStepAttack(modelObj, orginalPrediction, img3, epsilon).then(perturbation =>
		{
			// if the perturbation should be drawn to canvas, draw it with the given amplification value (so it can be seen)
			if(drawToCanvas)
				this.drawPerturbationToCanvas(perturbation, epsilon, perturbAmpli)

			// update the perturbation at the transfer service, so the perturbation can be re-drawn if the user changes the amplification (the above only updates when generated)
			this.transferService.setPerturbation(perturbation)

			// For FGSM ADD the perturbation to the img (move AWAY from the gradient)			
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Add).then(perturbedImgTensor => 
			{
				img3.dispose()
				img4.dispose()
				return <tf.Tensor3D | tf.Tensor4D> perturbedImgTensor
			})
		})
	}

	async Targeted_FGSM(modelObj: ModelData, targetPrediction:string, img3, img4, epsilon = 1, drawToCanvas:boolean = true, perturbAmpli:number = 25)
	{
		return this.singleStepAttack(modelObj, targetPrediction, img3, epsilon).then(perturbation =>
		{	
			// if the perturbation should be drawn to canvas, draw it with the given amplification value (so it can be seen)
			if(drawToCanvas)
				this.drawPerturbationToCanvas(perturbation, perturbAmpli)

			// update the perturbation at the transfer service, so the perturbation can be re-drawn if the user changes the amplification (the above only updates when generated)
			this.transferService.setPerturbation(perturbation)

			// For Targeted-FGSM SUBTRACT the perturbation from the img (move TOWARDS the gradient)
			return this.combineImgAndPerturbation(img4, perturbation, CombineMethod.Subtract).then(perturbedImgTensor => 
			{
				img3.dispose()
				img4.dispose()
				return <tf.Tensor3D | tf.Tensor4D> perturbedImgTensor
			})
		})
	}


	/**
	* As canvas' are transparant by default the perturbation cannot be drawn to the canvas by default
	* Here the perturbation is combined with an all-white tensor, so the perturbation is visible when drawn
	*/
	drawPerturbationToCanvas(perturbation:tf.Tensor3D | tf.Tensor4D, originalEpsilon:number, scaleFactor:number = 50)
	{
		// we scale the perturbation to ensure it is visible to the user
		// if the original Epsilon is greater than the scale value, disregard it, as this will overwrite the perturbation 
		if(originalEpsilon > scaleFactor)
			scaleFactor = originalEpsilon

		// scale the perturbation as required (low epsilon must be scaled to be visible)
		this.scaleTensor(perturbation, scaleFactor).then((scaledPerturbation)=>
		{
			tf.tidy(()=>
			{
				// apply alpha channel to perturbation (ensure it is the correct shape for canvas display)
				let perturbationWithAlpha = this.imgService.createAndApplyAlphaChannelToTensor(scaledPerturbation, 255)

				// Create the all-white tensor (pixel-value: 255)
				let whiteTensor = this.imgService.createFilledTensor(perturbationWithAlpha.shape, 255)

				// combine the white-tensor with the perturbed one; draw to canvas
				let whitePerturbedTensor = <tf.Tensor3D | tf.Tensor4D> whiteTensor.add(perturbationWithAlpha)
				this.imgService.drawTensorToCanvas('canvasDifference', whitePerturbedTensor, 350, 350)//TODO:HANDLE IMAGE SIZE-ING 
			})

			scaledPerturbation.dispose()
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
	private async scaleTensor(tensor, epsilon) 
	{
	 	return await tensor.data().then(tensorData =>
		{
			return tf.tidy(()=>
			{
				const scaledTensor = tensorData.map(x => 
				{
					return epsilon * Math.sign(x)
				})

				return tf.tensor(scaledTensor).reshapeAs(tensor)
			})

			tensorData.dispose()
		})
		
	}	

	/** Experimental (not used) */	
	// reverseSoftmax(softmaxNums, constant)
	// {
	// 	softmaxNums = softmaxNums.dataSync()
	// 	let revSoftMaxNums = new Array()

	// 	for(let i = 0; i < softmaxNums.length; i++)	
	// 	{
	// 		let x = Math.log(softmaxNums[i]) + constant
	// 		revSoftMaxNums.push(x)
	// 	}

	// 	return revSoftMaxNums
	// }	
}
