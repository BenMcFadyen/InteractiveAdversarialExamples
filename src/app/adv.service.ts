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
	*
	*
	*/ 
	async genAdvExample(modelObject: ModelData, orginalPrediction: string, canvas: HTMLCanvasElement, epsilon)
	{
		var model = modelObject.model

		let tbuffer = tf.buffer([1000]) // create a one dimensional tf.buffer of length 1000

	    // 4-channel img with alpha
	    const img4 = tf.image.resizeBilinear(tf.fromPixels(canvas, 4), [227, 227])

	    // 3-channel img for concat
	    const img3 = tf.image.resizeBilinear(tf.fromPixels(canvas, 3), [227, 227])

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
	    const xtoy = x => { return model.infer(x.toFloat(), 'conv_preds').flatten()}
	    const yloss = (gt, x) => tf.losses.softmaxCrossEntropy(gt, xtoy(x))
	    var loss_func = function(x) { return yloss(oglabel, x)}
	    let _grad_func = function () { return loss_func(img3)}

	    var _im = tf.environment.ENV.engine.gradients(_grad_func, [img3])
	    let im_gradients = _im.grads[0];

	    var perturbedImgTensor = await this.generate_adv_xs(img4, im_gradients, epsilon).then(async perturbedImgTensor => 
		{
			console.log("Generated adversarial example with: eps = " + epsilon)
			return perturbedImgTensor			
		})

		return perturbedImgTensor;
	}


	async generate_adv_xs(img4channel, grads, eps)
	{
		let perturbations = this.scale_grad(grads, eps)
		const zeroes = new Uint8Array(51529)

		// concat the all-zeros alpha channel with 3-channel gradients from tf.gradients()
		let alpha_channel = tf.tensor3d(zeroes, [227, 227, 1])  // [0, 0,... 0, 0] (227)
		let expanded_grad = tf.concat([perturbations, alpha_channel], 2) // 227,227,4   
		let perturbed_img = tf.add(tf.cast(img4channel,'float32'), expanded_grad)
		// perturbed_img.print()
		return perturbed_img
	}

	scale_grad(grad, eps) 
	{
		const grad_data = grad.dataSync()
		const normalized_grad = grad_data.map(item => 
		{
			return eps * Math.sign(item)
		})

		return tf.tensor(normalized_grad).reshapeAs(grad)
	}	
}
