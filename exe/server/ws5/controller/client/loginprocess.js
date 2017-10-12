var os 	= require('os');
var fs 	= require('fs');
var url = require('url');
var util = require('util');
var path = require('path');
var childProcess = require('child_process');
var ControllerHelper = require('./controllerhelper');
var ControllerCmd 	= require('./command');

var controllerCmd 	= new ControllerCmd();
var helper 	= new ControllerHelper();
var logger 	= helper.logger;
var intervalHandler 	= null;
var heartbeatProcess 	= null;
var failHeartbeatTimes 	= 0;
var lastSuccessHB 		= null;
var downloadProcess 	= null;
var lastSuccessDownload	= null;

var dataObj 		= {};
var serverURL 		= '';
var parentAliveAt 	= 0;
var renderAbnormal 	= false;
var versionString	= '';
var controllerConfig = null;
var parameterArray 	= [];

var exitFunc = function() { //exit hb process, download process and login process
	logger.error('receive exit message from register, or app.js does not send alive message for long time.');
	if(intervalHandler) clearInterval(intervalHandler);
	if(heartbeatProcess) {
		logger.error('send message to heartbeat and download process to let it exit.');
		logger.error('need relogin and create new heartbeat and download process.');
		heartbeatProcess.send({action: 'exit'});
		downloadProcess.send({action: 'exit'});
		
		setTimeout(function() {
			logger.error('login process [' + process.pid + '] will exit.');
			process.exit(1);	
		}, 2000);
	}
}

var changePlayerSetting = function(settingArray) {
	if(!settingArray || !util.isArray(settingArray) || !settingArray.length) return;
	
	var i = 0;
	var size = settingArray.length;
	var hasDifference = false;
	
	if(!controllerConfig) {
console.log('controllerConfig has not been ready wait 100ms.');
		setTimeout(changePlayerSetting, 100, settingArray);
		return;
	}
//console.log('controllerConfig is ready.');
	var invokeRenderHB = false;
	for(i = 0 ; i < size; i++)
	{
		if(controllerConfig[settingArray[i].name] !== settingArray[i].value) 
		{
			controllerConfig[settingArray[i].name] = settingArray[i].value;
			hasDifference = true;
		}
		if(!invokeRenderHB && settingArray[i].name == 'needreload' && settingArray[i].value)
		{
			logger.error('changePlayerSetting----need invoke render heartbeat');
			invokeRenderHB = true;
		}
	}
//logger.debug('the last player hb time is:' + helper.config.playersettings.lastheartbeattime);		
	if(hasDifference) {
		helper.writeDynamicConfig(controllerConfig, function(err) {
			if(err) { 
				logger.error('error occurs when write new controller config to DB. err= ' + err);
			}
		});
//		helper.config = helper.loadConfig();
	}
	if(invokeRenderHB) helper.invokeRenderHB();
}

var changeLogSetting = function(settingArray) {
	if(!settingArray || !util.isArray(settingArray) || !settingArray.length) return;
	
	var i = 0;
	var size = settingArray.length;
	var hasDifference = false;
	
	for(i = 0 ; i < size; i++)
	{
		if(helper.config.logsettings[settingArray[i].name] !== settingArray[i].value) {
			helper.config.logsettings[settingArray[i].name] = settingArray[i].value;
			hasDifference = true;
		}
	}
	
	if(hasDifference) {
		helper.writeConfigSync(helper.config);
//		helper.config = helper.loadConfig();
	}
}

var checkRenderAbnormal = function(currentTime, playerLastHBTime) {
		//check player send heartbeat normally or not, if no hb for a while, will reload it.
		var abnormalinterval = helper.config.playersettings.abnormalinterval || 0;
		if(abnormalinterval < helper.config.playersettings.renderhbinterval * 3) abnormalinterval = helper.config.playersettings.renderhbinterval * 3;
		if(!abnormalinterval || (Math.abs(currentTime - playerLastHBTime) > abnormalinterval)) 
		{
			logger.error('the last player hb time is:' + controllerConfig.lastheartbeattime + '   ' + playerLastHBTime);		
			logger.error('helper.config.playersettings.abnormalinterval=' + abnormalinterval);		
			//console.log('the last player hb time is:' + controllerConfig.lastheartbeattime + '   ' + playerLastHBTime);		
			//console.log('helper.config.playersettings.abnormalinterval=' + abnormalinterval);		
			if(renderAbnormal) {
				renderAbnormal = false;
				logger.error('render abnormal, will reload it.');		
				console.log('render abnormal, will reload it.');		
			
				//call app to reload render
				controllerCmd.restartRender(helper, function(err) {
					//do nothing.
				});
			}
			else {
				renderAbnormal = true;
			}
		}else {
			renderAbnormal = false;
		}
}

