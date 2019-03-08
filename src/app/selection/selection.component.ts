import { Component, OnInit } from '@angular/core';
import { ModelService} from '../model.service';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

  	constructor(private modelService: ModelService) 
  	{ 

  	}

	ngOnInit() 
	{
		this.modelService.loadAllModels()
	}
}
