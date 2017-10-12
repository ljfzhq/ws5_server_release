var fs			= require('fs');
var path		= require('path');
var util		= require('util');
var Helper 		= require('../../../../utils/helper');
var Media		= require('../../../../models/media');
var Publish		= require('../../../../models/publish');
var Schedule	= require('../../../../models/schedule');
var Privilege 	= require('../../../../models/privilege');
var Player	 	= require('../../../../models/player');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');
var FileUtils 	= require('../../../../utils/fileutils');


var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils	= new FileUtils();

var CheckPublish = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var that		= this;
		var schedule	= null;
		var publish		= null;
		var media		= null;
		var privilege 	= null;
		var player 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};

		var groupPath	= '';
		var groupid		= '';
		var scheduleType= '';
		var	startDate	= '';
		var	endDate		= '';
		var listType	= '';
		
		var groupArray  = [];
		var groupIndex 	= 0;
		var groupNumber	= 0;

		
		var generateGroupArray = function(groupPath, callback) {
			
			if(groupPath) {
				player.get(groupPath, function(err, groupInfo) {
					var singleGroupArray = [];
					var groupObj		 = {};
					
					if(err) {
						return callback(err, []);
					}
					
					groupObj.path = groupInfo.path;
					groupObj.groupid = groupInfo._id.toString();
					singleGroupArray.push(groupObj);
					return callback(0, singleGroupArray);
				});
			}
			else {
				player.getAllGroups(function(err, groupList) {
					if(err) {
						return callback(err)
					}
					
					return callback(0, groupList);
				});
			}	
		}

		//return 1 means schedule changed after publish
		//return 0 means schedule is not changed
		var isScheduleChangedAfterPublish = function(scheduleArray, publishArray) {
			if(!scheduleArray || !publishArray || !util.isArray(scheduleArray) || !util.isArray(publishArray)) {
				return 1; 
			}
			
			var index = 0;
			var size = scheduleArray.length;
			var publishTime = publishArray[0].lastmodifytime;
			
			for(index = 0; index < size; index++) {
				if(scheduleArray[index].lastmodifytime > publishTime) {
					break;
				}
			}
			
			if(index >= size) { return 0; }
			else { return 1; }
		}
		