var startDownloadProcess = function()
{
	if(parameterArray.length > 0)
	{
		downloadProcess = childProcess.fork(helper.serverPath + 'ws5/controller/client/downloadprocess.js', parameterArray);	
		logger.debug('download process is ' + downloadProcess.pid);
		
		downloadProcess.on('message', function(m) {
			if(m && m.action && (m.action === 'HB')) {
				lastSuccessDownload = new Date(m.HBTime);
	logger.debug('got new download active time from child:' + lastSuccessDownload);
	//console.log('got new download active time from child:' + lastSuccessDownload);
			}
			else if(m && (m.configsetting)) {
	//console.log('login process got configsetting from download process:');
	//console.log(JSON.stringify(m.configsetting, '', 4));
				logger.debug('get config settng changes from:' + m.configsetting.from);
				changePlayerSetting(m.configsetting.data);
			}
		});

		downloadProcess.on('exit', function(code, signal) {
			logger.error('download process exit. code=' + code + '  signal=' + signal);
			downloadProcess = null;
		});	
	}
}

var sendLogin = function() {
	var obj 			= {};
	var current 		= null;
	var cookieFromServer = '';
	//var parameterArray 	= [];
	var proxy			= {};
	var backupConfigFilePath = helper.WS5Path + path.sep + 'config' + path.sep + 'controller_backup.json';
	var dynamicConfigFilePath = helper.WS5Path + path.sep + 'config' + path.sep + 'dynamicConfig.json';
	
//logger.error(process.memoryUsage());
		
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

//console.log('start to login or heartbeat checking. [' + process.pid + ']');
		logger.debug('start to login or heartbeat checking. [' + process.pid + ']');
		logger.debug('version: ' + versionString);
		
		var currentTime = new Date().getTime();
		//check app.js process exist or not, if it exit, the login/hb/download process should exit too because the new app.js process will create a set of new process for them.
		if(parentAliveAt && ((currentTime - parentAliveAt) > helper.config.playersettings.abnormalinterval)) { //long time not get parent message
			logger.error('long time not get parent message, will kill heartbeat and download process then exit myself.');
			logger.error('last message at ' + new Date(parentAliveAt));
			exitFunc();
			return;
		}
		
		var playerLastHBTime = 0;
		if(controllerConfig.lastheartbeattime) {
			playerLastHBTime = new Date(controllerConfig.lastheartbeattime).getTime();
		}
		else {
			if(controllerConfig && controllerConfig.serverurl && 
				controllerConfig.playerid && controllerConfig.siteid && controllerConfig.playername && 
				controllerConfig.playerpwd && controllerConfig.grouppath && controllerConfig.uuid) {
				playerLastHBTime = new Date(2000,0,1).getTime();
			}
			else {//player information is not completed
				playerLastHBTime = currentTime;
			}
		}
		
		//check player send heartbeat normally or not, if no hb for a while, will reload it.
		checkRenderAbnormal(currentTime, playerLastHBTime);
	
		if(!heartbeatProcess) { //not login
			logger.debug('login and create new heartbeat and download process.');
	
			parameterArray = [];
			//get parameter from config
			dataObj.siteid = controllerConfig.siteid;
			dataObj.playerid = controllerConfig.playerid;
			dataObj.pwd = controllerConfig.playerpwd;
			
			if(controllerConfig.proxy && controllerConfig.proxy.host) { proxy = controllerConfig.proxy; }
			
			//check the parameters validation
			if((dataObj.siteid) && (dataObj.playerid) && controllerConfig.serverurl) {
				urlObj = url.parse(controllerConfig.serverurl);
				serverURL = urlObj.protocol + '//' + urlObj.host + '/ws5/controller/login.js';
				dataObj.version = helper.config.playersettings.version;
				
				helper.postRequestToServer(serverURL, dataObj, '', proxy, function(err, returnData, cookie) {
					if(err || !returnData) {
						logger.error('error occurs when call server controller login.js. ' + serverURL);
						logger.error(err);
						if(returnData) { logger.error(returnData); }
						logger.error('send message to heartbeat and download process to let it exit.');
						logger.error('need relogin and create new heartbeat and download process.');
						try {
							if(heartbeatProcess) heartbeatProcess.send({action: 'exit'});
							if(downloadProcess) downloadProcess.send({action: 'exit'});
							heartbeatProcess = null;
							downloadProcess = null;
						}
						catch(e) {
							console.log(e);
							logger.error('error occur when kill hb/download process.');
							logger.error(e);
						}
					}
					else {
						try {
							obj = JSON.parse(returnData, '', 4);
						}
						catch(e) {
							logger.error('Error occurs when parsing returned data.');
							logger.error(returnData);
							logger.error(e);
						}
			
						if(obj) {
							if(obj.status === true) { 
								parameterArray.push(versionString);
								
								//get cookie
								if(cookie && cookie.indexOf('connect.sid') >= 0) {
				//					console.log(cookie);			
									var pos1 = cookie.indexOf('connect.sid');
									var pos2 = cookie.indexOf(';', pos1 + 1);
				//					console.log(cookie.slice(pos1, pos2-pos1));
									cookieFromServer = cookie.slice(pos1, pos2 - pos1);
									parameterArray.push(cookieFromServer);
								}		
								
								//back up conroller config file
								helper.writeDataFile(backupConfigFilePath, helper.config);
								helper.writeDataFile(dynamicConfigFilePath, controllerConfig);
	
		
//console.log('get cookie');
//console.log(parameterArray);
//console.log('start a hb process.');
								//fork hearbeat process
								lastSuccessHB 		= new Date();
								lastSuccessDownload = new Date();
								failHeartbeatTimes 	= 0;
								try {
									if(heartbeatProcess) heartbeatProcess.send({action: 'exit'});
								}
								catch(e) {
									console.log(e);
									logger.error('error occur when kill hb process.');
									logger.error(e);
								}
								
								heartbeatProcess 	= childProcess.fork(helper.serverPath + 'ws5/controller/client/heartbeatprocess.js', parameterArray);	
								logger.debug('heartbeat process is ' + heartbeatProcess.pid);
								
								heartbeatProcess.on('message', function(m) {
									if(m && m.action && (m.action === 'HB')) {
									  	lastSuccessHB 	= new Date(m.HBTime);
										logger.debug('got new heartbeat time from child:' + lastSuccessHB);
									}
									else if (m && m.action && (m.action === 'newtask')) {
										if(downloadProcess) {
											downloadProcess.send({'action' : 'newtask'});
										}
									}
									else if(m && (m.configsetting)) {
//console.log('login process got configsetting from heartbeat process:');
//console.log(JSON.stringify(m.configsetting, '', 4));
										logger.debug('get config settng changes from:' + m.configsetting.from);
										changePlayerSetting(m.configsetting.data);
									}
									else if(m && (m.logsetting)) {
//console.log('login process got logsetting from heartbeat process:');
//console.log(JSON.stringify(m.logsetting, '', 4));
										logger.debug('get log settng changes from:' + m.configsetting.from);
										changeLogSetting(m.logsetting.data);
									}
								});

								heartbeatProcess.on('exit', function(code, signal) {
									logger.error('heartbeat process exit. code=' + code + '  signal=' + signal);
									heartbeatProcess = null;
								});
								
								try {
									if(downloadProcess) downloadProcess.send({action: 'exit'});
								}
								catch(e) {
									console.log(e);
									logger.error('error occur when kill download process.');
									logger.error(e);
								}								
								startDownloadProcess();								
							}
							else {
console.log('fail to login, will retry after ' + helper.config.playersettings.defaultinterval + ' milliseconds.');
console.log(obj);
								logger.error('fail to login, will retry after ' + helper.config.playersettings.defaultinterval + ' milliseconds.');
								logger.error(obj);
								fs.unlink(dynamicConfigFilePath, function(err) {
									if(err) {
										logger.error('error occurs when remove dynamic config file.');
									}
								});
							}
						}
					}
				});
			}
			else { //exit and wait for user register player
console.log('still not register player to server. will exit.');
				logger.error('still not register player to server. will exit.');
				fs.unlink(dynamicConfigFilePath, function(err) {
					if(err) {
						logger.error('error occurs when remove dynamic config file.');
					}
	
					process.exit(1);
				});
			}
		}
		else { //logined
			//if found heartbeat can not update data in json file continuously(duration > helper.config.playersettings.abnormalinterval), 
			//then reset the heartbeat failure timer, kill the heartbeat process and start another one.
			current = new Date();
	
//console.log((current.getTime() - lastSuccessDownload.getTime()));
			if((lastSuccessHB && ((current.getTime() - lastSuccessHB.getTime()) > helper.config.playersettings.abnormalinterval))/* || (lastSuccessDownload && ((current.getTime() - lastSuccessDownload.getTime()) > helper.config.playersettings.abnormalinterval))*/) {
logger.debug('lastSuccessHB= ' + lastSuccessHB.toISOString() + '   current= ' + current.toISOString() + '    (current - lastSuccessHB) > helper.config.playersettings.abnormalinterval = ' + ((current.getTime() - lastSuccessHB.getTime()) > helper.config.playersettings.abnormalinterval));		
//logger.debug('lastSuccessDownload= ' + lastSuccessDownload.toISOString() + '   current= ' + current.toISOString() + '    (current - lastSuccessDownload) > helper.config.playersettings.abnormalinterval = ' + ((current.getTime() - lastSuccessDownload.getTime()) > helper.config.playersettings.abnormalinterval));		
				//if still can not get correct heartbeat data after helper.config.playersettings.retrytimes retry, 
					//reset all timer number and interval, re-login.
				failHeartbeatTimes = 0;
				console.log('will relogin to server.');
				logger.error('send message to heartbeat and download process to let it exit.');
				logger.error('will relogin to server.');
				try {
					if(heartbeatProcess) heartbeatProcess.send({action: 'exit'});
					if(downloadProcess) downloadProcess.send({action: 'exit'});
				}
				catch(e) {
					console.log(e);
					logger.error('error occur when kill hb/download process.');
					logger.error(e);
				}
//				heartbeatProcess.kill();
				heartbeatProcess = null;
//				downloadProcess.kill();
				downloadProcess = null;
			}
			else {
				if(!downloadProcess && parameterArray.length > 0)
				{					
					logger.error('download process might exit unexpectedly, will start it again');
					startDownloadProcess();					
				}
				if(lastSuccessHB) {
//console.log('still wait:' + (current - lastSuccessHB));
				}
				else {
//console.log('not ready lastSuccessHB=' + lastSuccessHB);
				}
			}
		}
	});
}

