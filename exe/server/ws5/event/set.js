var fs 			= require('fs');
var os 			= require('os');
var path 		= require('path');
var Helper 		= require('../../utils/helper');
var FileUtils 	= require('../../utils/fileutils');
var Player 		= require('../../models/player');
var Site 		= require('../../models/site');
var Task		= require('../../models/task');

var fileUtils	= new FileUtils();
var helper 		= new Helper();
var logger 		= helper.logger;

var SetEvent = function() {
	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var dataObj 	= {};
		var expireMS 	= '';
		var siteObj 	= {};
/*		
		var getAllPlayersFromGroup = function(playerHandle, groupArray, callback) {
			if(!playerHandle || !groupArray || !groupArray.length) {
				return callback(0, []);
			}
			
			var groupIndex = 0;
			var groupNumber = groupArray.length;
			var playerArray = [];
			
			req.on('CollectAllPlayers', function(first) {
				var playerObj 	= {};
				var filterObj 	= {};
				var typeArray 	= [];
				var i 			= 0;
				if(!first) { groupIndex ++; }
				
				if(groupIndex >= groupNumber) {
					return callback(0, playerArray);
				}
				
				typeArray.push('player');
				filterObj.type = typeArray;
				playerHandle.searchWithoutPrivilege(filterObj, groupArray[groupIndex], 1, function(err, result) {
					if(result && (result.length > 0)) {
						for(i = 0; i < result.length; i++) {
							playerObj = {};
							playerObj.id = result[i]._id.toString();
							playerObj.name = result[i].name;
							playerObj.path = result[i].path;
							playerObj.type = result[i].type;
							playerObj.status = result[i].status;
							
							playerArray.push(playerObj);
						}
					}
	
					req.emit('CollectAllPlayers' , false);
					return;
				});
			});
			
			req.emit('CollectAllPlayers' , true);
		}
*/
		
		var getAllGroupInfo = function(playerHandle, groupList, callback) {
			if(!playerHandle || !groupList || !groupList.length) {
				return callback(0, []);
			}
			
			var groupIndex 	= 0;
			var groupNumber 	= groupList.length;
			var groupObjArray 	= [];
			
			req.on('CollectGroupInfo', function(first) {
				var groupObj 	= {};
				
				if(!first) { groupIndex ++; }
				
				if(groupIndex >= groupNumber) {
					return callback(0, groupObjArray);
				}
				
				playerHandle.get(groupList[groupIndex], function(err, groupInfo) {
					if(err || !groupInfo) {
						logger.error('error occurs when get player information in set.js. ' + err);
						
						req.emit('CollectGroupInfo', false);
						return;
					}
					else {
						groupObj = {};
						groupObj.id 	= groupInfo._id.toString();;
						groupObj.name 	= groupInfo.name;
						groupObj.path 	= groupInfo.path;
						groupObj.type 	= groupInfo.type;
						groupObj.status = groupInfo.status;
						
						groupObjArray.push(groupObj);

						req.emit('CollectGroupInfo' , false);
						return;
					}
				});
			});

			req.emit('CollectGroupInfo' , true);
		}		
			
		var getAllPlayerInfo = function(playerHandle, playerList, callback) {
			if(!playerHandle || !playerList || !playerList.length) {
				return callback(0, []);
			}
			
			var playerIndex 	= 0;
			var playerNumber 	= playerList.length;
			var playerObjArray 	= [];
			
			req.on('CollectPlayerInfo', function(first) {
				var playerObj 	= {};
				
				if(!first) { playerIndex ++; }
				
				if(playerIndex >= playerNumber) {
					return callback(0, playerObjArray);
				}
				
				playerHandle.get(playerList[playerIndex], function(err, playerInfo) {
					if(err || !playerInfo) {
						logger.error('error occurs when get player information in set.js. ' + err);
						
						req.emit('CollectPlayerInfo', false);
						return;
					}
					else {
						playerObj = {};
						playerObj.id 	= playerInfo._id.toString();;
						playerObj.name 	= playerInfo.name;
						playerObj.path 	= playerInfo.path;
						playerObj.type 	= playerInfo.type;
						playerObj.status = playerInfo.status;
						
						playerObjArray.push(playerObj);

						req.emit('CollectPlayerInfo' , false);
						return;
					}
				});
			});

			req.emit('CollectPlayerInfo' , true);
		}		
			
		
		
		logger.debug('enter server setevent.js');
		
		//get parameter from request
		dataObj = req.body.data;
/*
		dataObj = {
			regpwd: '123456',
			name: 'aaa',
			site: 'defaultsite',
			player: ['/player/aaa/ddd/ccc/test-pc1'],
			group: ['/player/not assigned', '/player/aaa'],
			expire: '20000',
			extra: {a:'a', b:'b'}
		};
*/
		
		if(!dataObj || !dataObj.regpwd || !dataObj.name || !dataObj.site || !((dataObj.group && dataObj.group.length) || (dataObj.player && dataObj.player.length))) {
			logger.error('got wrong parameter for calling setevent.js.');
			return res.send(retVal);
		}
		
		var encodedPWD = fileUtils.EncodeStringB64Sha256(dataObj.regpwd);
		if(encodedPWD !== helper.serversettings.playerpwd) {
			retVal.id = 452;
			retVal.msg = helper.retval[452];
			logger.error('got wrong password for calling setevent.js.');
			return res.send(retVal);
		}
		
		if(dataObj.expire) {
			expireMS = parseInt(dataObj.expire, 10);
			if(expireMS <= 0) {
				logger.error('got wrong parameter for calling setevent.js.');
				return res.send(retVal);
			}
			
			dataObj.expire = expireMS;
			dataObj.receiveTime = new Date().getTime();
		}
		
		var site 		= new Site();
		site.getByName(dataObj.site, function(err, siteInfo) {
			if(err || !siteInfo) {
				logger.error('got wrong parameter for site when calling setevent.js.');
				return res.send(retVal);
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;
			
			var player = new Player(siteObj);
			getAllGroupInfo(player, dataObj.group, function(err, groupList) {
				if(err) {
					logger.error('error occur during get all players under group when calling setevent.js.');
					return res.send(retVal);
				}
				
				getAllPlayerInfo(player, dataObj.player, function(err, playerList) {
					if(err) {
						logger.error('error occurs during get all player information when calling setevent.js.');
						return res.send(retVal);
					}
					
					var task 				= new Task(siteObj);
					var eventObj 			= {};
					var availablePlayers 	= [];
					var availableGroups 	= [];
					var groupArrayLength	= 0;
					var index 				= 0;
					var taskObj  			= {};

					eventObj.name 	= dataObj.name;
					eventObj.extra 	= dataObj.extra || null;
					eventObj.expire = expireMS;
					eventObj.receiveTime = new Date().getTime();
					
					for(var x = 0; x < playerList.length; x++) {
						availablePlayers.push(playerList[x].id);
					}

					for(var y = 0; y < groupList.length; y++) {
						availableGroups.push(groupList[y].id);
					}
					groupArrayLength = availableGroups.length;
//console.log('availablePlayers');
//console.log(availablePlayers);
//console.log(availableGroups);

					req.on('InsertEventTask', function(first) {
						if(!first) { index ++; }
						
						if(index >= groupArrayLength) {
							//publish one task for all single players
							if(availablePlayers.length > 0) {
								taskObj 				= {};
								taskObj.playerlist 		= availablePlayers;
								taskObj.tasktype 		= 'event';  
								taskObj.taskdata 		= eventObj;  
								taskObj.initialpath 	= 'not used';  
								taskObj.taskobjectid 	= 'not used';  
								taskObj.accountid 		= '';  
								taskObj.dur				= dataObj.expire;

								task.insertTask(taskObj, function(err) {
									if(err) { 
										logger.error('error occurs when insert event task.');
									}
									
									retVal.id = 0;
									retVal.msg = helper.retval[0];
									retVal.status = true;
									
									logger.debug('return from event/set.js.');
									logger.debug(JSON.stringify(retVal, '', 4));
									return res.send(retVal);
								});
							}
							else {
								retVal.id = 0;
								retVal.msg = helper.retval[0];
								retVal.status = true;
								
								logger.debug('return from event/set.js.');
								logger.debug(JSON.stringify(retVal, '', 4));
								return res.send(retVal);
							}
						}	
						else {
							taskObj 				= {};
							taskObj.groupid 		= availableGroups[index];
							taskObj.tasktype 		= 'event';  
							taskObj.taskdata 		= eventObj;  
							taskObj.initialpath 	= 'not used';  
							taskObj.taskobjectid 	= 'not used';  
							taskObj.accountid 		= '';  
							taskObj.dur				= dataObj.expire;
									
							task.insertTask(taskObj, function(err) {
								if(err) { 
									logger.error('error occurs when insert event task.');
								}
								
								req.emit('InsertEventTask', false);
							});
						}
					});

					req.emit('InsertEventTask', true);
/*
*/
				});
			});
		});
	}
};
/*					
					if(global.eventObjArray) {
						eventObjArray = global.eventObjArray;
					}
					else {
					}
					
					var eventObj = {};
					eventObj.playerList = allPlayers;
					eventObj.expire = dataObj.expire;
					eventObj.receiveTime = dataObj.receiveTime;
					
					delete dataObj.site;
					delete dataObj.regpwd;
					delete dataObj.group;
					delete dataObj.player;
					delete dataObj.receiveTime;
					delete dataObj.expire;
					eventObj.event = dataObj;
					eventObjArray.push(eventObj);
					
					global.eventObjArray = null;
					global.eventObjArray = eventObjArray;
					
console.log(JSON.stringify(eventObjArray, '', 4));	
					retVal.status = true;
					retVal.id = 0;
					retVal.msg = helper.retval[0];
					return res.send(retVal);
*/									
module.exports = SetEvent;

