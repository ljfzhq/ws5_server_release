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

var ConfirmMove = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal = {
			status	: false,
			id		: 4,
			msg		: helper.retval[4]
		};
		var accessibleArray 	= [];
		var inaccessibleArray 	= [];
		var userid				= '';
		var i					= 0;
		var tempAccessArray		= [];
		var playerObj			= {}; 
		var confirmObj			= {};
		var srcObj				= {};
		var tempObj				= {};
		var siteid				= '';
		var siteObj				= {};
		var accountObj			= {};
		
		logger.debug('enter player/moveconfirm.js');
		
		//1 If user choose overwrite, overwrite the player/group db record. Remove all schedule and channel belongs to old group, copy schedule/channel from new group
		//2 if user choose rename, rename the player or group with "name (N)". N is 1, 2, ,3, .... until no duplicated name.
		//		If it is group, after created renamed group and copy its attribues, change its sub groups and players's target path in accessibleArray. 
		//			Copy its schedule and channel to new path.
		//3 If user choose skip, 
		//		if it is a group, remove itself, its sub groups and players from accessibleArray; 
		//		if it is a player, just remove it from accessibleArray.
		//			add them into inaccessibleArray with "skip" reason.
		//4 If user choose cancel, remove the groupArray, accessArray and inaccessibleArray from session.
		//5 After copy player, remove the source player.
		//6 After all finished even have some failed items, remove the group which is empty, also remove its schedules and channels.
		function _pushFailedObjToFailArray(obj, failReason) {
			delete obj.rootobj;
			delete obj.objid;
			delete obj.valid;
			delete obj.lmt;
			obj.reason		= failReason;
			
			inaccessibleArray.push(obj);
			
			return;
		}
		
		function _copyPlayerGroup(srcPath, targetPath, playerType) {
			player.checkAndCopy(srcPath, 1, targetPath, 2, accountObj.name, playerType, function(err, resultString) {
				req.emit('MoveNextPlayer', err, resultString);
				return;
			});
		}
		
		function _processPlayerGroupByConfirm(srcPath, targetPath, playerType, option, callback) {
			if((option === 1) || (option === 'overwrite')) {
				player.copyGroupPlayer(srcPath, targetPath, playerType, function(err) {
					return callback(err); 
				});
			}
			else if((option === 0) || (option === 'rename')){//rename
				fileUtils.getAvailableName(siteObj, targetPath, function(err, newPathObj) {
					if(err || !newPathObj || !newPathObj.path || !newPathObj.name) { return callback(err); }
					else {
						player.copyGroupPlayer(srcPath, newPathObj.path, playerType, function(err) {
							if(err) { return callback(err); }
							else {
								return callback(0);
							}
						});
					}	
				});
			}
			else { return callback(4);}
		}

		//deal with the items in array
		req.on('MoveNextPlayer', function(err, resultString){
			if(err) {
				if(playerObj) { 
					_pushFailedObjToFailArray(playerObj, resultString); 
				}
				retVal.id 		= err;
				retVal.msg 		= helper.retval[err];
				retVal.fails 	= inaccessibleArray;
				logger.error('error occurs in MoveNextPlayer event. ' + err);
				return res.send(retVal);
			}
			else {
				if(resultString) {
					if((resultString === 'unwritable target') || (resultString === 'unreadable source')) {
						_pushFailedObjToFailArray(playerObj, resultString);
						playerObj = null;
					}
					else {
						if((confirmObj.options === 1) && (confirmObj.all === true) && ((resultString === 'confirm overwrite') || (resultString === 'confirm overwrite/rename'))) {
							_processPlayerGroupByConfirm(playerObj.path, playerObj.targetPath, playerObj.type, 'overwrite', function(err) {
								if(err) { logger.error('error occurs when call _processPlayerGroupByConfirm() for overwrite. ' + err); req.emit('MoveNextPlayer', err, 'Fail to overwrite'); }
								else {//delete player
									req.emit('MoveNextPlayer', 0, '');
								}
							});
							return;//leave event handler, wait for the result of _processPlayerGroupByConfirm()
						}
						else if((confirmObj.options === 0) && (confirmObj.all === true) && ((resultString === 'confirm rename') || (resultString === 'confirm overwrite/rename'))) {
							_processPlayerGroupByConfirm(playerObj.path, playerObj.targetPath, playerObj.type, 'rename', function(err) {
								if(err)  { logger.error('error occurs when call _processPlayerGroupByConfirm() for rename. ' + err); req.emit('MoveNextPlayer', err, 'Fail to rename'); }
								else {//delete player
									req.emit('MoveNextPlayer', 0, '');
								}
							});
							return;//leave event handler, wait for the result of _processPlayerGroupByConfirm()
						}
						else {
							srcObj.path 		= playerObj.path;
							srcObj.type 		= playerObj.type;
							confirmObj.src 		= srcObj;
							confirmObj.targetPath= playerObj.targetPath;
							delete confirmObj.all;
							 
							if(resultString === 'confirm overwrite'){ confirmObj.options = 0; }
							else if(resultString === 'confirm overwrite/rename'){ confirmObj.options = 2; }
							else if(resultString === 'confirm rename'){ confirmObj.options = 1; }
							
							retVal.status 	= false;
							retVal.id 		= 431;
							retVal.msg 		= helper.retval[431];
							retVal.confirm 	= confirmObj;
							
							if(inaccessibleArray.length > 0) {
								retVal.fails	= inaccessibleArray;
							}
							
							req.session.movePlayerAccessible 	= accessibleArray;
							req.session.movePlayerInaccessible 	= inaccessibleArray;
							logger.debug('return from player/moveconfirm.js.');
							logger.debug(JSON.stringify(retVal, '', 4));
							return res.send(retVal);
						}
					}
				}

				player.deleteSinglePlayer(playerObj, function(err) {
					if(err) {
						logger.error('error occurs when call player.deleteSinglePlayer(). ' + err);
						_pushFailedObjToFailArray(playerObj, 'fail to delete');
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
						logger.debug('return from player/moveconfirm.js.');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
					else {
						_copyPlayerGroup(playerObj.path, playerObj.targetPath, playerObj.type);
					}
				});
			}
		});
		


		//get data from session for paste
		if(req.session.movePlayerAccessible) { accessibleArray = req.session.movePlayerAccessible; }
		else { logger.error('bad parameter.'); return res.send(retVal); }

		if(req.session.movePlayerInaccessible) { inaccessibleArray = req.session.movePlayerInaccessible; }
		else { logger.error('bad parameter.'); return res.send(retVal); }

		delete req.session.movePlayerAccessible;
		delete req.session.movePlayerInaccessible;

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
				player = new Player(siteObj);
				
				//get parameter
				/*
				var confirmObj = {//test case of rename
					src:{path: '/player/group1', type: 'group'},
					targetPath: '/player/group2/group1',		
					options: 0,
					all: false
				}
				
				var confirmObj = {//test case of rename all
					src:{path: '/player/group1', type: 'group'},
					targetPath: '/player/group2/group1',		
					options: 0,
					all: true
				}
				
				var confirmObj = {//test case of overwrite
					src:{path: '/player/group1', type: 'group'},
					targetPath: '/player/group2/group1',		
					options: 1,
					all: false
				}
				
				var confirmObj = {//test case of overwrite all
					src:{path: '/player/group1', type: 'group'},
					targetPath: '/player/group2/group1',		
					options: 1,
					all: true
				}
				
				var confirmObj = {//test case of skip
					src:{path: '/player/group1', type: 'group'},
					targetPath: '/player/group2/group1',		
					options: 2,
					all: false
				}
				
				var confirmObj = {//test case of cancel
					src:{path: '/player/group1', type: 'group'},
					targetPath: '/player/group2/group1',		
					options: 3,
					all: false
				}

				var confirmObj = {//test case of overwrite all
					src:{path: '/player/group1', type: 'group'},
					targetPath: '/player/group2/group1',		
					options: 0,
					all: true
				}
		*/
				
				confirmObj = req.body;
console.log(confirmObj);
				
				//check the parameters validation
				if((!confirmObj) || (!confirmObj.src) || (!confirmObj.src.path) || (confirmObj.src.path.length === 0)  || 
						(!confirmObj.src.type) || (!confirmObj.targetPath) || (confirmObj.targetPath.length === 0)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('bad parameter.');
					return res.send(retVal);
				}	
		
				confirmObj.options = confirmObj.options || 0;
				confirmObj.all  = confirmObj.all || false;
				
				//process the current one
				tempObj 			= {};
				tempObj.objid 		= confirmObj.src.path;
				tempObj.path 		= confirmObj.src.path;
				tempObj.name		= path.basename(confirmObj.src.path);
				tempObj.type		= confirmObj.src.type;
				tempObj.targetPath 	= confirmObj.targetPath;
				if((confirmObj.options === 0) || (confirmObj.options === 1)) {//rename or overwrite
					_processPlayerGroupByConfirm(confirmObj.src.path, confirmObj.targetPath, confirmObj.src.type, confirmObj.options, function(err) {
						if(err) {
							_pushFailedObjToFailArray(tempObj, 'Fail to copy');
							retVal.id 		= err;
							retVal.msg 		= helper.retval[err];
							retVal.fails 	= inaccessibleArray;
							logger.error('error occurs when call _processPlayerGroupByConfirm(). ' + err);
							return res.send(retVal);
						}
						else {
							req.emit('MoveNextPlayer', 0, '');  //will continue for other player in accessibleArray in below.
							return;
						}				
					});
				}
				else if(confirmObj.options === 2) {//skip, if it is group, remove all of its subnode from accessibleArray
					_pushFailedObjToFailArray(tempObj, 'skipped by user');
					if(confirmObj.src.type === 'group') {
						for(i = 0; i < accessibleArray.length; i++) {
							if(accessibleArray[i].path.indexOf(confirmObj.src.path) !== 0) { tempAccessArray.push(accessibleArray[i]);}
							else { _pushFailedObjToFailArray(accessibleArray[i], 'skipped by user'); }
						}
						
						accessibleArray = [];
						accessibleArray = tempAccessArray;
					}
					req.emit('MoveNextPlayer', 0, ''); //will continue for other player in accessibleArray in below.
				}
				else if(confirmObj.options === 3) {//cancel
					retVal.id 	= 434;
					retVal.msg 	= helper.retval[434];
					return res.send(retVal);
				}
				else {//wrong parameter 
					return res.send(retVal); 
				} 
			});
		});
	}
}
		
module.exports = ConfirmMove;

