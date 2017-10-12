var path		= require('path');
var Helper 		= require('../../../../utils/helper');
var Schedule	= require('../../../../models/schedule');
var Privilege 	= require('../../../../models/privilege');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var GetScheduleItems = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var schedule			= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var groupPath	= '';

		var schedulePath		= '';
		var scheduleType 		= '';
		var	startDate			= null;
		var	endDate				= null;
		var listType			= '';
		var multiLevel			= false;
		var scheduleItemArray	= null;
		var groupScheduleArray 	= [];
		var groupScheduleObj	= {};


		logger.debug('enter schedule/playlist/get.js');
		//get parameter from request
		schedulePath = req.body.schedulepath;
		scheduleType = req.body.scheduletype;
		startDate	 = req.body.start;
		endDate		 = req.body.end;
		listType	 = req.body.listtype;
		multiLevel	 = ((req.body.multi === 'true') || (req.body.multi === true)) ? true : false;
console.log(req.body);
		
		if(scheduleType !== 'schedule') { multiLevel = false; }
		
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

				schedule	= new Schedule(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!schedulePath) || (!scheduleType) || (!startDate) || (!endDate) || (!listType)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
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

				if(scheduleType === 'schedule') { groupPath = schedulePath; }
				else { groupPath = path.dirname(schedulePath); }  //channel


				var getPlaylistSetByGroup = function(playlist_groupPath, playlist_schedulePath, playlist_scheduleType, playlist_listType, playlist_startDate, playlist_endDate, playlist_accountInfo, callback) {
					//check privilege, must have read privilege on specified group.
					privilege.checkPrivilege('player', playlist_groupPath, 'account', playlist_accountInfo.name, 1, function(err, have) {
						if(err) {
							logger.error('error occur when get privilege data from database or has not enough privilege to get schedule/channel information.' + playlist_groupPath);
							return callback(err, null);
						}
						else {
							if(have) {
								//get schedule/channel items
								schedule.getPlaylistSet(playlist_schedulePath, playlist_scheduleType, playlist_listType, playlist_startDate, playlist_endDate, function(err, itemArray) {
									return callback(err, itemArray);
								});
							}
							else {
								logger.error('you have not enough privilege to get schedule/channel information in current group (%s).', groupPath);
								return callback(200, null);
							}
						}
					});
				}

				req.on('GetPlaylistSetByGroup', function(firstTime) {
					if(!firstTime) { groupPath = path.dirname(groupPath); schedulePath = path.dirname(schedulePath); }
					
					if((!groupPath) || (groupPath === '/') || (!multiLevel && !firstTime)) {
						retVal.status 	= true;
						retVal.id 		= 0;
						retVal.msg 		= helper.retval[0];
						retVal.scheduleitems = groupScheduleArray;
						
						logger.debug('return from schedule/playlist/get.js');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
					
					groupScheduleObj = {};
					groupScheduleObj.grouppath 		= groupPath;
					groupScheduleObj.schedulepath 	= schedulePath;
					groupScheduleObj.scheduletype 	= scheduleType;
					groupScheduleObj.listtype 		= listType;
					groupScheduleObj.startdate 		= startDate;
					groupScheduleObj.enddate 		= endDate;
					

					getPlaylistSetByGroup(groupPath, schedulePath, scheduleType, listType, startDate, endDate, accountInfo, function(err, itemArray) {
						if(err) {
							groupScheduleObj.playlistitems 	= [];
							groupScheduleObj.errorid 		= err;
						}
						else {
							groupScheduleObj.playlistitems 	= itemArray;
							groupScheduleObj.errorid 		= 0;
						}
						
						groupScheduleArray.push(groupScheduleObj);
						
						req.emit('GetPlaylistSetByGroup', false);
					});				
				});
				
				req.emit('GetPlaylistSetByGroup', true);				
			});
		});
	}
};

module.exports = GetScheduleItems;

