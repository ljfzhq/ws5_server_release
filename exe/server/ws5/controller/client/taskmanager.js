var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var util 		= require('util');
var ControllerHelper = require('./controllerhelper');

var helper 		= new ControllerHelper();
var logger 		= helper.logger;

/*task object should like:
	taskid, //the publish task id (for publish schedule/channel), media id (for preview) in server DB
	tasktype, //publish schedule/channel, preview, preload
	revision, //for schedule and channel
	initialpath,
	lmt,
	starttime, //only for schedule/channel, will "0" for other types
	endtime, //only for schedule/channel, will "0" for other types
	receivetime, 
	...

*/
function TaskManager() {
	this.taskList = [];
	this.that = this;
	
	//for easy to sort task add prefix to task type
	var appendTypeCode = function(typeString) {
		var newType = '';
		
		if(!typeString) { return typeString; }
		
		if(typeString === 'reset') 			{ newType	= '02reset'; }
		else if(typeString === 'reject') 	{ newType	= '10reject'; }
		else if(typeString === 'uc') 		{ newType	= '20uc'; }
		else if(typeString === 'preview') 	{ newType 	= '30preview'; }
		else if(typeString === 'preload')   { newType 	= '40preload'; }
		else if(typeString === 'channel') 	{ newType 	= '50channel'; }
		else if(typeString === 'schedule') 	{ newType 	= '60schedule'; }
		else if(typeString === 'upgrade') 	{ newType 	= '70upgrade'; }
		else { newType = typeString; }

		return newType;
	}
	
	//read local task list file, parse the content to JSON object, sort the task list by priority
	this.loadTaskList = function() {
		var obj 	= {};
		var stats 	= null;
		var data 	= '';
		var exist 	= false;
		
		try{
			exist = fs.existsSync(helper.tasklistpath);
			if(!exist) {
				this.taskList = [];
				return this.taskList;
			}
		}
		catch(e) { return []; }
		
		try{
			stats = fs.statSync(helper.tasklistpath);
		}
		catch(e) { return []; }

		if(!stats) { return []; }

		try {
			data = fs.readFileSync(helper.tasklistpath, 'utf8'); //without encoding, will return buffer type data
		}
		catch(e) { return []; }
		
		
		if(!data) { 
			logger.error('Can not get tasklist file from --- ' + helper.tasklistpath);
			return [];
		}
		
		if(data) obj = JSON.parse(data);
		if(!obj || !util.isArray(obj)) {
			logger.error('Failed to parse tasklist file.');
			logger.error(data);
			return [];
  		}
	
		for(var i = 0; i < obj.length; i++) {
			obj[i].tasktype = appendTypeCode(obj[i].tasktype);
		}
		
		this.taskList = obj;
		this.sortTaskList();
		
		return this.taskList;
	}
	
	//sort task in task list by task type and task time.
	this.sortTaskList = function() {
		this.taskList.sort(function(a, b) {
			if(a.tasktype === b.tasktype) {
				if((a.tasktype === '60schedule') || (a.tasktype === '50channel')) { //first deal with the earlier started schedule/channel
					if(a.starttime > b.starttime) return 1;
					else if(a.starttime < b.starttime) return -1;
					else return 0;
				}
				else { //for other types, process according to receive time.
					if(a.recievetime > b.recievetime) return 1;
					else if(a.recievetime < b.recievetime) return -1;
					else return 0;
				}
			}	
			else {
				if(a.tasktype > b.tasktype) return 1;
				else if(a.tasktype < b.tasktype) return -1;
				else return 0;
			}	
		});
	}
	
	//need send this time to server when heartbeat
	this.getNewestTaskTime = function() {
		var datetime = '0000';
		
		if(!this.taskList) { //not parse the tasklist yet
			this.loadTaskList();
		}
		
		if(!this.taskList || (this.taskList.length === 0)) { return ''; }
		
		for(var i = 0 ; i < this.taskList.length; i++) {
			if(this.taskList[i].lmt > datetime) {
				datetime = this.taskList[i].lmt;
			}
		}
		
		return datetime;
	}
	
	//if this.taskList === null, call loadTaskList, then return the highest priority task object;
	//if task list is empty, return empty object.
	//if task list is not empty, return the highest priority task object.
	this.getNewTask = function() {
		var index = 0;
		var size = 0;
		var now = new Date();
		
		if(!this.taskList) { //not parse the tasklist yet
			this.loadTaskList();
		}
		
//console.log('will get new task:');
//console.log(this.taskList[0]);
//console.log('total task in list is:');
//console.log(JSON.stringify(this.taskList, '', 4));
		if(!this.taskList || (this.taskList.length === 0)) { return {}; }
		else {
			size = this.taskList.length;
			
			for(index = 0; index < size; index++) {//get new task first
				if(!this.taskList[index].downloadTime) {
					break;
				}
			}
			
			if(index >= size) { //al task are failed task need to retry.
				for(index = 0; index < size; index++) {
					if(!this.taskList[index].downloadTime) {
						break;
					}
					else {
						var downloadTime = new Date(this.taskList[index].downloadTime);
						if(this.taskList[index].downloadTime && (downloadTime < now)) {
							break;
						}
					}
				}
				
				if(index >= size) {
					return {}; //no availabel task
				}
				else {
					return this.taskList[index]; 
				}
			}
			else {
				return this.taskList[index]; 
			}
		}
	}	
	
	//remove the matched task from task list for reject schedule.channel ONLY.
	this.removeTask = function(taskObj) {
		//load the list everytime when update the list to avoid multiple process modify it the same time to lost some data
		this.loadTaskList();

		
		if(!this.taskList || (this.taskList.length === 0)) { return; }
		else {
			for(var i = 0; i < this.taskList.length; i++) {
				if((this.taskList[i].taskid === taskObj.taskid) && (this.taskList[i].tasktype === taskObj.tasktype) && 
					(this.taskList[i].starttime === taskObj.starttime) && (this.taskList[i].endtime === taskObj.endtime)) {
//console.log('will remove this task:');
//console.log(this.taskList[i]);
					this.taskList.splice(i, 1);
					break;
				}
			}
		}
		
		this.saveTaskList();
		
		return;
	}
	
	//set the next download time for some items in this task had not been finished, need to retry the next time when the time is coming
	this.setTaskDownloadTime = function(taskID, taskType, newTime) {
//console.log('set download time for the next time to ');
//console.log(newTime);
		//load the list everytime when update the list to avoid multiple process modify it the same time to lost some data
		this.loadTaskList();
		
		if((!this.taskList || (this.taskList.length === 0)) || !taskType) { return; }

		for(var i = 0; i < this.taskList.length; i++) {
			if((this.taskList[i].taskid === taskID) && (this.taskList[i].tasktype === taskType)) {
				this.taskList[i].downloadTime = newTime;
				break;
			}
		}
		
		this.saveTaskList();
		return;
	}

	//get the period for next download
	this.getTaskDownloadTime = function(taskID, taskType) {
		//load the list everytime when update the list to avoid multiple process modify it the same time to lost some data
		this.loadTaskList();
		
		if((!this.taskList || (this.taskList.length === 0)) || !taskType) { return 0; }

		var taskNumber = 0;
		var i = 0;
		
		taskNumber = this.taskList.length;
		for(i = 0; i < taskNumber; i++) {
			if((this.taskList[i].taskid === taskID) && (this.taskList[i].tasktype === taskType)) {
				break;
			}
		}
		
		if(i < taskNumber) {
			return this.taskList[i].downloadTime;
		}
		
		return 0;
	}
	
	//remove the matched task from task list for it is finished.
	//return next task if have.
	this.updateFinishedTask = function(taskID, taskType) {
		//load the list everytime when update the list to avoid multiple process modify it the same time to lost some data
		this.loadTaskList();
		
		if((!this.taskList || (this.taskList.length === 0)) || !taskType) { return {}; }
		else {
			for(var i = 0; i < this.taskList.length; i++) {
				if((this.taskList[i].taskid === taskID) && (this.taskList[i].tasktype === taskType)) {
					this.taskList.splice(i, 1);
					break;
				}
			}
		}
		
		this.saveTaskList();
		
		if(this.taskList.length !== 0) { return this.taskList[0]; }
		else { return {}; }
	}
	
	//check the task exist in task list or not
	this.isExist = function (taskObj) {
		//load the list everytime when update the list to avoid multiple process modify it the same time to lost some data
		this.loadTaskList();
		
		var taskNumber = this.taskList.length;
		var i = 0;
		for(i = 0; i < taskNumber; i++) {
			if((this.taskList[i].taskid === taskObj.taskid) && (this.taskList[i].tasktype === taskObj.tasktype) && 
				(this.taskList[i].starttime === taskObj.starttime) && (this.taskList[i].endtime === taskObj.endtime)) {
				break;
			}
		}
		
		if(i >= taskNumber) {
			return false;
		}
		else {
			return true;
		}
		
	}
	
	//add new gotten task into task list, write new data into file.
	//return the highest task Obj
	this.insertNewTask = function(taskObj) {
		var now = null;
		
		if(!taskObj) { return {}; }
		if(!taskObj.taskid || !taskObj.tasktype || !taskObj.lmt) { return {}; }
		
		//load the list everytime when update the list to avoid multiple process modify it the same time to lost some data
		this.loadTaskList();

//console.log('will insert new task:');
//console.log(taskObj);
		taskObj.tasktype = appendTypeCode(taskObj.tasktype);
		now = new Date();
		taskObj.receivetime = now.toISOString();
		
		if(!taskObj.revision) { taskObj.revision = 0; }
		
		if(this.isExist(taskObj)) {
			return this.getNewTask();
		}
		
		this.taskList.push(taskObj);
		this.sortTaskList();
		
		this.saveTaskList();
		
//console.log('total task in list after insert is:');
//console.log(JSON.stringify(this.taskList, '', 4));
		return this.getNewTask();
	}
	
	//write task list to local file
	this.saveTaskList = function() {
		helper.writeDataFile(helper.tasklistpath, this.taskList);
	}
	
	this.getTaskNumber = function(){
		var r = 0;
		if(this.taskList) r = this.taskList.length;
		//logger.error('getTaskNumber return %d', r);
		return r;		
	}
	
	//for multiple process testing
	this.getCounter = function() {
		return count;
	}
	this.incCounter = function() {
		count++;
	}
	this.printCounter = function() {
		console.log('current count is: ' + count);
	}
};
module.exports = TaskManager;




