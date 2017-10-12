var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var util 		= require('util');
var Helper 		= require('../../../utils/helper');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var Player		= require('../../../models/player');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var CollectLog = function() {
	helper.config 	= helper.loadConfig();
	var site 		= null;
	var accountrole	= null;
	var privilege 	= null;
	var player	 	= null;
	var checkingTimes = 0;
	var maxTimes	= 6;
	var logPackagePath = '';
	var serverlogFileName = 'serverlog.zip';
	
	var generatePackagePath = function(siteObj, callback) {
		var randomString = Math.random() + '';
		var timeString = new Date().toISOString().replace(/\:/g, '') + '_' + randomString;
		
		filePath = '/logpackage/' + timeString.replace(/\./g, '') + '/' + timeString.replace(/\./g, '') + '.zip';
		fileLocalPath = fileUtils.getFileLocalPath(siteObj, filePath);
		hfs.mkdir(path.dirname(fileLocalPath), function(err) {
			if(err) {
				logger.error('error occurs when create log package folder in generatePackagePath.');
				logger.error(err);
				return callback(440, '');
			}
			
			return callback(0, fileLocalPath);
		});
	}	
	
	var checkPrivilege = function(playerPath, accountName, permission, callback) {
		if(!playerPath || !permission) { return callback(4); }
		
		privilege.checkPrivilege('player', playerPath, 'account', accountName, permission, function(err, have) {
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
						
	var collectAllPlayers = function(playerList, accountName, callback) {
		var playerListIndex 	= 0;
		var playerListNumber 	= 0;
		var playerArray			= [];
  		var Emitter 			= require('events').EventEmitter;
		var emitter				= (new Emitter);
		
		emitter.on('CollectPlayer', function(first) {
			if(!first) {
				playerListIndex ++;
			}
			
			if(playerListIndex >= playerListNumber) {
				return callback(0, playerArray);
			}
			
			if(playerList[playerListIndex].type === 'player') {
				checkPrivilege(playerList[playerListIndex].path, accountName, 2, function(err) {
					if(!err) {
						player.get(playerList[playerListIndex].path, function(err, playerInfo) {
							if(!err) {
								if((playerInfo.type === 'player') && (playerInfo.status === 'online')) {
									playerArray.push(playerInfo);
								}
								else {
									logger.error('player %s is not online status, not collect its log.', playerInfo.path);
								}
							}
							else {
								logger.error('error occurs when get player in buildlog.js. ' + err);
							}
							
							emitter.emit('CollectPlayer', false);
						});
					}
					else {
						logger.error('no privilege for player: ' + playerList[playerListIndex].path);
						emitter.emit('CollectPlayer', false);
					}
				});
			}
			else {
				player.searchByCondition({}, playerList[playerListIndex].path, 1, accountName, 2, function(err, validArray, invalidArray) {
					if(!err) {
						if(validArray) {
							for(var i = 0; i < validArray.length; i++) {
								if((validArray[i].type === 'player') && (validArray[i].status === 'online')) {
									playerArray.push(validArray[i]);
								}
							}
						}
					}
					else {
						logger.error('error occurs when call player.searchByCondition() in buildlog.js. ' + err);
					}
					
					emitter.emit('CollectPlayer', false);
				});
			}
		});
		
		if(!playerList || !util.isArray(playerList) || !playerList.length || !accountName) {
			return callback(0, playerArray);
		}
		
		playerListNumber = playerList.length;
		emitter.emit('CollectPlayer', true);
	}
	
	
	var updatePlayerAttribute = function(playerList, logPath, callback) {
		var playerListIndex 	= 0;
		var playerListNumber 	= 0;
		var playerObj			= {};
  		var Emitter 			= require('events').EventEmitter;
		var emitter				= (new Emitter);
		
		emitter.on('UpdatePlayer', function(first) {
			if(!first) {
				playerListIndex ++;
			}
			
			if(playerListIndex >= playerListNumber) {
				return callback(0);
			}
			
			playerObj = {};
			playerObj.name = playerList[playerListIndex].name;
			playerObj.path = playerList[playerListIndex].path;
			playerObj.type = playerList[playerListIndex].type;
			playerObj.collectlog 	= true;
			playerObj.logpath 		= logPath;

			player.update(playerObj.path, playerObj, function(err) {
				if(err) {
					logger.error('error occurs when set collect log flag to player ' + playerObj.path);
				}
				
				emitter.emit('UpdatePlayer', false);
			});	
		});
		
		if(!playerList || !util.isArray(playerList) || !playerList.length) {
			return callback(0);
		}
		
		playerListNumber = playerList.length;
		emitter.emit('UpdatePlayer', true);
	}
	
	var getNextDay = function(dateString) { //output string in yyyy:mm:dd:hh:mm:ss.mmm
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

		return nextDayString;
	}

	var collectServerLog = function(dateObj, serverLogPackageFilePath, callback) {
		var currentDateString = '';
		var fileArray = [];
		var filePath = '';
		var serverLogBasePath = '';
		
		if(!dateObj || !dateObj.startdate || !dateObj.enddate || (dateObj.startdate > dateObj.enddate) || !serverLogPackageFilePath) {
			return callback(4);
		}
		
		serverLogBasePath = helper.WS5Path + path.sep + 'log' + path.sep + 'server' + path.sep + helper.config.logsettings.filename;
		currentDateString = dateObj.startdate;
		while(currentDateString <= dateObj.enddate) {
			filePath = serverLogBasePath + currentDateString.replace(/\:/g, '') + '.log';
			
			try {
				if(fs.existsSync(filePath)) {
					fileArray.push(filePath);	
				}
			}
			catch(e) {
				logger.error('exception occurs when check server log file existence --- ' + filePath);
				logger(e);	
			}			
			
			
			currentDateString = getNextDay(currentDateString);
		}
		
		if(fileArray.length > 0 ) {
			fileUtils.compressFile(fileArray, serverLogPackageFilePath, function(err) {
				if(err) {
					logger.error('error occurs when compress server log file.');
					return callback(441);
				}
				return callback(0);
			});
		}
		else {
			return callback(0);
		}
	}
	
	
	var checkPlayerLog = function(playerList, logPath) {
		var playerIndex 	= 0;
		var playerNumber 	= 0;
		var logFilePath 	= '';
		
		if(!logPath || !playerList || !util.isArray(playerList) || !playerList.length) {
			return true;
		}
		
		playerNumber = playerList.length;
		for(playerIndex = 0; playerIndex < playerNumber; playerIndex++) {
			logFilePath = '';
			logFilePath = path.normalize(logPath + playerList[playerIndex].path + '.zip');
			
			try{
				if(!fs.existsSync(logFilePath)) {
					return false;
				}
			}
			catch(e) {
				logger.error('exception occurs when check log package file existence for ' + logFilePath);
				logger.error(e);
				return false;
			}
		}
		
		return true;
	}
	
	var buildLogPackage = function(logFolderLocalPath, callback) {
		var tempPackageFilePath = '';
		var realPackageFilePath = '';
		var playerFolderPath	= '';
		var serverLogPath		= '';
		var randomString 	= Math.random() + '';
		var timeString 		= new Date().toISOString().replace(/\:/g, '') + '_temp_' + randomString;
		var pathArray 		= [];
		
		playerFolderPath = logFolderLocalPath + path.sep + 'player';
		serverLogPath = logFolderLocalPath + path.sep + serverlogFileName;
		tempPackageFilePath = path.dirname(logFolderLocalPath) + path.sep + timeString.replace(/\./g, '') + '.zip';
		realPackageFilePath = logFolderLocalPath + path.sep + path.basename(logFolderLocalPath) + '.zip';
		
		pathArray.push(logFolderLocalPath);
		fileUtils.compressFile(pathArray, tempPackageFilePath, function(err) {
			if(err) {
				logger.error('error occurs when compress whole log package. ' + err);
				logger.error('logFolderLocalPath=' + logFolderLocalPath);
				return callback(442);
			}
			
			
			
			//move temp package to real package
			fs.rename(tempPackageFilePath, realPackageFilePath, function(err) {
				if(err) {
					logger.error('error occurs when move log package (%s) to target path (%s).', tempPackageFilePath, realPackageFilePath);
					hfs.delSync(tempPackageFilePath);
				}
				
				//delete player log
				hfs.del(playerFolderPath, function(err) {
					if(err) {
						logger.error('error occurs when remove temp player log folder. ' + playerFolderPath);
					}
				
					//delete server log package
					hfs.del(serverLogPath, function(err) {
						if(err) {
							logger.error('error occurs when remove temp server log package. ' + serverLogPath);
						}
						
						return callback(0);
					});
				});
			});
		});
	}
	
	this.do = function(req, res) {
		var packagePath	= '';
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var dataObj		= {};
		
		logger.debug('enter player/buildlog.js');
		
		//get parameter from request
		dataObj = req.body;
//dataObj={'players': [{'path':'/player/not assigned','type':'group'},{'path':'/player/vvv','type':'group'}]};
//dataObj={'server': {'startdate':'2013:08:08','enddate':'2013:10:10'}};
//dataObj={'players': [{'path':'/player/not assigned','type':'group'},{'path':'/player/vvv','type':'group'}], 'server': {'startdate':'2013:08:08','enddate':'2013:10:10'}};

console.log('collect log Obj=');
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

				player		= new Player(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if(!dataObj || (!dataObj.players && !dataObj.server)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if(dataObj.players && (!util.isArray(dataObj.players) || !dataObj.players.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the players parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if(dataObj.server && (!dataObj.server.startdate || !dataObj.server.enddate)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the server parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				//if has players, collect all player object be query db, all players need to have write privilege
				collectAllPlayers(dataObj.players, accountInfo.name, function(err, playerArray) {
					if(err) {
						logger.error('error occurs when collect player from request player/group list. ' + err);
						return res.send(retVal);
					}
					
					//generate output path
					generatePackagePath(siteObj, function(err, fileLocalPath) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							return res.send(retVal);
						}
						
						logPackageLocalPath = fileLocalPath;
						
						//update all players to set collectlog attribute
						updatePlayerAttribute(playerArray, path.dirname(logPackageLocalPath), function(err) {
							if(err) {
								logger.error('error occurs when update player to set collect log flag. ' + err);
								retVal.id = err;
								retVal.msg = helper.retval[err];
								return res.send(retVal);
							}
							
							//return to caller without waiting.
							retVal.status = true;
							retVal.id = 0;
							retVal.msg = helper.retval[0];
							retVal.path = fileLocalPath.slice(helper.WS5Path.length).replace(/\\/g, '\/');
							res.send(retVal);
							
							//set timer to watch the log file is sent back, if collect all or time out, package the log and rename it from temp folder to formal path.
							var timeoutHandler = function() {
								if(checkPlayerLog(playerArray, path.dirname(logPackageLocalPath))) {
									buildLogPackage(path.dirname(logPackageLocalPath), function(err) {
										//do nothing
									});
								}
								else {
									if(checkingTimes < maxTimes) {
										checkingTimes ++;
						
										setTimeout(timeoutHandler, helper.config.serversettings.heartbeatInterval * 1000);	
									}
									else {
										logger.error('tried 6 times to get player log, but still can not get all of them, will generate package for existed ones.');
										buildLogPackage(path.dirname(logPackageLocalPath), function(err) {
											//do nothing
										});
									}
								}

								return;
							}
	
							//collect server log and package it.
							if(dataObj.server) {
								collectServerLog(dataObj.server, path.dirname(logPackageLocalPath) + path.sep + serverlogFileName, function(err) {
									if(err) {
										logger.error('error occurs when collect server log. ' + err);
									}
									timeoutHandler();
								});
							}
							else {
								timeoutHandler();
							}
						});
					});
				});
			});
		});
	}
};

module.exports = CollectLog;

