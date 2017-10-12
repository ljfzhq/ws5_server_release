var util 				= require('util');
var url 				= require('url');
var fs 					= require('fs');
var path 				= require('path');
var ControllerHelper 	= require('./controllerhelper');

var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var GetSchedule = function() {
	this.do = function(req, res) {
		var contentFilePath = '';
		var contentObj		= {};
		var fragments		= {};
		var nextGetTime	 	= 0;
		var now 			= 0;
		var retVal 			= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var configsetting   = [];
		var settingObj		= {};
		var lastTimeOfParsedSchedule 	= null;
		var milliSecondsOfLastTime 		= 0;
		var milliSecondsOfCurrentTime 	= 0;
		var opReset						= false;
		var controllerConfig = null;
		
		var acceptable = false;
		acceptable = helper.checkAcceptable(req);
		if(!acceptable){
console.log('access invalid');
			logger.error('invalid access. referer=' + req.headers.referer + '   origin=' + req.headers.origin);
			return res.send(retVal);
		}

		var prepareAlertContentFromPlaylist = function(playlistObj, alertStartTime, alertEndTime) {
			var tempPlaylistObj		= {};
			var opArray				= [];
			var newMediaArray		= [];
			var playlistDuration	= 0;
			var returnObj			= {};
			
			var calculatePlaylistDuration = function(playlist) {
				if(!playlist || !playlist.dur) { return 0; }
				return parseInt(playlist.dur, 10);
			}
			
		
		
			if(!playlistObj || !alertStartTime || !alertEndTime) { return null; }
			
			playlistDuration = calculatePlaylistDuration(playlistObj);
			playlistObj.duration = playlistDuration;
				
			if(playlistObj && playlistObj.duration) {
				var tempStartTime = 0;
				var tempEndTime = 0;
				var opObj 		= {};
				var tempMediaArray = [];
				var tempIndex 	= 0;
				var mediaArray 	= [];
				
				tempStartTime = alertStartTime;
//console.log('tempStartTime='+tempStartTime);
//console.log('alertEndTime='+alertEndTime);
				while(tempStartTime < alertEndTime) {
					opObj 		= {};
					opObj.code 	= 'newDesktop';
					opObj.start = tempStartTime;
if(helper.config.logsettings.loglevel === 'debug') {
	opObj.startString = new Date(opObj.start).toString();				    
}
					if((tempStartTime + playlistDuration) < alertEndTime) {
						opObj.end 	= tempStartTime + playlistDuration;
					}
					else {
						opObj.end 	= alertEndTime;
					}
if(helper.config.logsettings.loglevel === 'debug') {
	opObj.endString = new Date(opObj.end).toString();				    
}

					opObj.path 	= playlistObj.path;
					opArray.push(opObj);
					
					tempMediaArray = [];
					var tempArray = helper.buildMediaArray(playlistObj, playlistDuration); 
					if(tempArray) { mediaArray = tempArray; }
					else { 
						mediaArray = []; 
					}
					
					tempMediaArray = helper.cloneMediaArray(mediaArray, opObj.start, opObj.end, 1, controllerConfig);

					for(tempIndex = 0; tempIndex < tempMediaArray.length; tempIndex ++) {
						newMediaArray.push(tempMediaArray[tempIndex]);
					}
					
					tempStartTime += playlistDuration;
				}
				
				returnObj.op = opArray;
				returnObj.media = newMediaArray;
			}
			return returnObj;
		}
	
		var generateAlertContent = function(start, duration, newFragments) {
			var opArray		= [];
			var mediaArray	= [];
			var mediaObj 	= {};
			var opObj 		= {};
			var alertObj	= {};
			var startTime	= new Date(start);
			var endTime 	= new Date(start+ duration);
			var playlistObj	= {};
			var ucmedia		= [];
			var lastTime 	= 0;
			
			ucmedia = controllerConfig.ucmedia;
			if(ucmedia && ucmedia[0] && ucmedia[0].type && (ucmedia[0].type === 'widget')) {
				opObj 		= {};
				opObj.code 	= 'newDesktop';
				opObj.start = start;
				opObj.end 	= start + duration;
				opObj.path 	= '';
				if(helper.config.logsettings.loglevel === 'debug') {
					opObj.startString 	= startTime;
					opObj.endString 	= endTime;
				}
				
				opArray.push(opObj);
				
				opObj 		= {};
				opObj.code  = 'reset';
				opObj.start = 0;
				opArray.push(opObj);
				
				
				mediaObj = {};
				mediaObj.path 		= path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + ucmedia[0].path);
				mediaObj.httppath 	= '/download/' + controllerConfig.sitename + ucmedia[0].path;
				mediaObj.dur 		= duration;
				mediaObj.start 		= start;
				mediaObj.type 		= ucmedia[0].type;
				mediaObj.zorder 	= 0;
				mediaObj.width 		= 1.0;
				mediaObj.height 	= 1.0;
				mediaObj.name 		= "zone 1";
				mediaObj.id 		= 1;
				mediaObj.lockRatio 	= true; 
				mediaObj.left 		= 0.0;
				mediaObj.top 		= 0.0;
				mediaObj.revision 	= 0;
				mediaObj.vol	 	= '1';
				if(helper.config.logsettings.loglevel === 'debug') {
					mediaObj.startString = startTime;
				}
	
            	if(mediaObj.type === 'video') {
	           		mediaObj.httppath = mediaObj.httppath + '?zoneid=' + mediaObj.id;
				}
			    
				mediaArray.push(mediaObj);
				
				newFragments.op = opArray;
				newFragments.media = mediaArray;
			}
			else if(ucmedia && ucmedia[0] && ucmedia[0].path && ucmedia[0].type && (ucmedia[0].type === 'playlist')) {
			
				var tempObj = {};
				
				playlistObj = helper.getDataObj(path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + ucmedia[0].path));
				tempObj = prepareAlertContentFromPlaylist(playlistObj, start, start + duration);
				
				if(tempObj && tempObj.op && tempObj.media) {
					opObj 		= {};
					opObj.code  = 'reset';
					opObj.start = 0;
					tempObj.op.push(opObj);
					
					
					newFragments.op = tempObj.op;
					newFragments.media = tempObj.media;
				}
			}
			
			if((start + duration) > lastTime) {
				lastTime = start + duration;
			}

			return lastTime;
		}
		
		var getNewContent = function(start, duration, newFragments) {
			var end						= 0;
			var playlistNumber			= 0;
			var playlistIndex			= 0;
			var playlistObj				= {};
			var fragmentArray			= [];
			var fragmentNumber 			= 0;
			var fragmentIndex 			= 0;
			var mediaArrayInFragment 	= [];
			var mediaNumberInFragment 	= 0;
			var mediaIndexInFragment 	= 0;
			var mediaObj 				= {};
			var mediaArray				= [];
			var mediaIndex				= 0;
			var opArray					= [];
			var opIndex					= 0;
			var lastTime				= 0;
			
			if(!contentObj) { newFragments = {}; return 0; }
			
logger.debug('start='+start + '   ' + new Date(start));
logger.debug('duration='+duration);
			end = start + duration;
logger.debug('end='+end + '   ' + new Date(end));
			playlistNumber = contentObj.length;
//console.log('playlistNumber='+playlistNumber);
			for(playlistIndex = 0 ; playlistIndex < playlistNumber; playlistIndex++) {
				playlistObj = {};
				playlistObj = contentObj[playlistIndex];
				
//console.log('playlistObj.start='+playlistObj.start);
//console.log('playlistObj.end='+playlistObj.end);
				if(helper.withinRange2(playlistObj.start, playlistObj.end, start, end)) {
					fragmentArray = [];
					fragmentArray = playlistObj.fragment;
					fragmentNumber = fragmentArray.length;
					for(fragmentIndex = 0; fragmentIndex < fragmentNumber; fragmentIndex++) {
//console.log('fragmentArray[fragmentIndex].start='+fragmentArray[fragmentIndex].start);
//console.log('fragmentArray[fragmentIndex].end='+fragmentArray[fragmentIndex].end);
						if(helper.withinRange2(fragmentArray[fragmentIndex].start, fragmentArray[fragmentIndex].end, start, end)) {
logger.debug('within');
logger.debug('fragmentArray[fragmentIndex].start='+fragmentArray[fragmentIndex].start);
logger.debug('fragmentArray[fragmentIndex].end='+fragmentArray[fragmentIndex].end);
							mediaArrayInFragment = [];
							mediaArrayInFragment = fragmentArray[fragmentIndex].media || [];
							mediaNumberInFragment = mediaArrayInFragment.length;
							
							var opStart = end;
							for(mediaIndexInFragment = 0; mediaIndexInFragment < mediaNumberInFragment; mediaIndexInFragment++) {
								mediaObj = {};
								mediaObj = mediaArrayInFragment[mediaIndexInFragment];
								
//								mediaObj.vol = '1';
/*for Jeff's request for media sync issue
								if(mediaObj.start > start) {
									if(opStart > mediaObj.start) {
										opStart = mediaObj.start;
									}
									
									mediaArray[mediaIndex] = mediaObj;
									mediaIndex++;
								}
								else {
									if((mediaObj.start + mediaObj.dur) > start) {
										mediaObj.dur = mediaObj.start + mediaObj.dur - start;
										mediaObj.start = start;

										if(helper.config.logsettings.loglevel === 'debug') {
											mediaObj.startString = new Date(mediaObj.start).toString();
										}
										
										if(opStart > mediaObj.start) {
											opStart = mediaObj.start;
										}
										
										mediaArray[mediaIndex] = mediaObj;
										mediaIndex++;
									}
								}
*/
								if((mediaObj.start > start) || ((mediaObj.start + mediaObj.dur) > start)) {
									if(helper.config.logsettings.loglevel === 'debug') {
										mediaObj.startString = new Date(mediaObj.start).toString();
									}
									
									if(opStart > mediaObj.start) {
										opStart = mediaObj.start;
									}
									
									mediaArray[mediaIndex] = mediaObj;
									mediaIndex++;
								}
//
								
								if((mediaObj.start + mediaObj.dur) > lastTime) {
									lastTime = mediaObj.start + mediaObj.dur;
								}
							}

							opArray[opIndex] = {};
							opArray[opIndex].code = 'newDesktop';
							opArray[opIndex].start = opStart;
							opArray[opIndex].end = fragmentArray[fragmentIndex].end;
							if(helper.config.logsettings.loglevel === 'debug') {
								opArray[opIndex].startString = new Date(opArray[opIndex].start).toString();
								opArray[opIndex].endString = new Date(opArray[opIndex].end).toString();
							}
							opArray[opIndex].path = playlistObj.playlistpath;
							opIndex++;
						}
					}
				}
			}
			

			if(opArray && opArray.length && mediaArray && mediaArray.length){
				newFragments.op = opArray;
				newFragments.media = mediaArray;
			}
			else {
				newFragments = {};
				lastTime = 0;
			}
			
			return lastTime;
		}

		var adjustDeskptopAndMediaStartTime = function(fragments, starttime) {
			if(!fragments || !fragments.op || !fragments.media || !util.isArray(fragments.op) || !util.isArray(fragments.media) || !starttime)
				return;
				
			var opNumber = fragments.op.length;
			var mediaNumber = fragments.media.length;
			var index = 0;
			
			for(index = 0; index < opNumber; index++) {
				if((fragments.op[index].code === 'newDesktop') && (fragments.op[index].start < starttime)) {
					fragments.op[index].start = starttime;
					if(helper.config.logsettings.loglevel === 'debug') {
						fragments.op[index].startString = new Date(starttime).toString();
					}
				}
			}
			
			for(index = 0; index < mediaNumber; index++) {
				if((fragments.media[index].start < starttime) && ((fragments.media[index].start + fragments.media[index].dur) > starttime)) {
					fragments.media[index].dur -= (starttime - fragments.media[index].start);
					fragments.media[index].start = starttime;
					if(helper.config.logsettings.loglevel === 'debug') {
						fragments.media[index].startString = new Date(starttime).toString();
					}
				}
			}
		}
		
		var mergeDuplicatedDesktop = function(fragments, lastDesktopPath, returnObj) {
			var newFragments = {};
			var opIndex 	= 0;
			var opNumber 	= 0;
			var newOP	 	= [];
			var lastIndex	= -1;
			var newOPIndex	= 0;
			var tempLastDesktopPath = '';
			
			if(!fragments || !fragments.op || !fragments.media) {
				return null;
			}
			
			//sort
			fragments.op.sort(function(a, b) {
				if(a.start < b. start) { return -1; }
				else { return 1; }
			});
			
			//filter the duplicated and continuous desktop
			opNumber = fragments.op.length;
			for(opIndex = 0; opIndex < opNumber; opIndex++) {
				if(fragments.op[opIndex].code !== 'newDesktop') {
					newOP[newOPIndex] = fragments.op[opIndex];
					newOPIndex ++;
					lastIndex = -1;
				}
				else { //remove duplicated desktop
					if((lastIndex === -1) || !fragments.op[opIndex].path || (fragments.op[opIndex].path !== fragments.op[lastIndex].path)) {
						newOP[newOPIndex] = fragments.op[opIndex];
						newOPIndex ++;
						lastIndex = opIndex;
					}
					else {
						if(newOP.length) {
							newOP[newOP.length - 1].end = fragments.op[opIndex].end;	
							if(helper.config.logsettings.loglevel === 'debug') { 
								delete newOP[newOP.length - 1].endString;
								newOP[newOP.length - 1].endString = fragments.op[opIndex].endString; 
							}
						}
					}
				}
			}
			
			//filter the desktop which is duplicated with the last desktop in last getschedule content.
			tempLastDesktopPath = lastDesktopPath;
			opNumber = newOP.length;
			var newNewOP = [];
			for(opIndex = 0; opIndex < opNumber; opIndex++) {
				if((newOP[opIndex].code !== 'newDesktop') || !newOP[opIndex].path) {
					newNewOP.push(newOP[opIndex]);
					tempLastDesktopPath = '';  //
				}
				else {
					if(newOP[opIndex].path !== tempLastDesktopPath) {
						newNewOP.push(newOP[opIndex]);
					}
				}
				
				if(newOP[opIndex].code === 'newDesktop') {
					tempLastDesktopPath = newOP[opIndex].path;
				}
			}
			
			//sort
			newNewOP.sort(function(a, b) {
				if(a.start < b. start) { return -1; }
				else { return 1; }
			});
			
			if(newNewOP.length > 0) {
				newFragments.op = newNewOP;
			}			
			
			if(tempLastDesktopPath) {
				returnObj.path = tempLastDesktopPath;
			}
			
			newFragments.media = fragments.media;
			
			return newFragments;
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
				now = new Date();
				if(controllerConfig.stopuc || !controllerConfig.uc || !controllerConfig.ucmedia) {
					var endTimeOfSchedule = 0;
					if(controllerConfig.needreload === true) {
						logger.debug('set reset op due to find reload flag.');	
						opReset = true;
					}
					else {
						if(controllerConfig.nextgetscheduletime) {
							endTimeOfSchedule = new Date(controllerConfig.nextgetscheduletime).getTime();
//console.log('opReset=' + opReset);
							logger.debug('now.getTime()=' + now.getTime() + '   ' + now);
							logger.debug('endTimeOfSchedule=' + endTimeOfSchedule + '    ' + controllerConfig.nextgetscheduletime);
console.log('now=' + now);
console.log('endTimeOfSchedule=' + new Date(endTimeOfSchedule));
							if(now.getTime() < endTimeOfSchedule) { 
console.log('change now\'s value');
								now = new Date(endTimeOfSchedule); 
								logger.debug('new now is: ' + now.getTime());
								opReset = false; 
							}
							else { 
								logger.debug('set reset op due to current time > lastschedule time.');	
								logger.debug('now.getTime()=' + now.getTime() + '          endTimeOfSchedule=' + endTimeOfSchedule);	
								logger.debug(now);	
								logger.debug(controllerConfig.nextgetscheduletime);	
								opReset = true; 
							}
							logger.debug('opReset=' + opReset);
						}
						else {
							logger.debug('set reset op due to lastschedule time missing.');	
							opReset = true;
						}
					}
//console.log('opReset=' + opReset);
		
					//parse content data file into object.
					contentFilePath = helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + 'rendercontent.json';
					if(!fs.existsSync(contentFilePath)) {
						logger.debug('no rendercontent.json, generate new content.json');	
						
						helper.mergeSchedulePlaylist(controllerConfig.belongs, controllerConfig.topfirst, controllerConfig, 'getschedule');
					}
	
					contentObj = helper.getDataObj(contentFilePath);
					if(contentObj) {
						//get new data in content data file from the last point.
						nextGetTime = getNewContent(now.getTime(), helper.config.playersettings.mediascope, fragments);
						
						//for schedule may disturb by alert, after alert finished, the starttime may not be just the start time of media, 
						//so should adjust its start and dur 
						if(!opReset) adjustDeskptopAndMediaStartTime(fragments, now.getTime());
						
						logger.debug('nextGetTime=' + nextGetTime);
					}
					else {
						fragments 		= {};
						fragments.op 	= [];
						fragments.media = [];
						
						opReset = true;
					}
					
					logger.debug('got schedule from %s to %s, current time is: %s', controllerConfig.nextgetscheduletime, new Date(nextGetTime).toString(), now.toString());
//console.log('got schedule from %s to %s, current time is: %s', controllerConfig.nextgetscheduletime, new Date(nextGetTime).toString(), now.toString());
//console.log(fragments);
				}
				else { //play uc
//console.log('play alert!!!!!!!!!!!!!!!!');
					var curTime =new Date().getTime() + 2000;
					nextGetTime = generateAlertContent(curTime, controllerConfig.ucduration, fragments);	
					
					logger.debug('alert will be ended at : ' + new Date(nextGetTime));						
//console.log('alert will be ended at : ' + new Date(nextGetTime));						
//console.log('alert will be ended at : ' + new Date(nextGetTime));						
//console.log('alert will be ended at : ' + new Date(nextGetTime));						
//				nextGetTime = new Date().getTime() + controllerConfig.ucduration;
	
					controllerConfig.uc = false;	
					settingObj = {}; 
					settingObj.name = 'uc'; 
					settingObj.value = controllerConfig.uc; 
					configsetting.push(settingObj); 
					
					controllerConfig.ucduration = 0;	
					settingObj = {}; 
					settingObj.name = 'ucduration'; 
					settingObj.value = controllerConfig.ucduration; 
					configsetting.push(settingObj); 
					
					controllerConfig.ucmedia = [];	
					settingObj = {}; 
					settingObj.name = 'ucmedia'; 
					settingObj.value = controllerConfig.ucmedia; 
					configsetting.push(settingObj); 
					
					logger.debug('got alert from %s to %s, current time is: %s', new Date(curTime).toString(), new Date(nextGetTime).toString(), new Date());
//console.log('got alert from %s to %s, current time is: %s', new Date(curTime).toString(), new Date(nextGetTime).toString(), new Date());
//console.log(fragments);
				}
				
	
				if(nextGetTime) {
					var curTime = new Date();
					if((now - curTime.getTime()) > 600000) {
						logger.error('it may be error case, get data ahead too much.');
						logger.error('current time is:' + curTime + '    ' + curTime.getTime());
						logger.error('now=' + now + '    ' + now.getTime());
					}
					//set last get schedule time and next get schedule time
					controllerConfig.lastgetscheduletime = now.toISOString();
					controllerConfig.nextgetscheduletime = new Date(nextGetTime).toISOString();
/*20140714 not send reload every time when no media to play
				controllerConfig.needreload = false;	
*/
	
					settingObj = {}; 
					settingObj.name 	= 'lastgetscheduletime'; 
					settingObj.value 	= controllerConfig.lastgetscheduletime; 
					configsetting.push(settingObj); 
	
					settingObj = {}; 
					settingObj.name 	= 'nextgetscheduletime'; 
					settingObj.value 	= controllerConfig.nextgetscheduletime; 
					configsetting.push(settingObj); 
	
/*20140714 not send reload every time when no media to play
					settingObj = {}; 
					settingObj.name 	= 'needreload'; 
					settingObj.value 	= controllerConfig.needreload; 
					configsetting.push(settingObj); 
*/
				}
			
//20140714 not send reload every time when no media to play
				controllerConfig.needreload = false;	
				settingObj = {}; 
				settingObj.name 	= 'needreload'; 
				settingObj.value 	= controllerConfig.needreload; 
				configsetting.push(settingObj); 
//

//console.log('opReset=' + opReset);
				logger.debug('opReset=' + opReset);
				if(opReset === true) {
					//set reset to render with new content.
					var opObj	= {};
					opObj.code 	= 'reset';
					opObj.start = 0;
					
					if(!fragments || !fragments.op) {
						fragments 		= {};
						fragments.op 	= [];
						fragments.media = [];
					}
					
/*if not set reset op, the schedule will not stop playing when send reject schedule request.
//20140714 not send reset every time when no media to play
					if(fragments.media && fragments.media.length) {
*/
						fragments.op.push(opObj);
/*
					}
*/
	
/*20140714 not send reload every time when no media to play
					if(controllerConfig.needreload) {
						controllerConfig.needreload = false;
						settingObj = {}; 
						settingObj.name 	= 'needreload'; 
						settingObj.value 	= controllerConfig.needreload; 
						configsetting.push(settingObj); 
					}
*/
				}

//console.log('now = ' + now);

				logger.debug('call getschedule at ' + new Date().toString());
//console.log('call getschedule at ' + new Date().toString());
				if(fragments && fragments.op && fragments.media && fragments.media.length) {
					logger.debug('return ' + fragments.op.length + ' OPs.');
					logger.debug(JSON.stringify(fragments.op, '', 4));
					logger.debug('return ' + fragments.media.length + ' media');
					logger.debug('from ' + fragments.op[0].startString);
					if(fragments.op[fragments.op.length - 1].code === 'reset') {
						logger.debug('to ' + fragments.op[fragments.op.length - 2].endString);
					}
					else {
						logger.debug('to ' + fragments.op[fragments.op.length - 1].endString);
					}
					
if(((fragments.media[0].start + 1000) < now.getTime()) && (opReset !== true)){
logger.debug('may have problem if it is not the first time after controller startup.');	
logger.debug('now= ' + now.getTime());
logger.debug(JSON.stringify(fragments, '', 4));

console.log('may have problem if it is not the first time after controller startup.');
//console.log('now= ' + now.getTime());
console.log(JSON.stringify(fragments, '', 4));
}

					retVal.currenttime = now.toString();	
//				helper.writeDataFile(helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'getschedule' + now.toISOString().replace(/\:/g, '-') + '.json', fragments);
				}
				else {
//console.log('return empty object');	
					logger.debug('return empty object');	
				}
	
				var newLastDesktop = {};
				newLastDesktop.path = '';
//console.log(JSON.stringify(fragments.op, '', 4));
				fragments = mergeDuplicatedDesktop(fragments, controllerConfig.lastdesktoppath, newLastDesktop);
//console.log(JSON.stringify(fragments.op, '', 4));
			
//			helper.writeDataFile(helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'getschedule' + now.toISOString().replace(/\:/g, '-') + 'new.json', fragments);
			
				if(newLastDesktop.path !== controllerConfig.lastdesktoppath) {
//console.log('newLastDesktop.path='+newLastDesktop.path);
//console.log('controllerConfig.lastdesktoppath='+controllerConfig.lastdesktoppath);
					controllerConfig.lastdesktoppath = newLastDesktop.path;	
					settingObj = {}; 
					settingObj.name 	= 'lastdesktoppath'; 
					settingObj.value 	= controllerConfig.lastdesktoppath; 
					configsetting.push(settingObj); 
				}
				
				if(util.isArray(configsetting) && (configsetting.length > 0)) {
					var timeStamp = new Date().getTime();
					global.loginProcess.send({'configsetting': { 'from': 'getschedule_'+timeStamp, 'data': configsetting}});
					logger.debug('send message to update config data. ' + timeStamp);
				}
				
				//change ZIP media type according to its entryfile extension
				if(fragments && fragments.media && fragments.media.length) {
					var mediaNumber 	= fragments.media.length;
					var mediaIndex 		= 0;
					var tempObj 		= {};
									
					for(mediaIndex = 0 ; mediaIndex < mediaNumber; mediaIndex++) {
						if(fragments.media[mediaIndex].type === 'zip') {
							tempObj = {};
							tempObj = helper.getZIPMediaType(fragments.media[mediaIndex].path, fragments.media[mediaIndex].httppath);
							if(tempObj.path && tempObj.httppath && tempObj.type) {
								fragments.media[mediaIndex].path = tempObj.path;									
								fragments.media[mediaIndex].httppath = tempObj.httppath;									
								fragments.media[mediaIndex].type = tempObj.type;									
							}
						}
					}
				}
				
				
				retVal.data = fragments;
				
				retVal.status = true;
				retVal.serialno = new Date().getTime(); //for debug
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				res.send(JSON.stringify(retVal, '', 4));
//console.log(JSON.stringify(retVal, '', 4));
//console.log(JSON.stringify(fragments, '', 4));
//console.log(fragments.media.length);


				//check the parsed schedule data is update or not, if needed, parse schedule to build new content data
				if(controllerConfig.lastscheduleparsetime) {
					lastTimeOfParsedSchedule = controllerConfig.lastscheduleparsetime;
					milliSecondsOfLastTime = new Date(lastTimeOfParsedSchedule).getTime();
					milliSecondsOfCurrentTime = new Date().getTime();
					
//for generate rendercontent less than one day
//				if(((milliSecondsOfLastTime > milliSecondsOfCurrentTime) && ((milliSecondsOfLastTime - milliSecondsOfCurrentTime) < helper.config.playersettings.scheduleparsescope)) || 
					if(((milliSecondsOfLastTime > milliSecondsOfCurrentTime) && ((milliSecondsOfLastTime - milliSecondsOfCurrentTime) < (helper.config.playersettings.mediascope * 4))) || 
//
						(milliSecondsOfLastTime < milliSecondsOfCurrentTime)) {
						logger.debug('milliSecondsOfCurrentTime=' + milliSecondsOfCurrentTime);	
						logger.debug('milliSecondsOfLastTime=' + milliSecondsOfLastTime);	
						logger.debug('milliSecondsOfLastTime - milliSecondsOfCurrentTime=' + (milliSecondsOfLastTime - milliSecondsOfCurrentTime));
						logger.debug('generate new content.json');	
	
						logger.debug('generate new content.json');	
						helper.mergeSchedulePlaylist(controllerConfig.belongs, controllerConfig.topfirst, controllerConfig, 'getschedule');
					}
				}
				else {
					logger.debug('generate new content.json due to miss lastscheduleparsetime');	
	
					helper.mergeSchedulePlaylist(controllerConfig.belongs, controllerConfig.topfirst, controllerConfig, 'getschedule');
				}
			}
			else { // not register and login yet
				retVal.data = {};
				
				retVal.status = true;
				retVal.serialno = new Date().getTime(); //for debug
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				res.send(JSON.stringify(retVal, '', 4));
			}		
		});
	}
};
module.exports = GetSchedule;

