var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var Player 		= require('../../../models/player');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var FileUtils 	= require('../../../utils/fileutils');

var fileUtils	= new FileUtils();
var helper 		= new Helper();
var logger 		= helper.logger;
var player 		= null;
var site 		= null;
var accountrole	= null;

var Move = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal = {
			status	: false,
			id		: 4,
			msg		: helper.retval[4]
		};
		var accessibleArray 	= [];
		var inaccessibleArray 	= [];
		var playerObj			= null; 
		var userid				= '';
		var targetPath			= '';
		var srcObj				= {};
		var confirmObj			= {};
		var siteid				= '';
		var siteObj				= {};
		var accountObj			= {};

		logger.debug('enter player/move.js');
		
		//1. Sort accessibleArray by decsend order to let group be popped first and copied first for the same root path. 
		//2. Start to copy player and group.
		//3. Remove the finished item from accessibleArray, if it is a group, copy it to groupArray for later removing; move the failed item into inaccessibleArray.
		//4. If meet conflict item, then save the groupArray, accessArray and inaccessibleArray into session, and return to caller for confirmation.
		//		4.1 After get confirm then request in moveconfirm.js, get data from session and continue the move operation.
		//		4.2 If user choose overwrite, overwrite the player/group db record. Remove all schedule and channel belongs to old group, copy schedule/channel from new group
		//		4.3 if user choose rename, rename the player or group with "name (N)". N is 1, 2, ,3, .... until no duplicated name.
		//			If it is group, after created renamed group and copy its attribues, change its sub groups and players's target path in accessibleArray. 
		//				Copy its schedule and channel to new path.
		//		4.4 If user choose skip, 
		//				if it is a group, remove itself, its sub groups and players from accessibleArray; 
		//				if it is a player, just remove it from accessibleArray.
		//				add them into inaccessibleArray with "skip" reason.
		// 		4.5 If user choose cancel, remove the groupArray, accessArray and inaccessibleArray from session.
		//		4.6 After copy player, remove the source player.
		//		4.7 After all finished even have some failed items, remove the group which is empty, also remove its schedules and channels.
		//The move operation needs to copy:
		//		a. player or group db record.
		//		b. group's schedule
		//		c. group's channels
		//		d. the settings in privilege table.
		function _pushFailedObjToFailArray(obj, failReason) {
			delete obj.objid;
			delete obj.rootobj;
			delete obj.valid;
			delete obj.lmt;
			obj.reason = failReason;
			
			inaccessibleArray.push(obj);
			
			return;
		}
		
		function _copyPlayerGroup(srcPath, targetPath, playerType) {
			player.checkAndCopy(srcPath, 2, targetPath, 2, accountObj.name, playerType, function(err, resultString) {
				req.emit('FinishedOnePlayer', err, resultString);
				return;
			});
		}

		req.on('FinishedOnePlayer', function(err, resultString){
			var i 		= 0;
			var tempObj	= {};
			
			if(err) {
				if(playerObj) { 
					inaccessibleArray.push(playerObj); 
				}
				retVal.id 		= err;
				retVal.msg 		= helper.retval[err];
				retVal.fails 	= inaccessibleArray;
				
				logger.error('error occurs in FinishedOnePlayer event. ' + err);
				return res.send(retVal);
			}
			else {
				if(resultString) {
					if((resultString === 'unwritable target') || (resultString === 'unreadable source') || (resultString === 'unwritable source')) {
						_pushFailedObjToFailArray(playerObj, resultString);
						playerObj = null;
					}
					else {
						srcObj.path 		= playerObj.path;
						srcObj.type 		= playerObj.type;
						confirmObj.src 		= srcObj;
						confirmObj.targetPath= playerObj.targetPath;
						 
						if(resultString === 'confirm overwrite'){ confirmObj.options = 1; }
						else if(resultString === 'confirm overwrite/rename'){ confirmObj.options = 2; }
						else if(resultString === 'confirm rename'){ confirmObj.options = 0; }
						
						retVal.status 	= false;
						retVal.id 		= 431;
						retVal.msg 		= helper.retval[431];
						retVal.confirm 	= confirmObj;
						
						if(inaccessibleArray.length > 0) {
							retVal.fails	= inaccessibleArray;
						}
						
						req.session.movePlayerAccessible 	= accessibleArray;
						req.session.movePlayerInaccessible 	= inaccessibleArray;
						logger.debug('return from player/move.js.');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
				}

				playerObj = accessibleArray.pop();
				if(!playerObj) {
					if(inaccessibleArray.length > 0) {
						retVal.status 	= false;
						retVal.id 		= 432;
						retVal.fails	= inaccessibleArray;
					}
					else {
						retVal.status 	= true;
						retVal.id 		= 433;
					}
					
					retVal.msg 		= helper.retval[retVal.id];
					logger.debug('return from player/move.js.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal);
				}
				else {
					_copyPlayerGroup(playerObj.path, playerObj.targetPath, playerObj.type);
				}
			}
		});
		
		
		
		
		//remove the garbage data in session for move
		if(req.session.movePlayerAccessible) delete req.session.movePlayerAccessible;
		if(req.session.movePlayerInaccessible) delete req.session.movePlayerInaccessible;
		
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

				accountObj = accountInfo;
				
				//get parameter
				/*
				var moveObj = {//test case of all sucess
					src:[{path: '/player/group1', type: 'group'}],
					targetpath: '/player/group2'		
				}
				var moveObj = {//test case of all sucess
					src:[{path: '/player/group1', type: 'group'}],
					targetpath: '/player/group2'		
				}
				*/
				
				moveObj = req.body;
console.log(moveObj);
								
console.log(moveObj.targetpath);
								
				//check the parameters validation
				if((!moveObj) || (!moveObj.src) || (moveObj.src.length === 0) || (!moveObj.targetpath)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					return res.send(retVal);
				}	
		
				//Get all available player/group and unavailable player/group in two arrays without privilege checking(it will be checked when copy), 
				//then prepare to deal with every one.
				player = new Player(siteObj);
				player.getPlayerListByPrivilege(moveObj.src, accountInfo.name, 0, function(err, accessArray, inaccessArray) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						return res.send(retVal);
					}
					else {
						accessibleArray = accessArray;
						inaccessibleArray = inaccessArray;
						
						accessibleArray.sort(function(a, b) {//sort Array, let shorter path be in the end of array, that means deal with group first because teh confirmation of group will affect its player or sub group.
							return b.path.length - a.path.length;	
						});
						
						//calculate the target path for each item, otherwise confirm.js does not know where the item will be copied to if its parent group is confirmed to rename.				
						for(i = 0; i < accessibleArray.length; i++) {
							targetPath = '';
							targetPath = fileUtils.getTargetPath(accessibleArray[i].path, moveObj.targetpath, accessibleArray[i].rootobj.path);
							accessibleArray[i].targetPath = targetPath;
						}				
		
						req.emit('FinishedOnePlayer', 0, ''); //after got the available media array, start to deal the move operation
					}
				});
			});
		});
	}
};

module.exports = Move;

