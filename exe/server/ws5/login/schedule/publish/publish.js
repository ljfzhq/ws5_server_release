var path 		= require('path');
var Helper 		= require('../../../../utils/helper');
var Publish		= require('../../../../models/publish');
var Player		= require('../../../../models/player');
var Privilege 	= require('../../../../models/privilege');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var player 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var PublishSchedule = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		req.on('PrivilegeChecking', function(first) {
			var groupPath = '';
			
			if(!first) { groupIndex ++; }
			
			if(groupIndex < groupNumber) {
				if(dataObj.groups[groupIndex].channelid) {
					groupPath = path.dirname(dataObj.groups[groupIndex].schedulepath);
				}
				else {
					groupPath = dataObj.groups[groupIndex].schedulepath;
				}
				
				//check privilege, must have full control privilege on the group.
				privilege.checkPrivilege('player', groupPath, 'account', accountObj.name, 4, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to publish schedule.');
						logger.error(dataObj.groups[groupIndex]);
						return res.send(retVal);
					}
					else {
						if(have) {
							req.emit('PrivilegeChecking', false);
						}
						else {
							retVal.id = 480; 
							retVal.msg = helper.retval[480];
							logger.error('you have not enough privilege to publish schedule in current path (%s).', groupPath);
							return res.send(retVal);
						}
					}
				});
			}
			else { //all are checked
				groupIndex = 0;
				req.emit('StartToPublish', true);
			}
		});
		
		
		req.on('StartToPublish', function(first) {
			if(!first) { groupIndex ++; }
			
			if(groupIndex < groupNumber) {
				groupDataObj = {};
				groupDataObj = dataObj.groups[groupIndex];
				player.get(groupDataObj.schedulepath, function(err, groupObj) {
					if(err) {
							retVal.id = err; 
							retVal.msg = helper.retval[err];
							logger.error('Error occur when try to get group information for group (%s).', groupDataObj.schedulepath);
							logger.error(groupDataObj);
							return res.send(retVal);
					}
					
					publish.publish(groupObj._id.toString(), groupDataObj.channelid ? 'channel' : 'schedule', groupDataObj.schedulepath, groupDataObj.listtype, 
									dataObj.start, dataObj.end, groupDataObj.headertail, groupDataObj.channelid, accountObj, function(err) {
						if(err) {
							retVal.id = err; 
							retVal.msg = helper.retval[err];
							logger.error('Error occur when try to publish schedule/channel on group (%s).', groupDataObj.schedulepath);
							logger.error(groupDataObj);
							return res.send(retVal);
						}
						
						req.emit('StartToPublish', false);				
					});
				});
			}
			else { //finished to publish
				retVal.status 	= true;; 
				retVal.id 		= 0; 
				retVal.msg 		= helper.retval[0];
				logger.debug('return from schedule/publish/publish.js');
				logger.debug(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
		});
		
		
		
		//------------- start from here --------------------
		var dataObj 	= {};
		var groupDataObj= {};
		var newDataObj	= {};
		var groupArray 	= [];
		var groupNumber	= 0;
		var groupIndex	= 0;
		var channel		= null;
		var publish		= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var accountObj	= {};
		
		logger.debug('enter schedule/publish/publish.js');
		//get parameter from request
		dataObj = req.body;
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
				
				accountObj  = accountInfo;
				publish	 	= new Publish(siteObj);
				player	 	= new Player(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!dataObj) || (!dataObj.start) || (!dataObj.end) || (dataObj.start > dataObj.end) || (!dataObj.groups) || (!dataObj.groups.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
				if((regDateFormat.test(dataObj.start) === false) || (regDateFormat.test(dataObj.end) === false)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
				
				//split the request to two when publish spotlist and playlist together.
				groupArray 	 = [];
				groupDataObj = {};
				groupDataObj = dataObj.groups.pop();
				while(groupDataObj) {
					if(groupDataObj.listtype === 'both') {
						newDataObj = {};
						for(var i in groupDataObj) {
							newDataObj[i] = groupDataObj[i];
						}
						
						groupDataObj.listtype = 'playlist';
						newDataObj.listtype = 'spotlist';
						
						groupArray.push(newDataObj);
					}
					
					groupArray.push(groupDataObj);
					
					groupDataObj = {};
					groupDataObj = dataObj.groups.pop();
				}
				
				dataObj.groups = groupArray;
				
				groupIndex  = 0;
				groupNumber = dataObj.groups.length;
				req.emit('PrivilegeChecking', true);
			});
		});
	}
};

module.exports = PublishSchedule;

