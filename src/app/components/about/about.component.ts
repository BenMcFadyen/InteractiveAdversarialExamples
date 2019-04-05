import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit 
{
	nestedCardClass:string = 'card nestedCard mat-elevation-z5'

	constructor() 
	{ 

	}

	ngOnInit()
	{

	}

	scroll(element: HTMLElement) 
	{
 		element.scrollIntoView();
	}

}