/*		
		var getMediaPlaylistLastmodifytime = function(mediaPath, callback) {
			if(!mediaPath) {
				return calback(4, null); 
			}
			
			media.get(mediaPath, function(err, mediaObj) {
				if(err) { return callback(err, null); }
				
				return callback(0, mediaObj.lastmodifytime);
			});
		}

		var getMediaList = function(playlistPath, callback) {
			if(!playlistPath) {
				return calback(4, null); 
			}
			
			media.get(playlistPath, function(err, playlistObj) {
				if(err) { return callback(err, null); }
				
				var mediaList = [];
				var mediaNumber = 0;
				var mediaIndex = 0;
				var mediaArray = [];
				
				mediaArray = playlistObj.media;
				if(!mediaArray || !util.isArray(mediaArray) || !mediaArray.length) { return callback(0, []); }
				
				mediaNumber = mediaArray.length;
				for(mediaIndex = 0 ; mediaIndex < mediaNumber; mediaIndex++) {
					mediaArray.push(mediaArray[mediaIndex].path);
				}
				
				return callback(0, mediaArray);
			});
		}
*/
		
		var splitDateRange = function(startDate, endDate, groupPath, scheduleType, listType) {
			var resultArray = [];
			
			if(!startDate || !endDate || (startDate > endDate)) {
				return []; 
			}
			
			var nextDay = '';
			var tempObj = {};
			
			nextDay = startDate.slice(0, 10);
			while(nextDay <= endDate) {
				tempObj = {};
				tempObj.startDate = nextDay;
				tempObj.endDate = nextDay;
				tempObj.listType = listType;
				tempObj.scheduleType = scheduleType;
				tempObj.groupPath = groupPath;
				
				resultArray.push(tempObj);
				
				nextDay = schedule._getNextDay(nextDay).slice(0, 10);
			}
			
			return resultArray;
		}
	
		var isWidgetMediaFresh = function(publishTime, widgetMediaPath, callback) {
			var Emitter 		= require('events').EventEmitter;
			var emitter			= (new Emitter);
			var widgetFolderLocalPath = '';
			var widgetMediaListFileLocalPath = '';
			var widgetMediaList = [];
		
			var subMediaIndex 	= 0;
			var subMediaNumber 	= 0;
			
			
			emitter.on('CheckWidgetMedia', function(first) {
				var subMediaObj = {};
				
				if(!first) { subMediaIndex++; }
				if(subMediaIndex >= subMediaNumber) {
					return callback(0, false);
				}
				
				//get media info, include its last modify time, if it is fresher than publishTime, return true
				//if it is not fresher and it is not widget media, then return false
				//if it is not fresher and it is widget media, then check the sub media in widget
				subMediaObj = widgetMediaList[subMediaIndex];
				media.get(subMediaObj.path, function(err, mediaInfo) {
					if(err) {
						logger.error('error occurs when get media information in isWidgetMediaFresh(). ' + err);
						return callback(err, true);
					}
					
					if(publishTime < mediaInfo.lastmodifytime) { //the media is changed after publish.
						return callback(0, true);
					}
					else { //the media of this playlist is not changed
						emitter.emit('CheckWidgetMedia', false);
						return;
					}
				});
				
			});
			
			//-------- Entry --------------------//
			if(!publishTime || !widgetMediaPath) {
				return callback(4, true);
			}
			
			widgetFolderLocalPath = fileUtils.getExtraFilesFolderPath(fileUtils.getFileLocalPath(siteObj, widgetMediaPath));
			widgetMediaListFileLocalPath = widgetFolderLocalPath + path.sep + 'data' + path.sep + 'media.json';
			
			fs.exists(widgetMediaListFileLocalPath, function(exists) {
				if(exists) {
					widgetMediaList = fileUtils.getDataObj(widgetMediaListFileLocalPath);
					
					if(!widgetMediaList || !util.isArray(widgetMediaList) || !widgetMediaList.length) {
						return calblack(0, false);
					}
					else 
					{
						subMediaNumber = widgetMediaList.length;
						emitter.emit('CheckWidgetMedia', true);
					}
				}
				else {
					return callback(0, false);
				}
			});
		}
		
		var isMediaFresh = function(publishTime, playlistObj, callback) {
			var Emitter 		= require('events').EventEmitter;
			var emitter			= (new Emitter);
			var mediaIndex 		= 0;
			var mediaNumber 	= 0;
			var zoneIndex 		= 0;
			var zoneNumber 		= 0;
			var mediaArray		= [];
			
			
			emitter.on('CheckMedia', function(first) {
				var mediaObj = {};
				
				if(!first) { mediaIndex++; }
				if(mediaIndex >= mediaNumber) {
					return callback(0, false);
				}
				
				//get media info, include its last modify time, if it is fresher than publishTime, return true
				//if it is not fresher and it is not widget media, then return false
				//if it is not fresher and it is widget media, then check the sub media in widget
				mediaObj = mediaArray[mediaIndex];
				media.get(mediaObj.path, function(err, mediaInfo) {
					if(err) {
						logger.error('error occurs when get media information in isMediaFresh(). ' + err);
						return callback(err, true);
					}
					
//console.log('mediaObj.path=' + mediaObj.path);
//console.log('publishTime=' + publishTime);
//console.log('mediaInfo.lastmodifytime=' + mediaInfo.lastmodifytime);
					if(publishTime < mediaInfo.lastmodifytime) { //the media is changed after publish.
						return callback(0, true);
					}
					else { //the media of this playlist is not changed
						if(mediaInfo.type === 'widget') {
							isWidgetMediaFresh(publishTime, mediaInfo.path, function(err, changed) {
								if(err) {
									logger.error('error occurs when check widget media freshment in isMediaFresh(). ' + err);
									return callback(err, true);
								}
								
								if(changed) {
									return callback(0, true);
								}
								else {
									emitter.emit('CheckMedia', false);
									return;
								}
							});
						}
						else {
							emitter.emit('CheckMedia', false);
							return;
						}
					}
				});
				
			});
			
			//-------- Entry --------------------//
//console.log('mediaArray=');
//console.log(mediaArray);
			if(!playlistObj || !playlistObj.filedata || !playlistObj.filedata.zones || !util.isArray(playlistObj.filedata.zones) || !playlistObj.filedata.zones.length) { //empty media list means empty playlist
				return callback(0, false);
			}
			
			var zoneArray = playlistObj.filedata.zones;

//console.log('publishTime=');
//console.log(publishTime);
			if(!publishTime) {
				return callback(4, true);
			}
			
			zoneNumber = zoneArray.length;
			for(zoneIndex = 0; zoneIndex < zoneNumber; zoneIndex++) {
				if(zoneArray[zoneIndex].media && util.isArray(zoneArray[zoneIndex].media)) {
					mediaNumber = zoneArray[zoneIndex].media.length;
					for(mediaIndex = 0; mediaIndex < mediaNumber; mediaIndex++) {
						mediaArray.push(zoneArray[zoneIndex].media[mediaIndex]);						
					}
				}
			}

			mediaIndex = 0;
			mediaNumber = mediaArray.length;
//console.log('mediaArray=');
//console.log(mediaArray);
			
			emitter.emit('CheckMedia', true);
		}
		
		var isSchedulePlaylistFresh = function(schedulePlaylistArray, publishPlaylistArray, callback) {
			var Emitter 		= require('events').EventEmitter;
			var emitter			= (new Emitter);
			var playlistIndex 	= 0;
			var playlistNumber 	= 0;
			var publishTime 	= null;
			
			emitter.on('CheckPlaylist', function(first) {
				var playlistObj = {};
				
//console.log('playlistIndex=' + playlistIndex);
				if(!first) { playlistIndex++; }
				if(playlistIndex >= playlistNumber) {
//console.log('return false for playlist at last. playlistIndex=%d playlistNumber=%d', playlistIndex, playlistNumber);
					return callback(0, false);
				}
				
				//get playlist data, include its media list and its last modify time, if playlist's lastmodifytime is fresher than scheduleplaylist's lastmodifytime, return true
				//if they are the same, then check each playlist's media lastmodifytime, if the media is widget, need to check its sub media's lastmodify time.
				playlistObj = schedulePlaylistArray[playlistIndex];
//console.log('playlistObj=');
//console.log(playlistObj);
				media.get(playlistObj.playlistpath, function(err, playlistInfo) {
					if(err) {
						logger.error('error occurs when get playlist information in isSchedulePlaylistFresh(). ' + err);
						return callback(err, true);
					}
					
//console.log('publishTime=' + publishTime);
//console.log('playlistInfo.lastmodifytime=' + playlistInfo.lastmodifytime);
					if(publishTime < playlistInfo.lastmodifytime) { //the playlist is changed after publish.
//console.log('changed playlist.');
						return callback(0, true);
					}
					else { //change the media of this playlist
						isMediaFresh(publishTime, playlistInfo, function(err, changed) {
//console.log('call isMediaFresh for playlist, returns: ' + err);
							if(err) {
								logger.error('error occurs when check media freshment in isSchedulePlaylistFresh(). ' + err);
								return callback(err, true);
							}
							
							if(changed) {
//console.log('return true for playlist---'+playlistObj.playlistpath);
								return callback(0, true);
							}
							else {
								emitter.emit('CheckPlaylist', false);
							}
						});
					}
				});
			});


			//-------- Entry --------------------//
			if(!schedulePlaylistArray || !util.isArray(schedulePlaylistArray) || !schedulePlaylistArray.length) {
				return callback(4, true);
			}
			
			if(!publishPlaylistArray || !util.isArray(publishPlaylistArray) || !publishPlaylistArray.length) {
				return callback(4, true);
			}
			
			playlistNumber = schedulePlaylistArray.length;
			publishTime = publishPlaylistArray[0].lastmodifytime;
			
//console.log('schedulePlaylistArray=');
//console.log(schedulePlaylistArray);
//console.log('publishPlaylistArray=');
//console.log(publishPlaylistArray);

//console.log('playlistNumber=' + playlistNumber);
			emitter.emit('CheckPlaylist', true);
		}
		
		
		var checkOneGroup = function(groupObj, accountInfo, start, end, type, listtype, callback) {
			var resultArray	= [];
			var dateNumber	= 0;
			var dateIndex	= 0;

			privilege.checkPrivilege('player', groupObj.path, 'account', accountInfo.name, 1, function(err, have) {
				if(err) {
					logger.error('error occur when get privilege data from database or has not enough privilege to get publish information on group ' + groupObj.path);
/*
					retVal.id = err;
					retVal.msg = helper.retval[err];
					return res.send(retVal);
*/
					return callback(0, []);
				}
				else {
					if(have) {
						//split date range to single day
						resultArray = [];
						resultArray = splitDateRange(start, end, groupObj.path, type, listtype);
						dateNumber	= resultArray.length;
						dateIndex	= 0;
						
						//get one day playlist/spotlist in the schedule
						//get one day playlist in the channel
						
						//get one day playlist/spotlist in publish
						//get one day playlist in channel
						
						//compare the playlist/spotlist in publish and schedule
						//if empty in publish, that means not published
						//if schedule items are fresher than published item, that means need republish
						//if they are the same, need further checking
						//	get all playlist's lastmodifytime, if anyone is later than its playlist's lastmodifytime in schedule, it means need to republish
						//	if all playlist's lastmodifytime is older than the playlist's lastmodifytime in schedule, need check the media of the playlist
					
//console.log('resultArray=');
//console.log(resultArray);						
					
						if(type === 'schedule') {
							req.on(groupObj.path, function(first) {
								if(!first) { dateIndex++; }
								if(dateIndex >= dateNumber) {
									//merge date range if other attributes are the same
									resultArray.sort(function(a, b) {
										if(a.startDate < b.startDate) return -1;
										else if(a.startDate > b.startDate) return 1;
										else return 0;
									});
									
//console.log('resultArray=');
//console.log(resultArray);						
									var mergedResultArray = [];
									for(var resultIndex = 0 ; resultIndex < resultArray.length; resultIndex++) {
										if((resultIndex + 1) < resultArray.length) {
											if(resultArray[resultIndex].status === resultArray[resultIndex + 1].status) {
												resultArray[resultIndex + 1].startDate = resultArray[resultIndex].startDate;
											}
											else {
												if(resultArray[resultIndex].status !== 0) {
													mergedResultArray.push(resultArray[resultIndex]);
												}
											}
										}
										else {
											if(resultArray[resultIndex].status !== 0) {
												mergedResultArray.push(resultArray[resultIndex]);
											}
										}
									}
									return callback(0, mergedResultArray);
								}
								else {
									schedule.getPlaylistSet(groupObj.path, type, listtype, resultArray[dateIndex].startDate, resultArray[dateIndex].endDate, function(err, schedulePlaylistArray) {
										if(err) { 
											logger.error('error occur when get playlist in schedule of ' + groupObj.path + ' at ' + resultArray[dateIndex].startDate + '  (' + err + ')');
/*
											retVal.id = err;
											retVal.msg = helper.retval[err];
											return res.send(retVal);
*/
											req.emit(groupObj.path, false);
											return;
										}
//console.log('resultArray[dateIndex].startDate=');
//console.log(resultArray[dateIndex].startDate);						
//console.log('schedulePlaylistArray=');
//console.log(schedulePlaylistArray);						
										else {
											publish.getPublishedItems(groupObj.groupid, type, listtype, resultArray[dateIndex].startDate, resultArray[dateIndex].endDate, function(err, publishPlaylistArray) {
//console.log('publishPlaylistArray=');
//console.log(publishPlaylistArray);						
												if(err) { 
													logger.error('error occur when get published playlist of ' + groupObj.path + ' at ' + resultArray[dateIndex].startDate + '  (' + err + ')');
/*	
													retVal.id = err;
													retVal.msg = helper.retval[err];
													return res.send(retVal);
*/
													req.emit(groupObj.path, false);
													return;
												}
												else {
													if(!publishPlaylistArray || (publishPlaylistArray.length === 0)) { //no any published playlist
														resultArray[dateIndex].status = 1;
														req.emit(groupObj.path, false);
														return;
													}
													else if(!schedulePlaylistArray || (schedulePlaylistArray.length === 0)) { //no any schedule item but published
														resultArray[dateIndex].status = 0;
														req.emit(groupObj.path, false);
														return;
													}
													else {
														if(isScheduleChangedAfterPublish(schedulePlaylistArray, publishPlaylistArray) === 1) {//schedule changed
															resultArray[dateIndex].status = 2;
															req.emit(groupObj.path, false);
															return;
														}
														else { //two array size and items are the same, need to check the modify time
															//check all playlist's lastmodifytime, as long as find the modified playlist, stop the checking.
															isSchedulePlaylistFresh(schedulePlaylistArray, publishPlaylistArray, function(err, changed) {
																if(err) {
																	logger.error('error occur when get check whether schedule playlist fresh for ' + groupObj.path + ' at ' + resultArray[dateIndex].startDate + '  (' + err + ')');
/*
																	retVal.id = err;
																	retVal.msg = helper.retval[err];
																	return res.send(retVal);
*/
																	resultArray[dateIndex].status = 0;
																	req.emit(groupObj.path, false);
																	return;
																}			
																else {
																	if(changed) {
																		resultArray[dateIndex].status = 2;
																	}	
																	else {
																		resultArray[dateIndex].status = 3;
																	}		
																										
																	req.emit(groupObj.path, false);
																	return;
																}												
															});
														}
													}	
												}
											});
										}
									});
								}
							});
	
							req.emit(groupObj.path, true);
						}
						else { //channel, not supported yet
/*
							retVal.status = true;
							retVal.id = 0;
							retVal.msg = helper.retval[0];
							return res.send(retVal);
*/
							return callback(0, []);
						}
					}
					else {
						logger.error('you have not enough privilege to get schedule/channel information in current group (%s).', groupArray[groupIndex].path);
/*
						retVal.id = 481;
						retVal.msg = helper.retval[481];
						logger.error('the parameter from request is not correct. ');
						return res.send(retVal);
*/
						return callback(0, []);
					}	
				}
			});
		}



		logger.debug('enter schedule/publish/checkpublish.js');
		logger.debug(JSON.stringify(req.body, '', 4));
		//get parameter from request
		groupPath 	 = req.body.grouppath;
		scheduleType = req.body.scheduletype;
		startDate	 = req.body.startdate;
		endDate		 = req.body.enddate;
		listType	 = req.body.listtype;

