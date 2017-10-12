var url 	= require('url');
var fs 		= require('fs');
var hfs 	= require('hfs');
var util 	= require('util');
var path 	= require('path');
var ControllerHelper 	= require('./controllerhelper');
var ControllerCmd 		= require('./command');
var TaskManager 		= require('./taskmanager');

var controllerCmd 	= new ControllerCmd();
var helper 			= new ControllerHelper();
var logger 			= helper.logger;

var dataObj 			= {};
var serverURL 			= '';
var heartbeatInterval 	= 0;
var heartbeatTimeoutHandler = null;
var taskmanager 		= null;
var cookieFromServer 	= '';
//var packagePath 		= ''; //not use global variables
var versionString 		= '';
var controllerConfig 	= null;

//var memWatch = require('memwatch');

//get file list in command folder
var getFileList = function(folderPath, callback) {
	var fileList 	= [];//['7z.dll', '7z.exe', 'ws5Cmd.exe', 'ws5Ctrl.exe', 'ws5Ctrl.ini', 'ws5Exec.exe', 'ws5Start.bat', 'ws5Upgrade.bat', 'wxrtu.dll', 'wsLicense.txt'];
	var fileIndex 	= 0;
	var fileNumber 	= 0;
	
	if(!folderPath) {
		logger.error('got empty folder path.');
		return callback(4, null);
	}
	
	fs.exists(folderPath, function(exists) {
		if(!exists) {
			logger.error('folder (%s) does not exists.', folderPath);
			return callback(4, null);
		}

/*
		fs.readdir(folderPath, function(err, fileArray) {
			if(err) {
				logger.error('error occurs when get file list from source folder (%s).', folderPath);
				return callback(4, null);				
			}
			
			if(!fileArray || !util.isArray(fileArray) || !fileArray.length) {
				logger.error('the file list return from (%s) is not valid.', folderPath);
				return callback(4, null);
			}
			
			fileNumber = fileArray.length;
			for(fileIndex = 0; fileIndex < fileNumber; fileIndex++) {
				ext = path.extname(fileArray[fileIndex]);
logger.debug('fileArray[fileIndex]='+fileArray[fileIndex]);
logger.debug('ext='+ext);
				if(ext && (ext !== 'log') && (ext !== 'lnk') && (ext !== 'db')) {
					fileList.push(fileArray[fileIndex]);
				}
			}
			
			return callback(0, fileList);
		});
*/
		return callback(0, ['7z.dll', '7z.exe', 'ws5Cmd.exe', 'ws5Ctrl.exe', 'ws5Ctrl.ini', 'ws5Exec.exe', 'ws5Start.bat', 'ws5Upgrade.bat', 'wxrtu.dll', 'wsLicense.txt']);
	});
}	

//copy files under command folder to temp folder
var copyFiles = function(srcFolderPath, targetFolderPath, callback) {
	if(!srcFolderPath || !targetFolderPath) {
		logger.error('empty folder path for copy command files.');
		logger.error('srcFolderPath= ' + srcFolderPath);
		logger.error('targetFolderPath= ' + targetFolderPath);
		
		return callback(4);
	}
	
	var fileList 	= []; 
	var fileIndex 	= 0;
	var fileNumber 	= 0;
	var Emitter 	= require('events').EventEmitter;
	var emitter		= (new Emitter);
	
	emitter.on('CopyFile', function(first) {
		var srcFilePath = '';
		var targetFilePath = '';
		
		if(!first) {
			fileIndex ++;
		}
		
		if(fileIndex >= fileNumber) {
			return callback(0);
		}	
		
		srcFilePath = srcFolderPath + path.sep + fileList[fileIndex];
		targetFilePath = targetFolderPath + path.sep + fileList[fileIndex];

		logger.debug('will copy file from (%s) to (%s).', srcFilePath, targetFilePath);
		helper.internalCopyFile(srcFilePath, targetFilePath, function(err) {
			if(err) {
				logger.error('error occurs when copy file from (%s) to (%s).', srcFilePath, targetFilePath);
				logger.error(err);
				return callback(err);
			}
			
			emitter.emit('CopyFile', false);
		});
	
	});
	
	getFileList(srcFolderPath, function(err, files) {
		if(err) {
			logger.error('error occurs when get file list from folder (%s).', srcFolderPath);
			return callback(err);
		}
		
		fileList 	= files;
		fileIndex 	= 0;
		fileNumber 	= fileList.length;
		emitter.emit('CopyFile', true);
	});
}

//delete file from temp folder
var deleteFiles = function(folderPath, callback) {
	if(!folderPath) {
		logger.error('empty folder path for delete temp command files.');
		logger.error('folderPath= ' + folderPath);
		
		return callback(4);
	}
	
	var fileList 	= []; 
	var fileIndex 	= 0;
	var fileNumber 	= 0;
	var Emitter 	= require('events').EventEmitter;
	var emitter		= (new Emitter);
	
	emitter.on('DeleteFile', function(first) {
		var targetFilePath = '';
		
		if(!first) {
			fileIndex ++;
		}
		
		if(fileIndex >= fileNumber) {
			return callback(0);
		}	
		
		targetFilePath = folderPath + path.sep + fileList[fileIndex];

		logger.debug('will delete file (%s).', targetFilePath);
		fs.unlink(targetFilePath, function(err) {
			if(err) {
				logger.error('error occurs when delete file (%s).', targetFilePath);
				logger.error(err);
				return callback(err);
			}
			
			emitter.emit('DeleteFile', false);
		});
	});
	
	getFileList(folderPath, function(err, files) {
		if(err) {
			logger.error('error occurs when get file list from folder (%s).', folderPath);
			return callback(err);
		}
		
		fileList 	= files;
		fileIndex 	= 0;
		fileNumber 	= fileList.length;
		emitter.emit('DeleteFile', true);
	});
}

