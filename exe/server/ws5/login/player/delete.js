var path 	= require('path');
var util 	= require('util');
var Helper 	= require('../../../utils/helper');
var Player 	= require('../../../models/player');
var Site 	= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var FileUtils 	= require('../../../utils/fileutils');

var helper 		= new Helper();
var logger 		= helper.logger;
var player 		= null;
var site 		= null;
var accountrole	= null;
var fileUtils 	= new FileUtils();

var Delete = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal = {
			status: false,
			id: 100,
			msg: helper.retval[100],
		};
		var accessibleArray 	= [];
		var inaccessibleArray 	= [];
		var groupArray 			= [];
		var playerObj 			= {};
		var groupObj 			= {};
		var i 					= 0;
		var userid				= '';
		var siteid				= '';
		var siteObj				= {};
		
		//when got event, check the returned value, if it is critical issues return directly, otherwise move the item to inaccessibleArray and continue.
		//loop to delete player first, and pick the group object to another array during this loop.
		//after all player are deleted, sort the group array with path length, delete the group which path is longer.
		//(I think longer path is deeper in path, so it has more possibility be empty, if it is not empty, it means it really can not be removed.)
		function deleteOnePlayer(eventString, deleteObj) {
			player.deletePlayerGroup(deleteObj, function(err) {
				if(err) { req.emit(eventString, 'fail in db', err); return; }
				else { req.emit(eventString, '', 0); return; }
			});
		}

		req.on('FinishedOnePlayer', function(err, errNo) {
			if(err) {
				logger.error('internal error occurs when delete player in deleteOnePlayer(), maybe no effect---' + err);
				if((errNo !== 0) && (errNo !== 5)) {
					retVal.id = errNo;
					retVal.msg = helper.retval[errNo];
					logger.error('db error(%d) occurs when delete player in deleteOnePlayer().', errNo);
					res.send(retVal);
					return;
				}
				else { 
					playerObj.reason = err;
					inaccessibleArray.push(playerObj); 
				}
			}

			playerObj = accessibleArray.pop();
			if(!playerObj) { //no more items in the array, need to deal with group.
				groupArray.sort(function(a, b) { //sort the array, longer path obj will be put in the end of the array, so it will be process first.
					return a.path.length - b.path.length;
				});
				req.emit('FinishedOneGroup', '', 0);
				return;
			}
			else {
				if(playerObj.type === 'group') { 
					groupArray.push(playerObj);
					req.emit('FinishedOnePlayer', '', 0);
					return;
				}
				else { deleteOnePlayer('FinishedOnePlayer', playerObj); }
			}
		});
		
		req.on('FinishedOneGroup', function(err, errNo) {
			if(err) {
				if((errNo !== 0) && (errNo !== 5)) {
					retVal.id = errNo;
					retVal.msg = helper.retval[errNo];
					logger.error('db error(%d) occurs when delete group in deleteOnePlayer().', errNo);
					res.send(retVal);
					return;
				}
				else { 
					groupObj.reason = err;
					inaccessibleArray.push(groupObj); 
				}
			}

			groupObj = groupArray.pop();
			if(!groupObj) { //no more items in the array, finished all.
				retVal.status = true;
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				for(i = 0; i < inaccessibleArray.length; i++) {
					delete inaccessibleArray[i].rootobj;
					delete inaccessibleArray[i].objid;
					delete inaccessibleArray[i]._id;
					delete inaccessibleArray[i].valid;
				}
				retVal.failed = inaccessibleArray;
				logger.debug('return from player/delete.js.');
				logger.debug(JSON.stringify(retVal, '', 4));
				res.send(retVal);
			}
			else {
				//if the folder has elements in inaccessibleArray, that means the folder is not empty, so can not remove it.
				for(i = 0 ; i < inaccessibleArray.length; i++) {
					if(inaccessibleArray[i].path.indexOf(groupObj.path) === 0) {break;}//find child
				}

				if(i >= inaccessibleArray.length) { deleteOnePlayer('FinishedOneGroup', groupObj); }
				else { //has undeleted child
					groupObj.reason = 'not empty';
					inaccessibleArray.push(groupObj);
					req.emit('FinishedOneGroup', '', 0);
					return;
				}
			}
		});
		
		
		//get parameter
/*
		var playerGroupArray = [
			{path: '/player/group1/group11/player2', type: 'player'},
			{path: '/player/group2', type: 'group'}			
		];
		var playerGroupArray = [
			{path: '/player/group1', type: 'group'}		
		];
*/
		logger.debug('enter player/delete.js');
		
		playerGroupArray = req.body.data;
//console.log(playerGroupArray);			

		//check the parameters validation
		if((!util.isArray(playerGroupArray)) || (!playerGroupArray) || (playerGroupArray.length <= 0)) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('bad parameter.');
			return res.send(retVal);
		}	

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

				//Get all available player/group and unavailable player/group in two arrays, then prepare to deal with every one.
				player = new Player(siteObj);
				player.getPlayerListByPrivilege(playerGroupArray, accountInfo.name, 2, function(err, accessArray, inaccessArray) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occurs when call player.getPlayerListByPrivilege(). ' + err);
						return res.send(retVal);
					}
					else {
						accessibleArray = accessArray;
						inaccessibleArray = inaccessArray;
		//				console.log(accessibleArray);
		//				res.send(inaccessibleArray);
						req.emit('FinishedOnePlayer', '', 0); //after got the available player/group array, start to deal the delete operation
					}
				});
			});
		});
	}
};

module.exports = Delete;

