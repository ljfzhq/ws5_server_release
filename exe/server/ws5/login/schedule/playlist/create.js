var path		= require('path');
var Helper 		= require('../../../../utils/helper');
var Player		= require('../../../../models/player');
var Privilege 	= require('../../../../models/privilege');
var Schedule 	= require('../../../../models/schedule');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var CreatePlaylist = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= null;
		var recurrenceObj = null;
		var player	= null;
		var schedule	= null;
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
		var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{3}$/;
		var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
		var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
		
		logger.debug('enter schedule/playlist/create.js');
		//get parameter from request
/*
//across day case1
		recurrenceObj = {};
		recurrenceObj.startdate = '2013:03:01';
		recurrenceObj.enddate = '2013:03:10';
		recurrenceObj.recurrencetype = 'hourly';
		recurrenceObj.hourly = '300';
		recurrenceObj.endtime = '24:00:00.000';
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1';
       	dataObj.scheduletype = 'schedule';
       	dataObj.start = '2013:03:01:20:55:00.000';
       	dataObj.end = '2013:03:01:21:20:00.000'
       	dataObj.recurrence = true;
       	dataObj.recurrencesetting = recurrenceObj;

//across day case2
		recurrenceObj = {};
		recurrenceObj.startdate = '2013:03:11';
		recurrenceObj.enddate = '2013:03:20';
		recurrenceObj.recurrencetype = 'daily';
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1';
       	dataObj.scheduletype = 'schedule';
       	dataObj.start = '2013:03:11:23:50:00.000';
       	dataObj.end = '2013:03:12:00:30:00.000'
       	dataObj.recurrence = true;
       	dataObj.recurrencesetting = recurrenceObj;
*/

/*
		recurrenceObj = {};
		recurrenceObj.startdate = '2013:02:01';
		recurrenceObj.enddate = '2013:02:10';
		recurrenceObj.recurrencetype = 'hourly';
		recurrenceObj.hourly = '1800';
		recurrenceObj.endtime = '07:00:00.000';
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1';
       	dataObj.scheduletype = 'schedule';
       	dataObj.start = '2013:02:01:01:01:20.000';
       	dataObj.end = '2013:02:01:01:01:40.000'
       	dataObj.recurrence = true;
       	dataObj.recurrencesetting = recurrenceObj;
*/

/*
		recurrenceObj = {};
		recurrenceObj.startdate = '2013:02:01';
		recurrenceObj.enddate = '2013:03:20';
		recurrenceObj.recurrencetype = 'daily';
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1';
       	dataObj.scheduletype = 'schedule';
       	dataObj.start = '2013:02:01:01:00:40.000';
       	dataObj.end = '2013:02:01:01:01:20.000'
       	dataObj.recurrence = true;
       	dataObj.recurrencesetting = recurrenceObj;
		
		recurrenceObj = {};
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:03:10';
		recurrenceObj.recurrencetype = 'weekly';
		recurrenceObj.weekly = '0,0,1,1,1,0,1';
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1';
       	dataObj.scheduletype = 'schedule';
       	dataObj.start = '2013:01:01:01:00:20.000';
       	dataObj.end = '2013:01:01:01:00:40.000'
       	dataObj.recurrence = true;
       	dataObj.recurrencesetting = recurrenceObj;
		
		recurrenceObj = {};
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:10:10';
		recurrenceObj.recurrencetype = 'monthly';
		recurrenceObj.monthly = '29';
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1';
       	dataObj.scheduletype = 'schedule';
       	dataObj.start = '2013:01:29:01:00:00.000';
       	dataObj.end = '2013:01:29:01:00:20.000'
       	dataObj.recurrence = true;
       	dataObj.recurrencesetting = recurrenceObj;
		
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1';
       	dataObj.scheduletype = 'schedule';
       	dataObj.start = '2013:01:01:01:00:00.000';
       	dataObj.end = '2013:01:01:01:00:20.000'
       	dataObj.recurrence = false;
		
		recurrenceObj = {};
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:01:31';
		recurrenceObj.recurrencetype = 'daily';
		dataObj = {};
		dataObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
       	dataObj.listtype = 'playlist';
       	dataObj.schedulepath = '/player/group1/channel2.chnl';
       	dataObj.scheduletype = 'channel';
       	dataObj.start = '2013:01:01:01:10:00.000';
       	dataObj.end = '2013:01:01:01:15:00.000'
       	dataObj.recurrence = true;
       	dataObj.recurrencesetting = recurrenceObj;
*/
		dataObj = req.body;
console.log(req.body);		

		if(!dataObj.recurrence || (dataObj.recurrence === 'false')) {
			dataObj.recurrence = false;	
		}
		else {
			dataObj.recurrence = true;	
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

				player	 	= new Player(siteObj);
				schedule	= new Schedule(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!dataObj) || (!dataObj.playlistpath) || (!dataObj.listtype) || (!dataObj.schedulepath) || (!dataObj.scheduletype) || (!dataObj.start) || (!dataObj.end)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
 				if(!regTimeFormat.test(dataObj.start) || !regTimeFormat.test(dataObj.end)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
 				}
 				
				if(dataObj.recurrence && dataObj.recurrencesetting && 
					((regDateFormat.test(dataObj.recurrencesetting.startdate) === false) || (regDateFormat.test(dataObj.recurrencesetting.enddate) === false))) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if(dataObj.recurrence && dataObj.recurrencesetting && dataObj.recurrencesetting.hourly && (regTimeFormat2.test(dataObj.recurrencesetting.endtime) === false)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				//check privilege, must have write privilege on parent node.
				if(dataObj.scheduletype === 'schedule') { groupPath = dataObj.schedulepath; }
				else { groupPath = path.dirname(dataObj.schedulepath); }  //channel
				
				privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to create playlist under current group.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					else {
						if(have) {
							//create record in DB, create folder
							schedule.insertPlaylist(dataObj, function(err, conflictArray) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									if(conflictArray && conflictArray.length > 0) {
										retVal.conflict = conflictArray;
									}
									
									logger.error('error occurs when call insertPlaylist(). ' + err)
									return res.send(retVal);
								}
								
								schedule.getPlaylist(dataObj.schedulepath, dataObj.scheduletype, dataObj.listtype, dataObj.playlistpath, dataObj.start, function(err, obj) {
									if(err) {
										retVal.id = err;
										retVal.msg = helper.retval[err];
										if(conflictArray && conflictArray.length > 0) {
											retVal.conflict = conflictArray;
										}
									}
									
										
									retVal.id = 0;
									retVal.msg = helper.retval[0];
									retVal.status = true;
									retVal.playlist = obj;

									logger.debug('return from schedule/playlist/create.js');
									logger.debug(JSON.stringify(retVal, '', 4));
									return res.send(retVal);
								});
							});
						}
						else {
							retVal.id = 201;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to create playlist under specified group (%s).', dataObj.schedulepath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = CreatePlaylist;

