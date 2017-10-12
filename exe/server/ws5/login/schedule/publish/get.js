var path		= require('path');
var Helper 		= require('../../../../utils/helper');
var Publish		= require('../../../../models/publish');
var Privilege 	= require('../../../../models/privilege');
var Player	 	= require('../../../../models/player');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var GetScheduleItems = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var publish		= null;
		var privilege 	= null;
		var player 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};

		var groupPath	= '';
		var scheduleType 	= '';
		var	startDate		= '';
		var	endDate			= '';
		var listType		= '';
		var multiLevel		= false;
		var publishItemArray= [];
		var groupScheduleArray = [];
		var groupScheduleObj= {};


		
		logger.debug('enter schedule/publish/get.js');
		//get parameter from request
		groupPath 	 = req.body.grouppath;
		startDate	 = req.body.startdate;
		endDate		 = req.body.enddate;
		listType	 = req.body.listtype;
		multiLevel	 = ((req.body.multi === 'true') || (req.body.multi === true)) ? true : false;
		scheduleType = req.body.scheduletype;
		
		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id 	= err;
				retVal.msg 	= helper.retval[err];
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
					retVal.id 	= err;
					retVal.msg 	= helper.retval[err];
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(retVal);
				}

				publish		= new Publish(siteObj);
				privilege 	= new Privilege(siteObj);
				player	 	= new Player(siteObj);
				
				//check the parameters validation
				if((!groupPath) || (!scheduleType) || (!listType)) {
					retVal.id 	= 4;
					retVal.msg 	= helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
				if((regDateFormat.test(startDate) === false) || (regDateFormat.test(endDate) === false)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				var getPublishedScheduleByGroup = function(schedule_groupPath, schedule_scheduleType, schedule_listType, schedule_startDate, schedule_endDate, schedule_accountInfo, callback) {

					//check privilege, must have write privilege on specified group.
					privilege.checkPrivilege('player', schedule_groupPath, 'account', schedule_accountInfo.name, 1, function(err, have) {
						if(err) {
							logger.error('error occur when get privilege data from database or has not enough privilege to get publish information on group ' + schedule_groupPath);
							return callback(err, null);
						}
						else {
							if(have) {
								//get group id
								player.get(schedule_groupPath, function(err, groupInfo) {
									if(err) {
										logger.error('error occurs when get group id for ' + schedule_groupPath);
										return callback(err, null);
									}
									
									//get publish items
									var groupid = groupInfo._id.toString();
									publish.getPublishedItems(groupid, schedule_scheduleType, schedule_listType, schedule_startDate, schedule_endDate, function(err, itemArray) {
										return callback(err, itemArray);
									});
								});
							}
							else {
								logger.error('you have not enough privilege to get schedule/channel information in current group (%s).', schedule_groupPath);
								return callback(481, null);
							}
						}
					});
				}

				req.on('GetScheduleByGroup', function(firstTime) {
					if(!firstTime) { groupPath = path.dirname(groupPath); }
					
					if((!groupPath) || (groupPath === '/') || (!multiLevel && !firstTime)) {
						retVal.status 	= true;
						retVal.id 		= 0;
						retVal.msg 		= helper.retval[0];
						retVal.publisheditems = groupScheduleArray;
						
						logger.debug('return from schedule/publish/get.js');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
					
					groupScheduleObj = {};
					groupScheduleObj.grouppath 		= groupPath;
					groupScheduleObj.scheduletype 	= scheduleType;
					groupScheduleObj.listtype 		= listType;
					groupScheduleObj.startdate 		= startDate;
					groupScheduleObj.enddate 		= endDate;
					

					getPublishedScheduleByGroup(groupPath, scheduleType, listType, startDate, endDate, accountInfo, function(err, itemArray) {
						if(err) {
							groupScheduleObj.scheduleitems 	= [];
							groupScheduleObj.errorid 		= err;
						}
						else {
							groupScheduleObj.scheduleitems 	= itemArray;
							groupScheduleObj.errorid 		= 0;
						}
						
						groupScheduleArray.push(groupScheduleObj);
						
						req.emit('GetScheduleByGroup', false);
					});				
				});
				
				req.emit('GetScheduleByGroup', true);				
			});
		});
	}
};

module.exports = GetScheduleItems;

