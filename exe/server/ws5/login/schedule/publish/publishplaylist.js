var path		= require('path');
var Helper 		= require('../../../../utils/helper');
var Player		= require('../../../../models/player');
var Privilege 	= require('../../../../models/privilege');
var Schedule 	= require('../../../../models/schedule');
var Publish 	= require('../../../../models/publish');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var PublishPlaylist = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= null;
		var recurrenceObj = null;
		var player	= null;
		var schedule	= null;
		var publish	= null;
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
		var groupIndex	= 0;
		var startDate	= '';
		var endDate 	= '';

		
/*
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
data={
	path: ‘/media/xxx/yy.jpg’,
	type: ‘playlist’,
	groups: ['/player/path...', ...],
	start:, //yyyy:mm:dd:hh:mm:ss
	end:, // year 9999 as open ending
	recurrence: //true|false.
	recurrencesetting: {
		recurrencetype: ,// weekly or daily
		weekly: [1,0,1,0,1,0,1] // each number for one day, from sun to sat.
		startdate:, //yyyy:mm:dd:hh:mm:ss
		enddate: //yyyy:mm:dd:hh:mm:ss
	}
}
*/


		logger.debug('enter schedule/publish/publishplaylist.js');
		//get parameter from request
		dataObj = req.body;
//dataObj.end = '2013:06:14:24:00:00.000';
//dataObj.id='51bb0e63ebea554004000002';
//dataObj.recurrencesetting.enddate = '2099:12:31';

console.log('dataObj=');
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

				player	 	= new Player(siteObj);
				schedule	= new Schedule(siteObj);
				publish		= new Publish(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!dataObj.recurrence) && (dataObj.recurrence === 'false')) {
					dataObj.recurrence = false;
				}
				else {
					dataObj.recurrence = true;
				}
				
				if(dataObj.headertail) {
					dataObj.headertail = parseInt(dataObj.headertail, 10);
				}
				else {
					dataObj.headertail = 3;
				}
				
				if((!dataObj) || (!dataObj.path) || (!dataObj.type) || (!dataObj.groups) || (!dataObj.start) || (!dataObj.end)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}

				if((dataObj.recurrence) && (!dataObj.recurrencesetting)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}

				var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{2,3}$/;
				var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
				if((regTimeFormat.test(dataObj.start) === false) || (regTimeFormat.test(dataObj.end) === false)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
				
				if(dataObj.recurrencesetting) {
					if((regDateFormat.test(dataObj.recurrencesetting.startdate) === false) || (regDateFormat.test(dataObj.recurrencesetting.startdate) === false)) {
						retVal.id = 4;
						retVal.msg = helper.retval[4];
						logger.error('the parameter from request is not correct. ');
						logger.error(dataObj);
						return res.send(retVal);
					}
				}
				
				if(dataObj.recurrencesetting && dataObj.recurrencesetting.hourly && (regTimeFormat2.test(dataObj.recurrencesetting.endtime) === false)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}



				req.on('PublishPlaylist', function(first, err) {
					var playlistObj 	= {};
					
					if(err) {
						retVal.status = false;
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occurs in PublishPlaylist Event.' + err);
						return res.send(retVal);
					}
					else {
						if(!first) { groupIndex ++; }
						
						retVal.conflict 	= '';
						retVal.errorgroup 	= '';
							
						if(groupIndex >= dataObj.groups.length) {
							retVal.status = true;
							retVal.id = 0;
							retVal.msg = helper.retval[0];
							logger.debug('return from schedule/publish/publishplaylist.js');
							logger.debug(JSON.stringify(retVal, '', 4));
							return res.send(retVal);
						}
						else {
							//check privilege, must have write privilege on parent node.
							groupPath = dataObj.groups[groupIndex].path;
							
							privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 4, function(err, have) {
								if(err) {
									logger.error('error occur when get privilege data from database or has not enough privilege to publish playlist under current group.');
									logger.error(dataObj);
									
									req.emitter('PublishPlaylist', false, err);
									return;
								}
								else {
									if(have) {
										if(dataObj.recurrence) {
											startDate = dataObj.recurrencesetting.startdate;
											endDate = dataObj.recurrencesetting.enddate;
										}
										else {
											startDate = dataObj.start.slice(0, 10);
											endDate = dataObj.end.slice(0, 10);
										}
										
										//reject the schedule in the date range first.
										publish.reject(dataObj.groups[groupIndex].id, 'schedule', 'playlist', startDate, endDate, '', accountInfo, function(err) {
//console.log('reject old schedule ' + startDate + ' to ' + endDate);
//console.log('returns ' + err);
											if(err) {
												logger.error('Error occur when try to reject schedule on group (%s).', groupPath);
												req.emit('PublishPlaylist', false, err);
												return;
											}
											
											//delete all playlist in the date range
											schedule.deletePlaylistByDateRange(groupPath, 'schedule', 'playlist', startDate, endDate, function(err) {
//console.log('delete old old playlist ' + startDate + ' to ' + endDate);
//console.log('returns ' + err);
												if(err) {
													logger.error('Error occur when try to delete playlist on group (%s).', groupPath);
													req.emit('PublishPlaylist', false, err);
													return;
												}
											
												//construct playlist object to create it on group's schedule.
												playlistObj	= {};
												playlistObj.playlistpath 	= dataObj.path;
												playlistObj.listtype 		= dataObj.type;
												playlistObj.scheduletype	= 'schedule';
												playlistObj.id				= dataObj.id; 
												playlistObj.schedulepath	= dataObj.groups[groupIndex].path;
												playlistObj.start	 		= dataObj.start;
												playlistObj.end		 		= dataObj.end;
												playlistObj.recurrence		= dataObj.recurrence;
												playlistObj.recurrencesetting	= dataObj.recurrencesetting;
												
//console.log(playlistObj);
		
												//create record in DB, create folder
												schedule.insertPlaylist(playlistObj, function(err, conflictArray) {
													if(conflictArray && conflictArray.length > 0) {
														retVal.conflict = conflictArray;
													}
													
//console.log('insert new playlist returns ' + err);
													if(err) {
														logger.error('error occur when insert playlist into group schedule, will stop the work and return. ' + err);
														
														retVal.errorgroup = dataObj.groups[groupIndex].path;
														
														req.emit('PublishPlaylist', false, err);
														return;
													}
													else {
														//publish the schedule
														publish.publish(dataObj.groups[groupIndex].id, 'schedule', dataObj.groups[groupIndex].path, dataObj.type, 
																		startDate, endDate, dataObj.headertail, '', accountInfo, function(err) {
//console.log('publish new schedule ' + startDate + ' to ' + endDate);
//console.log('returns ' + err);
															if(err) {
																logger.error('Error occur when try to publish schedule/channel on group (%s).', dataObj.groups[groupIndex].path);
																logger.error(dataObj);
																
																req.emit('PublishPlaylist', false, err);
																return;
															}
															else {
																req.emit('PublishPlaylist', false, 0);
																return;
															}
														});
													}
												});
											});
										});
									}
									else {
										logger.error('you have not enough privilege to create playlist under specified group (%s).', dataObj.schedulepath);
										
										req.emit('PublishPlaylist', false, 201);
										return;
									}
								}
							});
						}
					}
				});
				
				//------------- start from here ---------------------
				req.emit('PublishPlaylist', true, 0);
			});
		});
	}
};

module.exports = PublishPlaylist;

