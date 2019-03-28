import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PageEvent } from '@angular/material';
import { FormControl } from '@angular/forms';

import { ImageFileNames } from '../../classes/ImageFileNames';
import { HelperService } from '../../services/helper.service';

@Component({
  selector: 'app-image-select-dialog',
  templateUrl: './image-select-dialog.component.html',
  styleUrls: ['./image-select-dialog.component.scss']
})
export class ImageSelectDialogComponent implements OnInit 
{
	basePath: string = './assets/images/'

	subFolderPaths: string[] = 
	[
		'animals/',
		'objects/',
		'food/',		
	]

	fileExtension:string = '.jpg'
	pageNumber = 0

	imageSelected = false
	selectedImgUrl:string = ''

	imageFileNames = new ImageFileNames()

  	tabs = ['Animals', 'Objects', 'Food'];
 	selected = new FormControl(0);

	groups:string[][] = 
	[
		this.imageFileNames.animals,
		this.imageFileNames.objects,
		this.imageFileNames.food,
	]

	imageUrls: string[][]

	constructor(public dialogRef: MatDialogRef<ImageSelectDialogComponent>,
				private helper:HelperService) 
	{ 

	}

	ngOnInit() 
	{
		//randomise the image order
		this.helper.shuffleArray(this.imageFileNames.animals)
		this.helper.shuffleArray(this.imageFileNames.objects)
		this.helper.shuffleArray(this.imageFileNames.food)

		this.updateImageArray(0)
	}

	updateImageArray(startIndex = 0)
	{
		let groupIndex = this.selected.value

		let row = 3
		let column = 3
		let index = startIndex*9;
		let fullUrl = ''

		this.imageUrls = []

		for(let i = 0; i < row; i++)
		{
			this.imageUrls[i] = []

			for(let j = 0; j < column; j++)
			{	
				//eof
				if(this.groups[groupIndex][index] == null)
					return 

				fullUrl = this.basePath + this.subFolderPaths[groupIndex] + this.groups[groupIndex][index] + this.fileExtension
				this.imageUrls[i][j] = fullUrl
				index++
			}
		}

	}

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
