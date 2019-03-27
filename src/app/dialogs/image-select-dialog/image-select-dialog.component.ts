import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {PageEvent} from '@angular/material';

@Component({
  selector: 'app-image-select-dialog',
  templateUrl: './image-select-dialog.component.html',
  styleUrls: ['./image-select-dialog.component.scss']
})
export class ImageSelectDialogComponent implements OnInit 
{
	private basePath: string = 'assets/images/'
	private fileExtension:string = '.jpg'
	private pageNumber = 0

	private imageSelected = false
	private selectedImgUrl:string = ''

	images: string[][]

	imageNames:string[] = 
	[
		'boxer', 
		'bubble', 
		'car', 
		'cat299', 
		'chainsaw', 
		'elephant', 
		'elephant2',
		'fountain_pen', 	
		'goldfish', 
		'hamster', 
		'jay', 
		'jay2', 	
		'laptop', 
		'lemon', 
		'lion', 
		'lion2',
		'moped',
		'mushroom',
		'ostrich',
		'pencil',
		'pooltable',
		'pooltable2',
		'pug',
		'scorpion',														
		'scuba',		
		'sealion',		
		'sealion2',		
		'snake',		
		'snake2',		
		'stingray',												
		'stingray2',												
		'strawberry',												
		'tarantula',												
		'vase',												
		'volcano',												
		'wolfspider',												
	]

	constructor(public dialogRef: MatDialogRef<ImageSelectDialogComponent>) 
	{ 

	}

	ngOnInit() 
	{
		this.updateImageArray(0)
	}

	updateImageArray(startIndex = 0)
	{
		let row = 3
		let column = 3
		let index = startIndex*9;
		let fullUrl = ''

		this.images = []

		for(let i = 0; i < row; i++)
		{
			this.images[i] = []

			for(let j = 0; j < column; j++)
			{	
				fullUrl = this.basePath + this.imageNames[index] + this.fileExtension
				this.images[i][j] = fullUrl
				index++
			}
		}

	}

	onPageUpdate(event)
	{
		this.imageSelected = false
		this.selectedImgUrl = null
		this.pageNumber = event.pageIndex
		this.updateImageArray(this.pageNumber)
	}

	onConfirmButtonClick()
	{
		this.dialogRef.close(this.selectedImgUrl)
	}

	onCloseButtonClick()
	{
		this.dialogRef.close(null)
	}

	onImgClick(selectedImgUrl)
	{
		this.imageSelected = true
		this.selectedImgUrl = selectedImgUrl
		//console.log('Selected: ' + selectedImgUrl)
	}

//
}
