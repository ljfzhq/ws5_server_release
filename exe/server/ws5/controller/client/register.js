var crypto 				= require('crypto');
var path 				= require('path');
var fs	 				= require('fs');
var hfs	 				= require('hfs');
var util	 			= require('util');
var fork 				= require('child_process').fork;
var ControllerHelper 	= require('./controllerhelper');

var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var ControllerRegister = function() {
	this.do = function(req, res) {
		var dataObj 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var hash 		= null;
		var encode 		= '';
		var returnedObj	= {};
		var that 		= this;
		var proxy		= {};
		var config		= null;

		
		//get parameter from request
/*
		dataObj = {
			serverurl		: 'http://localhost:2000',
			sitename		: 'defaultsite',
			player			: 'player3',
			pwd				: '123456'
	  	};
*/

		dataObj = req.body;
//console.log('dataObj=');
//console.log(dataObj);
/*
		if(!dataObj) {
			dataObj = {
				serverurl		: 'http://localhost:2000',
				sitename		: 'defaultsite',
		    	path			: '',
				player			: 'standalone',
				pwd				: '123456',
		  	};
		}
*/
		
		if(!dataObj.sitename) {
			dataObj.sitename = 'defaultsite';
		}
		
		if((!dataObj.serverurl) || (!dataObj.sitename) || (!dataObj.pwd) || (!dataObj.player)) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('the parameter from request is not correct. ');
			logger.error(dataObj);
			return res.send(retVal);
		}
		
		dataObj.serverurl = dataObj.serverurl + '/ws5/controller/register.js';
		
		if(dataObj.proxy) {
			var proxyHostArray = [];
			proxyHostArray = dataObj.proxy.split(':');
			proxy.host = proxyHostArray[0];
			proxy.port = proxyHostArray[1];
			
			if(dataObj.proxyId) {
				proxy.id = dataObj.proxyId;

				if(dataObj.proxyPwd) {
					proxy.pwd = dataObj.proxyPwd;
				}
			}
			
			if(dataObj.bypass) {
				proxy.bypass = dataObj.bypass.split(';');
				if(proxy.bypass && util.isArray(proxy.bypass)) {
					for(var i = 0, l = proxy.bypass.length; i < l; i++ ) {
						proxy.bypass[i] = proxy.bypass[i].toLowerCase();
					}
				}
				else {
					delete proxy.bypass;
				}
			}
		}

/*		
		hash = crypto.createHash("md5");
		hash.update(new Buffer(dataObj.pwd, "binary"));
		dataObj.pwd = hash.digest('hex');
*/
		
		helper.loadDynamicConfig(function(err, controllerConfig) {
			if(err) {
				logger.error('error occurs when get controller cofig from db. err=' + err);
				controllerConfig = null;
				
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error(retVal.msg);
				return res.send(retVal);
			}
			
			if(!controllerConfig.uuid) { dataObj.uuid = helper.getUUID(); }
			else { dataObj.uuid = controllerConfig.uuid; }
			
			helper.getPlayerLocalInfo(dataObj, function(obj) {
				obj.version = helper.config.playersettings.version;
				helper.postRequestToServer(obj.serverurl, obj, '', proxy, function(err, returnData, cookie) {
					if(err || !returnData) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error(retVal.msg);
						return res.send(retVal);
					}
					
					var oldSiteName = controllerConfig.sitename || '';
					try{
						returnedObj = JSON.parse(returnData);
					}
					catch(e) {
						logger.error('error occurs when parse register returned data.');
						logger.error(returnData);
					}			
//console.log(returnedObj);
					if(returnedObj.status === true) { //write playerid, playername, password, siteid, sitename, uuid to local file
						controllerConfig.serverurl 	= obj.serverurl;
						controllerConfig.playerid 	= returnedObj.playerid;
						controllerConfig.siteid 	= returnedObj.siteid;
						controllerConfig.playername = obj.player;
						controllerConfig.playerpwd 	= obj.pwd;
						controllerConfig.grouppath 	= returnedObj.grouppath;
						controllerConfig.sitename 	= obj.sitename;
						controllerConfig.uuid 		= obj.uuid;
						controllerConfig.proxy 		= proxy;
						controllerConfig.local 		= obj.local === 'true' ? true : false;
						controllerConfig.timezone	= obj.timezone;
						
						delete controllerConfig.lastmodifytime;
						delete controllerConfig.currentplaylist;
						delete controllerConfig.currentmedia;
						delete controllerConfig.powersetting;
						delete controllerConfig.shutdown;
						delete controllerConfig.snapshot;
						delete controllerConfig.reboot;
						delete controllerConfig.belongs;
						delete controllerConfig.newesttasktime;
						delete controllerConfig.lastscheduleparsetime;
						delete controllerConfig.needreload;
						delete controllerConfig.nextgetscheduletime;
						delete controllerConfig.lastgetscheduletime;
						delete controllerConfig.collectlog;
						delete controllerConfig.logpath;
						delete controllerConfig.downloadprogress;
						delete controllerConfig.downloadspeed;
						delete controllerConfig.packagepath;
						delete controllerConfig.upgradestarttime;
						delete controllerConfig.needreload;
						delete controllerConfig.lastheartbeattime;
						delete controllerConfig.lastdesktoppath;
						
						if(global.loginProcess && !global.loginProcess.exitCode && global.loginProcess.connected) { 
							logger.error('send exit message to login process [' + global.loginProcess.pid + '].');
							global.loginProcess.send({action: 'exit'});
							global.loginProcess = null;
						}
		
						process.nextTick(function() {
							//helper.writeConfigFileSync(configObj);
							helper.writeDynamicConfig(controllerConfig, function(err) {
								if(err) {
									logger.error('error occurs when save controller ocnfig to DB. err=' + err);
								}
								
								hfs.del(helper.fileLibPath + path.sep + 'task', function(err) {
									if(err) {
										logger.error('error occurs when delete task folder(%s) under download path after register successfully.', helper.fileLibPath + path.sep + 'task');
									}
	
//console.log('global.version=====' + global.version);
									var parameterArray = [];
									parameterArray.push(global.version);

									if(oldSiteName) {
										hfs.del(helper.fileLibPath + path.sep + oldSiteName, function(err) {
											if(err) {
												logger.error('error occurs when delete site folder(%s) under download path after register successfully.', helper.fileLibPath + path.sep + oldSiteName);
											}
//console.log('success delete old site.');
											setTimeout(function() {
												global.loginProcess = fork(helper.serverPath + 'ws5/controller/client/loginprocess.js', parameterArray);	
												logger.debug('new login process is ' + global.loginProcess.pid);
											}, 10000);
											
											return res.send(returnedObj);
										});
									}
									else {
										setTimeout(function() {
											global.loginProcess = fork(helper.serverPath + 'ws5/controller/client/loginprocess.js', parameterArray);	
											logger.debug('new login process is ' + global.loginProcess.pid);
										}, 10000);
										
										return res.send(returnedObj);
									}
								});
							});
						});		
					}
					else {
						return res.send(returnedObj);
					}
				});
			});
		});
	}
};
module.exports = ControllerRegister;

