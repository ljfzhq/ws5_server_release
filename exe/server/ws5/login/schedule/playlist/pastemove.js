var util 		= require('util');
var Helper 		= require('../../../../utils/helper');

var helper 	= new Helper();
var logger 	= helper.logger;

var PasteMove = function(schedule, siteObj) {
	helper.config = helper.loadConfig();
    
//ffff 20130903
	this.expandRecurrencePlaylist = function(sourceArray) {
		var resultArray = [];
		var index 		= 0;
		var sourceSize 	= 0;
		var tempArray 	= [];
		var tempIndex 	= 0;
		var tempSize	= 0;
		
		if(!sourceArray || !util.isArray(sourceArray) || !sourceArray.length) {
			return null;
		}
		
		sourceSize = sourceArray.length;
		for(index = 0; index < sourceSize; index++) {
			if(sourceArray[index].recurrence) {
				tempArray = [];
				schedule._expandPlaylist(sourceArray[index], tempArray, sourceArray[index].recurrencesetting.startdate, sourceArray[index].recurrencesetting.enddate);
				
				tempSize = tempArray.length;
				for(tempIndex = 0; tempIndex < tempSize; tempIndex++) {
					resultArray.push(tempArray[tempIndex]);
				}
			}
			else {
				resultArray.push(sourceArray[index]);
			}
		}
		
		return resultArray;
	}
	
	copyObject = function(obj) {
		var newObj = {};

		newObj.schedulepath = obj.schedulepath;
		newObj.scheduletype = obj.scheduletype;
		newObj.playlistpath = obj.playlistpath;
		newObj.listtype 	= obj.listtype;
		newObj.start 		= obj.start;
		newObj.end 			= obj.end;
		newObj.lastmodifytime = obj.lastmodifytime;
		newObj.rootobjid 	= obj.rootobjid;
		newObj.recurrence 	= obj.recurrence;
		if(obj.recurrence) {
			newObj.recurrencesetting = {};
			newObj.recurrencesetting.startdate = obj.recurrencesetting.startdate;
			newObj.recurrencesetting.enddate = obj.recurrencesetting.enddate;
			newObj.recurrencesetting.recurrencetype = obj.recurrencesetting.recurrencetype;
			
			if(obj.recurrencesetting.weekly) { newObj.recurrencesetting.weekly = obj.recurrencesetting.weekly; }
			if(obj.recurrencesetting.monthly) { newObj.recurrencesetting.weekly = obj.recurrencesetting.monthly; }
			if(obj.recurrencesetting.hourly) { newObj.recurrencesetting.weekly = obj.recurrencesetting.hourly; }
			if(obj.recurrencesetting.endtime) { newObj.recurrencesetting.weekly = obj.recurrencesetting.endtime; }
		}
		
		return newObj;
	}

/*		
	var handleHourlyPlaylist = function(obj, delta, newArray) {
		var newObj			= {};
		var firstStart		= '';
		var tempStart 		= '';
		var tempEnd 		= '';
		var nextEnd			= '';
		var lastValidEnd	= '';
		var entTime			= '';
		var interval		= parseInt(newObj.recurrencesetting.hourly, 10) * 1000; //ms
		
		newObj = {};
		newObj = copyObject(obj);
		delete newObj.rootobjid;
		
		newObj.lastmodifytime = new Date();
		newObj.siteid 	= siteObj.siteID;

		tempStart	= schedule._calculateNewTime(newObj.start, delta, false);
		tempEnd 	= schedule._calculateNewTime(newObj.end, delta, true);
		endTime 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate + ':' + newObj.recurrencesetting.endtime, delta, true);
		
		firstStart 	= tempStart;
		while((firstStart.slice(0, 10) === tempEnd.slice(0, 10)) && (tempEnd < endTime)) { //find the first item which across day
			tempStart = schedule._calculateNewTime(tempStart, interval, true);
			tempEnd = schedule._calculateNewTime(tempEnd, interval, true);
		}
		
		if(tempEnd > endTime) { //exceed the endtime, rollback one
			tempStart = schedule._calculateNewTime(tempStart, interval * (-1), true);
			tempEnd = schedule._calculateNewTime(tempEnd, interval * (-1), true);
		}
		
		if(firstStart.slice(0, 10) !== tempEnd.slice(0, 10)) {
			lastValidEnd = schedule._calculateNewTime(tempEnd, interval * (-1), true);
		}
		else {
			lastValidEnd = tempEnd;
		}
		
		
		if(firstStart > lastValidEnd) { //the first across day, add one extra static playlist
			newObj.start	= schedule._calculateNewTime(newObj.start, delta, false);
			newObj.end 		= schedule._calculateNewTime(newObj.end, delta, true);
			delete newObj.recurrencesetting;
			newObj.recurrence = false;

			newArray.push(newObj);

			newObj = {};
			newObj = copyObject(obj);
			delete newObj.rootobjid;
			
			newObj.lastmodifytime = new Date();
			newObj.siteid 	= siteObj.siteID;
			newObj.start	= schedule._calculateNewTime(newObj.start, delta + interval, false);
			newObj.end 		= schedule._calculateNewTime(newObj.end, delta + interval, true);
			newObj.recurrencesetting.startdate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10)).slice(0, 10);
			newObj.recurrencesetting.enddate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10)).slice(0, 10);
			newObj.recurrencesetting.endtime 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate + ':' + newObj.recurrencesetting.endtime, delta, true).slice(11, 23);

			newArray.push(newObj);
		}
		else { //maybe middle item across day
			newObj.start	= schedule._calculateNewTime(newObj.start, delta, false);
			newObj.end 		= schedule._calculateNewTime(newObj.end, delta, true);
			newObj.recurrencesetting.startdate 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10);
			newObj.recurrencesetting.enddate 	= schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10);
			newObj.recurrencesetting.endtime 	= lastValidEnd.slice(11, 23);
			
			newArray.push(newObj);

			if(tempStart.slice(0, 10) !== tempEnd.slice(0, 10)) { //one item across day
				//insert single playlist for the across day item
				newObj = {};
				newObj = copyObject(obj);
				delete newObj.rootobjid;
				
				newObj.lastmodifytime = new Date();
				newObj.siteid 	= siteObj.siteID;
				newObj.start	= tempStart;
				newObj.end 		= tempEnd;
				delete newObj.recurrencesetting;
				newObj.recurrence = false;

				newArray.push(newObj);

				//insert the left items as recurrence playlist
				newObj = {};
				newObj = copyObject(obj);
				delete newObj.rootobjid;
				
				newObj.lastmodifytime = new Date();
				newObj.siteid 	= siteObj.siteID;
				newObj.start	= schedule._calculateNewTime(tempStart, interval, false);
				newObj.end 		= schedule._calculateNewTime(tempEnd, interval, true);;
				newObj.recurrencesetting.startdate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10)).slice(0, 10);
				newObj.recurrencesetting.enddate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10)).slice(0, 10);
				newObj.recurrencesetting.endtime 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate + ':' + newObj.recurrencesetting.endtime, delta, true).slice(11, 23);

				newArray.push(newObj);
			}
			else { //not accross
				newObj = {};
				newObj = copyObject(obj);
				delete newObj.rootobjid;
				
				newObj.lastmodifytime = new Date();
				newObj.siteid 	= siteObj.siteID;
				newObj.start	= tempStart;
				newObj.end 		= tempEnd;
				newObj.recurrencesetting.startdate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10)).slice(0, 10);
				newObj.recurrencesetting.enddate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10)).slice(0, 10);
				newObj.recurrencesetting.endtime 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate + ':' + newObj.recurrencesetting.endtime, delta, true).slice(11, 23);

				newArray.push(newObj);
			}
		}
		
		return;
	}
*/
	
	this.calculateNewPlaylist = function(obj) {
		var index 		= 0;
		var number 		= obj.src.length;
		var weekArray	= [];
		var newWeekArray= [];
		var weekIndex	= 0;
		var weekNumber	= 0;
		var delta 		= 0;
		var howManyDays	= 0;
		var newArray 	= [];
		var newObj		= {};
		
		delta = schedule._calcDelta(obj.src[0].start, obj.target.start);
console.log('obj=');
console.log(JSON.stringify(obj, '', 4));
console.log('delta=' + delta);
		
		for(index = 0; index < number; index++) {
			newObj = {};
			newObj = copyObject(obj.src[index]);
			delete newObj.rootobjid;

			newObj.schedulepath = obj.target.schedulepath;
			newObj.scheduletype = obj.target.scheduletype;
			newObj.listtype = obj.target.listtype;
			newObj.lastmodifytime = new Date();
			newObj.siteid = siteObj.siteID;
			
			if(newObj.recurrence) {
				if(newObj.recurrencesetting.recurrencetype === 'daily') {
					var delta1 = schedule._calcDelta(newObj.start.slice(0, 10), newObj.recurrencesetting.enddate);

					newObj.start	= schedule._calculateNewTime(newObj.start, delta, false);
					newObj.end 		= schedule._calculateNewTime(newObj.end, delta, true);
					
					newObj.recurrencesetting.startdate = newObj.start.slice(0, 10);
					newObj.recurrencesetting.enddate = schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta1, false).slice(0, 10);
					
					newArray.push(newObj);
console.log('newObj=');
console.log(JSON.stringify(newObj, '', 4));
				}
				else if(newObj.recurrencesetting.recurrencetype === 'weekly') {
					var delta1 = schedule._calcDelta(newObj.start.slice(0, 10), newObj.recurrencesetting.enddate);

					howManyDays = (Math.floor(schedule._calcDelta(newObj.start.slice(0, 10), schedule._calculateNewTime(newObj.start, delta, false).slice(0, 10)) / 86400000) % 7 + 7) % 7;
console.log('howManyDays=' + howManyDays);

					newObj.start	= schedule._calculateNewTime(newObj.start, delta, false);
					newObj.end 		= schedule._calculateNewTime(newObj.end, delta, true);
					newObj.recurrencesetting.startdate = newObj.start.slice(0, 10);
					newObj.recurrencesetting.enddate = schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta1, false).slice(0, 10);
					
					weekArray = newObj.recurrencesetting.weekly.split(',', 7);
					weekNumber = weekArray.length;
					for(weekIndex = 0; weekIndex < weekNumber; weekIndex++) {
						newWeekArray[weekIndex] = '0';
					}
//console.log('newWeekArray=');
//console.log(newWeekArray);
					for(weekIndex = 0; weekIndex < weekNumber; weekIndex++) {
						if(weekArray[weekIndex] === '1') {
							newWeekArray[(weekIndex + howManyDays) % 7] = '1';
						}
//console.log('newWeekArray=');
//console.log(newWeekArray);
					}
//console.log('1111newWeekArray=');
//console.log(newWeekArray);
						
					newObj.recurrencesetting.weekly = newWeekArray.join();
console.log('newObj.recurrencesetting.weekly=');
console.log(newObj.recurrencesetting.weekly);

console.log('oldObj=');
console.log(obj.src[index]);
console.log('newObj=');
console.log(newObj);
					newArray.push(newObj);
				}
				else if(newObj.recurrencesetting.recurrencetype === 'monthly') {
				

					newArray.push(newObj);
				}
				else if(newObj.recurrencesetting.recurrencetype === 'hourly') {
/*
					var newEndTime 		= '';
					var tempDateTime 	= '';
					var newTempDateTime = '';
					
					tempDateTime = newObj.recurrencesetting.startdate + ':' + newObj.recurrencesetting.endtime;
					newTempDateTime = schedule._calculateNewTime(tempDateTime, delta, true);
					
					if(newTempDateTime.slice(0, 10) !== newObj.recurrencesetting.startdate) { //move afterwards across day
						handleHourlyPlaylist(obj.src[index], delta, newArray);
					}
					else {
						newTempDateTime = schedule._calculateNewTime(newObj.start, delta, false);
						if(newTempDateTime.slice(0, 10) !== newObj.start.slice(0, 10)) { //move forwards across day
							handleHourlyPlaylist(obj.src[index], delta, newArray);
						}
						else { //normal case
							newObj.start	= schedule._calculateNewTime(newObj.start, delta, false);
							newObj.end 		= schedule._calculateNewTime(newObj.end, delta, true);
							newObj.recurrencesetting.startdate 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10);
							newObj.recurrencesetting.enddate 	= schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10);
							newObj.recurrencesetting.endtime 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate + ':' + newObj.recurrencesetting.endtime, delta, true).slice(11, 23);

							newArray.push(newObj);
						}
					}
*/
					var expandedPlaylistArray 	= [];
					var itemIndex 				= 0;
					var itemNumber 				= 0;
					var acrossPoint				= -1;
					
					schedule._expandPlaylist(obj.src[index], expandedPlaylistArray, obj.src[index].recurrencesetting.startdate, obj.src[index].recurrencesetting.enddate);
					itemNumber = expandedPlaylistArray.length;
					for(itemIndex = 0; itemIndex < itemNumber; itemIndex++) {
						expandedPlaylistArray[itemIndex].start	= schedule._calculateNewTime(expandedPlaylistArray[itemIndex].start, delta, false);
						expandedPlaylistArray[itemIndex].end 	= schedule._calculateNewTime(expandedPlaylistArray[itemIndex].end, delta, true);
						
						if((acrossPoint === -1) && (expandedPlaylistArray[itemIndex].start.slice(0, 10) !== expandedPlaylistArray[itemIndex].end.slice(0, 10))) {
							acrossPoint = itemIndex;
						}
					}
					
					if(acrossPoint === -1) { //not find across day item
						newObj.start	= schedule._calculateNewTime(newObj.start, delta, false);
						newObj.end 		= schedule._calculateNewTime(newObj.end, delta, true);
						newObj.recurrencesetting.startdate 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10);
						newObj.recurrencesetting.enddate 	= schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10);
						newObj.recurrencesetting.endtime 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate + ':' + newObj.recurrencesetting.endtime, delta, true).slice(11, 23);
						
						newArray.push(newObj);
					}
					else {
						//insert static playlist for across day playlist item
						newObj.start	= expandedPlaylistArray[acrossPoint].start;
						newObj.end 		= expandedPlaylistArray[acrossPoint].end;
						delete newObj.recurrencesetting;
						newObj.recurrence = false;
		
						newArray.push(newObj);
		
						if(acrossPoint === 0) { //the first one
							if(itemNumber > 1) {
								newObj = {};
								newObj = copyObject(obj);
								delete newObj.rootobjid;
								
								newObj.lastmodifytime = new Date();
								newObj.siteid 	= siteObj.siteID;
								newObj.start	= expandedPlaylistArray[1].start;
								newObj.end 		= expandedPlaylistArray[1].end;
								newObj.recurrencesetting.startdate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10)).slice(0, 10);
								newObj.recurrencesetting.enddate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10)).slice(0, 10);
								newObj.recurrencesetting.endtime 	= expandedPlaylistArray[itemNumber - 1].end.slice(11, 23);
				
								newArray.push(newObj);
							}
						}
						else if(acrossPoint === (itemNumber - 1)) { //the last one
							if(itemNumber > 1) {
								newObj = {};
								newObj = copyObject(obj);
								delete newObj.rootobjid;
								
								newObj.lastmodifytime = new Date();
								newObj.siteid 	= siteObj.siteID;
								newObj.start	= expandedPlaylistArray[0].start;
								newObj.end 		= expandedPlaylistArray[0].end;
								newObj.recurrencesetting.startdate 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10);
								newObj.recurrencesetting.enddate 	= schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10);
								newObj.recurrencesetting.endtime 	= expandedPlaylistArray[itemNumber - 2].end.slice(11, 23);
				
								newArray.push(newObj);
							}
						}
						else { //the middle one
							newObj = {};
							newObj = copyObject(obj);
							delete newObj.rootobjid;
							
							newObj.lastmodifytime = new Date();
							newObj.siteid 	= siteObj.siteID;
							newObj.start	= expandedPlaylistArray[0].start;
							newObj.end 		= expandedPlaylistArray[0].end;
							newObj.recurrencesetting.startdate 	= schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10);
							newObj.recurrencesetting.enddate 	= schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10);
							newObj.recurrencesetting.endtime 	= expandedPlaylistArray[acrossPoint - 1].end.slice(11, 23);
			
							newArray.push(newObj);
							
							
							newObj = {};
							newObj = copyObject(obj);
							delete newObj.rootobjid;
							
							newObj.lastmodifytime = new Date();
							newObj.siteid 	= siteObj.siteID;
							newObj.start	= expandedPlaylistArray[acrossPoint + 1].start;
							newObj.end 		= expandedPlaylistArray[acrossPoint + 1].end;
							newObj.recurrencesetting.startdate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.startdate, delta, false).slice(0, 10)).slice(0, 10);
							newObj.recurrencesetting.enddate 	= schedule._getNextDay1(schedule._calculateNewTime(newObj.recurrencesetting.enddate, delta, false).slice(0, 10)).slice(0, 10);
							newObj.recurrencesetting.endtime 	= expandedPlaylistArray[itemNumber - 1].end.slice(11, 23);
			
							newArray.push(newObj);
						}
					}
				}
			}
			else {
				newObj.start = schedule._calculateNewTime(newObj.start, delta, false);
				newObj.end = schedule._calculateNewTime(newObj.end, delta, true);
				newArray.push(newObj);
			}
		}
		
		return newArray;
	}
//
}
module.exports = PasteMove;