//console.log('try to heartbeat');	
var upgradeCommand = function(packagePath) {
	var dummyArray				= [];
	var cmdsetObj 				= {};
	var command_parameterArray 	= [];
	var command_parameterObj 	= {};
	
	var tempFolderName = 'tempcommand';
	var tempFolderPath = helper.serverPath + 'addon' + path.sep + tempFolderName;
	var commandFolderPath = helper.serverPath + 'addon' + path.sep + 'command';
	
	var libBasePath = helper.fileLibPath + path.sep + controllerConfig.sitename;
	var packageLocalPath = '';
	
	logger.debug('upgrade packagePath=' + packagePath);
	if(!packagePath) {
		return;
	}
	
	packageLocalPath = path.normalize(libBasePath + packagePath);
	command_parameterArray		= [];
	command_parameterObj 		= {};
	command_parameterObj.cmd 	= 'ws5.upgrade';
	command_parameterObj.param 	= '\"' + helper.WS5Path + '\" \"' + packageLocalPath + '\"';
	
	command_parameterArray.push(command_parameterObj);
	
	cmdsetObj			= {};
	cmdsetObj.id 		= helper.getUUID();
	cmdsetObj.cmd_set 	= command_parameterArray;
	cmdsetObj.comment 	= 'upgrade';
	
	dummyArray.push(cmdsetObj);

	if(dummyArray.length) {
		//copy command folder to 'tempcommand' for upgrade need to overwrite 'command' folder
		logger.debug('copy command files to temp folder.');
		deleteFiles(tempFolderPath, function(err) {
			logger.debug('delete temp folder returns: ' + err);			
			
			copyFiles(commandFolderPath, tempFolderPath, function(err) {
				logger.debug('copy command folder returns: ' + err);			
				
				if(err) {
					logger.error('error occurs when copy command folder to rempcommand folder. ' + err);
				}
				else {
					controllerCmd.executeCommand(helper, dummyArray, tempFolderName, true, function() {
					});
				}
			});
		});
	}
}		

var upgradeCommand2 = function(packagePath) { //Jeff's installable patch package
	logger.debug('upgrade packagePath=' + packagePath);
	if(!packagePath) {
		return;
	}

	var libBasePath = helper.fileLibPath + path.sep + controllerConfig.sitename;
	var packageLocalPath = '';
	packageLocalPath = path.normalize(libBasePath + packagePath);
	controllerCmd.callUpgradePatch(helper, packageLocalPath, function() {
	});
}		

var generateObjForConfigUpdate = function(module, keyName, newValue) {
	var tempObj = {};
	var configModule = null;
	
	if(module === 'player') {
		configModule = controllerConfig;
	}
	else {
		configModule = helper.config.logsettings;
	}
	configModule[keyName] = newValue;
	tempObj 		= {}; 
	tempObj.name 	= keyName; 
	tempObj.value 	= newValue; 
	
	return tempObj;
}							

var powerSort= function(a, b) {
	if(a.weekday < b.weekday) { return -1; }
	else if(a.weekday > b.weekday) { return 1; }
	else { //a.weekday === b.weekday
		if(a.time < b.time) { return -1; }
		else if(a.time > b.time) { return 1; }
		else {
			if(a.type === 'on') return -1;
			else return 1;
		}
	}
}

var comparePowerSetting = function(power1, power2) {
	var i = 0;
	
	if(!power1 || !power2) { return false; }
	if(power1.length !== power2.length) { return false; }

	power1.sort(powerSort);
	power2.sort(powerSort);
	
	for(i = 0; i < power1.length; i++) {
		if((power1[i].weekday !== power2[i].weekday) || (power1[i].type !== power2[i].type) || (power1[i].time !== power2[i].time)) {
			break;
		}
	}
	
	if(i < power1.length) { return false; }
	
	return true;
}

