var path 		= require('path');
var util 		= require('util');
var Helper 		= require('../../../utils/helper');
var Player		= require('../../../models/player');
var Site		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var FileUtils 	= require('../../../utils/fileutils');

var fileUtils	= new FileUtils();
var helper 		= new Helper();
var logger 		= helper.logger;

var WOL = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= null;
		var player		= null;
		var site		= null;
		var accountrole	= null;
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
		
		var retriedTimes = 0;
		var maxRetry = 3;
		
		logger.debug('enter player/wol.js');

		var wakeupPlayer = function(playerObj, callback) {
			var failObj		= {};
			var playerNewObj	= {};
			
			if(!playerObj) {
				logger.error('wrong parameter when call updatePlayer().   obj=');
				logger.error(playerObj);
				return callback(null);
			}
			
			fileUtils.wakeupPlayerByMAC(playerObj.mac, function(err) {
				if(err) {
					logger.error('error occurs when wake up the player. ' + err);
					logger.error(playerObj);
					
					return callback(err);
				}
				else {
					return callback(null);
				}
			});
		}

		req.on('Wakeup', function(first) {
			if(!first) { expandPlayerIndex ++; }
			
			if(expandPlayerIndex >= expandPlayerNumber) {
				if(retriedTimes >= maxRetry) {
					retVal.status = true;
					retVal.id 	= 0;
					retVal.msg 	= helper.retval[0];
					if(failArray && failArray.length > 0) {
						retVal.fail = failArray;
					}
					
					logger.debug('return from player/wol.js.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal);
				}
				else {
					expandPlayerIndex = 0;
					retriedTimes ++;
				}
			}
			
			wakeupPlayer(expandPlayerArray[expandPlayerIndex], function(err) {
				req.emit('Wakeup', false);
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
				retriedTimes = 0;
				maxRetry = 3;
				expandPlayerNumber = expandPlayerArray.length;
				expandPlayerIndex = 0;
//console.log('expandPlayerArray=');
//console.log(expandPlayerArray);

				req.emit('Wakeup' , true);
				return;
			}
			
			if(dataObj.players[inputPlayerIndex].type === 'group') {
				typeArray.push('player');
				filterObj.type = typeArray;
				player.searchByCondition(filterObj, dataObj.players[inputPlayerIndex].path, 3, accountName, 1, function(err, validArray, invalidArray) {
					if(validArray && (validArray.length > 0)) {
						for(i = 0; i < validArray.length; i++) {
							playerObj = {};
							playerObj.id 	= validArray[i]._id.toString();
							playerObj.mac 	= validArray[i].mac;
							playerObj.path 	= validArray[i].path;
							playerObj.type 	= validArray[i].type;
							playerObj.status = validArray[i].status;
							
							expandPlayerArray.push(playerObj);
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
						playerObj.id 	= dataObj.players[inputPlayerIndex].id;
						playerObj.path 	= dataObj.players[inputPlayerIndex].path;
						playerObj.type 	= dataObj.players[inputPlayerIndex].type;
						playerObj.mac 	= playerInfo.mac;
						playerObj.status = playerInfo.status;
						
						expandPlayerArray.push(playerObj);

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
				
				//check the parameters validation
				if((!dataObj) || (!dataObj.players) || (!util.isArray(dataObj.players)) || (!dataObj.players.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
				
				if((!dataObj.players[0].type) || (!dataObj.players[0].id) || (!dataObj.players[0].path)) {
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

module.exports = WOL;

