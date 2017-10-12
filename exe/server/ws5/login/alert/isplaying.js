var fs 			= require('fs');
var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var Task		= require('../../../models/task');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var IsUCPlaying = function() {
	helper.config = helper.loadConfig();

	this.do = function(req, res) {
		var site 		= null;
		var accountrole	= null;
		var privilege 	= null;
		var task	 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		
		logger.debug('enter alert/isplaying.js');
		
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

				task	 	= new Task(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check privilege
				privilege.checkPrivilege('alert', '/alert', 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to query alert.');
						return res.send(retVal);
					}
					else {
						if(have) {
							//remove all uc task from db
							task.getUCTask(function(err, UCTaskArray) {
								if(err) {
									logger.error('error occurs when get all uc task. ' + err);
									retVal.id = err;
									retVal.msg = helper.retval[retVal.id];
									return res.send(retVal);
								}
//console.log(UCTaskArray);
								
								var taskNumber 	= 0;
								var taskIndex 	= 0;
								var taskObj 	= {};
								var taskStartTime = null;
								var taskDuration = 0;
								var now = new Date().getTime();
								var playing = false;
								
								taskNumber = UCTaskArray.length;
								for(taskIndex = 0 ; taskIndex < taskNumber; taskIndex++) {
									taskObj = UCTaskArray[taskIndex];
									
//console.log(taskObj.createtime);
									taskStartTime = taskObj.createtime.getTime();
									taskDuration = parseInt(taskObj.dur, 10);
									
//console.log('taskStartTime=' + taskStartTime);
//console.log('now=' + now);
//console.log('dur=' + taskDuration);
									if(now < (taskStartTime + taskDuration)) {
										playing = true;
										break;
									}
								}

								retVal.id = 0;
								retVal.msg = helper.retval[retVal.id];
								retVal.alertplaying = playing;
								
								logger.debug('return from alert/isplaying.js.');
								logger.debug(JSON.stringify(retVal, '', 4));
								return res.send(retVal);
							});
						}
						else {
							retVal.id = 590;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to query alert');
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = IsUCPlaying;