var isTimeToPowerOff = function(PowerScheduleArray) {
	var now 				= new Date();
	var currentWeekday 		= now.getDay();
	var millisecondsOfNow 	= now.getTime();
	var tempDate 			= null;
	var tempMillisecond 	= 0;
	var PowerSettingLength 	= 0;
	var PowerSettingIndex 	= 0;
	var powerOffMilliseconds= 0;
	
	var indexOfOff			= -1;
	var returnObj 			= { match: false };
	
	if(!PowerScheduleArray || !util.isArray(PowerScheduleArray) || !PowerScheduleArray.length) { return returnObj; }

	PowerSettingLength = PowerScheduleArray.length;
	for(PowerSettingIndex = 0; PowerSettingIndex < PowerSettingLength; PowerSettingIndex++) {
		PowerScheduleArray[PowerSettingIndex].time = parseInt(PowerScheduleArray[PowerSettingIndex].time, 10);
		PowerScheduleArray[PowerSettingIndex].weekday = parseInt(PowerScheduleArray[PowerSettingIndex].weekday, 10);
	}	
	
	tempDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	tempMilliseconds = tempDate.getTime();
	
	for(PowerSettingIndex = 0; PowerSettingIndex < PowerSettingLength; PowerSettingIndex++) {
		if((PowerScheduleArray[PowerSettingIndex].weekday === currentWeekday) && (PowerScheduleArray[PowerSettingIndex].type === 'off')) {
			powerOffMilliseconds = tempMilliseconds + PowerScheduleArray[PowerSettingIndex].time;
			if((powerOffMilliseconds >= millisecondsOfNow) && (powerOffMilliseconds < (millisecondsOfNow + heartbeatInterval * 2))) {
				returnObj.off = tempMilliseconds + PowerScheduleArray[PowerSettingIndex].time;
				indexOfOff = PowerSettingIndex;
				break;
			}
		}
	}	
	
	//not found power off setting
	if((PowerSettingIndex >= PowerSettingLength) || (indexOfOff < 0)) {
		return returnObj;
	}
	
	//get power on item follow the power off
	while(PowerSettingIndex < PowerSettingLength) {
		if(PowerScheduleArray[PowerSettingIndex].type === 'on') {
			break;
		}
		
		PowerSettingIndex++;
	}
			
	//if not found, find the items before power off in array		
	if((PowerSettingIndex >= PowerSettingLength) && (indexOfOff >= 0)) {
		PowerSettingIndex = 0;
		while(PowerSettingIndex < indexOfOff) {
			if(PowerScheduleArray[PowerSettingIndex].type === 'on') {
				break;
			}
			
			PowerSettingIndex++;
		}
		
		//if still not found, return
		if(PowerSettingIndex >= indexOfOff) {
			logger.debug('it is time to power off, but can not find the next power on time. So will not power off.');
			return returnObj;
		}	
	}		
	
	//calculate the power on time
	var powerOnDate = null;
	var days = 0;
	
	if(PowerSettingIndex >= indexOfOff) {
		days = PowerScheduleArray[PowerSettingIndex].weekday - PowerScheduleArray[indexOfOff].weekday;
	}
	else {
		days = PowerScheduleArray[PowerSettingIndex].weekday + 7 - PowerScheduleArray[indexOfOff].weekday;
	}


	var tempNumber = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	tempNumber += (86400000 * days);
	
	var tempDateObj = new Date(tempNumber);
	
	powerOnDate = new Date(tempDateObj.getUTCFullYear(), tempDateObj.getUTCMonth(), tempDateObj.getUTCDate());
	tempMilliseconds = powerOnDate.getTime();
	returnObj.on = tempMilliseconds + PowerScheduleArray[PowerSettingIndex].time;
	returnObj.match = true;
	
	return returnObj;
}

