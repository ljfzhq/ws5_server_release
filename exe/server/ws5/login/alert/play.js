var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var util 		= require('util');
var Helper 		= require('../../../utils/helper');
var Media		= require('../../../models/media');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var Task		= require('../../../models/task');
var Player		= require('../../../models/player');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var PublishUC = function() {
	helper.config = helper.loadConfig();
	
	var generatePublishFile = function(siteObj, mediaObj, duration, playerGroupList, callback) {
		var jsonObj			= {};
		var mediaList		= [];
		var filePath 		= '';
		var fileLocalPath 	= '';
		var randomString	= '';
		
		
		mediaList.push({'path': mediaObj.path, 'type': mediaObj.type});
		jsonObj.mediaList	= mediaList;
		jsonObj.dur			= duration;
		jsonObj.type 		= 'uc';
		jsonObj.createTime 	= new Date();
		jsonObj.for 		= playerGroupList;
		
		randomString = Math.random() + '';
		filePath = '/publish/alert/alert_' + new Date().toISOString().replace(/\:/g, '') + '_' + randomString.slice(2) + '.publ';
		fileLocalPath = fileUtils.getFileLocalPath(siteObj, filePath);
		hfs.mkdir(path.dirname(fileLocalPath), function(err) {
			if(err) {
				logger.error('error occurs when create publish alert folder in generatePublishFile. ' + err);
				return callback(471, '');
			}
			
			fileUtils.writeDataFile(fileLocalPath, jsonObj);
			
			return callback(0, filePath);
		});
	}	
	
	this.do = function(req, res) {
		var mediaPath	= '';
		var media		= null;
		var site 		= null;
		var accountrole	= null;
		var privilege 	= null;
		var task	 	= null;
		var player	 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		
		var dataObj		= {};
		var alertDataFilePath = '';
		
		logger.debug('enter alert/play.js');
		
		//get parameter from request
		dataObj = req.body;
/*
dataObj = {
	dur: 0,
	allplayers: true,
	mediapath: '/media/ticker.widget'
};
dataObj = {
	allplayers: false,
	mediapath: '/media/201306132.jpg'
};
*/		
console.log('play alert Obj=');
console.log(JSON.stringify(dataObj, '', 4));
		
		//get siteID from session
		siteid 	= req.session.siteObj.siteID;

		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
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
					retVal.id = err;
					retVal.msg = helper.retval[err];
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(retVal);
				}

				player	 	= new Player(siteObj);
				task	 	= new Task(siteObj);
				media	 	= new Media(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if(!dataObj || !dataObj.mediapath) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if(dataObj.allplayers === 'true')
					dataObj.allplayers = true;
				if(dataObj.allplayers === 'false')
					dataObj.allplayers = false;
				
				//check privilege
				privilege.checkPrivilege('alert', '/alert', 'account', accountInfo.name, 4, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to play alert.');
						return res.send(retVal);
					}
					else {
						if(have) {
							privilege.checkPrivilege('media', dataObj.mediapath, 'account', accountInfo.name, 1, function(err, have) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									logger.error('error occur when get privilege data from database or has not enough privilege to create folder.');
									return res.send(retVal);
								}
								else {
									if(have) {
										//create record in DB, create folder
										media.get(dataObj.mediapath, function(err, mediaObj) {
											var index 		= 0;
											var playerGroupArray = [];
											var arrayLength = 0;
											var playerArray	= [];
											var taskObj 	= {};
											
											if(err) {
												retVal.id = err;
												retVal.msg = helper.retval[err];
												
												logger.error('error occurs when call media.get(). ' + err);
												
												return res.send(retVal);
											}
											
											var checkPrivilege = function(playerPath, callback) {
												if(!playerPath) { return callback(4); }
												
												privilege.checkPrivilege('player', playerPath, 'account', accountInfo.name, 4, function(err, have) {
													if(err) {
														logger.error('error occur when get privilege data from database or has not enough privilege to send play alert task to the player/group of (%s).', playerPath);
														logger.error('err = ' + err);
														
														return callback(err);
													}
													else {
														if(have) {
															return callback(0);
														}
														else {
															logger.error('you have not enough privilege to send play alert task to the group/player.', playerPath);
								
															return callback(413);
														}
													}
												});
											}	
													
											
											var checkEachPlayerPrivilege = function(playerList, callback) {
												var playerIndex  = 0;
												var playerNumber = 0;
												var availablePlayerArray = [];
												
												req.on('CheckPrivilegeOnPlayer', function(first) {
													if(!first) { playerIndex ++; }
													
													if(playerIndex >= playerNumber) {
														return callback(0, availablePlayerArray);
													}
													
													checkPrivilege(playerList[playerIndex].path, function(err) {
														if(!err) {
															availablePlayerArray.push(playerList[playerIndex].id);
														}
														else {
															logger.error('error occurs when call checkPrivilege(). ' + err)
														}
								
														req.emit('CheckPrivilegeOnPlayer', false);
														return;
													});
												});
								
												
												//entry of function
												if(!playerList || !util.isArray(playerList) || !playerList.length) {
													logger.error('parameter error.');
													return callback(4, []);
												}
												
												playerNumber = playerList.length;
												req.emit('CheckPrivilegeOnPlayer', true);
											}
											
											//insert task according to playerlist array, insert one task for each group, insert one task for all players
											req.on('InsertAlertTask', function(first) {
												if(!first) { index ++; }
												
												if(index >= arrayLength) {
													//publish one task for all single players
													if(playerArray.length > 0) {
														checkEachPlayerPrivilege(playerArray, function(err, availablePlayers) {
															if(availablePlayers && util.isArray(availablePlayers) && availablePlayers.length) {
																taskObj 				= {};
																taskObj.groupid 		= '';
																taskObj.playerlist 		= availablePlayers;
																taskObj.tasktype 		= 'uc';  
																taskObj.taskobjectid 	= mediaObj._id.toString();  
																taskObj.initialpath 	= alertDataFilePath;  
																taskObj.accountid 		= accountInfo._id.toString();  
																taskObj.dur				= dataObj.dur;
		
																task.insertTask(taskObj, function(err) {
																	if(err) { 
																		logger.error('error occurs when insert publish uc task for ' + mediaObj.path);
																	}
																	
																	retVal.id = 0;
																	retVal.msg = helper.retval[0];
																	retVal.status = true;
																	
																	logger.debug('return from alert/play.js.');
																	logger.debug(JSON.stringify(retVal, '', 4));
																	return res.send(retVal);
																});
															}
															else { //all players are not available --- current user has not privilege on them
																retVal.id = 0;
																retVal.msg = helper.retval[0];
																retVal.status = true;
																
																logger.debug('return from alert/play.js.');
																logger.debug(JSON.stringify(retVal, '', 4));
																return res.send(retVal);
															}
														});
													}
													else {
														retVal.id = 0;
														retVal.msg = helper.retval[0];
														retVal.status = true;
														
														logger.debug('return from alert/play.js.');
														logger.debug(JSON.stringify(retVal, '', 4));
														return res.send(retVal);
													}
												}	
												else {
													if(playerGroupArray[index].type === 'group') {
														checkPrivilege(playerGroupArray[index].path, function(err) {
															if(err) {
																req.emit('InsertAlertTask', false);
															}
															else {
																taskObj 				= {};
																taskObj.groupid 		= playerGroupArray[index].id;
																taskObj.tasktype 		= 'uc';  
																taskObj.taskobjectid 	= mediaObj._id.toString();  
																taskObj.initialpath 	= alertDataFilePath;  
																taskObj.accountid 		= accountInfo._id.toString();  
																taskObj.dur				= dataObj.dur;
																		
																task.insertTask(taskObj, function(err) {
																	if(err) { 
																		logger.error('error occurs when insert publish uc task for ' + mediaObj.path);
																	}
																	
																	req.emit('InsertAlertTask', false);
																});
															}
														});
													}  
													else {
														req.emit('InsertAlertTask', false);
													}
												}
											});
											
											//entry
											if(mediaObj.type !== 'playlist' && mediaObj.type !== 'widget') {
												retVal.id = 591;
												retVal.msg = helper.retval[retVal.id];
												logger.error('unsupported alert media type %s of (%s).', mediaObj.type, dataObj.mediapath);
												return res.send(retVal);
											}
											
											if(!dataObj.dur) {
												if(mediaObj.alert && mediaObj.alert.dur) {
													dataObj.dur = mediaObj.alert.dur;
												}
												else {
													dataObj.dur = mediaObj.dur;
												}
											}

											if(mediaObj.alert && mediaObj.alert.allplayers) {
												dataObj.allplayers = true;
											}
											
											if(!dataObj.allplayers) {
												if(mediaObj.alert && mediaObj.alert.players && util.isArray(mediaObj.alert.players) && mediaObj.alert.players.length) {
													playerGroupArray = mediaObj.alert.players;
												}
												else {
													playerGroupArray = [];
												}
													
												arrayLength = playerGroupArray.length;
	
												//push all single player into another new array
												for(var i = 0 ; i < arrayLength; i++) {
													if(playerGroupArray[i].type === 'player') {
														playerArray.push(playerGroupArray[i]);
													}
												}
												
												//generate media list file for alert under publish folder
												generatePublishFile(siteObj, mediaObj, dataObj.dur, playerGroupArray, function(err, dataFilePath) {
													if(err) {
														retVal.id  = err;
														retVal.msg = helper.retval[err];
														
														logger.error('error occurs when call generatePublishFile(). ' + err);
														return res.send(retVal);
													}
													
													alertDataFilePath = dataFilePath;
														
													req.emit('InsertAlertTask', true);
												});
											}
											else {//for all player, directly publish this task to root node
												player.get('/player', function(err, rootObj) {
													if(err) {
														logger.error('error occurs when get root group information. ' + err);
														retVal.id = err;
														retVal.msg = helper.retval[retVal.id];
														return res.send(retVal);
													}
													
													playerGroupArray = [{'id': rootObj._id.toString(), 'path': '/player', 'type':'group'}];
													arrayLength = 1;
		
													//generate media list file for alert under publish folder
													generatePublishFile(siteObj, mediaObj, dataObj.dur, playerGroupArray, function(err, dataFilePath) {
														if(err) {
															retVal.id = err;
															retVal.msg = helper.retval[err];
															logger.error('error occurs when call generatePublishFile() for all players. ' + err);
															return res.send(retVal);
														}
														
														alertDataFilePath = dataFilePath;
														
														req.emit('InsertAlertTask', true);
													});
												});
											}
										});
									}
									else {
										retVal.id = 112;
										retVal.msg = helper.retval[retVal.id];
										logger.error('you have not enough privilege to read media in current path (%s).', dataObj.mediapath);
										return res.send(retVal);
									}
								}
							});
						}
						else {
							retVal.id = 590;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to play alert');
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = PublishUC;

