import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PageEvent } from '@angular/material';
import { FormControl } from '@angular/forms';

import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-image-select-dialog',
  templateUrl: './image-select-dialog.component.html',
  styleUrls: ['./image-select-dialog.component.scss']
})
export class ImageSelectDialogComponent implements OnInit 
{
	pageNumber = 0
	pageEvent: PageEvent;

	imageSelected = false
	selectedImgUrl:string = ''

	imageUrlArrays = [	this.imageService.animalImageUrls,
						this.imageService.objectImageUrls,
						this.imageService.foodImageUrls]

	imageUrls:string[][]

  	tabs = ['Animals', 'Objects', 'Food'];
 	selected = new FormControl(0);

	constructor(public dialogRef: MatDialogRef<ImageSelectDialogComponent>,
				private imageService:ImageService) 
	{ 

		this.imageService.initialiseImageSelectImagePaths()
	}

	ngOnInit() 
	{
		this.updateImageArray(0)
	}

	updateImageArray(startIndex = 0)
	{
		let tabIndex = this.selected.value

		let row = 3
		let column = 3
		let index = startIndex*9;

		let sourceArray = this.imageUrlArrays[tabIndex]

		this.imageUrls = [[]]

		for(let i = 0; i < row; i++)
		{
			this.imageUrls[i] = []

			for(let j = 0; j < column; j++)
			{	
				//eof
				if(sourceArray[index] == null)
					return
				

				this.imageUrls[i][j] = sourceArray[index]
				index++
			}
		}
	}


	//TODO: Fix bug with page not resetting on tab switch
	onTabSwitch()
	{
		this.imageSelected = false
		this.selectedImgUrl = null	
		this.updateImageArray(0)		
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
		if(this.selectedImgUrl == selectedImgUrl)
		{
			this.imageSelected = false
			this.selectedImgUrl = null
			return
		}

		this.imageSelected = true
		this.selectedImgUrl = selectedImgUrl
	}

//
}