var sendHeartbeat = function() {
	var newTask 		= false;
	var configsetting   = [];
	var logsetting   	= [];
	var settingObj		= {};
	var now				= new Date();
	var snapshotLocalPath = '';
	var snapshotDataBuffer = null;
	var snapshotDataBase64 = '';
	
	var dummyArray				= [];
	var cmdsetObj 				= {};
	var command_parameterArray 	= [];
	var command_parameterObj 	= {};
	
	var proxy			= {};
	var dataString		= '';

//var diff = hd.end();
//logger.error(JSON.stringify(diff, '', 4));
//hd = null;
//hd = new memWatch.HeapDiff();

//logger.error(process.memoryUsage());

//console.log('enter sendHeartbeat');
	helper.loadDynamicConfig(function(err, configObj) {
		if(err) {
console.log('error occurs when get controller config from DB. err=' + err);
			logger.error('error occurs when get controller config from DB. err=' + err);
			return;
		}
//console.log('got config.');
		
		controllerConfig = configObj;
		if(!controllerConfig) { //config wrong
			return;
		}

		var buildLogToBuffer = function(callback) {
			if(controllerConfig.collectlog === true) {
				var folderArray = [];
				
				//output dynamicConfig to file
				var configPath = path.dirname(helper.configPath) + path.sep + 'dynamicConfig.json';
				helper.writeDataFile(configPath, controllerConfig, false);
	
				logger.debug('got command to collect player log.');
				folderArray.push(helper.WS5Path + path.sep + 'log');
				folderArray.push(helper.WS5Path + path.sep + 'config');
				folderArray.push(helper.WS5Path + path.sep + 'exe' + path.sep + 'server' + path.sep + 'addon' + path.sep + 'command');
				folderArray.push(helper.WS5Path + path.sep + 'exe' + path.sep + 'server' + path.sep + 'addon' + path.sep + 'tempcommand');
				
				helper.compressFileToBuffer(folderArray, function(err, dataBuffer) {
					return callback(err, dataBuffer);
				});
			}
			else {
				return callback(0, null);
			}
		}
	
		//check whether need upgrade and it is time to upgrade
		if(controllerConfig.packagepath) {
			var needUpgrade = false;
			var packagePath = controllerConfig.packagepath + '';
			
			if(controllerConfig.upgradestarttime) {
				var upgradeTime = new Date(controllerConfig.upgradestarttime).getTime();
				var currentTime = now.getTime();
				if(upgradeTime && (Math.abs(upgradeTime - currentTime) >= 30000) && (upgradeTime < currentTime)) {
					logger.error('upgrade task is expired.');
					//clear upgrade information to let it only be done once
					settingObj = generateObjForConfigUpdate('player', 'upgradestarttime', '');
					configsetting.push(settingObj); 
					
					settingObj = generateObjForConfigUpdate('player', 'packagepath', '');
					configsetting.push(settingObj); 
					
					process.send({'configsetting': { 'from': 'heartbeatprocess', 'data': configsetting}});
				}
				else if(upgradeTime && (Math.abs(upgradeTime - currentTime) < 30000)) {
					logger.debug('will upgrade.');
					needUpgrade = true;
				}
			}
			else {
				needUpgrade = true;
			}
			
			if(needUpgrade) {
				//clear upgrade information to let it only be done once
				settingObj = generateObjForConfigUpdate('player', 'upgradestarttime', '');
				configsetting.push(settingObj); 
				
				settingObj = generateObjForConfigUpdate('player', 'packagepath', '');
				configsetting.push(settingObj); 
				
				process.send({'configsetting': { 'from': 'heartbeatprocess', 'data': configsetting}});
				
				//next tick
				logger.debug('got command to upgrade.');
				process.nextTick(function() {
					logger.debug('will call upgrade command.');
					//upgradeCommand(packagePath);
					upgradeCommand2(packagePath);
					return;
				});		
			}
		}
	
		configsetting = [];
		//check schedule power off
		if((controllerConfig.powersetting) && (util.isArray(controllerConfig.powersetting)) && controllerConfig.powersetting.length) {
			var powerSettingObj = isTimeToPowerOff(controllerConfig.powersetting);
	
			if(powerSettingObj && powerSettingObj.match && powerSettingObj.on && powerSettingObj.off)
			{
console.log('it is time for schedule power off.');
				logger.debug('it is time for schedule power off.');
				logger.debug(JSON.stringify(controllerConfig.powersetting, '', 4));
				
				command_parameterArray		= [];
				command_parameterObj 		= {};
				command_parameterObj.cmd 	= 'ws5.powerschedule';
				command_parameterObj.param 	= '' + powerSettingObj.on - powerSettingObj.off;
				
				command_parameterArray.push(command_parameterObj);
				
				cmdsetObj			= {};
				cmdsetObj.id 		= helper.getUUID();
				cmdsetObj.cmd_set 	= command_parameterArray;
				cmdsetObj.comment 	= 'schedule power off';
				
				dummyArray.push(cmdsetObj);
				
				logger.debug('will power off according to power setting.');
				controllerCmd.executeCommand(helper, dummyArray, '', false, function() {
					process.nextTick(function() {
						heartbeatTimeoutHandler = setTimeout(sendHeartbeat, 100000); //make it a little longer, for OS will went to sleep right away.
						return;
					});		
				});
			}
		}

		//get parameter from config
		dataObj = {};
		dataObj.newesttasktime 	= controllerConfig.newesttasktime;
		dataObj.playlist 		= controllerConfig.currentplaylist;
		dataObj.media 			= controllerConfig.currentmedia;
		
		if(controllerConfig.snapshot === true) {
			snapshotLocalPath = helper.serverPath + 'addon' + path.sep + 'command' + path.sep + 'screenshot.jpg';
			
			try {
				if(fs.existsSync(snapshotLocalPath)) {
//console.log('got new snapshot.');
					snapshotDataBuffer = fs.readFileSync(snapshotLocalPath);
					if(snapshotDataBuffer) {
						snapshotDataBase64 = snapshotDataBuffer.toString('base64');
						dataObj.snapshot = snapshotDataBase64;
					}
				}
				else {
//console.log('NOT got new snapshot.');
				}
			}
			catch(e) {
				logger.error('exception occurs when get data from snapshot file.');
				logger.error(e);
			}
		}
		
		if(controllerConfig.reboot === true) {
			dataObj.reboot = controllerConfig.reboot;
		}
		
		if(controllerConfig.shutdown === true) {
			dataObj.shutdown = controllerConfig.shutdown;
		}
		
		
		urlObj 		= url.parse(controllerConfig.serverurl);
		serverURL 	= urlObj.protocol + '//' + urlObj.host + '/ws5/controller/heartbeat.js';
		
		if(controllerConfig.proxy && controllerConfig.proxy.host) { proxy = controllerConfig.proxy; }
	
		buildLogToBuffer(function(err, dataBuffer) {
			if(err) {
				logger.error('error occurs when get controller log file. err=' + err);
			}
			else if(dataBuffer) {
				dataObj.logpackage = dataBuffer.toString('base64');
console.log('will send compressed log data buffer to server.');
			}
			
			helper.getPlayerLocalInfo(dataObj, function(obj) {
				obj.downloadprogress 	= controllerConfig.downloadprogress || 0;
				obj.downloadspeed 		= controllerConfig.downloadspeed || '';
				obj.version 			= helper.config.playersettings.version;
				obj.versionstring		= versionString;
				
				if(controllerConfig.upgradestarttime) {
					obj.upgradestarttime = controllerConfig.upgradestarttime;
					obj.upgradepackagepath = controllerConfig.packagepath;
				}
				else {
					obj.upgradestarttime = 0;
					obj.upgradepackagepath = '';
				}
				
				dataString = JSON.stringify(obj);
				dataObj = {};
				dataObj.data = dataString;
				helper.postRequestToServer(serverURL, dataObj, cookieFromServer, proxy, function(err, returnData, cookie) {
					var obj 			= {};
					var nowTime			= new Date();
					var now 			= new Date().getTime();
					var taskCreateTime 	= 0;
					
					dummyArray				= [];
					cmdsetObj 				= {};
					command_parameterArray 	= [];
					command_parameterObj 	= {};
//console.log('returnData=' + returnData);
			
					if(err || !returnData) {
						logger.error('error occurs when call server controller heartbeat.js. ' + serverURL);
						logger.error(err);
						if(returnData) { logger.error(returnData); }
	
//					heartbeatTimeoutHandler = setTimeout(sendHeartbeat, heartbeatInterval);
					}
					else {
						try {
							obj = JSON.parse(returnData, '', 4);
						}
						catch(e) {
							logger.error('Error occurs when parsing returned data.')
							logger.error(returnData);
							logger.error(e);
						}
	
						if(obj) {
							if(cookie && cookie.indexOf('connect.sid') >= 0) {
								var pos1 = cookie.indexOf('connect.sid');
								var pos2 = cookie.indexOf(';', pos1 + 1);
								cookieFromServer = cookie.slice(pos1, pos2 - pos1);
							}		
			
							//send hb time back to parent process
							process.send({'action' : 'HB', 'HBTime': nowTime });
							logger.debug('heartbeat process send message to server for HBTime: ' + nowTime);
							
							//if successfully returned, write success mark to local file of global variable to let login process check
							if(obj.status === true) {
								heartbeatInterval = obj.interval * 1000;
//console.log('heartbeat return data=');
//console.log(obj);
								
								//check the player attribute and task got from response
								//0. player name and group path
								if(controllerConfig.playername && (controllerConfig.playername !== obj.playername)) {
									settingObj = generateObjForConfigUpdate('player', 'playername', obj.playername);
									configsetting.push(settingObj); 
								}
								
								if(controllerConfig.grouppath && (controllerConfig.grouppath !== obj.grouppath)) {
									logger.debug('change group from %s to %s', controllerConfig.grouppath, obj.grouppath);
									
									settingObj = generateObjForConfigUpdate('player', 'grouppath', obj.grouppath);
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'currentplaylist', '');
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'currentmedia', []);
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'newesttasktime', new Date('2000-01-01'));
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'lastscheduleparsetime', new Date('2000-01-01'));
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'nextgetscheduletime', new Date('2000-01-01').toISOString());
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'lastgetscheduletime', new Date('2000-01-01').toISOString());
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'needreload', true);
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'lastdesktoppath', '');
									configsetting.push(settingObj); 
									
									//remove publish folder to generate new content
									var publishFolderPath = helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish';
									var taskFolderPath = helper.fileLibPath + path.sep + 'task';
									
									try {
										hfs.delSync(taskFolderPath);
									}
									catch(e) {
										logger.error('exception occurs when remove task folder when change group.');
										logger.error(e);
									}
											
									try {
										hfs.delSync(publishFolderPath);
									}
									catch(e) {
										logger.error('error occurs when remove publish folder when change group.');
										logger.error(e);
									}
									
									//remove publish folder to generate new content
									var renderContentPath = helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + 'rendercontent.json';
									
									try {
										fs.unlinkSync(renderContentPath);
									}
									catch(e) {
										logger.error('error occurs when remove publish render content change change time zone.');
										logger.error(e);
									}
			 					}
								
								//1. power setting
								if(obj.powerschedule && util.isArray(obj.powerschedule) && obj.powerschedule.length) {
									for(var powerIndex = 0; powerIndex < obj.powerschedule.length; powerIndex++) {
										obj.powerschedule[powerIndex].time = parseInt(obj.powerschedule[powerIndex].time, 10);
										obj.powerschedule[powerIndex].weekday = parseInt(obj.powerschedule[powerIndex].weekday, 10);
									}	
				
//console.log(JSON.stringify(obj.powerschedule, '', 4));							
									obj.powerschedule.sort(powerSort);
									
//console.log(JSON.stringify(obj.powerschedule, '', 4));							
									if(!comparePowerSetting(obj.powerschedule, controllerConfig.powersetting)) {
										settingObj = generateObjForConfigUpdate('player', 'powersetting', obj.powerschedule);
										configsetting.push(settingObj); 
//console.log('new power setting is returned.');							
										
										logger.debug('got new power settings.');
										logger.debug(controllerConfig.powersetting);
									}
									else {
//console.log('power setting is the same.');							
									}
								}
								else {
//console.log('empty power setting is returned.');							
									settingObj = generateObjForConfigUpdate('player', 'powersetting', []);
									configsetting.push(settingObj); 
								}
								
								//2. task
								if(obj.task && util.isArray(obj.task) && (obj.task.length > 0)) {
									var newestTaskTime = new Date('2000-01-01').toISOString();
									var newestSpecialTaskTime = new Date('2000-01-01').toISOString();
									var needStopUC	= false;
									
									logger.debug('got task from server:');
									logger.debug(JSON.stringify(obj.task, '', 4));
									
									for(var i = 0; i < obj.task.length; i++) {
										var taskObj = {};
										
										if(obj.task[i].tasktype === 'event') {//event task
//console.log('event task.');
//console.log(JSON.stringify(obj.task[i], '', 4));
											var eventDataFilePath = helper.WS5Path + path.sep + 'lib' + path.sep + 'tmp' + path.sep + 'event.json';
											var eventObj = helper.getDataObj(eventDataFilePath);
											var newEventArray = []; 
											if(eventObj && eventObj.length) {
												newEventArray = eventObj;
											}
											newEventArray.push(obj.task[i].taskdata);
											helper.writeDataFile(eventDataFilePath, newEventArray);
											
											if(newestSpecialTaskTime < obj.task[i].createtime) {
												newestSpecialTaskTime = obj.task[i].createtime;
											}
										}
										else if(obj.task[i].tasktype === 'stopuc') {//stopuc task need not download anything, so, not need to put to task queue
											if(newestSpecialTaskTime < obj.task[i].createtime) {
												newestSpecialTaskTime = obj.task[i].createtime;
											}
											
											//delete alert folder in download folder
											var alertFolderLocalPath   	= path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + '/publish/alert');
											hfs.delSync(alertFolderLocalPath);
											
											needStopUC = true;
										}
										else if(obj.task[i].tasktype === 'uc') {
											taskObj.siteid 		= obj.task[i].siteid;
											taskObj.taskid 		= obj.task[i]._id;
											taskObj.tasktype 	= obj.task[i].tasktype;
											taskObj.initialpath	= obj.task[i].initialpath;
											taskObj.starttime	= new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10).replace(/\-/g, ':');
											taskObj.endtime		= taskObj.starttime;
											taskObj.lmt			= obj.task[i].createtime;
											taskObj.revision	= obj.task[i].revision;
											taskObj.dur			= obj.task[i].dur;
											
											taskmanager.insertNewTask(taskObj);
										
											newTask = true;
										}
										else if(obj.task[i].tasktype === 'preload') {
											taskObj.siteid 		= obj.task[i].siteid;
											taskObj.taskid 		= obj.task[i]._id;
											taskObj.tasktype 	= obj.task[i].tasktype;
											taskObj.initialpath	= obj.task[i].initialpath;
											taskObj.starttime	= new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10).replace(/\-/g, ':');
											taskObj.endtime		= new Date(new Date().getTime() + 86400000 * 7 - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10).replace(/\-/g, ':'); //one week available
											taskObj.lmt			= obj.task[i].createtime;
											taskObj.revision	= obj.task[i].revision;
											taskObj.dur			= obj.task[i].dur;
											
											taskmanager.insertNewTask(taskObj);
										
											newTask = true;
										}
										else if(obj.task[i].tasktype === 'upgrade') {
											taskObj.siteid 		= obj.task[i].siteid;
											taskObj.taskid 		= obj.task[i]._id;
											taskObj.tasktype 	= obj.task[i].tasktype;
											taskObj.initialpath	= obj.task[i].initialpath;
											if(obj.task[i].starttime) {
												taskObj.starttime	= obj.task[i].starttime.slice(0, 10);
												taskObj.endtime		= helper.getNextDay(helper.getNextDay(obj.task[i].starttime)).slice(0, 10); //keep it two days
											}
											else {
												taskObj.starttime	= new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10).replace(/\-/g, ':');
												taskObj.endtime		= new Date(new Date().getTime() + 86400000 * 2 - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10).replace(/\-/g, ':'); //2 days available
											}
											taskObj.lmt			= obj.task[i].createtime;
											taskObj.revision	= obj.task[i].revision;
											
											taskmanager.insertNewTask(taskObj);
										
											newTask = true;
										}
										else if(obj.task[i].tasktype === 'reject') {//reject task
											//if still has following publish task, not set reload to render to avoid black screen
											var isTodayRepublish = function(taskList, index) {
												if(!taskList || !util.isArray(taskList) || !taskList.length || (index < 0) || (taskList[index].tasktype !== 'reject')) {
													return false;
												}
												
												var today = new Date();
												var todayString = helper.buildDateTimeString(today.getFullYear(), today.getMonth() + 1, today.getDate(), 0,0,0,0).slice(0, 10);
												var tempStart = todayString + ":00:00:00.000";
												var tempEnd = todayString + ":24:00:00.000";
//console.log('check including.');
												if(helper.withinRange(tempStart, tempEnd, taskList[index].starttime, taskList[index].endtime)) {
//console.log('reject task include today.');
													for(var x = index + 1; x < taskList.length; x++) {
														if((taskList[x].tasktype === "schedule") && helper.withinRange(tempStart, tempEnd, taskList[x].starttime, taskList[x].endtime)) {
//console.log('publish task include today too.');
															return true;
														}
													}
												}
												
												return false;
											}
											
											if(isTodayRepublish(obj.task, i)) {
												taskObj.noreload = true;
											}
											taskObj.siteid 		= obj.task[i].siteid;
											taskObj.taskid 		= obj.task[i]._id;
											taskObj.tasktype 	= obj.task[i].tasktype;
											taskObj.initialpath	= obj.task[i].initialpath;
											taskObj.starttime	= obj.task[i].starttime;
											taskObj.endtime		= obj.task[i].endtime;
											taskObj.lmt			= obj.task[i].createtime;
											taskObj.revision	= obj.task[i].revision;
											
											taskmanager.insertNewTask(taskObj);
										
											newTask = true;
										}
										else {//schedule task
											taskObj.siteid 		= obj.task[i].siteid;
											taskObj.taskid 		= obj.task[i]._id;
											taskObj.tasktype 	= obj.task[i].tasktype;
											taskObj.initialpath	= obj.task[i].initialpath;
											taskObj.starttime	= obj.task[i].starttime;
											taskObj.endtime		= obj.task[i].endtime;
											taskObj.lmt			= obj.task[i].createtime;
											taskObj.revision	= obj.task[i].revision;
											
											taskmanager.insertNewTask(taskObj);
										
											newTask = true;
										}
									}
									
									newestTaskTime = taskmanager.getNewestTaskTime();
									if(newestTaskTime) {
										if(newestTaskTime < newestSpecialTaskTime) {
											controllerConfig.newesttasktime = newestSpecialTaskTime;
										} 
										else {
											controllerConfig.newesttasktime = newestTaskTime;
										}
									}
									else {
										if(needStopUC) {
											controllerConfig.newesttasktime = newestSpecialTaskTime;
										} 
										
										if(controllerConfig.newesttasktime < newestSpecialTaskTime) {
											controllerConfig.newesttasktime = newestSpecialTaskTime;
										}
									}
									
									settingObj = generateObjForConfigUpdate('player', 'newesttasktime', controllerConfig.newesttasktime);
									configsetting.push(settingObj); 
			
									if(needStopUC) {
										settingObj = generateObjForConfigUpdate('player', 'stopuc', true);
										configsetting.push(settingObj); 
										
										settingObj = generateObjForConfigUpdate('player', 'uc', false);
										configsetting.push(settingObj); 
										helper.invokeRenderHB();
									}
									
									logger.debug(dataObj);
									logger.debug('got new tasks.');
									//logger.debug(obj.task);
								}
			
								//3. reboot
								if(obj.reboot) {
									logger.debug('got reboot command.');
			
									//set reboot flag into config
									settingObj = generateObjForConfigUpdate('player', 'reboot', true);
									configsetting.push(settingObj); 
									
									logger.debug('server asks for reboot.');
									
									command_parameterArray		= [];
									command_parameterObj 		= {};
									command_parameterObj.cmd 	= 'ws5.reboot';
									command_parameterObj.param 	= '';
									
									command_parameterArray.push(command_parameterObj);
									
									cmdsetObj			= {};
									cmdsetObj.id 		= helper.getUUID();
									cmdsetObj.cmd_set 	= command_parameterArray;
									cmdsetObj.comment 	= 'reboot';
									
									dummyArray.push(cmdsetObj);
								}
								else {
									//set reboot flag into config
									settingObj = generateObjForConfigUpdate('player', 'reboot', false);
									configsetting.push(settingObj); 
									
									//logger.debug('clear reboot flag.');
								}
								
								
								//4. shutdown
								if(obj.shutdown) {
									logger.debug('got shutdown command.');
									
									//set reboot flag into config
									settingObj = generateObjForConfigUpdate('player', 'shutdown', true);
									configsetting.push(settingObj); 
									
									logger.debug('server asks for shutdown.');
									
									command_parameterArray		= [];
									command_parameterObj 		= {};
									command_parameterObj.cmd 	= 'ws5.shutdown';
									command_parameterObj.param 	= '';
									
									command_parameterArray.push(command_parameterObj);
									
									cmdsetObj			= {};
									cmdsetObj.id 		= helper.getUUID();
									cmdsetObj.cmd_set 	= command_parameterArray;
									cmdsetObj.comment 	= 'shutdown';
									
									dummyArray.push(cmdsetObj);
								}
								else {
									//set shutdown flag into config
									settingObj = generateObjForConfigUpdate('player', 'shutdown', false);
									configsetting.push(settingObj); 
									
									//logger.debug('clear shutdown flag.');
								}
			
			
								//5. get snapshot
								if(obj.snapshot) {
//console.log('got snapshot command.');
									var tempSnapshotLocalPath = helper.serverPath + 'addon' + path.sep + 'command' + path.sep + 'screenshot.jpg';
									
									//remove the last snapshot file, otherwise it ishard to judge the snapshot is ready or not.
									try {
										fs.unlinkSync(tempSnapshotLocalPath);
									}
									catch(e) { 
//console.log('remove last snapshot file failed.' + tempSnapshotLocalPath);
										logger.error('remove last snapshot file failed.  ' + tempSnapshotLocalPath);
									}
	
									//set snapshot flag into config
									settingObj = generateObjForConfigUpdate('player', 'snapshot', true);
									configsetting.push(settingObj); 
									
									logger.debug('server asks for snapshot.');
									
									command_parameterArray		= [];
									command_parameterObj 		= {};
									command_parameterObj.cmd 	= 'ws5.snapshot';
									command_parameterObj.param 	= '192 192';
									
									command_parameterArray.push(command_parameterObj);
									
									cmdsetObj			= {};
									cmdsetObj.id 		= helper.getUUID();
									cmdsetObj.cmd_set 	= command_parameterArray;
									cmdsetObj.comment 	= 'get snapshot';
									
									dummyArray.push(cmdsetObj);
								}
								else {
//console.log('NOT got snapshot command.');
									//set snapshot flag into config
									settingObj = generateObjForConfigUpdate('player', 'snapshot', false);
									configsetting.push(settingObj); 
									
									//logger.debug('clear snapshot flag.');
								}
								
								//6. loglevel
								if(obj.loglevel && obj.loglevel !== helper.config.logsettings.loglevel) {
									settingObj = generateObjForConfigUpdate('log', 'loglevel', obj.loglevel);
									logsetting.push(settingObj); 
									
									logger.debug('got new log level setting.');
									logger.debug(helper.config.playersettings.loglevel);
								}
								
								//7. timezone
								if(obj.timezone && obj.timezone !== controllerConfig.timezone) {
									settingObj = generateObjForConfigUpdate('player', 'timezone', obj.timezone);
									configsetting.push(settingObj); 
									
									logger.debug('got new time zone setting. ' + controllerConfig.timezone);
									controllerCmd.setLocalTimeZone(helper, obj.timezone, function(err) {
										if(err) {
											logger.error('error occurs when set new timezone. ' + obj.timezone);
										}
										
										//timezone changed, should regenerate rendercontent and let player reload.
										logger.debug('need reboot to let nodejs got new timezone.');
										
										command_parameterArray		= [];
										command_parameterObj 		= {};
										command_parameterObj.cmd 	= 'ws5.reboot';
										command_parameterObj.param 	= '';
										
										command_parameterArray.push(command_parameterObj);
										
										cmdsetObj			= {};
										cmdsetObj.id 		= helper.getUUID();
										cmdsetObj.cmd_set 	= command_parameterArray;
										cmdsetObj.comment 	= 'reboot';
										
										dummyArray.push(cmdsetObj);
										
										controllerCmd.executeCommand(helper, dummyArray, '', false, function() {
										});
									});
								}
								
								//8. set group array it belongs to
								if(!controllerConfig.belongs || (obj.belongs && (controllerConfig.belongs.length !== obj.belongs.length))) {
									settingObj = generateObjForConfigUpdate('player', 'belongs', obj.belongs);
									configsetting.push(settingObj); 
								}
								else {
									for(var x = 0 ; x < obj.belongs.length; x++) {
										if(controllerConfig.belongs[x] !== obj.belongs[x]) {
											settingObj = generateObjForConfigUpdate('player', 'belongs', obj.belongs);
											configsetting.push(settingObj); 
											break;
										}
									}
								}
								
			
								//9. collect log
								if(obj.collectlog) {
									//set collectlog flag into config
									settingObj = generateObjForConfigUpdate('player', 'collectlog', true);
									configsetting.push(settingObj); 
								}
								else {
									//set collectlog flag into config
									settingObj = generateObjForConfigUpdate('player', 'collectlog', false);
									configsetting.push(settingObj); 
									
									//logger.debug('clear collectlog flag.');
								}
								
								//10. schedule priority
								if(controllerConfig.topfirst !== obj.topfirst) {
									//the priority is changed, need to reparse schedule
									
									settingObj = generateObjForConfigUpdate('player', 'topfirst', obj.topfirst);
									configsetting.push(settingObj); 
	
									settingObj = generateObjForConfigUpdate('player', 'needreload', true);
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'lastdesktoppath', '');
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'lastscheduleparsetime',  new Date('2000-01-01'));
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'nextgetscheduletime',  new Date('2000-01-01').toISOString());
									configsetting.push(settingObj); 
									
									settingObj = generateObjForConfigUpdate('player', 'lastgetscheduletime',  new Date('2000-01-01').toISOString());
									configsetting.push(settingObj); 
									
									//remove publish folder to generate new content
									var renderContentPath = helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + 'rendercontent.json';
									
									try {
										fs.unlinkSync(renderContentPath);
									}
									catch(e) {
										logger.error('error occurs when remove publish render content change schedule priority.');
										logger.error(e);
									}
								}
								
								if(util.isArray(configsetting) && (configsetting.length > 0)) { //write new settings into config
									process.send({'configsetting': { 'from': 'heartbeatprocess', 'data': configsetting}});
								}
								
								if(util.isArray(logsetting) && (logsetting.length > 0)) { //write new settings into config
									process.send({'logsetting': { 'from': 'heartbeatprocess', 'data': logsetting}});
								}
								
								
								if(newTask) { //let login process to notify download process the new task coming.
									process.send({'action' : 'newtask'});
			
									logger.debug('inform login process new task coming.');
								}
							}
							else {
								logger.error('error occurs when send heartbeat to server.');
								logger.error(obj);
								
								if((obj.id === 450) || (obj.id === 5)) { //session error, need relogin.
									logger.error('heartbeat request returns error. error id=' + obj.id);
									logger.error('heartbeat process [' + process.pid + '] will exit.');
									process.nextTick(function() {
										process.exit(1);	
									});
									return;
								}
							}
						}
					}
					
					if(dummyArray.length) {
						controllerCmd.executeCommand(helper, dummyArray, '', false, function() {
							process.nextTick(function() {
								heartbeatTimeoutHandler = setTimeout(sendHeartbeat, 100); //shorten the interval to let the data be sent to server right away.
							});		
						});
					}
					else {
						heartbeatTimeoutHandler = setTimeout(sendHeartbeat, heartbeatInterval);
					}
				});
			});
		});
	});
}

if(!helper.config) {
	return;
}

heartbeatInterval = helper.config.playersettings.defaulthbinterval;
//console.log('the parameter got from caller is:');
//console.log(process.argv[2]);
versionString = process.argv[2];
cookieFromServer = process.argv[3];

taskmanager = new TaskManager();
//var hd = new memWatch.HeapDiff();

sendHeartbeat();

process.on('message', function (m) {
	if(m && (m.action) && (m.action === 'exit')) {
		logger.error('receive exit message from login process.');
		clearTimeout(heartbeatTimeoutHandler);

		logger.error('heartbeat process [' + process.pid + '] will exit.');
		process.nextTick(function() {
			process.exit(1);	
		});
	}
});
/*
process.on('exit', function() {
  console.log('receive exit in heartbeatprocess.js.');
  logger.warn('receive exit in heartbeatprocess.js.');
});
process.on('SIGINT', function() {
  logger.warn('receive SIGINT in heartbeatprocess.js.');
});
*/
