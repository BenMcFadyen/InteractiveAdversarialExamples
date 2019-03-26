import { Component, OnInit } from '@angular/core';
import { Prediction } from '../Prediction';
import { ModelPrediction } from '../ModelPrediction';
import { ImageService } from '../image.service';
import { AdvService } from '../adv.service';

import * as tf from '@tensorflow/tfjs';

import { TransferService } from '../transfer.service';

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit
{
 	allModelPredictions:ModelPrediction[]

 	adversarialImageModelNameSource:string 

	columnsToDisplay = ['className', 'confidence']

	amplification:number = 10

	perturbation:tf.Tensor3D|tf.Tensor4D

	adversarialCanvasIsBlank = (()=> 
	{
		return this.imgService.isCanvasBlank('canvasAdversarial')
	})

	constructor(private tferService: TransferService, private imgService: ImageService, private advService: AdvService) 
	{
	}

	ngOnInit() 
	{
		this.tferService.currentAllModelPredictionsSource.subscribe(allModelPredictions => this.allModelPredictions = allModelPredictions)
		this.tferService.currentAdversarialImageModelNameSource.subscribe(adversarialImageModelNameSource => this.adversarialImageModelNameSource = adversarialImageModelNameSource)
		this.tferService.currentPerturbationSource.subscribe(perturbation => this.perturbation = perturbation)

	}


	onAmplificationChange()
	{
		// set the tranfer amplification value, this will ensure that when a new image is generated, the right amplification is applied
		this.tferService.setPerturbationAmplification(this.amplification)

		// also draw the perturbation to canvas, #
		if(this.imgService.isCanvasBlank('canvasAdversarial') )
			return

		if(this.perturbation == null)
			return

		this.advService.drawPerturbationToCanvas(this.perturbation, this.amplification, this.amplification)
		
	}


	formatConfidence(number:number)
	{
		return parseFloat((number*100).toFixed(2))
	}
}
