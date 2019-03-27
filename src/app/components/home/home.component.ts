import { Component, OnInit } from '@angular/core';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

	constructor(private image: ImageService)
	{ 

	}

	ngOnInit() 
	{

	}

}