logger.error("\n\n\nstart a new login process!!!!");
versionString = process.argv[2];

var controllerConfig = null;
var NTPTime = require('./ntptime.js');
var ntptime = new NTPTime();

var syncTime = function() {
	if(controllerConfig && controllerConfig.timeserver && helper.config.playersettings.maxsynctimedelay && helper.config.playersettings.maxtimedifference) {
logger.debug('sync time from ' + controllerConfig.timeserver);
		ntptime.syncTime(controllerConfig.timeserver, helper.config.playersettings.maxtimedifference, helper.config.playersettings.maxsynctimedelay, function(err) {
			if(err) {
				logger.error('error occurs when sync and set time.');
			}
			
			setTimeout(syncTime, 3000);

			return;	
		});
	}
}


helper.loadDynamicConfig(function(err, configObj) {
	if(err) {
console.log('error occurs when get controller config from DB. err=' + err);
		logger.error('error occurs when get controller config from DB. err=' + err);
		return;
	}
	
	controllerConfig = configObj;
	sendLogin();
	if(helper.config && helper.config.playersettings && helper.config.playersettings.defaultinterval) {
		intervalHandler = setInterval(sendLogin, helper.config.playersettings.defaultinterval);
	}

	syncTime();
});


process.on('message', function (m) {
	if(m && (m.action) && (m.action === 'exit')) {
		exitFunc();
	}
	else if(m && (m.configsetting)) {
//console.log('login proess got configsetting:');
//console.log(JSON.stringify(m.configsetting, '', 4));
		logger.debug('get config settng changes from:' + m.configsetting.from);
		changePlayerSetting(m.configsetting.data);
	}
	else if(m && (m.logsetting)) {
//console.log('login process got logsetting:');
//console.log(JSON.stringify(m.logsetting, '', 4));
		logger.debug('get log settng changes from:' + m.configsetting.from);
		changeLogSetting(m.logsetting.data);
	}
	else if(m && (m.parent)) {
//console.log('login process got parent alive message.');
		parentAliveAt = new Date().getTime();
	}
});
/*
process.on('exit', function (m) {
	logger.error('receive exit message.');
});
*/

