import { Component, OnInit } from '@angular/core';
import { ModelService} from '../model.service';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

  constructor(private model: ModelService) { }

  ngOnInit() 
  {

  //	this.model.loadModelFromFile
  }





}
