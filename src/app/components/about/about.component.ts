import { Component, OnInit } from '@angular/core';
import { AboutDescriptions } from '../../Classes/AboutDescriptions';
import { AboutDescription } from '../../Classes/AboutDescription';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit 
{
	descs: AboutDescriptions = new AboutDescriptions() 

	nestedCardClass:string = 'card nestedCard mat-elevation-z8'

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
