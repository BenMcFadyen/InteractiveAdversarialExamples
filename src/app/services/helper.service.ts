import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class HelperService
{
	wantLogTime:boolean = false

	constructor() 
	{ 

	}

	/** Log the time taken to perform complete a given action */
	logTime(t0:number, t1:number, message: string)
	{
		if(this.wantLogTime)
			console.log(message + ', time taken: ' + ((t1 - t0)/1000).toFixed(2) + " (ms).")
	}

	//** round a number to: [precison] dp */
	roundNumber(number:number, precision:number)
	{
		return parseFloat((number).toFixed(precision))
	}

	/**
	 * Randomize array element order in-place.
	 * Using Durstenfeld shuffle algorithm.
	 * https://stackoverflow.com/a/12646864/11086438
	 */
	shuffleArray(array:Array<any>)
	{
	    for (var i = array.length - 1; i > 0; i--) 
	    {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
	}
}
