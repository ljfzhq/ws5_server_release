var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var Task		= require('../../../models/task');
var Player		= require('../../../models/player');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var StopUC = function() {
	helper.config = helper.loadConfig();

	var deleteAlertFile = function(siteObj, callback) {
		var filePath = '';
		var fileLocalPath = '';
		
		filePath = '/publish/alert';
		fileLocalPath = fileUtils.getFileLocalPath(siteObj, filePath);
		
		hfs.del(fileLocalPath, function(err) {
			if(err) {
				logger.error('error occurs when delete alert folder.');
				logger.error(err);
			}
			
			return callback(err);
		});
	}	
	
	this.do = function(req, res) {
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
		
		logger.debug('enter alert/stop.js');
		
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
				privilege 	= new Privilege(siteObj);
				
				//check privilege
				privilege.checkPrivilege('alert', '/alert', 'account', accountInfo.name, 4, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to stop alert.');
						return res.send(retVal);
					}
					else {
						if(have) {
							//send task to all player
							player.get('/player', function(err, rootObj) {
								if(err) {
									logger.error('error occurs when get root group information. ' + err);
									retVal.id = err;
									retVal.msg = helper.retval[retVal.id];
									return res.send(retVal);
								}
								
								var groupid = rootObj._id.toString();
								
								//remove all uc task from db
								task.deleteUCTask(function(err) {
									if(err) {
										logger.error('error occurs when delete all uc task. ' + err);
										retVal.id = err;
										retVal.msg = helper.retval[retVal.id];
										return res.send(retVal);
									}
									
									//delete published alert data file in lib path
									deleteAlertFile(siteObj, function(err) {
										//not care the occurred error
										
										//insert stopuc task
										taskObj 				= {};
										taskObj.groupid 		= groupid;
										taskObj.tasktype 		= 'stopuc';  
										taskObj.taskobjectid 	= '';  
										taskObj.initialpath 	= '';  
										taskObj.accountid 		= accountInfo._id.toString();  
										
										task.insertStopUCTask(taskObj, function(err) {
											if(err) { 
												logger.error('error occurs when insert stop uc task.');
												retVal.id = err;
												retVal.msg = helper.retval[retVal.id];
												return res.send(retVal);
											}
											
	
											retVal.id = 0;
											retVal.msg = helper.retval[0];
											retVal.status = true;
											
											logger.debug('return from alert/stop.js.');
											logger.debug(JSON.stringify(retVal, '', 4));
											
											return res.send(retVal);
										});
									});
								});
							});
						}
						else {
							retVal.id = 590;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to stop alert');
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = StopUC;

