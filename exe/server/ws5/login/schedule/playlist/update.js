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

var UpdateScheduleItems = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var schedule 	= null;
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
		var newPlaytlist= {};
		var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{3}$/;
		var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
		var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
	
		var _compareRecurrencePlaylist = function(playlistA, playlistB) {
			if(!playlistA || !playlistB) return false;

			if((playlistA.start === playlistB.start) && (playlistA.end === playlistB.end) && (playlistA.recurrence) && (playlistB.recurrence) && 			
				(playlistA.recurrencesetting.startdate === playlistB.recurrencesetting.startdate) && (playlistA.recurrencesetting.enddate === playlistB.recurrencesetting.enddate) && 
				(playlistA.recurrencesetting.recurrencetype === playlistB.recurrencesetting.recurrencetype) &&
				((playlistA.recurrencesetting.recurrencetype === 'daily') ||
				((playlistA.recurrencesetting.recurrencetype === 'monthly') && (playlistA.recurrencesetting.monthly === playlistB.recurrencesetting.monthly)) ||
				((playlistA.recurrencesetting.recurrencetype === 'weekly') && (playlistA.recurrencesetting.weekly === playlistB.recurrencesetting.weekly)) ||
				((playlistA.recurrencesetting.recurrencetype === 'hourly') && (playlistA.recurrencesetting.hourly === playlistB.recurrencesetting.hourly) && (playlistA.recurrencesetting.endtime === playlistB.recurrencesetting.endtime)))) {
					return true;
			}
			
			return false;
		}
		
		var newObj		= {};
		var recurrenceObj = {};
		var dataObj 	= {};
		var srcObj = {};

		logger.debug('enter schedule/playlist/update.js');
		//get parameter from request
/*
//case 1 just change playlist name for single playlist
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:01:01:00:00.000';
		newObj.end = '2013:01:01:01:00:20.000';
		
		srcObj.objid = '50ee276ec55e788809000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:00.000';
		srcObj.end = '2013:01:01:01:00:20.000';
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;


//case 2 change playlist duration for single playlist
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:01:01:00:00.000';
		newObj.end = '2013:01:01:01:00:10.000';
		
		srcObj.objid = '50ee276ec55e788809000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:00.000';
		srcObj.end = '2013:01:01:01:00:20.000';
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;
		
//case 3 change playlist start time for single playlist
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:08:01:00:00.000';
		newObj.end = '2013:01:08:01:00:20.000';
		
		srcObj.objid = '50ee276ec55e788809000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:00.000';
		srcObj.end = '2013:01:01:01:00:20.000';
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;

//case 4 just change playlist name for recurrence playlist for apply to all
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:01:20';
		recurrenceObj.recurrencetype = 'daily';
		
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:01:01:00:40.000';
		newObj.end = '2013:01:01:01:01:20.000';
		newObj.recurrencesetting = recurrenceObj;
		
		srcObj.objid = '50ee2e676158c17016000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:40.000'; //for break use case
		srcObj.end = '2013:01:01:01:01:20.000'; //for break use case
		
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;

//case 5 change playlist duration for recurrence playlist for apply to all
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:01:20';
		recurrenceObj.recurrencetype = 'daily';
		
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:01:01:00:40.000';
		newObj.end = '2013:01:01:01:01:00.000';
		newObj.recurrencesetting = recurrenceObj;
		
		srcObj.objid = '50ee2e676158c17016000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:40.000'; //for break use case
		srcObj.end = '2013:01:01:01:01:20.000'; //for break use case
		
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;

//case 6 change playlist duration for recurrence playlist for apply to all -- conflict
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:01:20';
		recurrenceObj.recurrencetype = 'daily';
		
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:01:01:00:40.000';
		newObj.end = '2013:01:01:01:02:00.000';
		newObj.recurrencesetting = recurrenceObj;
		
		srcObj.objid = '50ee2e676158c17016000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:40.000'; //for break use case
		srcObj.end = '2013:01:01:01:01:20.000'; //for break use case
		
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;

//case 7 change playlist recurrence start/end for recurrence playlist for apply to all
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:03:20';
		recurrenceObj.recurrencetype = 'daily';
		
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:01:01:00:40.000';
		newObj.end = '2013:01:01:01:01:20.000';
		newObj.recurrencesetting = recurrenceObj;
		
		srcObj.objid = '50ee2e676158c17016000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:40.000'; //for break use case
		srcObj.end = '2013:01:01:01:01:20.000'; //for break use case
		
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;

//case 8 change playlist recurrence type for recurrence playlist for apply to all
		recurrenceObj.startdate = '2013:01:01';
		recurrenceObj.enddate = '2013:03:20';
		recurrenceObj.recurrencetype = 'weekly';
		recurrenceObj.weekly = '1,1,1,1,1,0,0';
		
		newObj.playlistpath = '/media/test/test5/11/new2/pnew1.plst';
		newObj.start = '2013:01:01:01:00:40.000';
		newObj.end = '2013:01:01:01:01:20.000';
		newObj.recurrencesetting = recurrenceObj;
		
		srcObj.objid = '50ee2e676158c17016000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:01:01:00:40.000'; //for break use case
		srcObj.end = '2013:01:01:01:01:20.000'; //for break use case
		
		dataObj.newplaylist = newObj;
		dataObj.applytoall = true;
		dataObj.src = srcObj;

//case 9 only change playlist name and durationfor recurrence playlist for break
		newObj.playlistpath = '/media/test/test5/11/new2/pnew11111.plst';
		newObj.start = '2013:01:11:01:00:40.000';
		newObj.end = '2013:01:11:01:01:10.000';
		
		srcObj.objid = '50ee2e676158c17016000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:01:11:01:00:40.000'; //for break use case
		srcObj.end = '2013:01:11:01:01:20.000'; //for break use case
		
		dataObj.newplaylist = newObj;
		dataObj.applytoall = false;
		dataObj.src = srcObj;

//case 10 only change playlist name and durationfor recurrence playlist for break for across daycase
		newObj.playlistpath = '/media/test/test5/11/new2/pnew11111.plst';
		newObj.start = '2013:03:06:06:00:40.000';
		newObj.end = '2013:03:06:06:01:10.000';
		
		srcObj.objid = '50f7732e8a31d8d812000001';
		srcObj.schedulepath = '/player/group1';
		srcObj.scheduletype = 'schedule';
		srcObj.start = '2013:03:05:23:55:00.000'; //for break use case
		srcObj.end = '2013:03:06:00:20:00.000'; //for break use case
		
		dataObj.newplaylist = newObj;
		dataObj.applytoall = false;
		dataObj.src = srcObj;
*/		

		dataObj = req.body;
