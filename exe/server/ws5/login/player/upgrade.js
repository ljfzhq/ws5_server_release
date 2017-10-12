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

var Upgrade = function() {
	helper.config = helper.loadConfig();
	
	var generatePublishFile = function(siteObj, packageObj, starttime, playerGroupList, callback) {
		var jsonObj			= {};
		var mediaList		= [];
		var filePath 		= '';
		var fileLocalPath 	= '';
		var randomString	= '';
		
		
		mediaList.push({'path': packageObj.path, 'type': packageObj.type});
		jsonObj.mediaList	= mediaList;
		jsonObj.starttime	= starttime || '';
		jsonObj.type 		= 'upgrade';
		jsonObj.createTime 	= new Date();
		jsonObj.for 		= playerGroupList;
		
		randomString = Math.random() + '';
		filePath = '/publish/upgrade/upgrade_' + new Date().toISOString().replace(/\:/g, '') + '_' + randomString.slice(2) + '.publ';
		fileLocalPath = fileUtils.getFileLocalPath(siteObj, filePath);
		hfs.mkdir(path.dirname(fileLocalPath), function(err) {
			if(err) {
				logger.error('error occurs when create publish upgrade folder in generatePublishFile. ' + err);
				return callback(471, '');
			}
			
			fileUtils.writeDataFile(fileLocalPath, jsonObj);
			
			return callback(0, filePath);
		});
	}	
	
	this.do = function(req, res) {
		var packagePath	= '';
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
		var upgradeDataFilePath = '';
		
		logger.debug('enter player/upgrade.js');
		
		//get parameter from request
		dataObj = req.body;
/*
dataObj={
	players:[
			{
				path:'/player/not assigned/remote', 
				type: 'player',
				id:'52536a249d786b181a000001'
			}
		],
	packagepath: '/media/ws5.ws5',
	starttime: '2013:10:15:12:00:00.000'
};
*/
console.log('upgrade Obj=');
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
				if(!dataObj || (!dataObj.packagepath && dataObj.starttime)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if(dataObj.allplayers === 'true')
					dataObj.allplayers = true;
				if(dataObj.allplayers === 'false')
					dataObj.allplayers = false;
				
				if((dataObj.allplayers !== true) && (!dataObj.players || !util.isArray(dataObj.players) || !dataObj.players.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				//check privilege
				privilege.checkPrivilege('media', dataObj.packagepath, 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to create folder.');
						return res.send(retVal);
					}
					else {
						if(have) {
							
							var getPackageObj = function(packagepath, callback) {
								var tempObj = {};
								
								if(packagepath) {
									media.get(packagepath, function(err, packageObj) {
										return callback(err, packageObj);
									});
								}
								else {
									tempObj = {path: '', type: '', _id: new Date().getTime().toString() + Math.ramdon().toString().slice(2)};
									return callback(0, tempObj);
								}
							}
							
							getPackageObj(dataObj.packagepath, function(err, packageObj) {
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
											logger.error('error occur when get privilege data from database or has not enough privilege to send upgrade task to the player/group of (%s).', playerPath);
											logger.error('err = ' + err);
											
											return callback(err);
										}
										else {
											if(have) {
												return callback(0);
											}
											else {
												logger.error('you have not enough privilege to send play upgrade task to the group/player.', playerPath);
					
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
								req.on('InsertUpgradeTask', function(first) {
									if(!first) { index ++; }
									
									if(index >= arrayLength) {
										//publish one task for all single players
										if(playerArray.length > 0) {
											checkEachPlayerPrivilege(playerArray, function(err, availablePlayers) {
												if(availablePlayers && util.isArray(availablePlayers) && availablePlayers.length) {
													taskObj 				= {};
													taskObj.groupid 		= '';
													taskObj.playerlist 		= availablePlayers;
													taskObj.tasktype 		= 'upgrade';  
													taskObj.taskobjectid 	= packageObj._id.toString();  
													taskObj.initialpath 	= upgradeDataFilePath;  
													taskObj.accountid 		= accountInfo._id.toString();  
													taskObj.starttime		= dataObj.starttime || '';

													task.insertTask(taskObj, function(err) {
														if(err) { 
															logger.error('error occurs when insert publish upgrade task for ' + packageObj.path);
														}
														
														retVal.id = 0;
														retVal.msg = helper.retval[0];
														retVal.status = true;
														
														logger.debug('return from player/upgrade.js.');
														logger.debug(JSON.stringify(retVal, '', 4));
														return res.send(retVal);
													});
												}
												else { //all players are not available --- current user has not privilege on them
													retVal.id = 0;
													retVal.msg = helper.retval[0];
													retVal.status = true;
													
													logger.debug('return from player/upgrade.js.');
													logger.debug(JSON.stringify(retVal, '', 4));
													return res.send(retVal);
												}
											});
										}
										else {
											retVal.id = 0;
											retVal.msg = helper.retval[0];
											retVal.status = true;
											
											logger.debug('return from player/upgrade.js.');
											logger.debug(JSON.stringify(retVal, '', 4));
											return res.send(retVal);
										}
									}	
									else {
										if(playerGroupArray[index].type === 'group') {

											checkPrivilege(playerGroupArray[index].path, function(err) {
												if(err) {
													req.emit('InsertUpgradeTask', false);
												}
												else {
													taskObj 				= {};
													taskObj.groupid 		= playerGroupArray[index].id;
													taskObj.tasktype 		= 'upgrade';  
													taskObj.taskobjectid 	= packageObj._id.toString();  
													taskObj.initialpath 	= upgradeDataFilePath;  
													taskObj.accountid 		= accountInfo._id.toString();  
													taskObj.starttime		= dataObj.starttime || '';
															
													task.insertTask(taskObj, function(err) {
														if(err) { 
															logger.error('error occurs when insert publish upgrade task for ' + packageObj.path);
														}
														
														req.emit('InsertUpgradeTask', false);
													});
												}
											});
										}  
										else {
											req.emit('InsertUpgradeTask', false);
										}
									}
								});
								
								//entry
								if(!dataObj.allplayers) {
									playerGroupArray = dataObj.players;

									arrayLength = playerGroupArray.length;

									//push all single player into another new array
									for(var i = 0 ; i < arrayLength; i++) {
										if(playerGroupArray[i].type === 'player') {
											playerArray.push(playerGroupArray[i]);
										}
									}
									
									//generate upgrade package file for upgrade data file under publish folder
									generatePublishFile(siteObj, packageObj, dataObj.starttime, playerGroupArray, function(err, dataFilePath) {
										if(err) {
											retVal.id  = err;
											retVal.msg = helper.retval[err];
											
											logger.error('error occurs when call generatePublishFile(). ' + err);
											return res.send(retVal);
										}
										
										upgradeDataFilePath = dataFilePath;
											
										req.emit('InsertUpgradeTask', true);
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

										//generate upgrade package file for upgrade under publish folder
										generatePublishFile(siteObj, packageObj, dataObj.starttime, playerGroupArray, function(err, dataFilePath) {
											if(err) {
												retVal.id = err;
												retVal.msg = helper.retval[err];
												logger.error('error occurs when call generatePublishFile() for all players. ' + err);
												return res.send(retVal);
											}
											
											upgradeDataFilePath = dataFilePath;
											
											req.emit('InsertUpgradeTask', true);
										});
									});
								}
							});
						}
						else {
							retVal.id = 112;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to read upgrade package in current path (%s).', dataObj.packagepath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = Upgrade;

