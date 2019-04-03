import { Injectable } from '@angular/core';
import { ImageService } from './image.service';
import { ModelService } from './model.service';
import { ModelData } from './../classes/ModelData';
import { TransferService } from './transfer.service';
import { UtilsService } from './utils.service';

import * as tf from '@tensorflow/tfjs';
import {IMAGENET_CLASSES} from './../classes/ImageNetClasses';

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
	perturbationCanvasSize:number = 250 //TODO: Tie this to the one defined in the selection component

	constructor(private imgService:ImageService, 
				private modelService:ModelService, 
				private transferService:TransferService,
				private utils:UtilsService) {}


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


	/** 
	*
	*/
	async DeepFool(modelObj: ModelData, originalClass:string, img3, img4, steps = 10, subSample = 10, p = 2, drawToCanvas:boolean = true, perturbAmpli:number = 25)
	{
  		let model = modelObj.model

  		//if a predictionOutpulLayer is set, use this as the model to ensure we get the needed logits before any activation function
  		if(modelObj.predictionOutputLayer != null)
  			 model = this.getModelAtSpecificEndpoint(modelObj.model, modelObj.predictionOutputLayer)  		


  		if(modelObj.normaliseImage)
  			img3 = this.imgService.normaliseIMGTensor(img3)
		
		let perturbedImg3 = img3 // initialise perturbed image -> 3 channel

		let perturbation = img3 // initialise perturbed image -> 3 channel

		let allPerturbations = []
		let classLabels = modelObj.classLabels
		let originalClassIndex = 0

		// get the INDEX of the original class
		for(let i = 0; i < 1000; i++) if(classLabels[i] == originalClass) originalClassIndex = i
		
		// tensor of shape [1000] -> raw logits of the Original Image 
		let originalLogits = (<tf.Tensor> model.predict(img3.toFloat())).as1D()

 		// Precautionary warning
		let originalLogitsSum = tf.sum(originalLogits.dataSync()).dataSync()[0]
		if(originalLogitsSum > 0.095 && originalLogitsSum < 1.05)
			console.error('Warning: logit sum = ' + originalLogitsSum + 'logits must be from before the activation-function is applied')

		// sort the originalLogits in descending order 
		let sortedOriginalLogits = originalLogits.dataSync().slice(0).sort().reverse() 
			//this.debug_printTensorData('sortedOriginalLogits', sortedOriginalLogits)

		// get the top-k (subSample) class predictions
		let subsampleLogits = sortedOriginalLogits.slice(1, subSample+1)
			//this.debug_printTensorData('subsampleLogits', subsampleLogits)

		// get the INDEX of the top-k (subSample) class predictions 
		// this is needed to one-hot encode the labels
		let subsampleLogitsIndexs = this.getIndexOfLogits(originalLogits, subsampleLogits)
			//this.debug_printTensorData('subsampleLogitsIndexs', subsampleLogitsIndexs)


		steps = 25
		subSample = 3 //faster
		for(let i = 0; i < steps; i++)
		{
 			// one-hot encode the original class
			let tbuffer = tf.buffer([1000])
			tbuffer.set(1, originalClassIndex)
	  		const oneHotOriginalClass = tbuffer.toTensor()

			perturbedImg3 = tf.tidy(()=>
			{
				let t0 = performance.now()

				// get the predictions of the perturbed image (this will be the original image for the first run)
	 			let perturbedLogits = (<tf.Tensor> model.predict(perturbedImg3.toFloat())).as1D()
	 				//this.debug_printTensorData('perturbedLogits', perturbedLogits)

	 			// get the gradient too
		  		const getModelLogits = x => (<tf.Tensor> model.predict(x.toFloat())).as1D()
			    const lossFunction = x => tf.losses.softmaxCrossEntropy(oneHotOriginalClass, getModelLogits(x))
			    const gradientFunction = tf.grad(lossFunction)
			    let gradient = gradientFunction(perturbedImg3)
	 				//this.debug_printTensorData('gradient', gradient)

	 			// get the (-) loss of the perturbedLogits w.r.t the original class
				let loss = tf.neg(tf.losses.softmaxCrossEntropy(oneHotOriginalClass, perturbedLogits))
	 				//this.debug_printTensorData('(-)loss', loss)

		
				let subSampleLosses = []
				let subSampleGrads = []

				// get the loss & gradient for each class (k) within the subsample of logits
				for(let i = 0; i < subSample; i++)
				{
	 				// one-hot encode the SubSample class (calculated earlier (subsampleLogitsIndexs)) 
					let tbuffer = tf.buffer([1000]) 
					tbuffer.set(1, subsampleLogitsIndexs[i])
			  		let oneHotSubSampleLabel = tbuffer.toTensor()

					// get the (-) loss of the perturbedLogits w.r.t the SubSample class
					let loss = tf.neg(tf.losses.softmaxCrossEntropy(oneHotSubSampleLabel, perturbedLogits))
					subSampleLosses.push(loss)
		 				//this.debug_printTensorData('subSampleLoss', loss)

					// Get the gradient of the image w.r.t the SubSample class
			  		const getModelLogits = x => (<tf.Tensor> model.predict(x.toFloat())).as1D()
				    const lossFunction = x => tf.losses.softmaxCrossEntropy(oneHotSubSampleLabel, getModelLogits(x))
				    const gradientFunction = tf.grad(lossFunction)
				    let gradient = gradientFunction(perturbedImg3)

					subSampleGrads.push(gradient)
		 				//this.debug_printTensorData('subSampleGrad', gradient)

				}


				let lossDiffs = []
				let gradDiffs = []

				/* compute the difference between the original loss/gradient (originalClass) 
					and the loss/gradient of each SubSample */
		    	for(let i = 0; i < subSample; i++)
		    	{
		    		let lossDiff = tf.sub(subSampleLosses[i], loss)
		    		lossDiffs.push(lossDiff)

		    		let gradDiff = tf.sub(subSampleGrads[i], gradient)
	    			gradDiffs.push(gradDiff)

	    		}




				let distances = []

				// calculate the distances between each SubSample and the original
				// TODO: P == 2 ASSUMED
		    	for(let i = 0; i < subSample; i++)
		    	{
		    		let distance = tf.div(tf.abs(lossDiffs[i]), tf.add(tf.norm(gradDiffs[i]), 1e-8))	   
		    	 	distances.push(distance.arraySync())

	    			//This.debug_printTensorData('distance', distance)

		    	}

				//this.debug_printTensorData('distances', distances)


		    	// choose optimal SubSample to use?? //TODO:Check
		    	let minValue = tf.min(distances)
		    	let optimalIndex = distances.indexOf(minValue.arraySync())

	    			//this.debug_printTensorData('minValue', minValue)
		 			//this.debug_printTensorData('optimalIndex', optimalIndex)

		    	// get the optimal loss/grad differences
		    	let optLossDiff = lossDiffs[optimalIndex]
		    	let optGradDiff = gradDiffs[optimalIndex]


		 			//this.debug_printTensorData('optLossDiff', optLossDiff)
		 			//this.debug_printTensorData('optGradDiff', optGradDiff)


		    	//console.log(optimalIndex)

		    	//TODO: P == 2 //TODO: BIDMAS
		    	// abs(df) / (np.linalg.norm(dg) + 1e-8)**2 * (-dg)
		    	perturbation = tf.mul(tf.div(tf.abs(optLossDiff), tf.square(tf.add(tf.norm(optGradDiff), 1e-8))), tf.neg(optGradDiff))
		 			//this.debug_printTensorData('perturbation', perturbation)

		 		allPerturbations.push(perturbation)
	 			tf.keep(perturbation)

		 		// overshoot
		 		perturbation = tf.mul(perturbation, 1.05)
		 			//this.debug_printTensorData('overshotPerturbation', perturbation)


	 			perturbedImg3 = tf.add(perturbedImg3, perturbation)
					//this.debug_printTensorData('perturbedImg3', perturbedImg3)

	 			this.debug_logTime(t0, performance.now(), 'Step ' + i + ' completed')




	 			return perturbedImg3
	 		})
	 		//end of tidy

		} // end of loop


		return tf.tidy(()=>
		{

			let finalPerturbation = allPerturbations[0]

			for(let i = 1; i < allPerturbations.length; i++)
			{
				finalPerturbation = tf.add(finalPerturbation, allPerturbations[i])
			}

			// note: this is the FINAL perturbation -> not the total
			let reshapedPerturbation = finalPerturbation.reshapeAs(img3)
			if(drawToCanvas)
				this.drawPerturbationToCanvas(reshapedPerturbation, perturbAmpli)	

			let perturbedImg4 = this.imgService.createAndApplyAlphaChannelToTensor(perturbedImg3, 255)

			//this.debug_printTensorData('perturbedImg4', perturbedImg4)


			let unNormedPerturbedImg4 = this.imgService.reverseIMGTensorNormalisation(perturbedImg4)

			//this.debug_printTensorData('unNormedPerturbedImg4', unNormedPerturbedImg4)

		  	console.log('done')

			return unNormedPerturbedImg4

		})
	
	}



	/** Log the time taken to perform complete a given action */
	debug_logTime(t0:number, t1:number, message: string)
	{
		console.log(message + ', time taken: ' + ((t1 - t0)/1000).toFixed(2) + " (ms).")
	}


	debug_printTensorData(name:string, tensor:any)
	{

		let debugMode = true

		if(!debugMode)
			return

		console.log(name)
		console.log(tensor)

		if(tensor instanceof tf.Tensor)
		{
			console.log(tensor.dataSync())
			console.log('Sum: ' + tf.sum(tensor.dataSync()).dataSync())
		}
		else
		{
			console.log('Sum: ' + tf.sum(tensor))			
		}

		console.log('         ')

	}


	/** Get the index location within [modelLogits] of each logit within [subsampleLogits] */
	getIndexOfLogits(modelLogits: tf.Tensor, subsampleLogits)
	{
		let logitIndexs = []
		let logits = modelLogits.dataSync()

		// TODO: Not optimal -> can be improved
		for(let j = 0; j < subsampleLogits.length; j++)
		{
			for(let i = 0; i < 1000; i++)
			{				
				if(subsampleLogits[j] == logits[i])
					logitIndexs.push(i)		
			}
		}

		return logitIndexs
	}











	// crossentropy(label:number, logits:tf.Tensor)
	// {
	//     let e = tf.exp(logits)
	//    	let s = tf.sum(e)
	//     let ce = tf.log(s) 


	//     console.log('log s')
	//     console.log(tf.log(s))
	//     console.log(tf.log(s).dataSync())

	//     // logits[label]
	//     //return ce
	// }


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


	/** Used to create a model sliced at one of its layers (used to retreive the model logits before any activation function is applied*/
	getModelAtSpecificEndpoint(model: tf.LayersModel, endpoint:string)
	{
		return tf.model({inputs:model.inputs, outputs:model.getLayer(endpoint).output})
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
				this.imgService.drawTensorToCanvas('canvasDifference', whitePerturbedTensor, this.perturbationCanvasSize, this.perturbationCanvasSize)
			})

			scaledPerturbation.dispose()
		})
	}

	/**
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

	/** Experimental*/	
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