console.log(dataObj);
		
		if(!dataObj.newplaylist.recurrence || (dataObj.newplaylist.recurrence === 'false')) {
			dataObj.newplaylist.recurrence = false;
		}
		else {
			dataObj.newplaylist.recurrence = true;
		}
		
		if(!dataObj.applytoall || (dataObj.applytoall === 'false')) {
			dataObj.applytoall = false;
		}
		else {
			dataObj.applytoall = true;
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

				schedule	= new Schedule(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!dataObj) || (!dataObj.newplaylist)|| (!dataObj.newplaylist.start)|| (!dataObj.newplaylist.end) || 
						(!dataObj.src)  || (!dataObj.src.schedulepath)  || (!dataObj.src.scheduletype)  || (!dataObj.src.objid)  || 
						(!dataObj.src.start)  || (!dataObj.src.end)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
 				if(!regTimeFormat.test(dataObj.src.start) || !regTimeFormat.test(dataObj.src.end)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
 				}
 				
 				if(dataObj.newplaylist.recurrence && dataObj.newplaylist.recurrencesetting && 
					((regDateFormat.test(dataObj.newplaylist.recurrencesetting.startdate) === false) || (regDateFormat.test(dataObj.newplaylist.recurrencesetting.enddate) === false))) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if(dataObj.newplaylist.recurrence && dataObj.newplaylist.recurrencesetting && dataObj.newplaylist.recurrencesetting.hourly && (regTimeFormat2.test(dataObj.newplaylist.recurrencesetting.endtime) === false)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if(dataObj.src.scheduletype === 'schedule') { groupPath = dataObj.src.schedulepath; }
				else { groupPath = path.dirname(dataObj.src.schedulepath); }  //channel
				
				if(!dataObj.newplaylist.objid) { dataObj.newplaylist.objid = dataObj.src.objid; }
								
				//check privilege, must have write privilege on specified group.
				privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to update schedule/channel information.' + groupPath);
						return res.send(retVal);
					}
					else {
						if(have) {
						  	schedule.getPlaylistByID(dataObj.src.objid, function(err, playlistObj) {
						  		if(err) { 
						  			logger.error('fail to get source playlist when update playlist. ' + err);
									retVal.id = err || 0;
									retVal.msg = helper.retval[err || 0];
									return res.send(retVal);
								}
						  		else {
						  			if(!playlistObj) {
										logger.error('get empty source playlist when update playlist.');
										retVal.id = 5;
										retVal.msg = helper.retval[5];
										return res.send(retVal);
									}
						  			else {
//console.log('the source playlist is:');
//console.log(playlistObj);
						  				if(dataObj.newplaylist.recurrencesetting) { dataObj.newplaylist.recurrence = true; }
						  				else { dataObj.newplaylist.recurrence = false; }
										dataObj.newplaylist.scheduletype = playlistObj.scheduletype;
										dataObj.newplaylist.schedulepath = playlistObj.schedulepath;
										dataObj.newplaylist.listtype 	= playlistObj.listtype;
										dataObj.newplaylist.siteid 		= playlistObj.siteid;
					  					
										var updatePlaylist = function(obj, srcObj, newPlaylist, applyToAll, callback) {
							  				if(obj.recurrence) {
								  				if(!applyToAll) { //break the recurrence playlist
													schedule.updateAndBreakPlaylist(obj, srcObj.start, srcObj.end, newPlaylist, function(err, conflictArray) {
														return callback(err, conflictArray);
													});
								  				}
								  				else { //complex update
										  			if(_compareRecurrencePlaylist(obj, newPlaylist) === true) {//recurrence playlist and every setting are the same, just replace playlist path.
							  							schedule.updatePlaylistWithoutChecking(srcObj.objid, newPlaylist.playlistpath, function(err) {
															return callback(err, []);
								  						});
							  						}
													else {
														schedule.updateWholePlaylist(obj, newPlaylist, function(err, conflictArray) {
															return callback(err, conflictArray);
														});
													}
								  				}
							  				}
							  				else { //single playlist
								  				if((obj.start === newPlaylist.start) && (obj.end === newPlaylist.end) && (!newPlaylist.recurrence)) { //if just change playlist path, then we can simply replace it.
						  							schedule.updatePlaylistWithoutChecking(srcObj.objid, newPlaylist.playlistpath, function(err) {
														return callback(err, []);
							  						});
								  				}
								  				else { //complex update
													schedule.updateWholePlaylist(obj, newPlaylist, function(err, conflictArray) {
														return callback(err, conflictArray);
													});
								  				}
							  				}
										}

if(dataObj.newplaylist.objid) { delete dataObj.newplaylist.objid; }
//console.log('dataObj.newplaylist=');
//console.log(dataObj.newplaylist);
										updatePlaylist(playlistObj, dataObj.src, dataObj.newplaylist, dataObj.applytoall, function(err, conflictArray) {
console.log('the result of update playlist is:' + err);
											if(err) {
												retVal.id = err || 0;
												retVal.msg = helper.retval[err || 0];

												if(conflictArray && conflictArray.length) {
//console.log('has conflict item:');
//console.log(conflictArray);
													retVal.conflict = conflictArray;
												}
												
												logger.error('error occurs when call updatePlaylist(). ' + err);
												return res.send(retVal);
											}

											schedule.getPlaylist(dataObj.newplaylist.schedulepath, dataObj.newplaylist.scheduletype, dataObj.newplaylist.listtype, 
													dataObj.newplaylist.playlistpath, dataObj.newplaylist.start, function(err, obj) {
														
												retVal.id = err || 0;
												retVal.msg = helper.retval[err || 0];
												if(!err) {
													retVal.status = true;
													retVal.obj = obj;
												}
//console.log('will return:');
//console.log(retVal);
												logger.debug('return from schedule/playlist/update.js');
												logger.debug(JSON.stringify(retVal, '', 4));
												return res.send(retVal);
											});
										});
						  			}
						  		}
						  	});
						}
						else {
							retVal.id = 201;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to get schedule/channel information in current group (%s).', groupPath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = UpdateScheduleItems;

