import { AboutDescription } from './AboutDescription';

export class AboutDescriptions 
{

	lorem:string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, ' +
		'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' +
		' Auctor augue mauris augue neque. Dis parturient montes nascetur ' +
		' ridiculus mus mauris vitae. Sed vulputate odio ut enim. Gravida ' + 
		' rutrum quisque non tellus orci ac auctor augue mauris.'

	WhatAreAdversarialExamples = new AboutDescription('What are adversarial examples?', this.lorem)

	HowDoesItWork = new AboutDescription('How does it work?', this.lorem)

	ModelLoading = new AboutDescription('Model Loading', this.lorem)

	Models = new AboutDescription('Models', this.lorem)
		MobileNet = new AboutDescription('MobileNet', this.lorem)
		MobileNetV2 = new AboutDescription('MobileNetV2', this.lorem)
		ResNet50 = new AboutDescription('ResNet50', this.lorem)
		Xception = new AboutDescription('Xception', this.lorem)
		InceptionV3 = new AboutDescription('InceptionV3', this.lorem)

	ImageSelection = new AboutDescription('Image Selection', this.lorem)
		Upload = new AboutDescription('Upload', this.lorem)
		Select = new AboutDescription('Select', this.lorem)
		RandomOption = new AboutDescription('Random Option', this.lorem)

	ModelSelection = new AboutDescription('Model Selection', this.lorem)
		AdversarialModel = new AboutDescription('Adversarial Model', this.lorem)
		PredictionModels = new AboutDescription('Prediction Models', this.lorem)

	AttackMethods = new AboutDescription('Attack Methods', this.lorem)
		FGSM = new AboutDescription('Fast Gradient Sign Method', this.lorem)
		T_FGSM = new AboutDescription('Targeted Fast Gradient Sign Method', this.lorem)
		DeepFool = new AboutDescription('DeepFool', this.lorem)


	ImageDisplay = new AboutDescription('Image Display', this.lorem)
	Perturbation = new AboutDescription('Perturbation', this.lorem)

	AboutThisProject = new AboutDescription('About this project', this.lorem)
		Related = new AboutDescription('Related', this.lorem)

}