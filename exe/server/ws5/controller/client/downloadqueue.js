var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var util 		= require('util');
var ControllerHelper = require('./controllerhelper');

var helper 		= new ControllerHelper();
var logger 		= helper.logger;

/*download queue should like:
	filepath, 
	localpath,
	type, //schedule, playlist, widget, ...
	revision, 
	lastmodifytime, //from server or parent file
	starttime, //the time this file be used, for schedule/channel only
	receivetime, //the time this file is inserted into queue
	failuretimes,
	
	

	...

*/
function DownloadQueue(taskName) {
	this.taskname = taskName;
	this.downloadQ = null;
	this.downloadQPath = helper.fileLibPath + path.sep + 'task' + path.sep + this.taskname + helper.config.playersettings.downloadqueuesuffix; //should be under the task file path  
	
	this.getQueueFilePath = function() {
		return this.downloadQPath;
	}
	
	//load the download queue data file saved before from local disk
	this.loadDownloadQueue = function() {
		var obj 	= {};
		var stats 	= null;
		var exist 	= false;
		var data 	= '';
		
		try{
			exist = fs.existsSync(this.downloadQPath);
			if(!exist) {
				this.downloadQ = [];
				return this.downloadQ;
			}
		}
		catch(e) { return []; }
		
		try{
			stats = fs.statSync(this.downloadQPath);
		}
		catch(e) { return []; }

		if(!stats) { return []; }

		try {
			data = fs.readFileSync(this.downloadQPath, 'utf8'); //without encoding, will return buffer type data
		}
		catch(e) { return []; }
		
		
		if(!data) { 
			logger.error('Can not get download file data from --- ' + this.downloadQPath);
			return [];
		}
		
		if(data) obj = JSON.parse(data);
		if(!obj || !util.isArray(obj)) {
			logger.error('Failed to parse download queue file.');
			logger.error(data);
			return [];
  		}
	
		this.downloadQ = obj;
		
		return this.downloadQ;
	}
	
	this.isEmpty = function() {
		if(this.downloadQ && (this.downloadQ.length > 0)) {
			return false;
		}
		else {
			return true;
		}
	}
	
	//get the first element from queue
	this.getNewElement = function() {
		if(!this.downloadQ) { //not parse the download queue yet
			this.loadDownloadQueue();
		}
		
		if(this.downloadQ && (this.downloadQ.length > 0)) { return this.downloadQ[0]; }
		else { return {}; }
	}
	
	//remove the first item in queue, if the parameter is valid, append all of them to the end of queue.
	//return the top item in queue
	this.removeFileFromQueue = function(fileObjArray) {
		if(!this.downloadQ) { //not parse the download queue yet
			this.loadDownloadQueue();
		}
		
		if(!this.downloadQ || (this.downloadQ.length === 0)) { return {}; }
		else {
			this.downloadQ.shift();
		}
		
		if(fileObjArray && (fileObjArray.length > 0)) {
			this.downloadQ = this.downloadQ.concat(fileObjArray);
		}
		
		this.saveQueue();
		
		return this.getNewElement();
	}
	
	//append new file object to the end of queue
	this.appendFileToQueue = function(fileObj) {
		var now = null;
		
		if(!fileObj) { return {}; }
		if(!fileObj.filepath || !fileObj.lastmodifytime) { return {}; }
		
		
		if(!this.downloadQ) { //not parse the download queue yet
			this.loadDownloadQueue();
		}
		
/*
		var index = 0;
		var length = this.downloadQ.length;
		for(index = 0 ; index < length; index ++) {
			if((this.downloadQ[index].filepath === fileObj.filepath) && (this.downloadQ[index].lastmodifytime === fileObj.lastmodifytime)) {
				break;
			}
		}
		
		if(index >= length) {
			now = new Date();
			fileObj.receivetime = now.toISOString();
			
			this.downloadQ.push(fileObj);
			
			this.saveQueue();
		}
*/
		now = new Date();
		fileObj.receivetime = now.toISOString();
		
		this.downloadQ.push(fileObj);
		
		this.saveQueue();
	
		return this.getNewElement();
	}
	
	//check the download queue alreadt exist or not, if exist, then not need download from start.
	this.isExist = function() {
		try {
			if(fs.existsSync(this.downloadQPath)) {
				return true;
			}
			else {
				return false;
			}
		}
		catch(e) {
			return false;
		}
	}
	
	//check all items in queue are retried enough times
	this.isAllRetried = function() {
		if(!this.downloadQ || (this.downloadQ.length === 0)) { return false; }

		var i = 0;
		var queueSize = this.downloadQ.length;
		for(i = 0; i < queueSize; i++) {
			if(this.downloadQ[i].failuretimes <= helper.config.playersettings.downloadretrytimes) {
				break;
			}
		}
		
		if(i >= queueSize) {
			return true;
		}

		return false;
	}
	
	//check all items in queue are retried enough times
	this.clearRetrytimes = function() {
		if(!this.downloadQ) { //not parse the download queue yet
			this.loadDownloadQueue();
		}
		
		if(!this.downloadQ || (this.downloadQ.length === 0)) { return; }

		var i = 0;
		var queueSize = this.downloadQ.length;
		for(i = 0; i < queueSize; i++) { //clear retrytimes
			this.downloadQ[i].failuretimes = 0;
		}
			
		this.saveQueue();
		
		return;
	}
	
	//check the download queue size
	this.size = function() {
		return this.downloadQ.length;
	}
	
	//inernal function.
	//save queue data into local file
	this.saveQueue = function() {
		helper.writeDataFile(this.downloadQPath, this.downloadQ);
	}
	
	
};
module.exports = DownloadQueue;




