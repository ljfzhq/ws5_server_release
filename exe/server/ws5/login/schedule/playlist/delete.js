var path		= require('path');
var util		= require('util');
var Helper 		= require('../../../../utils/helper');
var Schedule	= require('../../../../models/schedule');
var Privilege 	= require('../../../../models/privilege');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var DeleteScheduleItems = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var schedule	= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var groupPath	= '';

		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var	dataObj		= {};
		var dataArray	= [];
		
		
		logger.debug('enter schedule/playlist/delete.js');
		//get parameter from request
/*
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:00:40.000';
		dataObj.rootobjid	 = '50ee2e676158c17016000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:05:01:00:40.000';
		dataObj.rootobjid	 = '50ee2e676158c17016000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:06:01:00:40.000';
		dataObj.rootobjid	 = '50ee2e676158c17016000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:08:01:00:40.000';
		dataObj.rootobjid	 = '50ee2e676158c17016000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:18:01:00:40.000';
		dataObj.rootobjid	 = '50ee2e676158c17016000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:05:29:01:00:00.000';
		dataObj.rootobjid	 = '50ee2e8e45e8437003000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:16:01:00:20.000';
		dataObj.rootobjid	 = '50ee2e7a7d5ac3b010000001';
		dataObj.applytoall	 = true;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:00:00.000';
		dataObj.rootobjid	 = '50ee276ec55e788809000001';
		dataObj.applytoall	 = true;
		dataArray.push(dataObj);
*/
/*
//hourly case1
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case2
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:03:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case3
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:09:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case4
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:09:06:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case5
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case6
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:02:01:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case7
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:06:03:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case8
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case9
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:06:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case10
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:04:03:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:04:03:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case11
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:02:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
	
//hourly case12
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:05:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case13
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:04:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:05:01:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case14
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:09:05:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:09:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case15
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:09:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case16
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:03:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

//hourly case17
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:01:01:01:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:05:03:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:01:09:06:31:20.000';
		dataObj.rootobjid	 = '50ee2e4e06733f3c0a000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
	
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:03:03:23:55:00.000';
		dataObj.rootobjid	 = '50f7732e8a31d8d812000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:03:05:21:55:00.000';
		dataObj.rootobjid	 = '50f7732e8a31d8d812000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);

		dataObj = {};
		dataObj.schedulepath = '/player/group1';
		dataObj.scheduletype = 'schedule';
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
		dataObj.listtype	 = 'playlist';
		dataObj.start		 = '2013:03:09:23:55:00.000';
		dataObj.rootobjid	 = '50f7732e8a31d8d812000001';
		dataObj.applytoall	 = false;
		dataArray.push(dataObj);
*/	



		dataArray = req.body.data;
//console.log('dataArray=');
//console.log(dataArray);

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
				if((!util.isArray(dataArray)) || (!dataArray.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. 111');
					return res.send(retVal);
				}
		
				var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
				for(var x = 0 ; x < dataArray.length; x++) {
					if(dataArray[x].applytoall === 'false') { dataArray[x].applytoall = false; }
					if(dataArray[x].applytoall === 'true') { dataArray[x].applytoall = true; }
					
					if(!dataArray[x].schedulepath || !dataArray[x].scheduletype || !dataArray[x].playlistpath || !dataArray[x].listtype || !dataArray[x].start || !dataArray[x].rootobjid) {
						retVal.id = 4;
						retVal.msg = helper.retval[4];
						logger.error('the parameter from request is not correct. 222');
						return res.send(retVal);
					} 
					
	 				if(!regTimeFormat.test(dataArray[x].start)) {
						retVal.id = 4;
						retVal.msg = helper.retval[4];
						logger.error('the parameter from request is not correct. ');
						return res.send(retVal);
	 				}
				}

				if(dataArray[0].scheduletype === 'schedule') { groupPath = dataArray[0].schedulepath; }
				else { groupPath = path.dirname(dataArray[0].schedulepath); }  //channel
				
				//check privilege, must have write privilege on specified group.
				privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to delete schedule/channel item on group: ' + groupPath);
						return res.send(retVal);
					}
					else {
						if(have) {
							schedule.deletePlaylistArray(dataArray, function(err) {
								retVal.id 		= err;
								retVal.msg 		= helper.retval[err];
								retVal.status 	= err ? false: true;
								logger.debug('return from schedule/playlist/delete.js');
								logger.debug(JSON.stringify(retVal, '', 4));
								return res.send(retVal);
							});
						}
						else {
							retVal.id = 201;
							retVal.msg = helper.retval[retVal.id];
							logger.error('You have not enough privilege to delete/edit schedule/channel item on current group (%s).', groupPath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = DeleteScheduleItems;

