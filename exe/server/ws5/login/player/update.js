var path 		= require('path');
var util 		= require('util');
var Helper 		= require('../../../utils/helper');
var Player		= require('../../../models/player');
var Site		= require('../../../models/site');
var Privilege 	= require('../../../models/privilege');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;

var Update = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= null;
		var player		= null;
		var site		= null;
		var accountrole	= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		
		var failArray	= [];
		var expandPlayerArray = [];
		var expandPlayerNumber = 0;
		var expandPlayerIndex = 0;
		var inputPlayerNumber = 0;
		var inputPlayerIndex = 0;
		
		logger.debug('enter player/update.js');

		var updatePlayer = function(playerObj, attrObj, accountName, callback) {
			var failObj		= {};
			var playerNewObj	= {};
			
			if(!playerObj || !accountName) {
				logger.error('wrong parameter when call updatePlayer().   obj=');
				logger.error(playerObj);
				logger.error('accountName=' + accountName);
				return callback(null);
			}
			
			//check privilege, must have write privilege on specified node.
			privilege.checkPrivilege('player', playerObj.path, 'account', accountName, 2, function(err, have) {
				if(err) {
					logger.error('error occur when get privilege data from database or has not enough privilege to update player/group. ' + playerObj.path);
					failObj = {};
					failObj.path 	= playerObj.path;
					failObj.id	= playerObj.id;
					failObj.reason 	= 'check privilege failed';
					
					return callback(failObj);
				}
				else {
					if(have) {
						//update record in DB, if it is group and pass different name, need to change the group name and all sub nodes' path in db
						playerNewObj = {};
						playerNewObj.path = playerObj.path;
						playerNewObj.name = playerObj.name;
						playerNewObj.type = playerObj.type;
						
						if(attrObj.timezone			!== undefined) { playerNewObj.timezone 	= attrObj.timezone; }
						if(attrObj.meta 			!== undefined) { playerNewObj.meta 		= attrObj.meta; }
						if(attrObj.upgrade 			!== undefined) { playerNewObj.upgrade 	= attrObj.upgrade; }
						if(attrObj.powerschedule 	!== undefined) { playerNewObj.powerschedule = attrObj.powerschedule; }
						if(attrObj.emptypower 	 	=== 'true') { playerNewObj.powerschedule = []; }
						if((attrObj.reboot 		!== undefined) && (playerObj.status === 'online')) { playerNewObj.reboot 	= attrObj.reboot; }
						if((attrObj.shutdown 	!== undefined) && (playerObj.status === 'online')) { playerNewObj.shutdown 	= attrObj.shutdown; }
						if((attrObj.snapshot 	!== undefined) && (playerObj.status === 'online')) { playerNewObj.snapshot 	= attrObj.snapshot; }
						if(playerObj.name && (playerObj.name !== path.basename(playerObj.path))) { 
							playerNewObj.name = playerObj.name;
							playerNewObj.path= path.dirname(playerObj.path) + '/' + playerObj.name;
						}
						
console.log('playerNewObj=');
console.log(playerNewObj);
						player.update(playerObj.path, playerNewObj, function(err) {
							if(err) {
								logger.error('error occurs when update player db. ' + err);
								logger.error(playerObj);
								logger.error(playerNewObj);
								
								failObj = {};
								failObj.path 	= playerObj.path;
								failObj.id	= playerObj.id;
								failObj.reason 	= 'update db failed';
								
								return callback(failObj);
							}
							else {
								return callback(null);
							}
						});
					}
					else {
						logger.error('you have not enough privilege to update player/group in current path (%s).', obj.path);

						failObj = {};
						failObj.path 	= playerObj.path;
						failObj.id 	= playerObj.id;
						failObj.reason 	= 'no right';
						
						return callback(failObj);
					}
				}
			});
		}

		req.on('UpdateNext', function(first, accountName) {
			if(!first) { expandPlayerIndex ++; }
			
			if(expandPlayerIndex >= expandPlayerNumber) {
				retVal.status = true;
				retVal.id 	= 0;
				retVal.msg 	= helper.retval[0];
				if(failArray && failArray.length > 0) {
					retVal.fail = failArray;
				}
				
				logger.debug('return from player/update.js.');
				logger.debug(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
			
			updatePlayer(expandPlayerArray[expandPlayerIndex], dataObj, accountName, function(failureObj) {
				if(failureObj) {
					failArray.push(failureObj);
				}
				
				req.emit('UpdateNext', false, accountName);
				return;
			});
		});
		
		req.on('CollectAllPlayers', function(first, accountName) {
			var playerObj = {};
			var filterObj 	= {};
			var typeArray 	= [];
			var i 			= 0;
			
			if(!first) { inputPlayerIndex ++; }
			
			if(inputPlayerIndex >= inputPlayerNumber) {
				expandPlayerNumber = expandPlayerArray.length;
				expandPlayerIndex = 0;
//console.log('expandPlayerArray=');
//console.log(expandPlayerArray);

				req.emit('UpdateNext' , true, accountName);
				return;
			}
			
			if(dataObj.players[inputPlayerIndex].type === 'group') {
				playerObj = {};
				playerObj.id = dataObj.players[inputPlayerIndex].id;
				playerObj.name = dataObj.players[inputPlayerIndex].name;
				playerObj.path = dataObj.players[inputPlayerIndex].path;
				playerObj.type = dataObj.players[inputPlayerIndex].type;
				
				expandPlayerArray.push(playerObj);
				
				
				typeArray.push('player');
				filterObj.type = typeArray;
				player.searchByCondition(filterObj, dataObj.players[inputPlayerIndex].path, 3, accountName, 1, function(err, validArray, invalidArray) {
					if(validArray && (validArray.length > 0)) {
						for(i = 0; i < validArray.length; i++) {
							playerObj = {};
							playerObj.id = validArray[i]._id.toString();
							playerObj.name = validArray[i].name;
							playerObj.path = validArray[i].path;
							playerObj.type = validArray[i].type;
							playerObj.status = validArray[i].status;
							
							expandPlayerArray.push(playerObj);
/*
							if(validArray[i].status === 'online') {
								playerObj = {};
								playerObj.id = validArray[i]._id.toString();
								playerObj.name = validArray[i].name;
								playerObj.path = validArray[i].path;
								playerObj.type = validArray[i].type;
								
								expandPlayerArray.push(playerObj);
							}
							else {
								failObj = {};
								failObj.path 	= validArray[i].path;
								failObj.id	 	= validArray[i]._id.toString();
								failObj.reason 	= 'not online';
								
								failArray.push(failObj);
							}
*/
						}
					}

					if(invalidArray && (invalidArray.length > 0)) {
						for(i = 0; i < invalidArray.length; i++) {
							failObj = {};
							failObj.path 	= validArray[i].path;
							failObj.id	 	= validArray[i]._id.toString();
							failObj.reason 	= validArray[i].reason;
							
							failArray.push(failObj);
						}
					}
					
					req.emit('CollectAllPlayers' , false, accountName);
					return;
				});
			}
			else {
				player.get(dataObj.players[inputPlayerIndex].path, function(err, playerInfo) {
					if(err || !playerInfo) {
						logger.error('error occurs when get player information in update.js. ' + err);
						
						req.emit('CollectAllPlayers' , false, accountName);
						return;
					}
					else {
						playerObj = {};
						playerObj.id = dataObj.players[inputPlayerIndex].id;
						playerObj.name = dataObj.players[inputPlayerIndex].name;
						playerObj.path = dataObj.players[inputPlayerIndex].path;
						playerObj.type = dataObj.players[inputPlayerIndex].type;
						playerObj.status = playerInfo.status;
						
						expandPlayerArray.push(playerObj);
/*
						if(playerInfo.status === 'online') {
							playerObj = {};
							playerObj.id = dataObj.players[inputPlayerIndex].id;
							playerObj.name = dataObj.players[inputPlayerIndex].name;
							playerObj.path = dataObj.players[inputPlayerIndex].path;
							playerObj.type = dataObj.players[inputPlayerIndex].type;
							
							expandPlayerArray.push(playerObj);
						}
*/
						req.emit('CollectAllPlayers' , false, accountName);
						return;
					}
				});
			}
		});
		
		
		
		
		
		//get parameter from request
		dataObj = req.body;
/*
		dataObj = {
					'players':[{'id':'51cd8fb69c3d4b9813000001', 'name':'player4', 'path':'/player/not assigned/player4', 'type':'player'},
							{'id':'50dd19a9f11bc5701300022', 'name':'aaa', 'path':'/player/aaa', 'type':'group'}],
					'reboot': true,
					'shutdown': false,
					'meta': [
							{'city': 'beijing'},
							{'terminal': 'T3'}
						   ]
			};
*/
console.log(dataObj);
				
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

				player 		= new Player(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!dataObj) || (!dataObj.players) || (!util.isArray(dataObj.players)) || (!dataObj.players.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
				
				if((!dataObj.players[0].name) || (!dataObj.players[0].type) || (!dataObj.players[0].id) || (!dataObj.players[0].path)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
				
				//expand group to players
				inputPlayerNumber = dataObj.players.length;
				inputPlayerIndex = 0;
				req.emit('CollectAllPlayers' , true, accountInfo.name);
			});
		});
	}
};

module.exports = Update;