//console.log('checkpublishstatus.js');
//console.log(req.body);

		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id 	= err;
				retVal.msg 	= helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(retVal);
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			//get userid from session
			userid = req.session.userid; 
			
			accountrole = new AccountRole(siteObj);
			accountrole.getAccountByID(userid, function(err, accountInfo) {
				if(err) {
					retVal.id 	= err;
					retVal.msg 	= helper.retval[err];
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(retVal);
				}

				schedule	= new Schedule(siteObj);
				publish		= new Publish(siteObj);
				media		= new Media(siteObj);
				privilege 	= new Privilege(siteObj);
				player	 	= new Player(siteObj);
				
				//check the parameters validation
				if((!scheduleType) || (!listType) || !startDate || !endDate) {
					retVal.id 	= 4;
					retVal.msg 	= helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
				if((regDateFormat.test(startDate) === false) || (regDateFormat.test(endDate) === false) || (startDate > endDate)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				generateGroupArray(groupPath, function(err, groupArray) {
					req.on('CheckScheduleStatusByGroup', function(first) {
						if(!first) {
							groupIndex ++;
						}
						
						if(groupIndex >= groupNumber) {
							retVal.status 	= true;
							retVal.id 		= 0;
							retVal.msg 		= helper.retval[0];
							retVal.publishstatus = groupArray;
							
//console.log(JSON.stringify(retVal, '', 4));
							logger.debug('return from schedule/publish/checkpublish.js');
							logger.debug(JSON.stringify(retVal, '', 4));
							return res.send(retVal);
						}
						else {
							checkOneGroup(groupArray[groupIndex], accountInfo, startDate, endDate, scheduleType, listType, function(err, resultArray) {
								if(resultArray && util.isArray(resultArray) && resultArray.length) {
									groupArray[groupIndex].publishstatus = resultArray;
								}
								
								req.emit('CheckScheduleStatusByGroup', false);
								return;
							});
						}
					});
					
					
					
					//entry
					if(err) {
						logger.error('error occur when get group List.');
						retVal.id = err;
						retVal.msg = helper.retval[err];
						return res.send(retVal);
					}
					
//console.log('group list is:');
//console.log(groupArray)
					groupIndex = 0;
					groupNumber = groupArray.length;
					
					req.emit('CheckScheduleStatusByGroup', true);
					
				});
			});
		});
	}
};

module.exports = CheckPublish;

