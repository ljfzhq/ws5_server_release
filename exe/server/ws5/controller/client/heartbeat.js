var util 				= require('util');
var fs 					= require('fs');
var path 				= require('path');
var ControllerHelper 	= require('./controllerhelper');

var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var RenderHeartbeat = function() {
	this.do = function(req, res) {
		var nextGetContent 	= 0;
		var lastGetContent 	= 0;
		var now 			= 0;
		var dataObj 		= {};
		var tempDataObj		= {};
		var retVal 			= {
			status: false,
			id: 4,
			msg: helper.retval[4],
			reload: false
		};
		var configsetting   = [];
		var settingObj		= {};
		var lastParseTime	= 0;
		var lastHB			= 0;
		var controllerConfig= null;
		
		//do not know why this interface will create a session.
		delete req.session;		
		
		//get parameter from request
		tempDataObj = req.body;
		
		if(!tempDataObj) { tempDataObj = {}; }
		if(tempDataObj.data) {
			dataObj = JSON.parse(tempDataObj.data);
		}
		else {
			dataObj = tempDataObj;
		}
		
/*
		if(!dataObj.playlist) {
			dataObj.playlist = "/media/aaa.plst";
			dataObj.media = [
		            {
		                "path": "/media/bbb.jpg",
		                "type": "image"
		            }
		        ];
		}	
*/
		logger.debug(dataObj);
//console.log(dataObj);

		var acceptable = false;
		acceptable = helper.checkAcceptable(req);
		if(!acceptable){
console.log('access invalid');
			logger.error('invalid access. referer=' + req.headers.referer + '   origin=' + req.headers.origin);
			return res.send(retVal);
		}

		helper.loadDynamicConfig(function(err, configObj) {
			retVal = {
				status: false,
				id: 26,
				msg: helper.retval[26],
				reload: false
			};

			if(err) {
				logger.error('error occurs when get controller config from DB. err=' + err);
				return res.send(retVal);
			}
			
			controllerConfig = configObj;
			if(!controllerConfig) { //config wrong
				return res.send(retVal);
			}

			if(global.loginProcess && !global.loginProcess.exitCode && global.loginProcess.connected) {
			
				if(!dataObj.playlist) { controllerConfig.currentplaylist = ''; }
				else { controllerConfig.currentplaylist = dataObj.playlist; }
				settingObj = {}; 
				settingObj.name = 'currentplaylist'; 
				settingObj.value = controllerConfig.currentplaylist; 
				configsetting.push(settingObj); 
		
				if(!dataObj.media || !util.isArray(dataObj.media) || !dataObj.media.length) { controllerConfig.currentmedia = [{ "path": "", "type": "" }]; }
				else { 
					var tempMediaArray 	= [];
					var pathPrefix 		= '';
					var prefixLength	= 0;
					var tempPos 		= -1;
					
					tempMediaArray = dataObj.media;
					pathPrefix = helper.fileLibPath + path.sep + controllerConfig.sitename;
					prefixLength = pathPrefix.length;
					
					for(var mediaIndex = 0, mediaNumber = tempMediaArray.length ; mediaIndex < mediaNumber; mediaIndex++) {
						if(tempMediaArray[mediaIndex].type === 'inlineEventZoneWidget') {
							tempMediaArray[mediaIndex].path = '';
						}
						else {
							tempPos = tempMediaArray[mediaIndex].path.indexOf(pathPrefix);
							if(tempPos === 0) {
								tempMediaArray[mediaIndex].path = tempMediaArray[mediaIndex].path.slice(prefixLength).replace(/\\/g, '/');
							}
							else {
								tempMediaArray[mediaIndex].path = '';
							}
						}
					}
					controllerConfig.currentmedia = tempMediaArray; 
				}
				settingObj = {}; 
				settingObj.name = 'currentmedia'; 
				settingObj.value = controllerConfig.currentmedia; 
				configsetting.push(settingObj); 
				
				now 	= new Date().getTime();
				lastHB 	= new Date(controllerConfig.lastheartbeattime).getTime();
				controllerConfig.lastheartbeattime = new Date();
				settingObj = {}; 
				settingObj.name = 'lastheartbeattime'; 
				settingObj.value = controllerConfig.lastheartbeattime; 
				configsetting.push(settingObj); 
				
				if(Math.abs(lastHB - now) >= (4 * helper.config.playersettings.renderhbinterval)) {
//console.log('helper.config.playersettings.lastheartbeattime=' + new Date(lastHB));
//console.log('now=' + new Date(now));
	
					logger.error('helper.config.playersettings.lastheartbeattime=' + new Date(lastHB));
					logger.error('now=' + new Date(now));
					logger.error('a big time difference from last heartbeat, may due to timezone changed, local time changed or sync time.');
					logger.error('anyway, will regenerate rendercontent.json to guarantee render get correct content.');
					controllerConfig.lastgetscheduletime = new Date('2000-01-01').toISOString();
					settingObj = {}; 
					settingObj.name = 'lastgetscheduletime'; 
					settingObj.value = new Date('2000-01-01'); 
					configsetting.push(settingObj); 
					
					controllerConfig.nextgetscheduletime = new Date('2000-01-01').toISOString();
					settingObj = {}; 
					settingObj.name = 'nextgetscheduletime'; 
					settingObj.value = new Date('2000-01-01'); 
					configsetting.push(settingObj); 
					
					controllerConfig.lastscheduleparsetime = new Date('2000-01-01');
					settingObj = {}; 
					settingObj.name = 'lastscheduleparsetime'; 
					settingObj.value = new Date('2000-01-01'); 
					configsetting.push(settingObj); 
					
					controllerConfig.needreload = true;
					settingObj = {}; 
					settingObj.name = 'needreload'; 
					settingObj.value = true; 
					configsetting.push(settingObj); 
					
					//remove publish folder to generate new content
					var renderContentPath = helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + 'rendercontent.json';
/*
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('remove rendercontent.json due to long time not get render heartbeat.');
console.log('lastHB=' + lastHB + '           now=' + now);
console.log('Math.abs(lastHB - now)=' + Math.abs(lastHB - now));
*/
					logger.debug('remove rendercontent.json due to long time not get render heartbeat.');
					
					try {
						if(fs.existsSync(renderContentPath)) fs.unlinkSync(renderContentPath);
						else{
							//2017.8.28 Jeff
							//if not reset "newesttasktime", the player can't get any tasks under the below steps:
							//1. publish a new playlist
							//2. the player receives the playlist
							//3. the customer remove all files/folders under download\defaultsite\publish
							//4. if don't modify the playlist then republish it, the player never receive the playlist again even restart
							if(controllerConfig.newesttasktime){ //the code is making sure such player can get the newest task again													
								settingObj = {}; 								
								settingObj.name = 'newesttasktime'; 								
								settingObj.value = new Date((new Date(controllerConfig.newesttasktime).getTime()) - 3000); 
								logger.error("reset controllerConfig.newesttasktime, old value:" + controllerConfig.newesttasktime + "  new value:" + settingObj.value);
								configsetting.push(settingObj); 
							}
						}
					}
					catch(e) {
						logger.error('error occurs when remove publish render content when change time zone.');
						logger.error(e);
					}
				}
	
				if(dataObj.restart === 'true') {
					logger.debug('render just start, will set reload.');
					controllerConfig.needreload = true;
					settingObj = {}; 
					settingObj.name = 'needreload'; 
					settingObj.value = true; 
					configsetting.push(settingObj); 
				}
				
				if(controllerConfig.uc === true) {
					controllerConfig.needreload = true;
					settingObj = {}; 
					settingObj.name = 'needreload'; 
					settingObj.value = true; 
					configsetting.push(settingObj); 
				}
				
				if(controllerConfig.stopuc === true) {
					controllerConfig.needreload = true;
					settingObj = {}; 
					settingObj.name = 'needreload'; 
					settingObj.value = true; 
					configsetting.push(settingObj); 
	
	
					controllerConfig.stopuc = false;
					settingObj = {}; 
					settingObj.name = 'stopuc'; 
					settingObj.value = false; 
					configsetting.push(settingObj); 
				}
				
				if(controllerConfig.lastscheduleparsetime) { lastParseTime = new Date(controllerConfig.lastscheduleparsetime).getTime(); }
				else { lastParseTime = 0; }
				
				if(controllerConfig.needreload/* && (lastParseTime > now)*/) { 
					logger.debug('got reload flag from other module. will sent reload to render.');
					retVal.reload = true; 
				}
				else { retVal.reload = false; }
	
				if(controllerConfig.nextgetscheduletime) {
					nextGetContent = new Date(controllerConfig.nextgetscheduletime).getTime();
					lastGetContent = new Date(controllerConfig.lastgetscheduletime).getTime();
//console.log(nextGetContent - now);
//console.log(lastGetContent - now);
//console.log('lastGetContent=' + lastGetContent + '             nextGetContent=' + nextGetContent + '        now=' + now);
					logger.debug('nextGetContent=%d, lastGetContent=%d, now=%d, helper.config.playersettings.renderhbinterval=%d',
							nextGetContent, lastGetContent, now, helper.config.playersettings.renderhbinterval);
					if((nextGetContent < now) || ((nextGetContent - now) < (6 * helper.config.playersettings.renderhbinterval))
					 	|| (lastGetContent > (now + (6 * helper.config.playersettings.renderhbinterval)))) {
						logger.debug('will set reload.');
						retVal.reload = true;
						logger.debug('(nextGetContent - now)='+(nextGetContent - now));
						logger.debug('(lastGetContent - now)='+(lastGetContent - now));
						if(lastGetContent > (now + (6 * helper.config.playersettings.renderhbinterval))) {
							logger.error('schedule time is ahead of current time, it is not normal, will reset last and next get schedule time.');
							logger.error('now=' + now.toString + '   lastgetscheduletime=' + controllerConfig.lastgetscheduletime + '     nextgetscheduletime=' + controllerConfig.nextgetscheduletime);
	
							controllerConfig.lastgetscheduletime = new Date('2000-01-01').toISOString();
							settingObj = {}; 
							settingObj.name = 'lastgetscheduletime'; 
							settingObj.value = controllerConfig.lastgetscheduletime; 
							configsetting.push(settingObj); 
			
							controllerConfig.nextgetscheduletime = new Date('2000-01-01').toISOString();
							settingObj = {}; 
							settingObj.name = 'nextgetscheduletime'; 
							settingObj.value = controllerConfig.nextgetscheduletime; 
							configsetting.push(settingObj); 
						}
					}
					else {
						logger.debug('content still can play %d ms, not need reload', (nextGetContent - now));
					}
				}
				else {
					logger.debug('not found controllerConfig.nextgetscheduletime, will set reload.');
					retVal.reload = true;
				}
				
				//inform render the player is registered, it can stop the welcome page playing.
				if((controllerConfig.serverurl) && (controllerConfig.playerid) && (controllerConfig.siteid) && (controllerConfig.playername) && 
					(controllerConfig.grouppath) && (controllerConfig.sitename) && (controllerConfig.uuid)) {
					retVal.registered = true;	
				}
				else {
					retVal.registered = false;	
				}
	
				retVal.downloadFolder = helper.fileLibPath + path.sep + controllerConfig.sitename;	
				
				if(retVal.reload) { logger.debug('inform render to reload schedule.'); }
						
				retVal.interval = helper.config.playersettings.renderhbinterval || 5000;
				
				global.loginProcess.send({'configsetting': { 'from': 'clientheartbeat', 'data': configsetting}});
				
				logger.debug('call heartbeat at ' + new Date().toString());
				retVal.status = true;
				retVal.id = 0;
				retVal.msg = helper.retval[0];
//console.log(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
			else { //not register and login yet
				//inform render the player is registered, it can stop the welcome page playing.
				if((controllerConfig.serverurl) && (controllerConfig.playerid) && (controllerConfig.siteid) && (controllerConfig.playername) && 
					(controllerConfig.grouppath) && (controllerConfig.sitename) && (controllerConfig.uuid)) {
					retVal.registered = true;	
				}
				else {
					retVal.registered = false;	
				}
				
				retVal.interval = helper.config.playersettings.renderhbinterval || 5000;
				retVal.downloadFolder = helper.fileLibPath;	
				retVal.reload = false;
				retVal.status = true;
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				return res.send(retVal);
			}
		});
	}
};
module.exports = RenderHeartbeat;

