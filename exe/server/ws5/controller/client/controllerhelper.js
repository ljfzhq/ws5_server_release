/*
 * Build basic information of WS5 Controller
 */
var os 			= require('os');
var fs 			= require('fs');
var hfs 		= require('hfs');
var util 		= require('util');
var path 		= require('path');
var http 		= require('http');
var querystring = require('querystring');
var url 		= require('url');
var childProcess = require('child_process');
var needle 		= require("needle");
//var AdmZip		= require('adm-zip');
var consDef		= require('../../../utils/constant');
var ControllerConfig= require('../../../models/config');
var ControllerCmd 	= require('./command');

var controllerCmd 	= new ControllerCmd();
var controllerConfig = new ControllerConfig();

var version		= '1.0';

function ControllerHelper() {
	this.retval 	= consDef.returnvalue;
	this.WS5Path 	= process.env.WS5 || __dirname;
	this.configPath = this.WS5Path + path.sep + 'config' + path.sep + 'controller.json';
	this.serverPath = this.WS5Path + path.sep + 'exe' + path.sep + 'server' + path.sep;
	this.renderPath = this.WS5Path + path.sep + 'exe' + path.sep + 'render' + path.sep;
	this.updating 	= false;
	
	try {
		this.config 	= require(this.configPath);
	}	
	catch(e) {
		console.log('exception when include controller config.');
		console.log(e);
		this.config = null;
	}
	
	
/*	
	if(!this.config) {
		try {	
			var tempConfigFilePath = path.dirname(this.configPath) + path.sep + 'last_' + path.basename(this.configPath);
			
			if(fs.existsSync(tempConfigFilePath)) {
				console.log('last controller config exist, try to load it.');
				this.config 	= require(tempConfigFilePath);
				fs.unlinkSync(this.configPath);
				fs.renameSync(tempConfigFilePath, this.configPath);
			}
			else {
				console.log('last controller config does not exist, try to load backup file.');
				tempConfigFilePath = path.dirname(this.configPath) + path.sep + 'controller_backup.json';
				this.config 	= require(tempConfigFilePath);
				fs.unlinkSync(this.configPath);
				fs.renameSync(tempConfigFilePath, this.configPath);
			}
		}
		catch(e) {
			console.log('exception when include temp controller config.');
			console.log(e);
			this.config = null;
		}
	}
*/
	
	//log
	this.logPath = this.WS5Path + path.sep + 'log' + path.sep + 'controller';			//controller log folder
	
	//path
	this.fileLibPath 	= this.config && this.config.filelibrary ? this.config.filelibrary.path || '' : '';
	if(this.fileLibPath) {
		this.fileLibPath = this.fileLibPath + path.sep + 'download';
	}
	this.tmpPath 		= this.fileLibPath + path.sep + 'tmp';
	this.tasklistpath 	= this.fileLibPath + path.sep + 'task' + path.sep + 'tasklist.json';
	
//	this.config = this.loadConfig();
	
/*
	this.logger = require('tracer').console({root : this.logPath, 
												logPathFormat : '{{root}}/' + this.config.logsettings.logfilename + '{{date}}.log', 
												dateformat : "yyyy-mm-dd HH:MM:ss.lZ",
												level: this.config.logsettings.loglevel});
*/
	if(this.config && this.config.logsettings && this.config.logsettings.filename && this.config.logsettings.loglevel) {
		hfs.mkdirSync(this.logPath);
		this.logger = require('tracer').dailyfile({root : this.logPath,
												logPathFormat : '{{root}}/' + this.config.logsettings.filename + '{{date}}.log', 
												dateformat : "yyyy-mm-dd HH:MM:ss.lZ",
												level: this.config.logsettings.loglevel});
	}

	var that = this;
	controllerConfig.get('controller', function(err, configObj) {
		var updateConfig2DB = function() {
			var newConfigObj = {};
			var DynamicConfigObj = {};
			
			//keep static config save to config file
			newConfigObj.playersettings = {};
			newConfigObj.playersettings.server 				= that.config.playersettings.server;
			newConfigObj.playersettings.pptAppPath 			= that.config.playersettings.pptAppPath;
			newConfigObj.playersettings.minimumfreespace 	= that.config.playersettings.minimumfreespace;
			newConfigObj.playersettings.widgetfilelist 		= that.config.playersettings.widgetfilelist;
			newConfigObj.playersettings.revisionprefix 		= that.config.playersettings.revisionprefix;
			newConfigObj.playersettings.revisionsuffix 		= that.config.playersettings.revisionsuffix;
			newConfigObj.playersettings.mediascope 			= that.config.playersettings.mediascope;
			newConfigObj.playersettings.scheduleparsescope 	= that.config.playersettings.scheduleparsescope;
			newConfigObj.playersettings.defaultinterval 	= that.config.playersettings.defaultinterval;
			newConfigObj.playersettings.renderhbinterval 	= that.config.playersettings.renderhbinterval;
			newConfigObj.playersettings.defaulthbinterval 	= that.config.playersettings.defaulthbinterval;
			newConfigObj.playersettings.rangeinterval 		= that.config.playersettings.rangeinterval;
			newConfigObj.playersettings.rangefailbaseinterval = that.config.playersettings.rangefailbaseinterval;
			newConfigObj.playersettings.rangesize 			= that.config.playersettings.rangesize;
			newConfigObj.playersettings.downloadqueuesuffix = that.config.playersettings.downloadqueuesuffix;
			newConfigObj.playersettings.retrytimes 			= that.config.playersettings.retrytimes;
			newConfigObj.playersettings.downloadtimeout 	= that.config.playersettings.downloadtimeout;
			newConfigObj.playersettings.downloadretrytimes 	= that.config.playersettings.downloadretrytimes;
			newConfigObj.playersettings.abnormalinterval 	= that.config.playersettings.abnormalinterval;
			newConfigObj.playersettings.maxsynctimedelay 	= that.config.playersettings.maxsynctimedelay;
			newConfigObj.playersettings.maxtimedifference 	= that.config.playersettings.maxtimedifference;
			newConfigObj.playersettings.version 			= that.config.playersettings.version;
			newConfigObj.logsettings = that.config.logsettings;
			newConfigObj.filelibrary = that.config.filelibrary;
			
			DynamicConfigObj = that.clone(that.config.playersettings);
			delete DynamicConfigObj.server;
			delete DynamicConfigObj.pptAppPath;
			delete DynamicConfigObj.minimumfreespace;
			delete DynamicConfigObj.widgetfilelist;
			delete DynamicConfigObj.revisionprefix;
			delete DynamicConfigObj.revisionsuffix;
			delete DynamicConfigObj.mediascope;
			delete DynamicConfigObj.scheduleparsescope;
			delete DynamicConfigObj.defaultinterval;
			delete DynamicConfigObj.renderhbinterval;
			delete DynamicConfigObj.defaulthbinterval;
			delete DynamicConfigObj.rangeinterval;
			delete DynamicConfigObj.rangefailbaseinterval;
			delete DynamicConfigObj.rangesize;
			delete DynamicConfigObj.downloadqueuesuffix;
			delete DynamicConfigObj.retrytimes;
			delete DynamicConfigObj.downloadtimeout;
			delete DynamicConfigObj.downloadretrytimes;
			delete DynamicConfigObj.abnormalinterval;
			delete DynamicConfigObj.maxsynctimedelay;
			delete DynamicConfigObj.maxtimedifference;
			//delete DynamicConfigObj.version;  //keep version option to avoid 4 returned from controllerConfig.update method 2017.1.19 Jeff
			
			//get dynamic config save to db.
			controllerConfig.update(DynamicConfigObj, 'controller', function(err) {
				if(err) {
					output(that, 'can not update controller config data to db.');
				}
				
				writeConfigFile(that, newConfigObj, function(err) {
					that.updating 	= false;					
				});
			});
		}
		
		if(err) {
			if(err === 5) { //not exist config record, will create one.
				if(that.config) {
					that.updating 	= true;					
					updateConfig2DB();
				}
				else {
					output(that, 'can not get controller config data from file1.');
				}
			}
			else {
				output(that, 'get controller config from server failed. ' + err);
				return;
			}
		}
		else { //to avoid config data in db is wrong when upgrade old version onto new version then register player and  then upgrade new version back 
			if(that.config && that.config.playersettings && 
				(that.config.playersettings.serverurl || that.config.playersettings.playerid || that.config.playersettings.siteid || 
				 that.config.playersettings.playername || that.config.playersettings.playerpwd || that.config.playersettings.uuid)) {

				that.updating 	= true;					

				if((that.config.playersettings.serverurl && (that.config.playersettings.serverurl !== configObj.serverurl)) ||
				 (that.config.playersettings.playerid && (that.config.playersettings.playerid !== configObj.playerid)) ||
				 (that.config.playersettings.siteid && (that.config.playersettings.siteid !== configObj.siteid)) ||
				 (that.config.playersettings.playername && (that.config.playersettings.playername !== configObj.playername)) ||
				 (that.config.playersettings.playerpwd && (that.config.playersettings.playerpwd !== configObj.playerpwd)) ||
				 (that.config.playersettings.uuid && (that.config.playersettings.uuid !== configObj.uuid))){
					output(that, 'both db and config file contains player dynamic information, but they are different. Flush config file information to DB.');
					output(that, 'config file info is:');
					output(that, JSON.stringify(that.config.playersettings, '', 4));
					output(that, 'db info is:');
					output(that, JSON.stringify(configObj, '', 4));
					updateConfig2DB();
				}
				else {
					output(that, 'both db and config file contains player dynamic information, but their player register information are the same, will remove those dynamic info from config file.');
					output(that, 'config file info is:');
					output(that, JSON.stringify(that.config.playersettings, '', 4));

					var newConfigObj = {};
					//keep static config save to config file
					newConfigObj.playersettings = {};
					newConfigObj.playersettings.server 				= that.config.playersettings.server;
					newConfigObj.playersettings.pptAppPath 			= that.config.playersettings.pptAppPath;
					newConfigObj.playersettings.minimumfreespace 	= that.config.playersettings.minimumfreespace;
					newConfigObj.playersettings.widgetfilelist 		= that.config.playersettings.widgetfilelist;
					newConfigObj.playersettings.revisionprefix 		= that.config.playersettings.revisionprefix;
					newConfigObj.playersettings.revisionsuffix 		= that.config.playersettings.revisionsuffix;
					newConfigObj.playersettings.mediascope 			= that.config.playersettings.mediascope;
					newConfigObj.playersettings.scheduleparsescope 	= that.config.playersettings.scheduleparsescope;
					newConfigObj.playersettings.defaultinterval 	= that.config.playersettings.defaultinterval;
					newConfigObj.playersettings.renderhbinterval 	= that.config.playersettings.renderhbinterval;
					newConfigObj.playersettings.defaulthbinterval 	= that.config.playersettings.defaulthbinterval;
					newConfigObj.playersettings.rangeinterval 		= that.config.playersettings.rangeinterval;
					newConfigObj.playersettings.rangefailbaseinterval = that.config.playersettings.rangefailbaseinterval;
					newConfigObj.playersettings.rangesize 			= that.config.playersettings.rangesize;
					newConfigObj.playersettings.downloadqueuesuffix = that.config.playersettings.downloadqueuesuffix;
					newConfigObj.playersettings.retrytimes 			= that.config.playersettings.retrytimes;
					newConfigObj.playersettings.downloadtimeout 	= that.config.playersettings.downloadtimeout;
					newConfigObj.playersettings.downloadretrytimes 	= that.config.playersettings.downloadretrytimes;
					newConfigObj.playersettings.abnormalinterval 	= that.config.playersettings.abnormalinterval;
					newConfigObj.playersettings.maxsynctimedelay 	= that.config.playersettings.maxsynctimedelay;
					newConfigObj.playersettings.maxtimedifference 	= that.config.playersettings.maxtimedifference;
					newConfigObj.playersettings.version 			= that.config.playersettings.version;
					newConfigObj.logsettings = that.config.logsettings;
					newConfigObj.filelibrary = that.config.filelibrary;
					
					writeConfigFile(that, newConfigObj, function(err) {
						that.updating 	= false;					
					});
				}
			}
		}
	});	

/*	
	this.loadConfig = function loadConfig(forceLoad) {
		var obj = {};
		var lastConfigFilePath = '';

		lastConfigFilePath = path.dirname(this.configPath) + path.sep + 'last_' + path.basename(this.configPath);
		obj = internalLoadConfig(this, this.configPath, true);
		if(!obj || !obj.playersettings) {
			output(this, 'error occurs when read config file.');
			output(this, 'will switch to last config file.');
			
			obj = internalLoadConfig(this, lastConfigFilePath, true);
			if(obj && obj.playersettings) { output(this, 'last config file is good.'); }
		}
		
		if(obj && obj.playersettings) {
			obj.playersettings.version = version;
		}
		
		return obj;
	}
	
	var internalLoadConfig = function(that, configFilePath, forceLoad) {
		var obj = {};
		var data = '';
		
		if(!that || !configFilePath) { return {}; }
		
		try{
			stats = fs.statSync(configFilePath);
		}
		catch(e) { 
			output(that, 'exception occurs when check config file. ' + configFilePath);
			output(that, e);
			
			return null; 
		}

		if(!stats) {
			output(that, 'config file does not exist.');
			return null; 
		}

//the file time only accurate to second, not ms. it has problem when check file is changed or not.

//		if(!global.lastCCMT || (stats.mtime.toISOString() !== global.lastCCMT.toISOString())) {
		if(forceLoad || !that || !that.config || !that.config.playersettings || !that.config.playersettings.lastmodifytime || 
			(that.config.playersettings.lastmodifytime !== stats.mtime.toISOString())) {
//			output(that, 'Player Controller configuration file changed, need to reload it.' + '  last modify time=' + that.config.playersettings.lastmodifytime);  			
//console.log('the config object is NOT fresh, need to reload.');  			
//console.log(that.config.playersettings.lastmodifytime);  			
//console.log(stats.mtime.toISOString());  			
			try {
				data = fs.readFileSync(configFilePath, 'utf8'); //without encoding, will return buffer type data
			}
			catch(e) {
				output(that, 'exception occurs when read config file. ');
				output(that, e);
				return null; 
			}

			if(!data) { 
				output(that, 'Can not get configuration file from --- ' + configFilePath);
				return null;
			}
			
			try {
				obj = JSON.parse(data);
			}
			catch(e) {
				output(that, 'parse config file ' + configFilePath + ' cause problem.');
				output(that, e);
				return null;
			}
			
			if(!obj || !obj.playersettings) {
				output(that, 'Failed to parse config file.');
				output(that, data);
				
				return null;
	  		}
	
//			global.lastCCMT = stats.mtime;
			obj.playersettings.lastmodifytime = stats.mtime.toISOString();	
			that.config 	= obj; 		
			
			//path
			that.fileLibPath= that.config.filelibrary.path || '';
			if(that.fileLibPath) {
				that.fileLibPath = that.fileLibPath + path.sep + 'download';
			}
			that.tmpPath 	= that.fileLibPath + path.sep + 'tmp';
	
  			return obj;
  		}
  		else {
//console.log('the config object is fresh, not need to reload.');  			
//console.log(that.config.playersettings.lastmodifytime);  			
//console.log(stats.mtime.toISOString());  			
	  		return that.config;
  		}
	};
*/

	this.writeConfigSync = function(configObj) {
		var lastConfigFilePath 	= '';
		var stats 				= null;
		var needRename	 		= false; //to avoid rename an empty file to backup file. --- config file may write to empty when system crashed.
		if(this.logger) this.logger.debug('write config file Sync.');
		
		lastConfigFilePath = path.dirname(this.configPath) + path.sep + 'last_' + path.basename(this.configPath);
		if(configObj && configObj.playersettings && configObj.logsettings) {
			try {
				stats = fs.statSync(this.configPath);
			}
			catch(e) {
				if(this.logger) this.logger.error('error occurs when get config file status.')
				needRename = false;
			}
			
			var obj = null;
			if(stats) {
				obj = this.getDataObj(this.configPath);
				if(obj && obj.playersettings) {
					needRename = true;
				}
			}
			
			if(needRename) {
				try {
					if(fs.existsSync(lastConfigFilePath)) fs.unlinkSync(lastConfigFilePath);
				}
				catch(e) {
					if(this.logger) this.logger.error('error occurs when delete last configuration file.');
					if(this.logger) this.logger.error(e);
				}
	
				try {
					fs.renameSync(this.configPath, lastConfigFilePath);
				}
				catch(e) {
					if(this.logger) this.logger.error('error occurs when rename current configuration file to last.');
					if(this.logger) this.logger.error(e);
				}
	
			}
			else {
				if(this.logger) this.logger.error('config file has problem, not need rename it to backup file');
				if(this.logger) this.logger.error(JSON.stringify(configObj, '', 4));
			}
			
			try {
				this.writeDataFile(this.configPath, configObj);
			}
			catch(e) {
				if(this.logger) this.logger.error('error occurs when write configuration file.');
				if(this.logger) this.logger.error(e);
			}
		}
	}
	
	var output = function(that, errorString) {
		if(that.logger) { 
			that.logger.error(errorString);
		}
		else {
			console.log(errorString);
		}
	}
		
	var writeConfigFile = function(that, configObj, cb) {
		var lastConfigFilePath 	= '';
		var needRename	 		= false; //to avoid rename an empty file to backup file. --- config file may write to empty when system crashed.
		var obj 				= null;
		
		that.logger.debug('write config file.');
		lastConfigFilePath = path.dirname(that.configPath) + path.sep + 'last_' + path.basename(that.configPath);
		if(configObj && configObj.playersettings && configObj.logsettings) {
			fs.stat(that.configPath, function(err, stats) {

				if(err || (stats.size < 100)) {
					that.logger.error('err=' + err);
					that.logger.error(stats);
					needRename = false;
				}
				else {
					obj = that.getDataObj(that.configPath);
					if(obj && obj.playersettings) {
						needRename = true;
					}
				}
				
				if(needRename) {
					fs.unlink(lastConfigFilePath, function(err) {
						if(err && err.errno != 34) { 
							that.logger.error('fail to delete the last configuration file when write new configuration file.'); 
							that.logger.error(err);
						}
						
						fs.rename(that.configPath, lastConfigFilePath, function(err) {
							if(err/* && err.errno != 34*/) { 
								that.logger.error('fail to rename current configuration file to the last configuration file when write new configuration file.'); 
								that.logger.error(err);
							}
							
							that.writeContent2File(that.configPath, 'w', JSON.stringify(configObj, null, 4), function(err) {
								return cb(err);
							});		
						});
					});
				}
				else {
					that.logger.error('config file has problem, not need rename it to backup file');
					that.logger.error(JSON.stringify(configObj, '', 4));
					that.writeContent2File(that.configPath, 'w', JSON.stringify(configObj, null, 4), function(err) {
						return cb(err);
					});		
				}	
			});
		}
	}

	this.loadDynamicConfig = function loadDynamicConfig(callback) {
		var that = this;
		if(that.updating) {
			return callback(4, null);
		}
		else {
			controllerConfig.get('controller', function(err, configObj) {
				if(err) {
					output(that, 'can not get controller config data from file2.');
					return callback(err, null);
				}
				else {
					return callback(0, configObj);
				}
			});	
		}
	}
	
	this.writeDynamicConfig = function writeDynamicConfig(configObj, callback) {
		var that = this;
		controllerConfig.update(configObj, 'controller', function(err) {
			if(err) {
				output(that, 'fail to write controller config data to db.');
			}
			
			return callback(err);
		});	
	}
	
	//this method is used to ask the render sending HB to the controller ASAP
	this.invokeRenderHB = function invokeRenderHB()
	{
		if(os.platform() === 'win32') 
		{
			var wsctrlexe = this.serverPath + 'addon' + path.sep + 'command' + path.sep + 'ws5Ctrl.exe';
			fs.exists(wsctrlexe, function(exists){
				if(exists)
				{
					var commandLine = wsctrlexe + ' /invokeHB';
					//if(this.logger) this.logger.error('ask the render sending HB!');
					//else console.log('ask the render sending HB! ' + commandLine);
					childProcess.exec(commandLine, function (error, stdout, stderr) {						
					});
				}
			});
		}
	}

	this.cleanuplog = function cleanuplog() {
		var now 			= new Date();
		var old 			= new Date(now);
		var dateString 		= '';
		var logFileString 	= '';
		var tempFilePath 	= '';
		var that 			= this;
		var controllerLogPath = '';
		
		var pad = function (val, len) {
			var strVal = String(val);
			var nLen = len || 2;
			while (strVal.length < nLen) {
				strVal = '0' + strVal;
			}
			
			return strVal;
		}
		
		old.setSeconds(old.getSeconds() - this.config.logsettings.keep * 86400);
		
		dateString 		= old.getFullYear() + pad(old.getMonth() + 1) + pad(old.getDate()); //format date to YYYYMMDD style.
		logFileString 	= this.config.logsettings.filename + dateString + '.log';
	
		controllerLogPath = this.logPath;
		fs.exists(controllerLogPath, function(exists) {
	        if(exists === false) {
	    	    return;
	    	}
	    	 
	    	//get all of the files under log folder, compare the file name, it is older than logFileStrng, then remove it.  	
	    	fs.readdir(controllerLogPath, function(err, files) {
				var i = 0;
	
	    		if(err){
	    			return;
	    		}
	    		
	    		for(i = 0 ; i < files.length; i++) {
	    			if(files[i] <= logFileString) {
						tempFilePath = controllerLogPath + path.sep + files[i];
						fs.unlink(tempFilePath, function(err) {
							//do nothing
						});    				
	    			}
	    		}
	    	}); 	
	    });
	}
	
	this.checkAcceptable = function(req) {
		var acceptable = false;
//		return true;
		
		if(req && req.headers && req.headers.origin) {
			if(req.headers.origin.slice(0, 5) === 'file:') {
//console.log('access by file://');
				acceptable = true;
			}
			else if(req.headers.referer) {
				if(req.headers.referer.slice(req.headers.origin.length) === '/render/ws5.html') {
					acceptable = true;
//console.log('access from render/ws5.html');
				}
			}
		}
		
		return acceptable;
	}
		


	this.isArray = function(obj) {
		return Object.prototype.toString.apply(obj) === '[object Array]';
	}
	
	this.clone = function(srcObj) {
		var cloneObj = {};
	
		if(!srcObj) return null;
		if(typeof srcObj !== 'object') {
			return srcObj;
		}
		
		for(var key in srcObj) {
			if(srcObj[key] && this.isArray(srcObj[key])) {
				cloneObj[key] = [];
				for(var i = 0; i < srcObj[key].length; i++) {
					cloneObj[key].push(this.clone(srcObj[key][i]));
				}					
			}
            else if(srcObj[key] && (typeof(srcObj[key]) === 'object'))
            { 
            	cloneObj[key] = this.clone(srcObj[key]);
            }
            else
            {
                cloneObj[key] = srcObj[key];
            }
		}
		
		return cloneObj;
	}
			
	this.getZIPMediaType = function(mediaPath, mediaHTTPPath) {
		var retObj = {};
		var fileName = '';
		var fullFileName = '';
		
		fullFileName = path.basename(mediaPath);
		fileName = path.basename(mediaPath, '.zip');
		if(fileName) {
			entryFileExtName = path.extname(fileName);
			if(entryFileExtName) {
				retObj.path = path.dirname(mediaPath) + path.sep + '.' + fullFileName + '.zipfiles' + path.sep + fileName;									
				retObj.httppath = path.dirname(mediaHTTPPath) + '/.' + fullFileName + '.zipfiles/' + fileName;									
//console.log('httppath=' + retObj.httppath);
//console.log('path=' + retObj.path);
				
				if((entryFileExtName === '.exe') || (entryFileExtName === '.bat')) {
					retObj.type = "app";									
				}
				else if((entryFileExtName === '.doc') || (entryFileExtName === '.docx') || (entryFileExtName === '.dot') || 
					(entryFileExtName === '.rtf') || (entryFileExtName === '.wpd') || (entryFileExtName === '.wps')) {
					retObj.type = "doc";									
				}
				else if((entryFileExtName === '.ppt') || (entryFileExtName === '.pptx') || (entryFileExtName === '.pps') || (entryFileExtName === '.ppsx')) {
					retObj.type = "ppt";									
				}
				else if((entryFileExtName === '.pdf')) {
					retObj.type = "pdf";									
				}
				else if((entryFileExtName === '.swf')) {
					retObj.type = "flash";									
				}
				else if((entryFileExtName === '.html') || (entryFileExtName === '.htm') || (entryFileExtName === '.shtml') ||
				 	(entryFileExtName === '.asp') || (entryFileExtName === '.php') || (entryFileExtName === '.shtm') || 
				 	(entryFileExtName === '.cgi') || (entryFileExtName === '.jsp')) {
					retObj.type = "html";									
				}
				else if((entryFileExtName === '.gif') || (entryFileExtName === '.jpeg') || (entryFileExtName === '.jpg') || 
					(entryFileExtName === '.tif') || (entryFileExtName === '.jpe') || 
					(entryFileExtName === '.bmp') || (entryFileExtName === '.tiff') || (entryFileExtName === '.png')) {
					retObj.type = "image";									
				}
				else if((entryFileExtName === '.avi') || (entryFileExtName === '.mp4') || (entryFileExtName === '.mp3') || 
					(entryFileExtName === '.ts') || (entryFileExtName === '.mkv') || (entryFileExtName === '.flv') || 
					(entryFileExtName === '.mpeg') || (entryFileExtName === '.webm') || (entryFileExtName === '.fla') ||
					(entryFileExtName === '.mpg') || (entryFileExtName === '.mpe') || (entryFileExtName === '.rm') || (entryFileExtName === '.asf') ||
					(entryFileExtName === '.wmv') || (entryFileExtName === '.mov') || (entryFileExtName === '.3gb')) {
					retObj.type = "video";									
				}
			}
		}

		return retObj;		
	}

	this.getIP = function getIP() {
		var networkObj = {};
		var interfaceObj = null;
		
		networkObj 	= os.networkInterfaces();
		
		for(var i in networkObj) {
			if(i.indexOf('Pseudo-Interface') === -1) {
				if(util.isArray(networkObj[i])) {
					interfaceObj = null;
					interfaceObj = networkObj[i];
					
					for(var j = 0, l = interfaceObj.length; j < l; j++) {
						if(!interfaceObj[j].internal && (interfaceObj[j].family === 'IPv4')) {
							return interfaceObj[j].address;
						}
					}
				}
			}
		}
		
		return '';
	}
/*	
	this.getTimezoneName = function () {
	    tmSummer = new Date(Date.UTC(2005, 6, 30, 0, 0, 0, 0));
	    so = -1 * tmSummer.getTimezoneOffset();
	    tmWinter = new Date(Date.UTC(2005, 12, 30, 0, 0, 0, 0));
	    wo = -1 * tmWinter.getTimezoneOffset();
	
	    if (-660 == so && -660 == wo) return 'Pacific/Midway';
	    if (-600 == so && -600 == wo) return 'Pacific/Tahiti';
	    if (-570 == so && -570 == wo) return 'Pacific/Marquesas';
	    if (-540 == so && -600 == wo) return 'America/Adak';
	    if (-540 == so && -540 == wo) return 'Pacific/Gambier';
	    if (-480 == so && -540 == wo) return 'US/Alaska';
	    if (-480 == so && -480 == wo) return 'Pacific/Pitcairn';
	    if (-420 == so && -480 == wo) return 'US/Pacific';
	    if (-420 == so && -420 == wo) return 'US/Arizona';
	    if (-360 == so && -420 == wo) return 'US/Mountain';
	    if (-360 == so && -360 == wo) return 'America/Guatemala';
	    if (-360 == so && -300 == wo) return 'Pacific/Easter';
	    if (-300 == so && -360 == wo) return 'US/Central';
	    if (-300 == so && -300 == wo) return 'America/Bogota';
	    if (-240 == so && -300 == wo) return 'US/Eastern';
	    if (-240 == so && -240 == wo) return 'America/Caracas';
	    if (-240 == so && -180 == wo) return 'America/Santiago';
	    if (-180 == so && -240 == wo) return 'Canada/Atlantic';
	    if (-180 == so && -180 == wo) return 'America/Montevideo';
	    if (-180 == so && -120 == wo) return 'America/Sao_Paulo';
	    if (-150 == so && -210 == wo) return 'America/St_Johns';
	    if (-120 == so && -180 == wo) return 'America/Godthab';
	    if (-120 == so && -120 == wo) return 'America/Noronha';
	    if (-60 == so && -60 == wo) return 'Atlantic/Cape_Verde';
	    if (0 == so && -60 == wo) return 'Atlantic/Azores';
	    if (0 == so && 0 == wo) return 'Africa/Casablanca';
	    if (60 == so && 0 == wo) return 'Europe/London';
	    if (60 == so && 60 == wo) return 'Africa/Algiers';
	    if (60 == so && 120 == wo) return 'Africa/Windhoek';
	    if (120 == so && 60 == wo) return 'Europe/Amsterdam';
	    if (120 == so && 120 == wo) return 'Africa/Harare';
	    if (180 == so && 120 == wo) return 'Europe/Athens';
	    if (180 == so && 180 == wo) return 'Africa/Nairobi';
	    if (240 == so && 180 == wo) return 'Europe/Moscow';
	    if (240 == so && 240 == wo) return 'Asia/Dubai';
	    if (270 == so && 210 == wo) return 'Asia/Tehran';
	    if (270 == so && 270 == wo) return 'Asia/Kabul';
	    if (300 == so && 240 == wo) return 'Asia/Baku';
	    if (300 == so && 300 == wo) return 'Asia/Karachi';
	    if (330 == so && 330 == wo) return 'Asia/Calcutta';
	    if (345 == so && 345 == wo) return 'Asia/Katmandu';
	    if (360 == so && 300 == wo) return 'Asia/Yekaterinburg';
	    if (360 == so && 360 == wo) return 'Asia/Colombo';
	    if (390 == so && 390 == wo) return 'Asia/Rangoon';
	    if (420 == so && 360 == wo) return 'Asia/Almaty';
	    if (420 == so && 420 == wo) return 'Asia/Bangkok';
	    if (480 == so && 420 == wo) return 'Asia/Krasnoyarsk';
	    if (480 == so && 480 == wo) return 'Australia/Perth';
	    if (540 == so && 480 == wo) return 'Asia/Irkutsk';
	    if (540 == so && 540 == wo) return 'Asia/Tokyo';
	    if (570 == so && 570 == wo) return 'Australia/Darwin';
	    if (570 == so && 630 == wo) return 'Australia/Adelaide';
	    if (600 == so && 540 == wo) return 'Asia/Yakutsk';
	    if (600 == so && 600 == wo) return 'Australia/Brisbane';
	    if (600 == so && 660 == wo) return 'Australia/Sydney';
	    if (630 == so && 660 == wo) return 'Australia/Lord_Howe';
	    if (660 == so && 600 == wo) return 'Asia/Vladivostok';
	    if (660 == so && 660 == wo) return 'Pacific/Guadalcanal';
	    if (690 == so && 690 == wo) return 'Pacific/Norfolk';
	    if (720 == so && 660 == wo) return 'Asia/Magadan';
	    if (720 == so && 720 == wo) return 'Pacific/Fiji';
	    if (720 == so && 780 == wo) return 'Pacific/Auckland';
	    if (765 == so && 825 == wo) return 'Pacific/Chatham';
	    if (780 == so && 780 == wo) return 'Pacific/Enderbury'
	    if (840 == so && 840 == wo) return 'Pacific/Kiritimati';
	    return 'US/Pacific';
	}
*/
	this.getTimezoneName = function () {
	    tmSummer = new Date(Date.UTC(2005, 6, 30, 0, 0, 0, 0));
	    so = -1 * tmSummer.getTimezoneOffset();
	    tmWinter = new Date(Date.UTC(2005, 12, 30, 0, 0, 0, 0));
	    wo = -1 * tmWinter.getTimezoneOffset();
	
	    if (-720 == so && -720 == wo) return 'International Date Line West';
	    if (-660 == so && -660 == wo) return 'Coordinated Universal Time -11';
	    if (-600 == so && -600 == wo) return 'US/Hawaii';
	    if (-540 == so && -600 == wo) return 'America/Adak';
	    if (-570 == so && -570 == wo) return 'Pacific/Marquesas';
	    if (-540 == so && -540 == wo) return 'Pacific/Gambier';
	    if (-480 == so && -540 == wo) return 'US/Alaska';
	    if (-480 == so && -480 == wo) return 'Pacific/Pitcairn';
	    if (-420 == so && -480 == wo) return 'US/Pacific';
	    if (-420 == so && -420 == wo) return 'US/Arizona';
	    if (-360 == so && -420 == wo) return 'US/Mountain';
	    if (-360 == so && -360 == wo) return 'America/Guatemala';
	    if (-300 == so && -360 == wo) return 'US/Central';
	    if (-300 == so && -300 == wo) return 'America/Bogota';
	    if (-240 == so && -300 == wo) return 'US/Eastern';
	    if (-270 == so && -270 == wo) return 'America/Caracas';
	    if (-240 == so && -240 == wo) return 'America/Caracas';
	    if (-180 == so && -240 == wo) return 'Canada/Atlantic';
	    if (-150 == so && -210 == wo) return 'Canada/Newfoundland';
	    if (-180 == so && -180 == wo) return 'America/Salvador';
	    if (-120 == so && -180 == wo) return 'America/Montevideo';
	    if (-120 == so && -120 == wo) return 'America/Noronha';
	    if (-60 == so && -120 == wo) return 'Mid-Atlantic';
	    if (-60 == so && -60 == wo) return 'Atlantic/Cape_Verde';
	    if (0 == so && -60 == wo) return 'Atlantic/Azores';
	    if (0 == so && 0 == wo) return 'Europe/Reykjavik';
	    if (60 == so && 0 == wo) return 'Europe/London';
	    if (60 == so && 60 == wo) return 'Africa/Algiers';
	    if (120 == so && 60 == wo) return 'Europe/Amsterdam';
	    if (120 == so && 120 == wo) return 'Africa/Harare';
	    if (180 == so && 120 == wo) return 'Europe/Athens';
	    if (180 == so && 180 == wo) return 'Africa/Nairobi';
	    if (270 == so && 210 == wo) return 'Asia/Tehran';
	    if (240 == so && 240 == wo) return 'Asia/Dubai';
	    if (300 == so && 240 == wo) return 'Europe/Baku';
	    if (270 == so && 270 == wo) return 'Asia/Kabul';
	    if (300 == so && 300 == wo) return 'Asia/Karachi';
	    if (360 == so && 300 == wo) return 'Asia/Yekaterinburg';
	    if (330 == so && 330 == wo) return 'Asia/New Delhi';
	    if (345 == so && 345 == wo) return 'Asia/Katmandu';
	    if (360 == so && 360 == wo) return 'Asia/Colombo';
	    if (420 == so && 360 == wo) return 'Asia/Almaty';
	    if (390 == so && 390 == wo) return 'Asia/Rangoon';
	    if (420 == so && 420 == wo) return 'Asia/Bangkok';
	    if (480 == so && 420 == wo) return 'Asia/Krasnoyarsk';
	    if (480 == so && 480 == wo) return 'Asia/Beijing';
	    if (540 == so && 540 == wo) return 'Asia/Tokyo';
	    if (600 == so && 540 == wo) return 'Asia/Yakutsk';
	    if (570 == so && 570 == wo) return 'Australia/Darwin';
	    if (630 == so && 570 == wo) return 'Australia/Adelaide';
	    if (600 == so && 600 == wo) return 'Australia/Brisbane';
	    if (660 == so && 600 == wo) return 'Australia/Sydney';
	    if (660 == so && 660 == wo) return 'Asia/Vladivostok';
	    if (690 == so && 690 == wo) return 'Pacific/Norfolk';
	    if (720 == so && 720 == wo) return 'Asia/Magadan';
	    if (780 == so && 720 == wo) return 'Pacific/Fiji';
	    if (780 == so && 780 == wo) return 'Pacific/Nukualodfa';
	    if (840 == so && 780 == wo) return 'Pacific/Samoa';
	    return 'Unknown';
	}
/*
{"zone":"-12", "id":"Dateline Standard Time"},
{"zone":"-11", "id":"UTC-11"},
{"zone":"-10", "id":"Hawaiian Standard Time"},
{"zone":"-9", "id":"Alaskan Standard Time"},
{"zone":"-8", "id":"Pacific Standard Time"},
{"zone":"-8", "id":"Pacific Standard Time (Mexico)"},
{"zone":"-7", "id":"Mountain Standard Time (Mexico)"},
{"zone":"-7", "id":"Mountain Standard Time"},
{"zone":"-7", "id":"US Mountain Standard Time"},
{"zone":"-6", "id":"Central Standard Time (Mexico)"},
{"zone":"-6", "id":"Canada Central Standard Time"},
{"zone":"-6", "id":"Central Standard Time"},
{"zone":"-6", "id":"Central America Standard Time"},
{"zone":"-5", "id":"SA Pacific Standard Time"},
{"zone":"-5", "id":"Eastern Standard Time"},
{"zone":"-5", "id":"US Eastern Standard Time"},
{"zone":"-4.5", "id":"Venezuela Standard Time"},
{"zone":"-4", "id":"Atlantic Standard Time"},
{"zone":"-4", "id":"Central Brazilian Standard Time"},
{"zone":"-4", "id":"SA Western Standard Time"},
{"zone":"-4", "id":"Pacific SA Standard Time"},
{"zone":"-4", "id":"Paraguay Standard Time"},
{"zone":"-3.5", "id":"Newfoundland Standard Time"},
{"zone":"-3", "id":"E. South America Standard Time"},
{"zone":"-3", "id":"Argentina Standard Time"},
{"zone":"-3", "id":"Greenland Standard Time"},
{"zone":"-3", "id":"SA Eastern Standard Time"},
{"zone":"-3", "id":"Montevideo Standard Time"},
{"zone":"-3", "id":"Bahia Standard Time"},
{"zone":"-2", "id":"UTC-02"},
{"zone":"-2", "id":"Mid-Atlantic Standard Time"},
{"zone":"-1", "id":"Cape Verde Standard Time"},
{"zone":"-1", "id":"Azores Standard Time"},
{"zone":"0", "id":"GMT Standard Time"},
{"zone":"0", "id":"Morocco Standard Time"},
{"zone":"0", "id":"Greenwich Standard Time"},
{"zone":"0", "id":"UTC"},
{"zone":"1", "id":"Libya Standard Time"},
{"zone":"1", "id":"W. Europe Standard Time"},
{"zone":"1", "id":"Central Europe Standard Time"},
{"zone":"1", "id":"Romance Standard Time"},
{"zone":"1", "id":"Central European Standard Time"},
{"zone":"1", "id":"Namibia Standard Time"},
{"zone":"1", "id":"W. Central Africa Standard Time"},
{"zone":"2", "id":"Middle East Standard Time"},
{"zone":"2", "id":"Syria Standard Time"},
{"zone":"2", "id":"E. Europe Standard Time"},
{"zone":"2", "id":"South Africa Standard Time"},
{"zone":"2", "id":"FLE Standard Time"},
{"zone":"2", "id":"Egypt Standard Time"},
{"zone":"2", "id":"GTB Standard Time"},
{"zone":"2", "id":"Israel Standard Time"},
{"zone":"2", "id":"Turkey Standard Time"},
{"zone":"3", "id":"Jordan Standard Time"},
{"zone":"3", "id":"Arabic Standard Time"},
{"zone":"3", "id":"Kaliningrad Standard Time"},
{"zone":"3", "id":"Arab Standard Time"},
{"zone":"3", "id":"E. Africa Standard Time"},
{"zone":"3.5", "id":"Iran Standard Time"},
{"zone":"4", "id":"Arabian Standard Time"},
{"zone":"4", "id":"Caucasus Standard Time"},
{"zone":"4", "id":"Azerbaijan Standard Time"},
{"zone":"4", "id":"Georgian Standard Time"},
{"zone":"4", "id":"Mauritius Standard Time"},
{"zone":"4", "id":"Russian Standard Time"},
{"zone":"4.5", "id":"Afghanistan Standard Time"},
{"zone":"5", "id":"West Asia Standard Time"},
{"zone":"5", "id":"Pakistan Standard Time"},
{"zone":"5.5", "id":"India Standard Time"},
{"zone":"5.5", "id":"Sri Lanka Standard Time"},
{"zone":"5.75", "id":"Nepal Standard Time"},
{"zone":"6", "id":"Central Asia Standard Time"},
{"zone":"6", "id":"Bangladesh Standard Time"},
{"zone":"6", "id":"Ekaterinburg Standard Time"},
{"zone":"6.5", "id":"Myanmar Standard Time"},
{"zone":"7", "id":"SE Asia Standard Time"},
{"zone":"7", "id":"N. Central Asia Standard Time"},
{"zone":"8", "id":"China Standard Time"},
{"zone":"8", "id":"Singapore Standard Time"},
{"zone":"8", "id":"North Asia Standard Time"},
{"zone":"8", "id":"W. Australia Standard Time"},
{"zone":"8", "id":"Taipei Standard Time"},
{"zone":"8", "id":"Ulaanbaatar Standard Time"},
{"zone":"9", "id":"Tokyo Standard Time"},
{"zone":"9", "id":"Korea Standard Time"},
{"zone":"9", "id":"North Asia East Standard Time"},
{"zone":"9.5", "id":"Cen. Australia Standard Time"},
{"zone":"9.5", "id":"AUS Central Standard Time"},
{"zone":"10", "id":"E. Australia Standard Time"},
{"zone":"10", "id":"West Pacific Standard Time"},
{"zone":"10", "id":"Tasmania Standard Time"},
{"zone":"10", "id":"AUS Eastern Standard Time"},
{"zone":"10", "id":"Yakutsk Standard Time"},
{"zone":"11", "id":"Vladivostok Standard Time"},
{"zone":"11", "id":"Central Pacific Standard Time"},
{"zone":"12", "id":"New Zealand Standard Time"},
{"zone":"12", "id":"Fiji Standard Time"},
{"zone":"12", "id":"Magadan Standard Time"},
{"zone":"12", "id":"UTC+12"},
{"zone":"13", "id":"Tonga Standard Time"},
{"zone":"13", "id":"Samoa Standard Time"}
*/

	this.getPlayerLocalInfo = function getPlayerLocalInfo(obj, callback) {
		var IP = '';
		var that = this;
		obj.localtime	= new Date();
		obj.timezoneoffset 	= obj.localtime.getTimezoneOffset() / 60; 
		obj.machinename = os.hostname();
		obj.platform 	= os.platform();
		obj.arch		= os.arch();
		
		IP = this.getIP();
		if(IP) {
			obj.ip = IP;
		}
		
		controllerCmd.getLocalTimeZoneId(this, function(zoneId) {
			obj.timezone = zoneId;
			
			var MB = 1024 * 1024;
			that.getFreeSpacePercent(function(total, free) {
				if(total) {//the status returned contains CR/LF, so only get the first 5 characters
					obj.diskspace = Math.floor(parseInt(free, 10) / MB) + ' MB / ' + Math.floor(parseInt(total, 10) / MB) + ' MB';
				}
		
				return callback(obj);
			});
		});
	}

	this.getFreeSpacePercent = function(callback) {
		var that = this;
		
		controllerCmd.diskCheck(this.WS5Path.charAt(0), function(total, free, status) {
			/*		
				NOTFOUND - Disk was not found, the space values will be 0
				READY - The drive is ready
				NOTREADY - The drive isn't ready, the space values will be 0
				STDERR - some error, the output of it was logged to the console.
			*/		
			if(status.slice(0, 5) === 'READY') {//the status returned contains CR/LF, so only get the first 5 characters
				return callback(total, free);
			}
			else {
				that.logger.error('error return when get disk space information. ' + status);
				return callback(0, 0);
			}
		});
	}
	
	var matchByPass = function(proxy, urlObj) {
		var bypass = false;

		if(proxy && proxy.bypass && util.isArray(proxy.bypass) && urlObj && urlObj.host) {
			for(var i = 0, l = proxy.bypass.length; i < l; i++) {
				if((proxy.bypass[i].indexOf('\*') !== -1) || (proxy.bypass[i].indexOf('\?') !== -1)) {
					var tempString = '';
					tempString = proxy.bypass[i].replace(/\./g, '\\.');
					tempString = tempString.replace(/\*/g, '(\.*)');
					tempString = tempString.replace(/\?/g, '(\.?)');

					var regExp = new RegExp(tempString, 'i');
					var matchResult = [];
					matchResult = urlObj.host.match(regExp);
					if(matchResult && util.isArray(matchResult) && (matchResult[0] === urlObj.host)) {
						bypass = true;
						break;
					}
				}
				else {
					if(urlObj.host.toLowerCase() === proxy.bypass[i].toLowerCase()) {
						bypass = true;
						break;
					}
				}	
			}
		}
	
		return bypass;
	}

	this.postRequestToServerByProxy = function(urlString, postdata, cookie, callback) {
		var req 		= null;
		var urlObj 		= {};
		var postString 	= '';
		var that 		= this;
		
		if(!urlString) { return callback(4, ''); }
		if(!postdata) { return callback(4, ''); }
		
		urlObj.host = '10.10.7.252';
		urlObj.port = '808';
		urlObj.path = 'http://10.10.7.50:2000/ws5/controller/login.js';//urlString;
		urlObj.method = 'POST';
		
		postString 		= querystring.stringify(postdata);		
/*
		urlObj 			= url.parse(urlString);
		urlObj.method 	= 'POST';
*/		
		urlObj.headers = {	connection: 'keep-alive',
							accept: 'application/json, text/javascript, */*; q=0.01',
							'Content-Type': 'application/x-www-form-urlencoded',
							'Content-Length': postString.length,
							Cookie: cookie }	;

//console.log(urlObj);
//console.log(postString);
		req = http.request(urlObj, function(res) {
	    	//setEncoding will transfer Buffer data to string according to encoding type
	    	//if the stream is long enough and will be cut, it will cause problem, so we should not convert it to string before get the whole data.
		  	//res.setEncoding('utf8');
		  	res.on('data', function (chunk) {
//console.log('receive data event.');		  		
				if(res.statusCode === 200) {
					return callback(0, chunk, res.headers['set-cookie']);
				}
				else {
					return callback(res.statusCode, '', '');
				}		
		  	});
		  	res.on('end', function () {
//console.log('receive end event.');		  		
			});
		  	res.on('close', function (err) {
//console.log('receive close event.' + err);		  		
			});
		});
		
		req.on('error', function(e) {
//console.log('receive error event.');		
//console.log(e);  		
			that.logger.error('problem with request: ' + e.message);
			return callback(11, '');
		});
		
		// write data to request body
		req.write(postString);
		req.end();		
	}

	this.sendRequestToServer = function(urlString, cookie, proxy, callback) {
		var req 		= null;
		var urlObj 		= {};
		var postString 	= '';
		var that 		= this;
		var authBuffer 	= null;
		var bufferArray	= [];
		var bufferIndex = 0;
		var finalBuffer = null;
		var status 		= false;
		var returncookie= '';
		var bufferSize 	= 0;
		var bypass		= false;
		
		if(!urlString || (urlString.indexOf('http') !== 0)) { return callback(4, ''); }

		//check bypass or not
		var tempUrlObj = {};
		tempUrlObj = url.parse(urlString);
		if(proxy && proxy.bypass && util.isArray(proxy.bypass)) {
			bypass = matchByPass(proxy, tempUrlObj);
		}
		
		if(!bypass && proxy && proxy.host && proxy.port) {
			urlObj.host = proxy.host;
			urlObj.port = proxy.port;
			urlObj.headers = {};
			if(proxy.id) {

				authBuffer = new Buffer(proxy.id + ':' + proxy.pwd);
//console.log(authBuffer.toString('base64'));

				urlObj.auth = proxy.id + ':' + proxy.pwd;
				urlObj.headers['Proxy-Connection'] = 'keep-alive';
				urlObj.headers['Proxy-Authorization'] = 'Basic ' + authBuffer.toString('base64');
				
			}
			urlObj.path = urlString;
		}	
		else {
			urlObj		= url.parse(urlString);
			urlObj.headers = {};
		}
		
		urlObj.method 	= 'get';
		urlObj.headers.connection = 'keep-alive';
		urlObj.headers.accept = 'application/json, text/javascript, */*; q=0.01';
		urlObj.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		urlObj.headers.Cookie = cookie;

		

//console.log('urlObj=');
//console.log(urlObj);
		req = http.request(urlObj, function(res) {
	    	//setEncoding will transfer Buffer data to string according to encoding type
	    	//if the stream is long enough and will be cut, it will cause problem, so we should not convert it to string before get the whole data.
		  	//res.setEncoding('utf8');
		  	res.on('data', function (chunk) {
//console.log('receive data event.');		  		
//console.log(res.statusCode);		  		
//console.log(chunk);		  		
				if(res.statusCode === 200) {
					if(typeof chunk === 'string') {
						bufferArray[bufferIndex] = new Buffer(chunk);
						bufferSize += bufferArray[bufferIndex].length;	  		
						bufferIndex++;
					}
					else {
						bufferArray[bufferIndex] = chunk;
						bufferIndex++;
						bufferSize += chunk.length;	  		
					}

					if(res.headers['set-cookie']) { returncookie = res.headers['set-cookie'].toString(); }
					status = true;
//console.log('res.headers=');		  		
//console.log(res.headers);		  		
				}
				else {
					status = false;
				}		
		  	});
		  	
		  	res.on('end', function () {
//console.log(res.statusCode);		  		
//console.log('receive end event.');		  		
				if(status) {
					if(bufferIndex === 0) { //never download at all
						return callback(11, '', returncookie);
					}
				 	else {
					 	if(bufferIndex === 1) {
							finalBuffer = bufferArray[0];
						}
						else {
							finalBuffer = Buffer.concat(bufferArray, bufferSize);
						}
//console.log('finalBuffer=');		  		
//console.log(finalBuffer);		  		
						return callback(0, finalBuffer, returncookie);
					}
				}
				else {
					return callback(11, res.statusCode, '');
				}	  		
			});
		  	res.on('close', function (err) {
//console.log('receive close event.' + err);		  		
			});
		});
		
		req.on('error', function(e) {
//console.log('receive error event.');		
//console.log(e);  		
			that.logger.error('problem with request: ' + e.message);
			return callback(11, '', '');
		});
		
		req.end();		
	}

	this.postRequestToServer = function(urlString, postdata, cookie, proxy, callback) {
		var req 		= null;
		var urlObj 		= {};
		var postString 	= '';
		var that 		= this;
		var authBuffer 	= null;
		var bufferArray	= [];
		var bufferIndex = 0;
		var finalBuffer = null;
		var status 		= false;
		var returncookie= '';
		var bufferSize 	= 0;
		var bypass		= false;
		
		if(!urlString || (urlString.indexOf('http') !== 0)) { return callback(4, ''); }
		if(!postdata) { return callback(4, ''); }
		
		postString 		= querystring.stringify(postdata);
		
		//check bypass or not
		var tempUrlObj = {};
		tempUrlObj = url.parse(urlString);
		if(proxy && proxy.bypass && util.isArray(proxy.bypass)) {
			bypass = matchByPass(proxy, tempUrlObj);
		}
		
		if(!bypass && proxy && proxy.host && proxy.port) {
			urlObj.host = proxy.host;
			urlObj.port = proxy.port;
			urlObj.headers = {};
			if(proxy.id) {

				authBuffer = new Buffer(proxy.id + ':' + proxy.pwd);
//console.log(authBuffer.toString('base64'));

				urlObj.auth = proxy.id + ':' + proxy.pwd;
				urlObj.headers['Proxy-Connection'] = 'keep-alive';
				urlObj.headers['Proxy-Authorization'] = 'Basic ' + authBuffer.toString('base64');
				
			}
			urlObj.path = urlString;
		}	
		else {
			urlObj		= url.parse(urlString);
			urlObj.headers = {};
		}
		
		urlObj.method 	= 'POST';
		urlObj.headers.connection = 'keep-alive';
		urlObj.headers.accept = 'application/json, text/javascript, */*; q=0.01';
		urlObj.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		urlObj.headers['Content-Length'] = postString.length;
		urlObj.headers.Cookie = cookie;

		

//console.log('urlObj=');
//console.log(urlObj);
//console.log('postString=');
//console.log(postString);
		req = http.request(urlObj, function(res) {
	    	//setEncoding will transfer Buffer data to string according to encoding type
	    	//if the stream is long enough and will be cut, it will cause problem, so we should not convert it to string before get the whole data.
		  	//res.setEncoding('utf8');
		  	res.on('data', function (chunk) {
//console.log('receive data event.');		  		
//console.log(res.statusCode);		  		
//console.log(chunk);		  		
				if(res.statusCode === 200) {
					if(typeof chunk === 'string') {
						bufferArray[bufferIndex] = new Buffer(chunk);
						bufferSize += bufferArray[bufferIndex].length;	  		
						bufferIndex++;
					}
					else {
						bufferArray[bufferIndex] = chunk;
						bufferIndex++;
						bufferSize += chunk.length;	  		
					}

					if(res.headers['set-cookie']) { returncookie = res.headers['set-cookie'].toString(); }
					status = true;
//console.log('res.headers=');		  		
//console.log(res.headers);		  		
				}
				else {
					status = false;
					return callback(11, ''+ res.statusCode, '');
				}		
		  	});
		  	
		  	res.on('end', function () {
//console.log(res.statusCode);		  		
//console.log('receive end event.');		  		
				if(status) {
					if(bufferIndex === 0) { //never download at all
						return callback(11, '', returncookie);
					}
				 	else {
					 	if(bufferIndex === 1) {
							finalBuffer = bufferArray[0];
						}
						else {
							finalBuffer = Buffer.concat(bufferArray, bufferSize);
						}
//console.log('finalBuffer=');		  		
//console.log(finalBuffer);		  		
						return callback(0, finalBuffer, returncookie);
					}
				}
				else {
					return callback(11, res.statusCode, '');
				}	  		
			});
		  	res.on('close', function (err) {
//console.log('receive close event.' + err);		  		
			});
		});
		
		req.on('error', function(e) {
//console.log('receive error event.');		
//console.log(e);  		
			that.logger.error('problem with request: ' + e.message);
			return callback(11, '', '');
		});
		
		// write data to request body
		req.write(postString);
		req.end();		
	}


/*
	this.getFileFromServer = function(urlString, cookie, callback) {
		var req 		= null;
		var urlObj 		= {};
		var that 		= this;
		var buffer		= null;
		var status 		= true;
		var cookie		= '';
		var bufferSize 	= 0;
		
		if(!urlString) { return callback(4, ''); }
		
		urlObj 			= url.parse(urlString);
		urlObj.method 	= 'GET';
		
		urlObj.headers = {	
							accept: 'application/json, text/javascript; q=0.01',
//							'Content-Type': '',
//							'Content-Length': postString.length,
							Cookie: cookie }	;

		req = http.request(urlObj, function(res) {
		  	res.on('data', function (chunk) {
console.log('receive data event for get. ' + chunk.length);	
				if(res.statusCode === 200) {
					if(!buffer) { 
console.log(res.headers);	
						buffer = new Buffer(parseInt(res.headers['content-length'], 10));
					}
					
					chunk.copy(buffer, bufferSize, 0);
console.log('buffer size=' + buffer.length);	
					bufferSize += chunk.length;	  		
console.log('total chunk size=' + bufferSize);	

					if(res.headers['set-cookie']) { cookie = res.headers['set-cookie']; }
				}
				else {
					status = false;
				}		
		  	});
		  	res.on('end', function () {
console.log('receive end event for get.');	
				if(status) {
console.log('buffer size=' + buffer.length);	
					return callback(0, buffer, cookie);
				}
				else {
					return callback(400, null, '');
				}	  		
			});
		  	res.on('close', function (err) {
console.log('receive close event for get.' + err);		  		
			});
		});
		
		req.on('error', function(e) {
			that.logger.error('problem with request: ' + e.message);
			return callback(11, '');
		});
		
		req.end();		
	}
*/
	
	//if use this funciton, need consider proxy case.
	this.getFileFromServer = function(urlString, targetPath, cookie, callback) {
		var req 		= null;
		var urlObj 		= {};
		var that 		= this;
		var bufferArray	= [];
		var bufferIndex = 0;
		var finalBuffer = null;
		var status 		= true;
		var cookie		= '';
		var bufferSize 	= 0;
		var lastModifiedTime = '';
		
		if(!urlString) { return callback(4, ''); }
		if(!targetPath) { return callback(4, ''); }
		
		that.getFileLastModifiedTime(targetPath, function(err, lmt) {
//			if(!err) lastModifiedTime = lmt;

			urlObj 			= url.parse(urlString);
			urlObj.method 	= 'GET';
		
			urlObj.headers = {	
							accept: '*/*; q=0.01',
							'If-Modified-Since': lastModifiedTime,
							Cookie: cookie }	;

			req = http.request(urlObj, function(res) {
			  	res.on('data', function (chunk) {
console.log('receive data event for get. ' + chunk.length);	
					if(res.statusCode === 200) {
						if(typeof chunk === 'string') {
							bufferArray[bufferIndex] = new Buffer(chunk);
							bufferSize += bufferArray[bufferIndex].length;	  		
							bufferIndex++;
						}
						else {
							bufferArray[bufferIndex] = chunk;
							bufferIndex++;
							bufferSize += chunk.length;	  		
						}
	
						if(res.headers['set-cookie']) { cookie = res.headers['set-cookie']; }
					}
					else {
console.log('res.statusCode=' + res.statusCode);
						status = false;
					}		
			  	});
			  	
			  	res.on('end', function () {
console.log(res.statusCode);
console.log('receive end event for get.');	
					if(status) {
						if(bufferIndex === 0) { //never download at all
							return callback(0, cookie);
						}
					 	else {
						 	if(bufferIndex === 1) {
								finalBuffer = bufferArray[0];
							}
							else {
								finalBuffer = Buffer.concat(bufferArray, bufferSize);
							}
			
							try{
								hfs.mkdirSync(path.dirname(targetPath));
								fs.writeFileSync(targetPath, finalBuffer);
							}
							catch(e) {
								that.logger.error('Fail to write data file to ' + targetPath);
								return callback('Fail to write data file', '');
							}
						}
						
						return callback(0, cookie);
					}
					else {
						return callback('http error ' + res.statusCode, '');
					}	  		
				});
			  	res.on('close', function (err) {
console.log('receive close event for get.' + err);		  		
				});
			});
			
			req.on('error', function(e) {
				that.logger.error('problem with request: ' + e.message);
				return callback('download error', '');
			});
			
			req.end();	
		});	
	}



	/* The resut likes:
	d0c35d02-e809-4405-8eaa-68f2126b010d
	54a60996-8d73-4049-8048-8ded29a8db2c
	81ef8391-855a-4635-b3ae-3830aa323812
	5cc98943-3f36-42a3-8540-05268ecf5a61
	a0b8fd84-d659-42a7-948c-d502925a0f6d
	*/
    this.getUUID = function () {
	    // http://www.ietf.org/rfc/rfc4122.txt
	    var s = [];
	    var hexDigits = "0123456789abcdef";
	    for (var i = 0; i < 36; i++) {
	        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	    }
	    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
	    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	    s[8] = s[13] = s[18] = s[23] = "-";
	
	    var uuid = s.join("");
	    return uuid;
	}	

	/* The resut likes:
	C597957C78100001A247CFC06E921EF2
	C597957C7820000112D8135319994D80
	C597957C7820000119FD11908B6042B0
	C597957C7820000150641AD031DAE270
	C597957C783000013E38921062881A68
	*/
	this.generatorUUID = function() {
		//
		// Loose interpretation of the specification DCE 1.1: Remote Procedure Call
		// since JavaScript doesn't allow access to internal systems, the last 48 bits
		// of the node section is made up using a series of random numbers (6 octets long).
		//
		var dg = new Date(1582, 10, 15, 0, 0, 0, 0);
		var dc = new Date();
		var t = dc.getTime() - dg.getTime();
		var tl = getIntegerBits(t, 0, 31);
		var tm = getIntegerBits(t, 32, 47);
		var thv = getIntegerBits(t, 48, 59) + '1'; // version 1, security version is 2
		var csar = getIntegerBits(rand(4095), 0, 7);
		var csl = getIntegerBits(rand(4095), 0, 7);
		
		// since detection of anything about the machine/browser is far to buggy,
		// include some more random numbers here
		// if NIC or an IP can be obtained reliably, that should be put in
		// here instead.
		var n = getIntegerBits(rand(8191), 0, 7) +
		    getIntegerBits(rand(8191), 8, 15) +
		    getIntegerBits(rand(8191), 0, 7) +
		    getIntegerBits(rand(8191), 8, 15) +
		    getIntegerBits(rand(8191), 0, 15); // this last number is two octets long
		return tl + tm + thv + csar + csl + n;
		
		//Pull out only certain bits from a very large integer, used to get the time
		//code information for the first part of a UUID. Will return zero's if there
		//aren't enough bits to shift where it needs to.
		function getIntegerBits(val, start, end) {
			var base16 = returnBase(val, 16);
			var quadArray = new Array();
			var quadString = '';
			var i = 0;
			for (i = 0; i < base16.length; i++) {
				quadArray.push(base16.substring(i, i + 1));
			}
			for (i = Math.floor(start / 4); i <= Math.floor(end / 4); i++) {
				if (!quadArray[i] || quadArray[i] == '') quadString += '0';
				else quadString += quadArray[i];
			}
			return quadString;
		}
		
		//Replaced from the original function to leverage the built in methods in
		//JavaScript. Thanks to Robert Kieffer for pointing this one out
		function returnBase(number, base) {
			return (number).toString(base).toUpperCase();
		}
		
		//pick a random number within a range of numbers
		//int b rand(int a); where 0 <= b <= a
		function rand(max) {
			return Math.floor(Math.random() * (max + 1));
		}
	}
	
	this.writeDataFile = function(targetLocalPath, dataObj, notformat) { //copy from fileutils.js
		if(!targetLocalPath) return 1; //error
		if(!dataObj) return 1; //error

		try {
			var folderPath = path.dirname(targetLocalPath);
			hfs.mkdirSync(folderPath);
			if(notformat) fs.writeFileSync(targetLocalPath, JSON.stringify(dataObj));
			else fs.writeFileSync(targetLocalPath, JSON.stringify(dataObj, null, 4));
		}
		catch(e) {
			if(this.logger) this.logger.error('error ocuurs when write file to ' + targetLocalPath);
			if(this.logger) this.logger.error(e);
			return 1;
		}		
		
		return 0;
	}
	
	this.writeContent2File = function(targetPath, mode, chunk, callback) {
		var folderPath = '';
		var lastSlashPos = targetPath.lastIndexOf(path.sep);
		var wOption = {
  			flags: mode,
  			encoding: null,
  			mode: 0755   
		}
		var fileWriteStream = null;

		if(lastSlashPos > 0) {
			folderPath = targetPath.slice(0, lastSlashPos);
			hfs.mkdirSync(folderPath);
			fileWriteStream = fs.createWriteStream(targetPath, wOption);
			fileWriteStream.write(chunk);
		  	fileWriteStream.end();
		  	
		  	fileWriteStream.on('close', function() {
			  	return callback(0);
		  	});
		  	fileWriteStream.on('error', function(err) {
			  	return callback(err);
		  	});
		}
		else {
			return callback(1); //'wrong path'
		}
	}
	
	//read text file
	this.readContentFromFile = function(targetPath, callback) {
		var fileReadStream = null;
		var bufferArray = [];
		var bufferSize  = 0;
		var bufferIndex = 0;
		var finalBuffer = null;

		if(!targetPath) {
			return callback(4, null);
		}
		
		fileReadStream = fs.createReadStream(targetPath);
	  	
	  	fileReadStream.on('data', function(chunk) {
			if(typeof chunk === 'string') {
				bufferArray[bufferIndex] = new Buffer(chunk);
				bufferSize += bufferArray[bufferIndex].length;	  		
				bufferIndex++;
			}
			else {
				bufferArray[bufferIndex] = chunk;
				bufferIndex++;
				bufferSize += chunk.length;	  		
			}
	  	});
		  	
	  	fileReadStream.on('end', function() {
			if(bufferIndex === 0) { //never download at all
				return callback(0, null);
			}
		 	else {
			 	if(bufferIndex === 1) {
					finalBuffer = bufferArray[0];
				}
				else {
					finalBuffer = Buffer.concat(bufferArray, bufferSize);
				}
				
				return callback(0, finalBuffer);  		
			}
	  	});
	  	
	  	fileReadStream.on('error', function(err) {
			return callback(err, null);  		
	  	});
	}


	//source file path must exist.
	//for destPath, all folders in the path must exist
	//both path must be absolute path
	this.internalCopyFile = function(srcPath, destPath, callback) {
		var fileReadStream = null;
		var fileWriteStream = null;
		var that = this;
		
		if(!srcPath || !destPath) { return callback(4);}
		if((srcPath.length === destPath.length) && (srcPath.indexOf(destPath) === 0)) {
			return callback(null);
		}
		
		fs.exists(srcPath, function(exists) {
	        if(!exists) {
	    	    return callback('The source file does not exist!');
	    	}
			
			hfs.mkdir(path.dirname(destPath), function(err) {
				if(err) return callback(null);
				
				fileReadStream = fs.createReadStream(srcPath);
				fileWriteStream = fs.createWriteStream(destPath);
				fileReadStream.pipe(fileWriteStream);
				
				fileWriteStream.on('close', function() {
	//			  	that.logger.debug('copy finished.');  
				  	callback(null);
				});	    	
				fileWriteStream.on('error', function(e) {
				  	that.logger.error('error occurs during copy.');  
				  	that.logger.error(e);  
				  	callback(e);
				});	    	
			});
		});
	}
	
	//check file existence, if exists, return its lastmodifiedtime in GMT format.
	this.getFileLastModifiedTime = function(filePath, callback) {
		fs.exists(filePath, function(exists) {
			if(!exists) return callback('does not exist', '0');
			
			fs.lstat(filePath, function(err, stats) {
				if(!err) {
					callback(null, stats.mtime.toUTCString());
				}
				else {
					callback('failed to get file status.', '0');
				}
			});
		});
	}
	
	
	//not be used, if use need to consider proxy case!!!!!!!!!!
	this.uploadFile = function uploadFile(host, port, url, fileLocalPath, contentType, callback){
		if(!post || !port || !url || !fileLocalPath || !contentType) {
			return callback('wrong parameter');
		}
		
	    var boundaryKey = '----' + new Date().getTime();
	    var fileName = path.basename(fileLocalPath);
	    var options = {
	        host: 	host,//远端服务器域�?
	        port: 	port,//远端服务器端口号
	        method: 'POST',
	        path: 	url,//上传服务路径
	        headers:{
	            'Content-Type':'multipart/form-data; boundary=' + boundaryKey,
	            'Connection':'keep-alive'
	        }
	    };
	    
	    var req = http.request(options,function(res){
	    	//setEncoding will transfer Buffer data to string according to encoding type
	    	//if the stream is long enough and will be cut, it will cause problem, so we should not convert it to string before get the whole data.
	        //res.setEncoding('utf8'); 
	        res.on('data', function (chunk) {
	            console.log('body: ' + chunk);
	        });
	        res.on('end',function(){
	            console.log('res end.');
	        });
	    });
	    
	    if(!req) {
	    	return callback('fail to create request object');
	    }
	    
	    req.write(
	        '--' + boundaryKey + '\r\n' +
	        'Content-Disposition: form-data; name="upload"; filename="' + fileName + '"\r\n' +
	        'Content-Type: ' + contentType + '\r\n\r\n'
	    );
	    
	    //设置1M的缓冲区
	    var fileStream = fs.createReadStream(fileLocalPath, { bufferSize : 1024 * 1024 });
	    fileStream.pipe(req, { end : false });
	    fileStream.on('end', function() {
	        req.end('\r\n--' + boundaryKey + '--');
	        
	        return callback('');
	    });
	    
	    fileStream.on('error', function() {
	        return callback('error occurs');
	    });
	    
	    fileStream.on('close', function() {
//	        return callback('error occurs');
console.log('stream closed');
	    });
	}


	//decompress file 
	this.decompressFile = function(zipFile, targetPath, callback) {
		controllerCmd.decompressFile(this, zipFile, targetPath, function(err) {
			return callback(err);
		});
	}
	
	//compress file
	this.compressFile = function(srcPathArray, destPath, callback) {
		controllerCmd.compressFile(this, srcPathArray, destPath, function(err) {
			return callback(err);
		});
	}
	
	//compress file to buffer
	this.compressFileToBuffer = function(srcPathArray, callback) {
		controllerCmd.compressFileToBuffer(this, srcPathArray, function(err, content) {
			return callback(err, content);
		});
	}
	
/*
	//decompress file 
	this.decompressFile = function(zipFile, targetPath) {
	    // reading archives
	    try {
		    var zip = new AdmZip(zipFile);
	
		    // extracts everything
		    zip.extractAllTo(targetPath, true);
	    }
	    catch(e) {
	    	this.logger.error('exception occurs when extract zip file. ' + zipFile + '  to   ' + targetPath);
	    	this.logger.error(e);
	    }
	}
	
	//compress file
	this.compressFile = function(srcPathArray, isFolder, destPath) {
		if(!srcPath || !util.isArray(srcPathArray) || !srcPathArray.length || !destPath) {
			return 0;
		}
		
	    // create object
	    var zip 	= new AdmZip();
		var index 	= 0; 
		var number 	= srcPathArray.length;
		
		//create archive
		for(index = 0; index < number; index++) {
			try{
				if(isFolder) {
					zip.addLocalFolder(srcPathArray[index]);
				}
				else {
					zip.addLocalFile(srcPathArray[index]);
				}
			}
			catch(e) {
				this.logger.error('exception occurs when add file/folder to zip. ' + srcPathArray[index]);
				this.logger.error(e);
			}
		}
		
	    // output to file
		try{
		    zip.writeZip(destPath);
		}
		catch(e) {
			this.logger.error('exception occurs when write to zip. ' + destPath);
			this.logger.error(e);
		}
	    
	    return 1;
	}

	//compress file to buffer
	this.compressFileToBuffer = function(srcPathArray, isFolder) {
		if(!srcPathArray || !util.isArray(srcPathArray) || !srcPathArray.length) {
			return null;
		}
		
	    // create object
	    var zip 	= new AdmZip();
		var index 	= 0; 
		var number 	= srcPathArray.length;
		
		//create archive
		for(index = 0; index < number; index++) {
			try{
				if(isFolder) {
					zip.addLocalFolder(srcPathArray[index]);
				}
				else {
					zip.addLocalFile(srcPathArray[index]);
				}
			}
			catch(e) {
				this.logger.error('exception occurs when add file/folder to zip. ' + srcPathArray[index]);
				this.logger.error(e);
			}
		}
		
	    // output to buffer
		try{
		    return zip.toBuffer();
		}
		catch(e) {
			this.logger.error('exception occurs when write to buffer.');
			this.logger.error(e);
		}

		return null;
	}
*/


	
		
	//download file from remote server to local file. first download file totally, if failed, then start range download.
	//first download file to temp file, it failed, remove the temp file; if success, rename the temp file to formal file name.
	this.downloadFile = function(fileURL, targetPath, cookie, playerProxy, callback) {
  		var Emitter 				= require('events').EventEmitter;
		var emitter					= (new Emitter);
		var tempFilePath 			= targetPath;
		var lastModifiedTime 		= '';
		var fileContentLength 		= 0;
		var fileDownloadedLength 	= 0;
		var retries 				= 0;
		var that					= this;
		var myCookie 				= null;
		var proxyURL				= '';
		var start 					= new Date().getTime(); //for calc download speed
		var curTime 				= new Date();
							
//console.log('fileURL=' +fileURL);
//console.log('targetPath=' +targetPath);
//console.log('cookie=' +cookie);

		var downloadByNeedle = function(fileURL, cookie, proxy, timeout, lmt, range, head, cb) {
			var proxyURL 	= '';
			var urlObj 		= {};
			var rangeString = '';
			var headerObj 	= {};
			var optionObj 	= {};
			var bypass		= false;
			
			if(!fileURL) {
				return cb(4, null, '');
			}
			
			urlObj = url.parse(fileURL);
			
			//check bypass or not
			var tempUrlObj = {};
			tempUrlObj = url.parse(fileURL);
			if(proxy && proxy.bypass && util.isArray(proxy.bypass)) {
				bypass = matchByPass(proxy, tempUrlObj);
			}
			
			if(!bypass && proxy && proxy.host && proxy.port) {
				proxyURL = urlObj.protocol + '//' + proxy.host + ':' + proxy.port;
			
				if(proxy && proxy.id && proxy.pwd) {
					optionObj.username = proxy.id;
					optionObj.password = proxy.pwd;
				} 
			} 
/*		
			if(range && range.start && range.end && (range.start < range.end)) {
				if(range.size){
					rangeString = 'bytes=' + range.start + '-' + (range.start + range.size);
				}
				else {
					rangeString = 'bytes=' + range.start + '-' + range.end;
				}
			}
			else {
				rangeString = 'bytes=' + 0 + '-' + range.size;
			}
*/			
			if(range) {
 				if(range.start < range.end) {
					if(range.size && ((range.start + range.size) < range.end)){
						rangeString = 'bytes=' + range.start + '-' + (range.start + range.size);
					}
					else {
						rangeString = 'bytes=' + range.start + '-' + range.end;
					}
				}
				else {
					rangeString = 'bytes=' + 0 + '-' + range.size;
				}
			}
			
			headerObj.Connection = 'keep-alive';
			headerObj.Accept = '*/*';
that.logger.debug('If-Modified-Since=' + lmt);
			if(lmt) {
				headerObj['If-Modified-Since'] = lmt;
			}
			
			if(cookie) {
				headerObj.Cookie = cookie;
			}
			
			optionObj.timeout = timeout;
			optionObj.headers = headerObj;
			if(proxyURL) {
				optionObj.proxy = proxyURL;
			}

			//not parse xml and json
			optionObj.parse = false;
			
			if(head) {
				needle.head(fileURL, optionObj, function(err, resp, body) {
					return cb(err, resp, body);
				});
			}
			else {
				if(rangeString) {
					optionObj.headers.Range = rangeString;
				}
			

				needle.get(fileURL, optionObj, function(err, resp, body) {
					return cb(err, resp, body);
				});
			}
		}
		
		var waitAMoment = function() {
			//send active time back to parent process
			var now = new Date();
			if((curTime.getTime() + that.config.playersettings.defaultinterval) < now.getTime()) {
				process.send({'action' : 'HB', 'HBTime': new Date() });
				that.logger.debug('download process send message to server from downloadFile function for HBTime: ' + now);
//console.log('download process send message to server from downloadFile function for HBTime: ' + now);
				curTime = now;
			}
			
			downloadByNeedle(fileURL, myCookie, playerProxy, that.config.playersettings.downloadtimeout, lastModifiedTime, 
						{'start': fileDownloadedLength, 'end' : fileContentLength - 1, 'size': that.config.playersettings.rangesize || 0}, false, function(err, res, content) {
				emitter.emit('GetContent', err, res, content);
			});
		}
		
		emitter.on('GetContent', function(err, res, content) {
			var writeMode = 'a';
			var downloadspeed = 0;
			
			if((err && !res) || (res && (res.statusCode !== 200) && (res.statusCode !== 206) && (res.statusCode !== 304))) { //fail to download, will retry, but can not just judge it by error because needle download file success and return erorr string, such as SyntaxError: Unexpected token '
console.log('download file error');
console.log(fileURL);
				that.logger.error("error occurs when download file.");
				that.logger.error(err);
				that.logger.error('fileURL=' + fileURL);

				if(res) {
					that.logger.error('res.statusCode= ' + res.statusCode);
					that.logger.error(util.inspect(res, true, null));
					if((res.statusCode >= 400) && (res.statusCode < 500)) {
						return callback(21);
					}
				}
				else {
					that.logger.error('empty res.');
				}

				retries = retries + 1;
				that.logger.error('failed: ' + retries + ' times.');
				if(retries >= that.config.playersettings.downloadretrytimes) {
					that.logger.error('fail to download file for %d times for the same segment, will not retry any more.', retries);
					try {
						if(fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);						
					}
					catch(e) {
						that.logger.error('error occur during delete temp file(%s), error = ', tempFilePath);
						that.logger.error(e);	
					}
					
					return callback(15);
				}
				else {
					setTimeout(waitAMoment, that.config.playersettings.rangefailbaseinterval * retries);
				}
			}
			else {
				if(res) {
//console.log('res.statusCode='+res.statusCode);
					if((res.statusCode === 200) || (res.statusCode === 206)) {
						if(fileDownloadedLength === 0) {
							writeMode = 'w';
						}
						
						if(content) { //save content to temp file and update download file length
							retries = 0;
							fileDownloadedLength += content.length;
//console.log('new fileContentLength='+fileContentLength);
//console.log('fileDownloadedLength='+fileDownloadedLength);
							that.logger.debug('got new data %d bytes, total got %d bytes', content.length, fileDownloadedLength);
							that.writeContent2File(tempFilePath, writeMode, content, function(err) {
								if(err) {
									that.logger.error('failed to write temp file(%s), will exit.', tempFilePath);
									that.logger.error(err);
				
									//remove temp file
									fs.exists(tempFilePath, function(exists) {
										if(exists) {
											fs.unlink(tempFilePath, function (err1) {
												if(err1) { 
													that.logger.error('failed to remove temp file(%s).', tempFilePath);
													that.logger.error(err1);
												}
												return callback(err);
											});
										}
				
										return callback(err);
									});
								}
				
								if(fileDownloadedLength >= fileContentLength) {
									that.logger.debug('the got data length: ' + fileDownloadedLength + '   the expected length: ' + fileContentLength);
									
									//calculate download speed
									if(res && ((res.statusCode === 200) || (res.statusCode === 206)) && content) {
										if(fileContentLength > 2048) {
											var end = new Date().getTime();
											var speed = 1000 * fileContentLength / ((end - start) * 1024);
											
											if(speed < 1) {
												downloadspeed = (speed * 1024).toFixed(2) + ' Byte/s';
											}
											else if(speed >= 1024) {
												downloadspeed = (speed / 1024).toFixed(2) + ' MB/s';
											}
											else {
												downloadspeed = speed.toFixed(2) + ' KB/s';
											}
										}
									}
									
									var renameTempFile = function(tempFilePath, targetPath, targetExist, callback) {
										var logString = 'target file does not exist.';
										if(targetExist) {
											logString = 'target file exist.';
										}
										
										fs.rename(tempFilePath, targetPath, function(err) {
											if(err) {
												that.logger.error(logString);
												that.logger.error('failed to rename temp file(%s) to target(%s).', tempFilePath, targetPath);
												that.logger.error(err);
												
												var retry = 0;
												var success = true;
												for(retry = 0 ; retry < 5; retry++) {
													success = true;
													
													try {
														fs.renameSync(tempFilePath, targetPath);
													}
													catch(e) {
														that.logger.error('retried %d times to rename file, but still fail.', retry);
														success = false;
													}
													
													if(success === true) {
														break;
													}
												}
												
												if(retry >= 5) {
													that.logger.error('fail to rename temp file to target, will remove the temp file.');
													fs.unlink(tempFilePath, function(err1) {
														if(err1) {
															that.logger.error('removed old file, temp file can not be rename. But failed to remove it.');
															that.logger.error(err1);
														}
														
														return callback(err);
													});
												}
											}
											
											return callback(0);
										});
									}
									
									fs.exists(targetPath, function(exists) {
										if(exists) {
											fs.unlink(targetPath, function (err) {
												if(err) { 
													that.logger.error('failed to remove target file(%s).', targetPath);
													that.logger.error(err);
													
													fs.unlink(tempFilePath, function(err1) {
														if(err1) {
															that.logger.error('fail to remove old file, but temp file also can not be removed.');
															that.logger.error(err1);
														}
														
														return callback(err);
													});
												}
												
that.logger.debug('rename temp file to target. ' + targetPath);
												renameTempFile(tempFilePath, targetPath, true, function(err) {
													if(err) {
														return callback(err);
													}
													
													return callback(0, downloadspeed);
												});
											});
										}
										else {
that.logger.debug('target does not exist. rename temp file to target. ' + targetPath);
											renameTempFile(tempFilePath, targetPath, false, function(err) {
												if(err) {
													return callback(err);
												}
												
												return callback(0, downloadspeed);
											});
										}
									});
								}
								else {
									setTimeout(waitAMoment, 100);
								}
							});
						}
						else { //no content
							that.logger.error('return 200, but no content.')
							return callback(18);
						}
					}
					else if(res.statusCode === 304) {
						that.logger.debug('the file is fresh, need not to download again. fileURL=' + fileURL);
						return callback(0, 0);
					}
				}
				else { //the first calling
					setTimeout(waitAMoment, 100);
				}
			}
		});

		//entry
		if(!targetPath || !fileURL) {
			that.logger.error('parameter error in downloadFile().');
			that.logger.error('targetPath=' + targetPath + '            fileURL='+fileURL);
			return callback(4);
		}

		var nowString = new Date().valueOf() + '';
		tempFilePath += nowString;
		
		myCookie = cookie;

		that.getFileLastModifiedTime(targetPath, function(err, lmt) {
			if(!err) lastModifiedTime = lmt;
			
			downloadByNeedle(fileURL, myCookie, playerProxy || null, that.config.playersettings.downloadtimeout, lastModifiedTime, 
				null, true, function(err, res, content) {

				if((err && !res) || (res && (res.statusCode !== 200) && (res.statusCode !== 206) && (res.statusCode !== 304))) {
console.log('download file error');
console.log(fileURL);
					that.logger.error('download file error:' + fileURL);
					if(res) {
						that.logger.error('res.statusCode =' + res.statusCode );
						if((res.statusCode >= 400) && (res.statusCode < 500)) {
							return callback(21);
						}
						else {
							return callback(15);
						}
					}
					else {
						that.logger.error('res is invalid.');
						return callback(15);
					}
				}
				
				if(res && (res.statusCode === 304)) {
					that.logger.debug('the file is fresh, need not to download again. fileURL=' + fileURL);
					return callback(0, 0);
				}
				
				fileContentLength = parseInt(res.headers['Content-Length'] || res.headers['content-length'], 10);
				
				if(!fileContentLength) {
					return callback(15);
				}
				
				emitter.emit('GetContent', 0, null, '');
			});
		});
	}
	
	
	//download file from remote server to local file. first download file totally, if failed, then start range download.
	//first download file to temp file, it failed, remove the temp file; if success, rename the temp file to formal file name.
	this.downloadFile2 = function(fileURL, targetPath, cookie, playerProxy, callback) {
  		var Emitter 				= require('events').EventEmitter;
		var emitter					= (new Emitter);
		var tempFilePath 			= targetPath;
		var lastModifiedTime 		= '';
		var fileContentLength 		= 0;
		var fileDownloadedLength 	= 0;
		var retries 				= 0;
		var shredReq 				= null;
		var that					= this;
		var dataContent 			= null;
		var myCookie 				= null;
		var proxyURL				= '';
							
console.log('fileURL=' +fileURL);
console.log('targetPath=' +targetPath);
console.log('cookie=' +cookie);

		var nowString = new Date().valueOf() + '';
		tempFilePath += nowString;
		
		myCookie = cookie;
/*
*/
		if(playerProxy && playerProxy.host && playerProxy.port) {
			proxyURL = playerProxy.host + ':' + playerProxy.port;
		} 
console.log('proxyURL=' +proxyURL);

		//range download
		var downloadPartial = function(start, end) {
			var partialReq = shred.get({
				url: fileURL,
				headers: {
					Connection: 'keep-alive',
					Accept: '*/*',
					Range: 'bytes=' + start + '-' + end,
					proxy : proxyURL,
					Cookie: myCookie
				},
				timeout: that.config.playersettings.downloadtimeout,
				on: {
						// get partial data
						206: function(response) {
							// get partial data, return it to caller.
							that.logger.debug('got data by 206, invoke event.' + response.content.data.length);
							emitter.emit('gotdata', response.content.data);
							return;
						},
						
						// get data
						200: function(response) {
							// get partial data, return it to caller.
							that.logger.debug('got data by 200, invoke event.');
							emitter.emit('gotdata', response.content.data);
							return;
						},
						
						// Any other response means something's wrong
						response: function(response) {
							that.logger.error('Oh, failed!');
							that.logger.error(util.inspect(response, true, null));
							emitter.emit('fail');
							return;
						}
				}
			});	
			partialReq.emitter.on('request_error', function(err) {
				emitter.emit('fail');
				return;
			});
				
			partialReq.emitter.on('timeout', function(req) {
				emitter.emit('fail');
				return;
			});
		}
	
		emitter.on('gotdata', function(chunk) {
			retries = 0;
			fileDownloadedLength += chunk.length;
				
			that.logger.debug('new got data %d bytes, total got %d bytes', chunk.length, fileDownloadedLength);
			that.writeContent2File(tempFilePath, 'a', chunk, function(err) {
				if(err) {
					that.logger.error('failed to write temp file(%s), will exit.', tempFilePath);

					//remove temp file
					fs.exists(tempFilePath, function(exists) {
						if(exists) {
							fs.unlink(tempFilePath, function (err1) {
								if(err1) { 
									that.logger.error('failed to remove temp file(%s).', tempFilePath);
									that.logger.error(err1);
								}
								return callback(err);
							});
						}

						return callback(err);
					});
				}

				if(fileDownloadedLength >= fileContentLength) {
					that.logger.debug('the got data length: ' + fileDownloadedLength + '   the expected length: ' + fileContentLength);
					
					fs.exists(targetPath, function(exists) {
						if(exists) {
							fs.unlink(targetPath, function (err) {
								if(err) { 
									that.logger.error('failed to remove target file(%s).', targetPath);
									that.logger.error(err);
									
									fs.unlink(tempFilePath, function (err1) {
										if(err1) { 
											that.logger.error('failed to remove old file, but also failed to remove temp file(%s).', tempFilePath);
											that.logger.error(err1);
										}
										return callback(err);
									});
								}
								
								fs.rename(tempFilePath, targetPath, function(err) {
									if(err) {
										that.logger.error('failed to rename temp file(%s) to target(%s).', tempFilePath, targetPath);
										that.logger.error(err);
										
										fs.unlink(tempFilePath, function (err1) {
											if(err1) { 
												that.logger.error('failed to rename old file, but also failed to remove temp file(%s).', tempFilePath);
												that.logger.error(err1);
											}
											return callback(err);
										});
									}
									
									return callback(0);
								});
							});
						}
						else {
							fs.rename(tempFilePath, targetPath, function(err) {
								if(err) {
									that.logger.error('failed to rename temp file(%s) to target(%s).', tempFilePath, targetPath);
									that.logger.error(err);
									
									fs.unlink(tempFilePath, function (err1) {
										if(err1) { 
											that.logger.error('failed to rename old file, but also failed to remove temp file(%s).', tempFilePath);
											that.logger.error(err1);
										}
										return callback(err);
									});
								}
								
								return callback(0);
							});
						}
					});
				}
				else {
					setTimeout(downloadPartial, that.config.playersettings.rangeinterval, [fileDownloadedLength], [fileContentLength]);
				}
			});
		});
		
		emitter.on('fail', function() {
			that.logger.error('enter fail event. failed: ' + retries);
		
			retries = retries + 1;
			if(retries >= that.config.playersettings.downloadretrytimes) {
				that.logger.error('fail to get File %d times.', retries);
				try {
						if(fs.existsSync(tempFilePath))	fs.unlinkSync(tempFilePath);					
				}
				catch(e) {
					that.logger.error('error occur during delete temp file(%s), error = ', tempFilePath);
					that.logger.error(e);	
				}
				
				return callback('Fail to get File.');
			}
			else {
				setTimeout(downloadPartial, that.config.playersettings.rangefailbaseinterval * retries, [fileDownloadedLength], [fileContentLength]);
			}
		});

		if(targetPath) {
			that.getFileLastModifiedTime(targetPath, function(err, lmt) {
//console.log('get last modify time from ' + targetPath);
//console.log(lmt);

//console.log('fileURL= ' + fileURL);
//console.log('myCookie= ' + myCookie);

				if(!err) lastModifiedTime = lmt;

				shredReq = shred.get({
					url: fileURL,
					headers: {
						Connection: 'keep-alive',
						Accept: '*/*',
						"If-Modified-Since": lastModifiedTime,
						Cookie: cookie
					},
					proxy : proxyURL,
					timeout: that.config.playersettings.downloadtimeout,
					on: {
							// got new file, maybe not entirely, if so, need to range download.
							200: function(response) {
console.log(response);
								fileContentLength = parseInt(response.headers['Content-Length']);
								if(response.headers['Content-Type'] === 'application/json') {
									fileDownloadedLength = response.content._body.length;
								}
								else {
									fileDownloadedLength = response.content.data.length;
								}
								
								if(response.headers['Set-Cookie']) {
//									myCookie = response.headers['Set-Cookie'];
//console.log('myCookie= ' + myCookie);
								}
								else if(response.headers['set-cookie']) {
//									myCookie = response.headers['set-cookie'];
//console.log('myCookie= ' + myCookie);
								}
//console.log('fileDownloadedLength= ' + fileDownloadedLength);
//console.log('fileContentLength= ' + fileContentLength);
								if(fileDownloadedLength === fileContentLength) {
									that.logger.debug('got entire data.');
									
									if(response.headers['Content-Type'] === 'application/json') {
										dataContent = response.content._body;
									}
									else {
										dataContent = response.content.data;
									}

									that.writeContent2File(targetPath, 'w', dataContent, function(err) {
										return callback(err);
									});
								}
								else {//start range download
									that.logger.debug('got data %d bytes, total %d bytes', fileDownloadedLength, fileContentLength);
									that.writeContent2File(tempFilePath, 'w', response.content.data, function(err) {
										if(err) 
											return callback(err);
									});

									setTimeout(downloadPartial, that.config.playersettings.rangefailbaseinterval, [fileDownloadedLength], [fileContentLength]);
								}
							},
							
							// cache is valid
							304: function(response) {
								that.logger.debug('the file is fresh, need not to download again.')
								return callback(null);
							},
							
							// Any other response means something's wrong
							response: function(response) {
								that.logger.debug("Oh no!");
								that.logger.error(util.inspect(response, true, null));
								return callback('error occur');
							}
					}
				});
				
				shredReq.emitter.on('request_error', function(err) {
console.log('request_error:' + err);
					return callback('request_error');
				});
					
				shredReq.emitter.on('timeout', function(req) {
console.log('timeout.');
					return callback('timeout.');
				});
			});
		}
	}
	
	
	//for schedule parse and merge
	this.getDataObj = function(localPath) {
		var dataObj = {};
		var data 	= null;
		var stats 	= null;
		var exist	= false;
		
		if(!localPath) { return null; }
		
		try{
			exist = fs.existsSync(localPath);
		}
		catch(e) { 
			if(this.logger) this.logger.error('exception occurs when check data file (%s) existence.', localPath);
			if(this.logger) this.logger.error(e);
			return null; 
		}
		
		if(!exist) {
			return null;
		}
		
		try{
			stats = fs.statSync(localPath);
		}
		catch(e) { 
			if(this.logger) this.logger.error('exception occurs when check data file--- ' + localPath);
			if(this.logger) this.logger.error(e);
			return null; 
		}
	
		if(!stats) { if(this.logger) this.logger.error('file does not exist'); return null; }
	
		try {
			data = fs.readFileSync(localPath, 'utf8'); //without encoding, will return buffer type data
		}
		catch(e) {
			if(this.logger) this.logger.error('exception occurs when read data file. ' + localPath);
			if(this.logger) this.logger.error(e);
			return null; 
		}
	
		if(!data) { 
			if(this.logger) this.logger.error('Can not get data file content from --- ' + localPath);
			return null;
		}
		
		try {
			dataObj = JSON.parse(data);
		}
		catch(e) {
			if(this.logger) logger.error('encounter problems when parse file.');
			if(this.logger) logger.error(e); 
			if(this.logger) logger.error('data=' + data);
			dataObj = null;
//console.log('encounter problems when parse file.');
//console.log(e); 
//console.log('data=' + data);
		}
		
		if(!dataObj) {
			if(this.logger) this.logger.error('Failed to parse data file.');
			if(stats.size < 1024 * 20 && this.logger) this.logger.error(data);
			return null;
		}
	
		return dataObj;		
	}
	
	
	
	this.buildTimeString = function(hours, minutes, seconds, mseconds) {//to hh:mm:ss.mmm
		var timeString = '';
		
		if(hours < 10) { timeString += '0' + hours + ':'; }
		else { timeString += hours + ':'; }
		
		if(minutes < 10) { timeString += '0' + minutes + ':'; }
		else { timeString += minutes + ':'; }
		
		if(seconds < 10) { timeString += '0' + seconds + '.'; }
		else { timeString += seconds + '.'; }

		if(mseconds < 10) { timeString += '00' + mseconds; }
		else if(mseconds < 100) { timeString += '0' + mseconds; }
		else { timeString += mseconds; }
		
		return timeString;
	}
	
	this.buildDateTimeString = function(year, month, day, hours, minutes, seconds, mseconds) {//to yyyy:mm:dd:hh:mm:ss.mmm
		var timeString = '';
		
		if(year < 10) { timeString += '000' + year + ':'; }
		else if(year < 100) { timeString += '00' + year + ':'; }
		else if(year < 1000) { timeString += '0' + year + ':'; }
		else { timeString += year + ':'; }
		
		if(month < 10) { timeString += '0' + month + ':'; }
		else { timeString += month + ':'; }
		
		if(day < 10) { timeString += '0' + day + ':'; }
		else { timeString += day + ':'; }
		
		if(hours < 10) { timeString += '0' + hours + ':'; }
		else { timeString += hours + ':'; }
		
		if(minutes < 10) { timeString += '0' + minutes + ':'; }
		else { timeString += minutes + ':'; }
		
		if(seconds < 10) { timeString += '0' + seconds + '.'; }
		else { timeString += seconds + '.'; }

		if(mseconds < 10) { timeString += '00' + mseconds; }
		else if(mseconds < 100) { timeString += '0' + mseconds; }
		else { timeString += mseconds; }
		
		return timeString;
	}
	
	this.getMilliseconds = function(timeString) {//yyyy:mm:dd:hh:mm:ss.mmm
		var timeArray = [];
		var secondArray = [];
		var tempDateObj = null;
		
		timeArray = timeString.split(':');
		if(timeArray.length === 6) {
			secondArray = timeArray[5].split('.');
			tempDateObj = new Date(timeArray[0], parseInt(timeArray[1], 10) - 1, timeArray[2], timeArray[3], timeArray[4], secondArray[0], secondArray[1] || '000');
			
			return tempDateObj.getTime();
		}
		else {
			return 0;
		}
	}
	
	this.getMillisecondsInDay = function(timeString) {//yyyy:mm:dd:hh:mm:ss.mmm
		var timeArray = [];
		var hours	  = 0;
		var minutes	  = 0;
		var seconds	  = 0;
		
		timeArray = timeString.split(':');
		if(timeArray.length === 6) {
			hours = parseInt(timeArray[3], 10);
			minutes = parseInt(timeArray[4], 10);
			seconds = parseFloat(timeArray[5]);
		}
		else {
			hours = parseInt(timeArray[0], 10);
			minutes = parseInt(timeArray[1], 10);
			seconds = parseFloat(timeArray[2]);
		}
		
		return Math.floor((hours * 3600 + minutes * 60 + seconds) * 1000);
	}
	
	this.millisecondsInDay2String = function(milliseconds) {//to hh:mm:ss.mmm
		var timeString= '';
		var hours	  = 0;
		var minutes	  = 0;
		var seconds	  = 0;
		var mseconds  = 0;
		
		hours = Math.floor(milliseconds / 3600000);
		minutes = Math.floor((milliseconds % 3600000) / 60000);
		seconds = Math.floor((milliseconds % 60000) / 1000);
		mseconds = milliseconds % 1000;
		
		hours = hours % 24;
		
		return this.buildTimeString(hours, minutes, seconds, mseconds);
	}
	
	this.dateString2Obj = function(strDate) { //be careful, month need to decrease 1 when create date, 0 means Jan, 1 means Feb. 
		var dateArray = [];
		var dateObj	  = null;
		var seconds	  = 0;
		var mseconds  = 0;
		
		if(strDate) {
			dateArray = strDate.split(':');
			if(dateArray.length === 3) { dateObj = new Date(parseInt(dateArray[0], 10), parseInt(dateArray[1], 10) - 1, parseInt(dateArray[2], 10)); }
			else { 
				seconds = Math.floor(parseFloat(dateArray[5]));
				mseconds = Math.ceil(parseFloat(dateArray[5]) * 1000 % 1000);
				dateObj = new Date(parseInt(dateArray[0], 10), parseInt(dateArray[1], 10) - 1, parseInt(dateArray[2], 10), 
							parseInt(dateArray[3], 10), parseInt(dateArray[4], 10), seconds, mseconds); 
			}
		}
		
		return dateObj;
	}
	
	this.mergeDateTime = function(dateString, timeString) {
		var dateArray = [];
		var timeArray = [];
		var newString = '';
		
		dateArray = dateString.split(':');
		timeArray = timeString.split(':');
		if(timeArray.length === 3)
			newString = dateArray[0] + ':' + dateArray[1] + ':' + dateArray[2] + ':' + timeArray[0] + ':' + timeArray[1] + ':' + timeArray[2];
		else 
			newString = dateArray[0] + ':' + dateArray[1] + ':' + dateArray[2] + ':' + timeArray[3] + ':' + timeArray[4] + ':' + timeArray[5];
		
		return newString;
	}
	
	this.getNextDay = function(dateString) { //output string in yyyy:mm:dd:hh:mm:ss.mmm
		var dateArray	= [];
		var nextDayString = '';
		var year 		= 0;
		var month		= 0;
		var date		= 0;
		var hourstr	    = '00';
		var minutestr	= '00';
		var secondstr	= '00.000';
		var tempDateObj = null;
		var tempNumber  = 0;
		
		dateArray = dateString.split(':');
		if(dateArray.length === 3) {
			year = parseInt(dateArray[0], 10); 
			month = parseInt(dateArray[1], 10); 
			date = parseInt(dateArray[2], 10); 
		}
		else {
			year = parseInt(dateArray[0], 10); 
			month = parseInt(dateArray[1], 10); 
			date = parseInt(dateArray[2], 10); 
			hourstr = dateArray[3]; 
			minutestr = dateArray[4]; 
			secondstr = dateArray[5]; 
		}
	
		tempNumber = Date.UTC(year, month - 1, date);
		tempNumber += 86400000;
		
		tempDateObj = new Date(tempNumber);
		
		nextDayString = tempDateObj.toISOString().slice(0, 10).replace(/\-/g, ':');
		nextDayString += ':' + hourstr + ':' + minutestr + ':' + secondstr;
	
		return nextDayString;
	}
	
	this.withinRange = function(start1, end1, start2, end2) {
		var tempStart = '';
		var tempEnd = '';
		
		if(start2.length === 10) { tempStart = start2 + ':00:00:00.000'; }
		else { tempStart = start2; }
		if(end2.length === 10) { tempEnd = end2 + ':24:00:00.000'; }
		else { tempEnd = end2; }
		
		if((start1 < tempEnd) && (end1 > tempStart)) { 
			return true;
		}
		else
			return false;
	}
	
	//input are milliseconds number
	this.withinRange2 = function(start1, end1, start2, end2) {
		if((start1 < end2) && (end1 > start2)) { 
			return true;
		}
		else
			return false;
	}
	

	this.buildMediaObj = function(playlistObj, zoneObj, mediaArray, mediaIndex) {
		if(!playlistObj || !zoneObj || !mediaArray || !util.isArray(mediaArray) || !mediaArray.length || (mediaIndex < 0)) {
			return null;
		}
/*			
			var clone = function(srcObj) {
				var mediaObj = {};
			
				for(var key in srcObj) {
		            if ( typeof(srcObj[key]) === 'object' )
		            { 
		            	mediaObj[key] = clone(srcObj[key]);
		            }
		            else
		            {
		                mediaObj[key] = srcObj[key];
		            }
				}
				
				return mediaObj;
			}
*/			
		var mediaObj = {};
		mediaObj = this.clone(mediaArray[mediaIndex]);
if(mediaObj.type === 'inlineEventZoneWidget') {
//	console.log(JSON.stringify(mediaObj, '', 4));
		//if(this.logger) this.logger.error('mediaObj--- ' + JSON.stringify(mediaObj, '', 4));
}			
        mediaObj.zorder 	= zoneObj.zorder;
        mediaObj.zoneDesignWidth = zoneObj.width;
        mediaObj.zoneDesignHeight = zoneObj.height;
        mediaObj.width 		= parseInt(zoneObj.width, 10) / parseInt(playlistObj.width) + '';
        mediaObj.height 	= parseInt(zoneObj.height, 10) / parseInt(playlistObj.height) + '';
        mediaObj.name 		= zoneObj.name;
        mediaObj.id 		= zoneObj.id;
        mediaObj.lockRatio 	= zoneObj.lockRatio;
        mediaObj.shuffle 	= zoneObj.shuffle;
        mediaObj.left 		= parseInt(zoneObj.x, 10) / parseInt(playlistObj.width) + '';
        mediaObj.top 		= parseInt(zoneObj.y, 10) / parseInt(playlistObj.height) + '';
if(mediaObj.type === 'inlineEventZoneWidget') {
		//	console.log(JSON.stringify(mediaObj, '', 4));					
			//if(this.logger) this.logger.error('mediaObj--- ' + JSON.stringify(mediaObj, '', 4));
}			
            
        return mediaObj;
	}

	this.shuffleArray = function(oneArray) {
		var temp = null;
		var arraySize = oneArray.length;
		
		var newArray = new Array(arraySize);
		for(var i = 0; i < arraySize; i++) {
			newArray[i] = {};
			newArray[i].start = parseInt(oneArray[i].start, 10);
			newArray[i].dur = parseInt(oneArray[i].dur, 10);
		}
		
		for(var i = 0; i < arraySize; i++) {
			var d = Math.floor(Math.random() * 10000) % (arraySize - i); 
		   	temp = null;
		   	temp = oneArray[d];
		    oneArray[d] = oneArray[arraySize - i - 1];	
		    oneArray[arraySize - i - 1] = temp;
		}
		
		oneArray[0].start = newArray[0].start;
		for(var i = 1; i < arraySize; i++) {
			var diff = newArray[i].start - (newArray[i - 1].start + newArray[i - 1].dur);
			oneArray[i].start = parseInt(oneArray[i - 1].start, 10) + parseInt(oneArray[i - 1].dur, 10) + diff + '';
		}	
				
		return oneArray;	
	}
	
	this.buildMediaArray = function(playlistObj, playlistDuration) {
		if(!playlistObj || !playlistObj.filedata || !playlistObj.filedata.zones || (playlistDuration <= 0)) {
			return null;
		}
		
		var mediaArray = [];
		var zoneIndex = 0, zoneNumber = playlistObj.filedata.zones.length;
			
//console.log('zoneNumber=' + zoneNumber);
		for(zoneIndex = 0; zoneIndex < zoneNumber; zoneIndex ++) {
			var startTime = 0;
			var zoneStartTime = 0;
			var zoneDuration = playlistDuration;
			
			if(playlistObj.filedata.zones[zoneIndex].media) {
				playlistObj.filedata.zones[zoneIndex].media.sort(function(a, b) {
					var startA = parseInt(a.start, 10);
					var startB = parseInt(b.start, 10);
					
					if(startA > startB) return 1;
					else if(startA < startB) return -1;
					else return 0;
				});
				
				zoneStartTime = parseInt(playlistObj.filedata.zones[zoneIndex].media[0].start, 10);
			}
			else if(playlistObj.filedata.zones[zoneIndex].start) {
				zoneStartTime = parseInt(playlistObj.filedata.zones[zoneIndex].start, 10);
			}
			
			if(playlistObj.filedata.zones[zoneIndex].stop) {
				zoneDuration = parseInt(playlistObj.filedata.zones[zoneIndex].stop, 10) - zoneStartTime;
			}
			
			startTime = zoneStartTime;
//console.log('zoneIndex=' + zoneIndex + '   zonename=' + playlistObj.filedata.zones[zoneIndex].name);
//console.log('startTime=' + startTime);
//console.log('zoneStartTime=' + zoneStartTime);
//console.log('zoneDuration=' + zoneDuration);
				
			while(startTime < (zoneStartTime + zoneDuration)) {
				var tempMediaArray = [];
				if(playlistObj.filedata.zones[zoneIndex].media) {
					if(playlistObj.filedata.zones[zoneIndex].shuffle && (playlistObj.filedata.zones[zoneIndex].shuffle === 'true')) {
//console.log('before shuffle');
//console.log(playlistObj.filedata.zones[zoneIndex].media);
						tempMediaArray = this.shuffleArray(playlistObj.filedata.zones[zoneIndex].media);
//console.log('after shuffle');
//console.log(playlistObj.filedata.zones[zoneIndex].media);
					}
					else {
						tempMediaArray = playlistObj.filedata.zones[zoneIndex].media;
					}
				}
				else {
					tempMediaArray = [];
					break;
				}

				var zoneMediaNumber = tempMediaArray.length;
				var zoneMediaIndex = 0;
				var mediaObj = {};
				for(zoneMediaIndex = 0; zoneMediaIndex < zoneMediaNumber; zoneMediaIndex++) {
					if(zoneMediaIndex !== 0) { //for the case that media is not continuous
						startTime += parseInt(tempMediaArray[zoneMediaIndex].start, 10) - 
							(parseInt(tempMediaArray[zoneMediaIndex - 1].start, 10) + parseInt(tempMediaArray[zoneMediaIndex - 1].dur, 10));
					}
					
					if(startTime < (zoneStartTime + zoneDuration)) {
						mediaObj = {};
						mediaObj = this.buildMediaObj(playlistObj, playlistObj.filedata.zones[zoneIndex], tempMediaArray, zoneMediaIndex);
						mediaObj.start = startTime + '';
						
						var dur = parseInt(mediaObj.dur, 10);
						if((startTime + dur) > (zoneStartTime + zoneDuration)) {
							mediaObj.dur = ((zoneStartTime + zoneDuration) - startTime) + '';
						}
							
//if(playlistObj.filedata.zones[zoneIndex].shuffle && (playlistObj.filedata.zones[zoneIndex].shuffle === 'true')) {
//console.log('mediaObj');
//console.log(mediaObj);
//}
//console.log('mediaObj=');
//console.log(mediaObj);
						mediaArray.push(mediaObj);
						
//						if(mediaObj.type === 'inlineEventZoneWidget'){
//							startTime += playlistDuration;
//						}
//						else {
							startTime += parseInt(mediaObj.dur, 10);
//						}
					}
					else {
						break;
					}
				}
				
				if(zoneMediaIndex < zoneMediaNumber) {
					break;
				}
				
				if(!playlistObj.filedata.zones[zoneIndex].zoneloop || (playlistObj.filedata.zones[zoneIndex].zoneloop !== 'true')) {
					break;
				}
			}
		}
			
//console.log('mediaArray=');
//console.log(mediaArray);
		return mediaArray;
	}
	
	//for caching the mapping ofmedia path to media local path
	var mediaPathMappingArray = [];
	var mediaHTTPPathMappingArray = [];
	this.cloneMediaArray = function(mediaArray, start, end, revision, playerConfig) {
		var newArray 	= [];
		var index 		= 0;
		var realIndex	= 0;
		var arraySize 	= 0;
		var mediaObj	= {};
		var newObj		= {};
		var duration	= 0;
		var startTime	= 0;
		var endTime		= 0;
		var httppath 	= '';
		var localPath 	= '';
		var that		= this;
		
		if(!start || !end || !revision || !mediaArray || !util.isArray(mediaArray) || !playerConfig) { return null; }
		
		arraySize = mediaArray.length;
		realIndex = 0;
		for(index = 0 ; index < arraySize; index++) {
			mediaObj = mediaArray[index];
			newObj = {};

		    newObj = this.clone(mediaObj);
		    
//			    newObj.vol = '1';
		    if(newObj.type !== 'inlineEventZoneWidget') {
			    if(mediaHTTPPathMappingArray && mediaHTTPPathMappingArray[newObj.path]) {
			    	newObj.httppath = mediaHTTPPathMappingArray[newObj.path];
			    }
			    else {
				    httppath = '/download/' + playerConfig.sitename + newObj.path;
				    mediaHTTPPathMappingArray[newObj.path] = httppath;
				    newObj.httppath = httppath;
			    }
			    
			    if(mediaPathMappingArray && mediaPathMappingArray[newObj.path]) {
			    	newObj.path = mediaPathMappingArray[newObj.path];
			    }
			    else {
				    localPath = path.normalize(this.fileLibPath + path.sep + playerConfig.sitename + newObj.path);
				    mediaPathMappingArray[newObj.path] = localPath;
				    newObj.path = localPath;
			    }
			    
			    newObj.revision = revision;
			    
				if(typeof start === 'string') {	startTime = parseInt(start); }
				else { startTime = start; }
				
				if(typeof end === 'string') { endTime = parseInt(end); }
				else { endTime = end; }
				
				if(typeof newObj.start === 'string') { newObj.start = parseInt(newObj.start, 10) + startTime; }
			    else { newObj.start += startTime; }
			    
            	if(newObj.type === 'video') {
            		newObj.httppath = newObj.httppath + '?zoneid=' + newObj.id;
				}
			    
			    if(newObj.start < endTime) {
					if(typeof newObj.dur === 'string') { duration = parseInt(newObj.dur, 10); }
				    else { duration = newObj.dur; }
				    
				    if((duration + newObj.start) > endTime) { newObj.dur = endTime - newObj.start}
				    else { newObj.dur = duration; }

if(this.config.logsettings.loglevel === 'debug') {
	newObj.startString = new Date(newObj.start).toString();				    
}
				    newArray[realIndex] = newObj;
				    realIndex++;
			    }
		    }
		    else {
				var tempObj = {};
		    	var tempMediaArray = [];
		    	tempMediaArray = newObj.inlineData.media || [];

				var convertMediaPath = function(mediaPath, mediaType, zoneid) {
					var pathObj = {};
					
				    if(mediaHTTPPathMappingArray && mediaHTTPPathMappingArray[mediaPath]) {
				    	pathObj.httppath = mediaHTTPPathMappingArray[mediaPath];
				    }
				    else {
					    httppath = '/download/' + playerConfig.sitename + mediaPath;
					    mediaHTTPPathMappingArray[mediaPath] = httppath;
					    pathObj.httppath = httppath;
				    }
				    
				    if(mediaPathMappingArray && mediaPathMappingArray[mediaPath]) {
				    	pathObj.path = mediaPathMappingArray[mediaPath];
				    }
				    else {
					    localPath = path.normalize(that.fileLibPath + path.sep + playerConfig.sitename + mediaPath);
					    mediaPathMappingArray[mediaPath] = localPath;
					    pathObj.path = localPath;
				    }
				    
				    pathObj.type = mediaType;
					if(mediaType === 'zip') {
						tempObj = {};
						tempObj = that.getZIPMediaType(pathObj.path, pathObj.httppath);
						if(tempObj.path && tempObj.httppath && tempObj.type) {
							pathObj.path 		= tempObj.path;									
							pathObj.httppath 	= tempObj.httppath;									
							pathObj.type 		= tempObj.type;									
						}
					}
					
	            	if(mediaType === 'video') {
	            		pathObj.httppath = pathObj.httppath + '?zoneid=' + zoneid;
					}
					
					return pathObj;
				}		    
				
				var tempPathObj = {};
		    	for(var x = 0 ; x < tempMediaArray.length; x++) {
		    		tempPathObj = convertMediaPath(tempMediaArray[x].path, tempMediaArray[x].type, newObj.id);
			    	tempMediaArray[x].httppath 	= tempPathObj.httppath;
			    	tempMediaArray[x].path 		= tempPathObj.path;
			    	tempMediaArray[x].type 		= tempPathObj.type;
		    	}
				    
				tempPathObj = convertMediaPath(newObj.inlineData.triggers.startButtonMedia, 'image', newObj.id);
				newObj.inlineData.triggers.startButtonHttpPath = tempPathObj.httppath;
				newObj.inlineData.triggers.startButtonLocalPath = tempPathObj.path;
				
				tempPathObj = convertMediaPath(newObj.inlineData.triggers.stopButtonMedia, 'image', newObj.id);
				newObj.inlineData.triggers.stopButtonHttpPath = tempPathObj.httppath;
				newObj.inlineData.triggers.stopButtonLocalPath = tempPathObj.path;				
			  newObj.revision = revision;
			    
				if(typeof start === 'string') {	startTime = parseInt(start); }
				else { startTime = start; }
				
				if(typeof end === 'string') { endTime = parseInt(end); }
				else { endTime = end; }
				
				if(typeof newObj.start === 'string') { newObj.start = parseInt(newObj.start, 10) + startTime; }
			    else { newObj.start += startTime; }
			    
			    if(newObj.start < endTime) {
					if(typeof newObj.dur === 'string') { duration = parseInt(newObj.dur, 10); }
				    else { duration = newObj.dur; }
				    
				    if((duration + newObj.start) > endTime) { newObj.dur = endTime - newObj.start}
				    else { newObj.dur = duration; }

if(this.config.logsettings.loglevel === 'debug') {
	newObj.startString = new Date(newObj.start).toString();				    
}
				    newArray[realIndex] = newObj;
				    realIndex++;
			    }
		    }
		}	
		
		return newArray;
	}

	//expand the media array into every playlist item in playlist array
	//cache the playlist object during this function's life cycle
	this.expandMedia = function(playlistArray, startTime, endTime, playerConfig) {
		var playlistArraySize 	= 0;
		var playlistIndex 		= 0;
		var playlistObj 		= {};
		var mediaArray 			= [];
		var mediaObj 			= {};
		var newMediaArray		= [];
		var baseTime			= 0;
		var playlistDuration	= 0;
		var fragmentStart		= 0;
		var fragment			= {};
		var fragmentArray		= [];
		var fragmentIndex		= 0;
		
		var calculatePlaylistDuration = function(playlist) {
			if(!playlist) { return 0; }
			
			return parseInt(playlist.dur, 10);
		}
		
//console.log('enter into ExpandMedia()');
		if(!playlistArray || !util.isArray(playlistArray) || !playerConfig) { return; }
		
		playlistArraySize = playlistArray.length;
//console.log('playlistArraySize=' + playlistArraySize);
		for(playlistIndex = 0; playlistIndex < playlistArraySize; playlistIndex ++) {
//console.log('playlistIndex=' + playlistIndex);
			playlistObj = this.getDataObj(playlistArray[playlistIndex].playlistlocalpath);
			if(playlistObj) {
				playlistDuration = calculatePlaylistDuration(playlistObj);
				playlistObj.duration = playlistDuration;
			}
			
			if(playlistObj && playlistObj.duration) {
				fragmentStart = playlistArray[playlistIndex].start;

				fragmentArray = [];
				fragmentIndex = 0;
//for generate rendercontent less than one day
//				while(fragmentStart < playlistArray[playlistIndex].end) {
				while((fragmentStart < playlistArray[playlistIndex].end) && (fragmentStart < endTime)) {
//
//console.log('fragmentStart=' + new Date(fragmentStart));
//console.log('playlistArray[playlistIndex].end=' + playlistArray[playlistIndex].end);
					newMediaArray = [];
					fragment = {};
					
					fragment.start = fragmentStart;
					fragment.end = fragmentStart + playlistObj.duration;
					if(fragment.end > playlistArray[playlistIndex].end) { fragment.end = playlistArray[playlistIndex].end; }
//for generate rendercontent less than one day
					if(fragment.end < startTime) { 
						fragmentStart = fragment.end;
						continue; 
					}
//
if(this.config.logsettings.loglevel === 'debug') {
	fragment.start1 = new Date(fragment.start).toString();
	fragment.end1 = new Date(fragment.end).toString();
}
//console.log('playlistObj=');
//console.log(playlistObj);
					var tempArray = this.buildMediaArray(playlistObj, playlistDuration); //shuffleMedia(playlistObj);
//console.log('tempArray=');
//console.log(tempArray);
					if(tempArray) { mediaArray = tempArray; }
					else { 
						mediaArray = []; 
					}
					
					newMediaArray = this.cloneMediaArray(mediaArray, fragment.start, fragment.end, playlistArray[playlistIndex].revision, playerConfig);

					fragment.media = newMediaArray;
					fragmentArray[fragmentIndex] = fragment;
					
					fragmentStart += playlistObj.duration;
					fragmentIndex++;
				}
					
//console.log('fragmentArray size=' + fragmentArray.length);
				playlistArray[playlistIndex].fragment = fragmentArray;
			}
		}
//console.log(process.memoryUsage());
//console.log('return from ExpandMedia()');
		return;
	}
	
	this.expandPlaylist = function(playlistObj, scheduleRangeArray, startDate, endDate, revision) {
		var tempObj 		= {};
		var start			= '';
		var end				= '';
		var startRange		= '';
		var endRange		= '';
		var indexDate		= '';
		var nextDate		= ''; //for weekly and monthly
		var tempDateObj		= null;//for weekly and monthly
		var day				= 0; //for weekly and monthly
		var dayArray		= []; //for weekly
	
		var timeArray		= []; //for hourly
		var hourlyEnd		= 0; //for hourly
		var hourlyStartTime	= 0; //for hourly
		var hourlyEndTime	= 0; //for hourly
		var hourlyDuration	= 0; //for hourly
		var tempTime		= 0; //for hourly
		var timeRange 		= 0;
		var timeString		= ''; //for hourly
		var date1String		= ''; //for hourly
		var date2String		= ''; //for hourly
		var playlistDuration= 0; //for hourly
	
		if(!playlistObj || !startDate || !endDate) { return; }
		
		if(!playlistObj.recurrence) {
			tempObj.start 			= this.getMilliseconds(playlistObj.start);
			tempObj.end 			= this.getMilliseconds(playlistObj.end);
			tempObj.objid 			= playlistObj._id;
			tempObj.playlistpath 	= playlistObj.playlistpath;
			tempObj.playlistlocalpath = playlistObj.playlistlocalpath;
			tempObj.revision	 	= revision;
			
			scheduleRangeArray.push(tempObj);
		}
		else {
			start 	= playlistObj.recurrencesetting.startdate;
			end 	= playlistObj.recurrencesetting.enddate;
			playlistDuration = this.getMillisecondsInDay(playlistObj.end) - this.getMillisecondsInDay(playlistObj.start);
			if(playlistDuration < 0) { playlistDuration += 86400000; }
			
			indexDate = start.slice(0, 10); 
			while(indexDate <= end) {
				if(playlistObj.recurrencesetting.recurrencetype !== 'hourly') {
					tempObj					= {};
					tempObj.objid 			= playlistObj._id;
					tempObj.playlistpath 	= playlistObj.playlistpath;
					tempObj.playlistlocalpath = playlistObj.playlistlocalpath;
					tempObj.revision	 	= revision;
					tempObj.start 			= this.mergeDateTime(indexDate, playlistObj.start);
					
					date1String = playlistObj.start.slice(0, 10);
					date2String = playlistObj.end.slice(0, 10);
					if(date1String === date2String) { tempObj.end = this.mergeDateTime(indexDate, playlistObj.end); } //the same day
					else { tempObj.end = this.mergeDateTime(this.getNextDay(indexDate), playlistObj.end); }  //across day
	
					if(this.withinRange(tempObj.start, tempObj.end, startDate, endDate)) {
if(this.config.logsettings.loglevel === 'debug') {
	tempObj.oldstart = tempObj.start;
	tempObj.oldend = tempObj.end;
}
						tempObj.start = this.getMilliseconds(tempObj.start);
						tempObj.end = this.getMilliseconds(tempObj.end);
					
						if(playlistObj.recurrencesetting.recurrencetype === 'daily') {
							scheduleRangeArray.push(tempObj);
						}
						else if(playlistObj.recurrencesetting.recurrencetype === 'weekly') {
							dayArray = playlistObj.recurrencesetting.weekly.split(',', 7);
							tempDateObj = this.dateString2Obj(indexDate);
							day = tempDateObj.getDay();//local time
							if(dayArray[day] === '1') {
								scheduleRangeArray.push(tempObj);
							}
						}
						else if(playlistObj.recurrencesetting.recurrencetype === 'monthly') {
							day = parseInt(playlistObj.recurrencesetting.monthly, 10);
							tempDateObj = this.dateString2Obj(indexDate);
							if(day === tempDateObj.getDate()) { //local time
								scheduleRangeArray.push(tempObj);
							}
						}
					}
				}
				else { //hourly
					if(this.withinRange(indexDate, this.getNextDay(indexDate), startDate, endDate) ||
						this.withinRange(this.getNextDay(indexDate), this.getNextDay(this.getNextDay(indexDate)), startDate, endDate)) {
						hourlyDuration	= parseInt(playlistObj.recurrencesetting.hourly, 10) * 1000;
						timeArray = playlistObj.recurrencesetting.endtime.split(':', 3);
						hourlyEnd = Math.ceil((parseInt(timeArray[0], 10) * 3600 + parseInt(timeArray[1], 10) * 60 + parseFloat(timeArray[2])) * 1000); //end time in milliseconds
						hourlyStartTime = this.getMillisecondsInDay(playlistObj.start);
						hourlyEndTime   = hourlyEnd;
							
						for(tempTime = hourlyStartTime; tempTime < hourlyEndTime; tempTime += hourlyDuration) {
							timeString 		= this.millisecondsInDay2String(tempTime);
							date1String 	= this.mergeDateTime(indexDate, timeString);
	
							if(tempTime + playlistDuration >= 86400000) { //across day
								nextTimeString = this.millisecondsInDay2String(tempTime + playlistDuration - 86400000);
								date2String = this.mergeDateTime(this.getNextDay(indexDate), nextTimeString);
							}
							else {
								nextTimeString = this.millisecondsInDay2String(tempTime + playlistDuration);
								date2String = this.mergeDateTime(indexDate, nextTimeString);
							}
	
							if(this.withinRange(date1String, date2String, startDate, endDate)) {
								tempObj						= {};
								tempObj.start 				= this.getMilliseconds(date1String);
								tempObj.end 				= this.getMilliseconds(date2String);
								tempObj.objid 				= playlistObj._id;
								tempObj.playlistpath 		= playlistObj.playlistpath;
								tempObj.playlistlocalpath 	= playlistObj.playlistlocalpath;
								tempObj.revision	 		= revision;
								scheduleRangeArray.push(tempObj);
							}
						}
					}
				}
						
				indexDate = this.getNextDay(indexDate).slice(0, 10);
			}
		}
	}
	
	this.mergePlaylist = function(baseArray, newArray, start, end) {
		var lastEnd 	= 0;
		var nextStart 	= 0;
		var newSize 	= 0;
		var baseSize 	= 0;
		var baseIndex 	= 0;
		var newIndex 	= 0;
		var resultArray = [];
		var resultIndex = 0;
		var tempObj		= {};

		if(!newArray || !start || !end || !util.isArray(newArray)) { return baseArray; }
		
		baseSize = baseArray.length;
		newSize = newArray.length;

//console.log('baseArray=');
//console.log(baseArray);
//console.log('newArray=');
//console.log(newArray);
		if(baseArray && (baseSize === 0)) { //the first time merge
			for(newIndex = 0 ; newIndex < newSize; newIndex++) {
				resultArray[newIndex] = newArray[newIndex];
			}
			
			return resultArray;
		}
		
		lastEnd  = start;
		nextStart = baseArray[0].start;
		if(lastEnd > nextStart) {
			lastEnd = nextStart;
		}
		
		baseIndex = 0;
		newIndex  = 0;
		while(baseIndex < baseSize) {
			if(baseArray[baseIndex].end < lastEnd) {
				baseIndex ++;
				
				if(baseIndex < baseSize) {
					nextStart = baseArray[baseIndex].start;
				}
				else {
					nextStart = end;
				}
			}
			else { break; }
		}

		while(newIndex < newSize) {
			if(newArray[newIndex].end < lastEnd) {
				newIndex ++;
			}
			else { break; }
		}
		
//console.log('start='+new Date(start));
//console.log('end='+new Date(end));
//console.log('lastEnd='+new Date(lastEnd));
//console.log('nextStart='+new Date(nextStart));
		while((baseIndex < baseSize) && (newIndex < newSize)) {
			if(lastEnd === nextStart) {
//console.log('lastEnd === nextStart');
				if(baseArray[baseIndex].start >= start) {
//console.log('baseArray[baseIndex].start >= start');
					resultArray[resultIndex] = baseArray[baseIndex];
					resultIndex ++;
					lastEnd = baseArray[baseIndex].end;
					baseIndex ++;
//console.log('lastEnd='+new Date(lastEnd));
				}
				else {
//console.log('baseArray[baseIndex].start < start');
					tempObj = {};
					tempObj.objid 				= baseArray[baseIndex].objid;
					tempObj.playlistpath 		= baseArray[baseIndex].playlistpath;
					tempObj.playlistlocalpath 	= baseArray[baseIndex].playlistlocalpath;
					tempObj.revision 			= baseArray[baseIndex].revision;
					tempObj.start 				= start;
					tempObj.end 				= baseArray[baseIndex].end;

					resultArray[resultIndex] = tempObj;
					resultIndex++;
					lastEnd = baseArray[baseIndex].end;
					baseIndex++;
//console.log('lastEnd='+new Date(lastEnd));
				}

				if(baseIndex < baseSize) { nextStart = baseArray[baseIndex].start; }
				else { nextStart = lastEnd; }
//console.log('nextStart='+new Date(nextStart));
			}
			else if( newArray[newIndex].end <= lastEnd) {
//console.log('newArray[newIndex].end <= lastEnd');
				newIndex ++;
			}
			else if( newArray[newIndex].start > lastEnd) {
//console.log('newArray[newIndex].start > lastEnd');
				if(newArray[newIndex].start < nextStart) {
//console.log('newArray[newIndex].start < nextStart');
					if(newArray[newIndex].end < nextStart) {
//console.log('newArray[newIndex].end < nextStart)');
						resultArray[resultIndex] = newArray[newIndex];
						lastEnd = newArray[newIndex].end;
						newIndex ++;
						resultIndex ++;
//console.log('lastEnd='+new Date(lastEnd));
					}
					else {
//console.log('newArray[newIndex].end >= nextStart)');
						tempObj = {};
						tempObj.objid 				= newArray[newIndex].objid;
						tempObj.playlistpath 		= newArray[newIndex].playlistpath;
						tempObj.playlistlocalpath 	= newArray[newIndex].playlistlocalpath;
						tempObj.revision 			= newArray[newIndex].revision;
						tempObj.start 				= newArray[newIndex].start;
						tempObj.end 				= nextStart;
						
						resultArray[resultIndex] = tempObj;
						resultIndex ++;
						newArray[newIndex].start = nextStart;
						if(newArray[newIndex].end <= newArray[newIndex].start) {
							newIndex ++;
						}
						lastEnd = nextStart;
//console.log('lastEnd='+new Date(lastEnd));
					}
				}
				else {
//console.log('newArray[newIndex].start >= nextStart');
					lastEnd = nextStart;
//console.log('lastEnd='+new Date(lastEnd));
				}
			}
			else { //newArray[newIndex].start < lastEnd
//console.log('newArray[newIndex].start <= lastEnd');
				if(newArray[newIndex].end < nextStart) {
//console.log('newArray[newIndex].end < nextStart');
					tempObj = {};
					tempObj.objid 				= newArray[newIndex].objid;
					tempObj.playlistpath 		= newArray[newIndex].playlistpath;
					tempObj.playlistlocalpath 	= newArray[newIndex].playlistlocalpath;
					tempObj.revision 			= newArray[newIndex].revision;
					tempObj.start 				= lastEnd;
					tempObj.end 				= newArray[newIndex].end;
					
					resultArray[resultIndex] = tempObj;
					resultIndex++;
					lastEnd = newArray[newIndex].end;
					newIndex++;
//console.log('lastEnd='+new Date(lastEnd));
				}
				else {
//console.log('newArray[newIndex].end >= nextStart');
					tempObj = {};
					tempObj.objid 				= newArray[newIndex].objid;
					tempObj.playlistpath 		= newArray[newIndex].playlistpath;
					tempObj.playlistlocalpath 	= newArray[newIndex].playlistlocalpath;
					tempObj.revision 			= newArray[newIndex].revision;
					tempObj.start 				= lastEnd;
					tempObj.end 				= nextStart;
					
					resultArray[resultIndex] = tempObj;
					resultIndex++;
					newArray[newIndex].start = nextStart;
					if(newArray[newIndex].end <= newArray[newIndex].start) {
						newIndex ++;
					}
					
					lastEnd = nextStart;
//console.log('lastEnd='+new Date(lastEnd));
				}
			}
		}
		
//console.log('resultArray=');
//console.log(resultArray);
//console.log('lastEnd='+new Date(lastEnd));
//console.log('nextStart='+new Date(nextStart));
//console.log('newIndex='+newIndex);
//console.log('baseIndex='+baseIndex);
		if(newIndex < newSize) {
			while(newIndex < newSize) {
				if(newArray[newIndex].end < lastEnd) {
					newIndex ++;
				}
				else { break; }
			}
			
			while(newIndex < newSize) {
				if(newArray[newIndex].start > lastEnd) {
					resultArray[resultIndex] = newArray[newIndex];
					resultIndex ++;
					
					lastEnd = newArray[newIndex].end;
					newIndex ++;
				}
				else if(newArray[newIndex].end > lastEnd) { //partial included
					tempObj = {};
					tempObj.objid 				= newArray[newIndex].objid;
					tempObj.playlistpath 		= newArray[newIndex].playlistpath;
					tempObj.playlistlocalpath 	= newArray[newIndex].playlistlocalpath;
					tempObj.revision 			= newArray[newIndex].revision;
					tempObj.start 				= lastEnd;
					tempObj.end 				= newArray[newIndex].end;
					
					resultArray[resultIndex] = tempObj;
					resultIndex++;
					lastEnd = newArray[newIndex].end;
					newIndex++;
				}
				else {
					newIndex++;
				}
			}
		}
		else {
			while(baseIndex < baseSize) {
				if(baseArray[baseIndex].end < lastEnd) {
					baseIndex ++;
				}
				else { break; }
			}
			
			while(baseIndex < baseSize) {
				if(baseArray[baseIndex].start > lastEnd) {
					resultArray[resultIndex] = baseArray[baseIndex];
					resultIndex ++;
					
					lastEnd = baseArray[baseIndex].end;
					baseIndex ++;
				}
				else if(baseArray[baseIndex].end > lastEnd){ //partial included
					tempObj = {};
					tempObj.objid 				= baseArray[baseIndex].objid;
					tempObj.playlistpath 		= baseArray[baseIndex].playlistpath;
					tempObj.playlistlocalpath 	= baseArray[baseIndex].playlistlocalpath;
					tempObj.revision 			= baseArray[baseIndex].revision;
					tempObj.start 				= lastEnd;
					tempObj.end 				= baseArray[baseIndex].end;
					
					resultArray[resultIndex] = tempObj;
					resultIndex++;
					lastEnd = baseArray[baseIndex].end;
					baseIndex++;
				}
				else {
					baseIndex++;
				}
			}
		}
		
//console.log('resultArray=');
//console.log(resultArray);
		return resultArray;
	}
	
	this.expandSchedule = function(scheduleObj, startScope, endScope) {
		var playlistNumber 	= 0;
		var playlistIndex 	= 0;
		var scheduleRangeArray = [];
		
		if(!scheduleObj || !startScope || !endScope) { return {}; }
		
		playlistNumber = scheduleObj.listArray.length;
		for(playlistIndex = 0 ; playlistIndex < playlistNumber; playlistIndex ++) {
			this.expandPlaylist(scheduleObj.listArray[playlistIndex], scheduleRangeArray, startScope, endScope, scheduleObj.revision);
		}
		
		if(scheduleRangeArray) {
			scheduleRangeArray.sort(function(a, b) {
				if(a.start > b.start) return 1;
				else if(a.start < b.start) return -1;
				else return 0;
			});
		}
		
		return scheduleRangeArray;
	}
	
	this.parseScheduleDataFile = function(fileLocalPath, fileType, playerConfig) {
		var obj 			= {};
		var playlistNumber 	= 0;
		var playlistIndex 	= 0;
		var tempPath 		= '';
		
		obj = this.getDataObj(fileLocalPath);
		
		if(obj && (obj.listArray) && (obj.listArray.length)) {
			playlistNumber = obj.listArray.length;
			for(playlistIndex = 0 ; playlistIndex < playlistNumber; playlistIndex ++) {
				tempPath = obj.listArray[playlistIndex].playlistpath;
				obj.listArray[playlistIndex].playlistlocalpath = path.normalize(this.fileLibPath + path.sep + playerConfig.sitename + tempPath);
				delete obj.listArray[playlistIndex].siteid;
				delete obj.listArray[playlistIndex].lastmodifytime;
			}
		}
		return obj;
	}
	
	this.buildMediaListByGroup = function(groupIDArray, startScope, endScope, playerConfig) {
		var groupFolderLocalPath = '';
		var scheduleFileList 	= [];
		var scheduleFileNumber 	= 0;
		var scheduleFileIndex 	= 0;
		var fileLocalPath 		= '';
		var fileStatus 			= {};
		var matchResult 		= null;
		var scheduleStartDate 	= '';
		var scheduleEndDate 	= '';
		var scheduleObj 		= {};
		var expandPlaylistArray	= [];
		var FinalArray			= [];
		var startMilliSeconds	= 0;
		var endMilliSeconds		= 0;
		var i 					= 0 ;
		var prefixArray			= ['channel', 'spotlist', 'playlist'];
		var groupIndex			= 0;
		var groupNumber 		= 0;
		var groupID		 		= '';
		var mediaArray			= [];
		
		if(!groupIDArray || !util.isArray(groupIDArray) || !startScope || !endScope || !playerConfig) { return null; }
		
		try {
			groupNumber = groupIDArray.length;
			for(groupIndex = 0; groupIndex < groupNumber; groupIndex++) {
				groupID = groupIDArray[groupIndex];

				groupFolderLocalPath = this.fileLibPath + path.sep + playerConfig.sitename + path.sep + 'publish' + path.sep + groupID;
//console.log('groupFolderLocalPath=' + groupFolderLocalPath);
				if(fs.existsSync(groupFolderLocalPath)) {
					scheduleFileList = fs.readdirSync(groupFolderLocalPath);
					if(scheduleFileList && scheduleFileList.length) {
						scheduleFileNumber = scheduleFileList.length;
						
//console.log('scheduleFileNumber=' + scheduleFileNumber);
						for(i = 0 ; i < 3; i++) {
							//parse schedule according to schedule type,
							var revision = -1;
							var publishFileLocalPath = '';
							var tempIndex = 0;
							for(scheduleFileIndex = 0 ; scheduleFileIndex < scheduleFileNumber; scheduleFileIndex++) {
								fileLocalPath = groupFolderLocalPath + path.sep + scheduleFileList[scheduleFileIndex];
								fileStatus = fs.lstatSync(fileLocalPath);
								if(fileStatus.isFile()) {
									matchResult = scheduleFileList[scheduleFileIndex].match(/^(.*)\_([0-9]{8})\_([0-9]{8})\.publ$/);
									if(matchResult && (matchResult.index === 0) && (matchResult[1] === prefixArray[i])) {
//console.log('find ' + prefixArray[i]);
//console.log(matchResult);
										scheduleStartDate = matchResult[2].slice(0, 4) + ':' + matchResult[2].slice(4, 6) + ':' + matchResult[2].slice(6, 8) + ':00:00:00.000';
										scheduleEndDate = matchResult[3].slice(0, 4) + ':' + matchResult[3].slice(4, 6) + ':' + matchResult[3].slice(6, 8) + ':24:00:00.000';
										
//console.log('scheduleStartDate =  ' + scheduleStartDate);
//console.log('scheduleEndDate =  ' + scheduleEndDate);
//console.log('startScope =  ' + startScope);
//console.log('endScope =  ' + endScope);
//console.log('fileLocalPath =  ' + fileLocalPath);
										if((startScope < scheduleEndDate) && (endScope > scheduleStartDate)) { //overlapped
											//parse schedule file to get data object
											scheduleObj = {};
											scheduleObj = this.parseScheduleDataFile(fileLocalPath, matchResult[1], playerConfig);
//console.log('scheduleObj=');
//console.log(scheduleObj);
											//to avoid same date range covered by more publish data file, get the newest one.
											if(revision < scheduleObj.revision) {
												publishFileLocalPath = fileLocalPath;
												revision = scheduleObj.revision;
												tempIndex = scheduleFileIndex;
											}
										}
									}
								}
							}
							
							if(publishFileLocalPath && (revision > 0)) {
								//parse schedule file to get data object
								scheduleObj = {};
								scheduleObj = this.parseScheduleDataFile(publishFileLocalPath, prefixArray[i], playerConfig);
//console.log('groupIndex='+groupIndex);
//console.log('i='+i);
//console.log('tempIndex='+tempIndex);
//console.log('scheduleObj=');
//console.log(scheduleObj);
											
								//expand recurrence playlist
								expandPlaylistArray = [];
								expandPlaylistArray = this.expandSchedule(scheduleObj, startScope, endScope);
//this.writeDataFile('d:\\a' + groupID + '_' + prefixArray[i] + '_' + tempIndex + '.json', expandPlaylistArray);
											
								//merge playlist object into mediaListObj
								startMilliSeconds = this.getMilliseconds(startScope);
								endMilliSeconds = this.getMilliseconds(endScope);
								mediaArray = this.mergePlaylist(mediaArray, expandPlaylistArray, startMilliSeconds, endMilliSeconds);
//this.writeDataFile('d:\\b' + groupID + '_' + prefixArray[i] + '_' + tempIndex + '.json', mediaArray);
							}
						}
					}
				}
			}
		}
		catch(e) {
			this.logger.error('error occurs in buildMediaList().');
			this.logger.error(e);
			return null;
		}

		return mediaArray;
	}
	
	this.mergeSchedulePlaylist = function(groupIDArray, topFirst, controllerConfig, from) {
		var newGroupIDArray = null;
		var groupNumber = 0;
		var groupIndex = 0;
		var today = new Date();
		var startDate = '';
		var endDate = '';
		var mediaList = [];
		var j = 0;
		var k = 0;

		if(!groupIDArray || !groupIDArray.length || !controllerConfig) { return; }
		
		//build group order according to the value of topFirst, true means from 0 to N, false means from N to 0.
		groupNumber = groupIDArray.length;
		newGroupIDArray = new Array(groupNumber);
		if(!topFirst) {
			for(groupIndex = 0; groupIndex < groupNumber; groupIndex++) {
				newGroupIDArray[groupIndex] = groupIDArray[groupIndex];
			}
		}
		else {
			for(groupIndex = 0; groupIndex < groupNumber; groupIndex++) {
				newGroupIDArray[groupNumber - groupIndex - 1] = groupIDArray[groupIndex];
			}
		}
		
		//set the date range to parse schedule into memory object, only parse media in 30 days
//		startDate = new Date(today.getTime() - 86400000).toISOString().slice(0, 10).replace(/-/g, ':') + ':00:00:00.000';
//		endDate = new Date(today.getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, ':') + ':24:00:00.000';
		var tempStartDate = today;
		var tempEndDate = new Date(today.getTime() + this.config.playersettings.scheduleparsescope);
		
		startDate = this.buildDateTimeString(tempStartDate.getFullYear(), tempStartDate.getMonth() + 1, tempStartDate.getDate(), 
											tempStartDate.getHours(), tempStartDate.getMinutes(), tempStartDate.getSeconds(), tempStartDate.getMilliseconds());
		endDate = this.buildDateTimeString(tempEndDate.getFullYear(), tempEndDate.getMonth() + 1, tempEndDate.getDate(), 
											tempEndDate.getHours(), tempEndDate.getMinutes(), tempEndDate.getSeconds(), tempEndDate.getMilliseconds());
		
//console.log('startDate='+startDate);
//console.log('endDate='+endDate);
		
		mediaList = [];
		mediaList = this.buildMediaListByGroup(newGroupIDArray, startDate, endDate, controllerConfig);
		//expand media list into playlist array
//console.log('start::::::::::::::::::::::::::::::::::');
//console.log(process.memoryUsage());
		this.expandMedia(mediaList, this.getMilliseconds(startDate), this.getMilliseconds(endDate), controllerConfig);
//console.log(process.memoryUsage());
//console.log('end::::::::::::::::::::::::::::::::::');
//this.writeDataFile('d:\\c.json', mediaList);

		if(mediaList && mediaList.length) {
			var settingObj 		= {}; 
			var configsetting 	= []; 
			var playlistNumber 	= 0;
			var fragmentNumber 	= 0;

			playlistNumber = mediaList.length;

			var validNum = playlistNumber;
			for( ; validNum > 0; validNum--) {
				if(mediaList[validNum - 1].fragment && util.isArray(mediaList[validNum - 1].fragment) && mediaList[validNum - 1].fragment.length) {
					break;
				}
			}
			playlistNumber = validNum;
			
			if(playlistNumber > 0 && mediaList[playlistNumber - 1].fragment && util.isArray(mediaList[playlistNumber - 1].fragment) && mediaList[playlistNumber - 1].fragment.length) {
				fragmentNumber = mediaList[playlistNumber - 1].fragment.length;
//console.log(' old lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
				controllerConfig.lastscheduleparsetime = new Date(mediaList[playlistNumber - 1].fragment[fragmentNumber - 1].end).toString();
/*
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
console.log('controllerConfig.lastscheduleparsetime='+controllerConfig.lastscheduleparsetime);
*/
				settingObj.name = 'lastscheduleparsetime'; 
				settingObj.value = controllerConfig.lastscheduleparsetime; 
				configsetting.push(settingObj); 
				
				if(global.loginProcess) {
					global.loginProcess.send({'configsetting': { 'from': 'clientheartbeat', 'data': configsetting}});
				}
				else {
					process.send({'configsetting': { 'from': from, 'data': configsetting}});
				}
				
				//output content array to file
				var newFileName = 'rendercontent' + new Date().getTime() + '.json';
				var oldFileName = 'oldrendercontent' + new Date().getTime() + '.json';
				var tempNewFilePath = this.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + newFileName;
				var tempOldFilePath = this.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + oldFileName;
				var formalPath = this.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + 'rendercontent.json';
				this.writeDataFile(tempNewFilePath, mediaList, true);
				
				try{
					if(fs.existsSync(formalPath)) {
						if(!fs.renameSync(formalPath, tempOldFilePath)) {
							fs.renameSync(tempNewFilePath, formalPath);
							fs.unlinkSync(tempOldFilePath);
						}
						else {
							if(!fs.renameSync(formalPath, tempOldFilePath)) {
								fs.renameSync(tempNewFilePath, formalPath);
								fs.unlinkSync(tempOldFilePath);
							}
							else {
								if(!fs.renameSync(formalPath, tempOldFilePath)) {
									fs.renameSync(tempNewFilePath, formalPath);
									fs.unlinkSync(tempOldFilePath);
								}
								else {
									if(this.logger) this.logger.error('unable to write render content to file.');
								}
							}
						}
					}
					else {
						fs.renameSync(tempNewFilePath, formalPath);
					}
				}	
				catch(e) {
					if(this.logger) this.logger.error('error occurs during generate rendercontent.json');
				}					
			}
			else {
				var formalPath = this.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + 'rendercontent.json';
				if(this.logger) this.logger.error('got empty playlist, will remove rendercontent.json.');
				try {

					//console.log('remove rendercontent.json due to got empty playlist array.');
					if(fs.existsSync(formalPath))	fs.unlinkSync(formalPath);
				}
				catch(e) {
					if(this.logger) this.logger.error('got empty playlist, will remove rendercontent.json, but failed.');
				}
			}
		}
		else { //if no media, clear the rendercontent.
			var formalPath = this.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + 'rendercontent.json';
			
			try{
				//console.log('remove rendercontent.json due to got empty media list.');
				if(fs.existsSync(formalPath))	fs.unlinkSync(formalPath);				
			}	
			catch(e) {
				this.logger.error('error occurs during remove rendercontent.json');
			}					
		}

		return;
	}
};
module.exports = ControllerHelper;

