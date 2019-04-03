import { Component, OnInit } from '@angular/core';
import { Prediction } from '../../classes/Prediction';
import { ModelPrediction } from '../../classes/ModelPrediction';
import { ImageService } from '../../services/image.service';
import { AdvService } from '../../services/adv.service';
import { UtilsService } from '../../services/utils.service';

import * as tf from '@tensorflow/tfjs';

import { TransferService } from '../../services/transfer.service';

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

	amplification:number = 25

	perturbation:tf.Tensor3D|tf.Tensor4D

	adversarialCanvasIsBlank = (()=> 
	{
		return this.imgService.isCanvasBlank('canvasAdversarial')
	})

	constructor(private tferService: TransferService,
				private imgService: ImageService,
				private advService: AdvService,
				private utils:UtilsService) 
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

//
}
