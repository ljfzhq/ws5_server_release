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

var PasteScheduleItems = function() {

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
		var sourceDateRangeArray = [];
		var targetDateRangeArray = [];
		var sourcePlaylistNumber = 0;
		var targetPlaylistArray  = [];
		var targetConflictPlaylistArray  = [];
		var delta 				 = 0;
		var index 				 = 0;
		var overwrite			 = '';
		
		var srcObj 		= {};
		var targetObj 	= {};
		var dataObj		= {};
		var listObj		= {};
		var dateArray	= [];
		var srcArray	= [];
dataObj.overwrite = 'overwrite';
		if(!dataObj.overwrite) {
			//remove the garbage data in session for paste
			if(req.session.pastePlaylistData) delete req.session.pastePlaylistData;
			
			//get parameter from request
/*
			//case1: hourly, daily recurrence playlist is all included by the range
			dateArray.push('2013:02:01');
			dateArray.push('2013:02:02');
			dateArray.push('2013:02:03');
			dateArray.push('2013:02:04');
			dateArray.push('2013:02:05');
			dateArray.push('2013:02:06');
			dateArray.push('2013:02:07');
			dateArray.push('2013:02:08');
			dateArray.push('2013:02:09');
			dateArray.push('2013:02:10');
			dateArray.push('2013:02:11');
			dateArray.push('2013:02:12');
			
			srcObj.date = dateArray;
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			
			targetObj.schedulepath = '/player/group1';
			targetObj.scheduletype = 'schedule';
			targetObj.listtype = 'playlist';
			
			dataObj.src = srcObj;
			dataObj.target = targetObj;
			dataObj.startdate = '2013:10:30';
			dataObj.mode = 'bydate';
			
			//case2: hourly, daily recurrence playlist is partially included by the range, also includes single playlist
			dateArray.push('2013:01:01');
			dateArray.push('2013:01:02');
			dateArray.push('2013:01:04');
			
			srcObj.date = dateArray;
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			
			targetObj.schedulepath = '/player/group1';
			targetObj.scheduletype = 'schedule';
			targetObj.listtype = 'playlist';
			
			dataObj.src = srcObj;
			dataObj.target = targetObj;
			dataObj.startdate = '2013:10:30';
			dataObj.mode = 'bydate';
			
			//case3: source range and target range overlapped
			//case6: some playlist exceed the target range, should be deleted
			dateArray.push('2013:03:11');
			dateArray.push('2013:03:12');
			dateArray.push('2013:03:13');
			dateArray.push('2013:03:14');
			
			srcObj.date = dateArray;
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			
			targetObj.schedulepath = '/player/group1';
			targetObj.scheduletype = 'schedule';
			targetObj.listtype = 'playlist';
			
			dataObj.src = srcObj;
			dataObj.target = targetObj;
			dataObj.startdate = '2013:03:13';
			dataObj.mode = 'bydate';
			
			//case4: some playlist exceed the source range in beginning
			//case5: some playlist exceed the source range in the end
			dateArray.push('2013:03:11');
			dateArray.push('2013:03:12');
			dateArray.push('2013:03:14');
			
			srcObj.date = dateArray;
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			
			targetObj.schedulepath = '/player/group1';
			targetObj.scheduletype = 'schedule';
			targetObj.listtype = 'playlist';
			
			dataObj.src = srcObj;
			dataObj.target = targetObj;
			dataObj.startdate = '2013:10:30';
			dataObj.mode = 'bydate';

			//bylist cases
			srcObj = {};
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			srcObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
			srcObj.start = '2013:01:01:01:00:00.000';
			srcObj.end = '2013:01:01:01:00:20.000';
			srcArray.push(srcObj);
			
			srcObj = {};
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			srcObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
			srcObj.start = '2013:01:01:01:00:20.000';
			srcObj.end = '2013:01:01:01:00:40.000';
			srcArray.push(srcObj);
			
			srcObj = {};
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			srcObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
			srcObj.start = '2013:01:01:01:00:40.000';
			srcObj.end = '2013:01:01:01:01:20.000';
			srcArray.push(srcObj);
			
			srcObj = {};
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			srcObj.playlistpath = '/media/test/test5/11/new2/pnew.plst';
			srcObj.start = '2013:01:01:01:01:20.000';
			srcObj.end = '2013:01:01:01:01:40.000';
			srcArray.push(srcObj);
			
			targetObj.schedulepath = '/player/group1';
			targetObj.scheduletype = 'schedule';
			targetObj.listtype = 'playlist';
			targetObj.start = '2013:10:01:00:00:00.000'; //normal case
//			targetObj.start = '2013:10:01:00:00:10.000'; //execute normal case then this one. overlap case
//			targetObj.start = '2013:10:01:23:59:59.000'; //across day case.
//			targetObj.start = '2013:01:01:01:00:10.000'; //overlap with source
			
			dataObj.src = srcArray;
			dataObj.target = targetObj;
			dataObj.mode = 'bylist';
*/		
//simple test for across day
			dateArray.push('2013:03:13');
			dateArray.push('2013:03:14');
			
			srcObj.date = dateArray;
			srcObj.schedulepath = '/player/group1';
			srcObj.scheduletype = 'schedule';
			srcObj.listtype = 'playlist';
			
			targetObj.schedulepath = '/player/group1';
			targetObj.scheduletype = 'schedule';
			targetObj.listtype = 'playlist';
			
			dataObj.src = srcObj;
			dataObj.target = targetObj;
			dataObj.startdate = '2013:10:13';
			dataObj.mode = 'bydate';
/*			
*/			
			
		
		
		}
		else {
			overwrite = dataObj.overwrite;
			//get parameter from session
			if(req.session.pastePlaylistData) { dataObj = req.session.pastePlaylistData; }
			else { return res.send(JSON.stringify(retVal)); }
			
			delete req.session.pastePlaylistData;

			if(overwrite === 'cancel') { 
				retVal.id = 230;
				retVal.msg = helper.retval[230];
				logger.debug('User cancelled the paste operation.');
				return res.send(JSON.stringify(retVal));
			}
		}
		
		//get siteID from session
		siteid 	= '50dd19a9f11bc57013000031';
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(JSON.stringify(retVal));
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			//get userid from session
			userid = '50c8516bde2a26440e000121'; 
			
			accountrole = new AccountRole(siteObj);
			accountrole.getAccountByID(userid, function(err, accountInfo) {
				if(err) {
					retVal.id = err;
					retVal.msg = helper.retval[err];
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(JSON.stringify(retVal));
				}

				schedule	= new Schedule(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if(!dataObj) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(JSON.stringify(retVal));
				}
		
				if((dataObj.mode === 'bydate') &&
					((!dataObj.src) || (!dataObj.target) || (!dataObj.startdate) || 
					(!dataObj.src.schedulepath) || (!dataObj.src.scheduletype) || (!dataObj.src.listtype) || (!dataObj.src.date) || (!dataObj.src.date.length) || 
					(!dataObj.target.schedulepath) || (!dataObj.target.scheduletype) || (!dataObj.target.listtype))) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(JSON.stringify(retVal));
				}
				
				if((dataObj.mode === 'bylist') &&
					((!dataObj.src) || (!dataObj.src.length) || (!dataObj.target) || 
					(!dataObj.target.schedulepath) || (!dataObj.target.scheduletype) || (!dataObj.target.listtype) || (!dataObj.target.start))) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(JSON.stringify(retVal));
				}
		
				if((dataObj.mode !== 'bydate') && (dataObj.mode !== 'bylist')) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(JSON.stringify(retVal));
				}
		
				if(dataObj.mode === 'bydate') {
					if(dataObj.src.scheduletype === 'schedule') { groupPath = dataObj.src.schedulepath; }
					else { groupPath = path.dirname(dataObj.src.schedulepath); }  //channel
					
					//check privilege, must have read privilege on specified group.
					privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 1, function(err, have) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							logger.error('error occur when get privilege data from database or has not enough privilege to get schedule/channel information.' + groupPath);
							return res.send(JSON.stringify(retVal));
						}
						else {
							if(have) {
								if(dataObj.target.scheduletype === 'schedule') { groupPath = dataObj.target.schedulepath; }
								else { groupPath = path.dirname(dataObj.target.schedulepath); }  //channel
		
								//check privilege, must have write privilege on specified group.
								privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 2, function(err, have) {
									if(err) {
										retVal.id = err;
										retVal.msg = helper.retval[err];
										logger.error('error occur when get privilege data from database or has not enough privilege to update schedule/channel information.' + groupPath);
										return res.send(JSON.stringify(retVal));
									}
									else {
										if(have) {
											//1. Collect the date in src object, merge continuous date into one object
											//2. From source date range and target start date, build target date range array
											//3. For every target date range in range array, get its playlist set, expand playlist to get conflict playlist items.
											//  3.1 if the number of playlist in the set is not 0, and overwrite is not defined, then return for user confirm.
											// 	3.2 if overwrite === 'overwrite' or conflict playlist array is empty,
											//		3.2.1 collect all playlist set by each source date range, save the playlist set into each date range object.
											//		3.2.2 delete all playlist or playlist item in conflict the array from DB.
											//		3.2.3 check every playlist in source range playlist set, if its recurrence scope exceed the source range, 
											//				change its scope to fit into TARGET range.
											//		3.2.4 insert those playlist into DB. 
		
		
											//1. Collect the date in src object, merge contiuous date into one object
											sourceDateRangeArray = schedule._mergeDateToRange(dataObj.src.date);
		
											schedule._adjustSourceDateRange(dataObj.src.schedulepath, dataObj.src.scheduletype, dataObj.src.listtype,
																			sourceDateRangeArray, function(err, newSourceDateRangeArray) {
												if(err) {
													retVal.id = err;
													retVal.msg = helper.retval[err];
													logger.error('error occur when adjust source date range to support across day playlist by date range. ' + err);
													return res.send(JSON.stringify(retVal));
												}
												sourceDateRangeArray = newSourceDateRangeArray;
		console.log(newSourceDateRangeArray)															
												//2. From source date range and target start date, build target date range array
												targetDateRangeArray = schedule._buildTargetRangeArray(sourceDateRangeArray, dataObj.startdate);
												
		console.log(targetDateRangeArray)															
												//3. For every target date range in range array, get its playlist set, save the playlist set into each date range object.
												schedule.collectPlaylistSet2RangeArray(dataObj.target.schedulepath, dataObj.target.scheduletype, dataObj.target.listtype, 
															targetDateRangeArray, true, function(err, playlistArray) {
													if(err) {
														retVal.id = err;
														retVal.msg = helper.retval[err];
														logger.error('error occur when get target playlist set before paste playlist by date range. ' + err);
														return res.send(JSON.stringify(retVal));
													}
													targetConflictPlaylistArray = playlistArray;
			
													//  3.1 if the number of playlist in the set is not 0, and overwrite is not defined, then return for user confirm.
													if(targetConflictPlaylistArray.length && !overwrite) {
														req.session.pastePlaylistData = dataObj;
														
														retVal.id = 231;
														retVal.msg = helper.retval[231];
														retVal.confirm = targetConflictPlaylistArray;
														logger.error('Found playlist in target date range, need confirm before overwrite them.');
														return res.send(JSON.stringify(retVal));
													}
													else { //empty or confirmed to overwrite
														// 	3.2 if overwrite === 'overwrite' or playlist set is empty,
														//		3.2.1 collect all playlist set by each source date range, save the playlist set into each date range object.
														schedule.collectPlaylistSet2RangeArray(dataObj.src.schedulepath, dataObj.src.scheduletype, dataObj.src.listtype,
																	sourceDateRangeArray, false, function(err, playlistArray) {
															if(err) {
																retVal.id = err;
																retVal.msg = helper.retval[err];
																logger.error('error occur when get source playlist set before paste playlist by date range. ' + err);
																return res.send(JSON.stringify(retVal));
															}
			
															for(index = 0; index < sourceDateRangeArray.length; index ++){
																sourcePlaylistNumber += sourceDateRangeArray[index].playlistArray.length;
															}
															
															if(sourcePlaylistNumber === 0) {
																retVal.id = 232;
																retVal.msg = helper.retval[232];
																logger.error('empty source.');
																return res.send(JSON.stringify(retVal));
															}
															
															//		3.2.2 expand playlist into targetPlaylistArray, delete all playlist or playlist item in the array from DB.
															for(index = 0; index < targetConflictPlaylistArray.length; index ++) {
																targetConflictPlaylistArray[index].rootobjid = targetConflictPlaylistArray[index].objid.toString();
															}
														
		console.log('will delete:');
		console.log(targetConflictPlaylistArray);
															schedule.deletePlaylistArray(targetConflictPlaylistArray, function(err) { 
																if(err) {
																	retVal.id = err;
																	retVal.msg = helper.retval[err];
																	logger.error('error occur when delete playlist in target before paste playlist by date range. ' + err);
																	return res.send(JSON.stringify(retVal));
																}
																//		3.2.3 check every playlist in source range playlist set, if its recurrence scope exceed the source range, 
																//				change its scope to fit into TARGET range.
																delta = schedule._calcDelta(sourceDateRangeArray[0].startTime, targetDateRangeArray[0].start);
		c
																targetPlaylistArray = schedule._makeSourcePlaylistIntoTargetRange(dataObj.src.schedulepath, 
																									dataObj.src.scheduletype, sourceDateRangeArray, delta);
		
		console.log('the playlist will be inserted:');
		console.log(targetPlaylistArray);
																//		3.2.4 insert those playlist into DB. 
																schedule.batchInsertPlaylist(targetPlaylistArray, function(err) {
																	if(err) {
																		retVal.id = err;
																		retVal.msg = helper.retval[err];
																		logger.error('error occur when insert source playlist in target by date range. ' + err);
																		return res.send(JSON.stringify(retVal));
																	}
																	else {
																		retVal.id = 0;
																		retVal.msg = helper.retval[0];
																		retVal.status = true;
																		return res.send(JSON.stringify(retVal));
																	}
																});
															});
														});
													}
												});
											});
										}
										else {
											retVal.id = 201;
											retVal.msg = helper.retval[retVal.id];
											logger.error('you have not enough privilege to paste schedule/channel information into group (%s).', groupPath);
											return res.send(JSON.stringify(retVal));
										}
									}
								});
							}
							else {
								retVal.id = 200;
								retVal.msg = helper.retval[retVal.id];
								logger.error('you have not enough privilege to get schedule/channel information in group (%s).', groupPath);
								return res.send(JSON.stringify(retVal));
							}
						}
					});
				}
				else if(dataObj.mode === 'bylist'){ //by list
					if(dataObj.src[0].scheduletype === 'schedule') { groupPath = dataObj.src[0].schedulepath; }
					else { groupPath = path.dirname(dataObj.src[0].schedulepath); }  //channel
					
					//check privilege, must have read privilege on specified group.
					privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 1, function(err, have) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							logger.error('error occur when get privilege data from database or has not enough privilege to get schedule/channel information.' + groupPath);
							return res.send(JSON.stringify(retVal));
						}
						else {
							if(have) {
								if(dataObj.target.scheduletype === 'schedule') { groupPath = dataObj.target.schedulepath; }
								else { groupPath = path.dirname(dataObj.target.schedulepath); }  //channel
		
								//check privilege, must have write privilege on specified group.
								privilege.checkPrivilege('player', groupPath, 'account', accountInfo.name, 2, function(err, have) {
									if(err) {
										retVal.id = err;
										retVal.msg = helper.retval[err];
										logger.error('error occur when get privilege data from database or has not enough privilege to update schedule/channel information.' + groupPath);
										return res.send(JSON.stringify(retVal));
									}
									else {
										if(have) {
											//1. From source list and target start time, build target playlist array with correct target time
											//2. For every target time range in range array, get its playlist set.
											//  2.1 if the number of playlist in the target set is not 0, and overwrite is not defined, then return for user confirm.
											// 	2.2 if overwrite === 'overwrite' or playlist set is empty,
											//		2.2.1 delete all playlist or playlist item in the target array from DB. 
											//				there maybe duplicate item for one playlist may overlap with multiple playlist, it'd better to sort them by start time
											//				then filter the duplicated one and save the data into new array.
											//		2.2.2 insert those playlist into DB. 
											
											//1. From source list and target start time, build target playlist array with correct target time
											targetPlaylistArray = schedule._buildTargetArrayFromSourceArray(dataObj.src, dataObj.target.schedulepath, 
																											dataObj.target.scheduletype, dataObj.target.listtype, dataObj.target.start);
											
											if(targetPlaylistArray.length === 0) {
												retVal.id = 232;
												retVal.msg = helper.retval[232];
												logger.error('empty source.');
												return res.send(JSON.stringify(retVal));
											}
											
		console.log(targetPlaylistArray);
											//2. For every target time range in playlist array, get its playlist set.
											schedule.collectPlaylistSet2RangeArray(dataObj.target.schedulepath, dataObj.target.scheduletype, dataObj.target.listtype,
														targetPlaylistArray, true, function(err, playlistArray) {
												if(err) {
													retVal.id = err;
													retVal.msg = helper.retval[err];
													logger.error('error occur when get source playlist set before paste playlist by list. ' + err);
													return res.send(JSON.stringify(retVal));
												}
												
												targetConflictPlaylistArray = schedule.removeDuplicatedItem(playlistArray);
		console.log(targetConflictPlaylistArray);
		
												//  2.1 if the number of playlist in the target set is not 0, and overwrite is not defined, then return for user confirm.
												if(targetConflictPlaylistArray.length && !overwrite) {
													req.session.pastePlaylistData = dataObj;
													
													retVal.id = 231;
													retVal.msg = helper.retval[231];
													retVal.confirm = targetConflictPlaylistArray;
													logger.error('Found playlist in target, need confirm before overwrite them.');
													return res.send(JSON.stringify(retVal));
												}
												else { //empty or confirmed to overwrite
													// 	2.2 if overwrite === 'overwrite' or playlist set is empty,
													for(index = 0; index < targetConflictPlaylistArray.length; index ++) {
														targetConflictPlaylistArray[index].rootobjid = targetConflictPlaylistArray[index].objid.toString();
													}
													
													//		2.2.1 delete all playlist or playlist item in the target array from DB. 
													//				there maybe duplicate item for one playlist may overlap with multiple playlist, it'd better to sort them by start time
													//				then filter the duplicated one and save the data into new array.
													schedule.deletePlaylistArray(targetConflictPlaylistArray, function(err) { 
														if(err) {
															retVal.id = err;
															retVal.msg = helper.retval[err];
															logger.error('error occur when delete playlist in target before paste playlist by list. ' + err);
															return res.send(JSON.stringify(retVal));
														}
														
		console.log(targetPlaylistArray);
														//		2.2.2 insert those playlist into DB. 
														schedule.batchInsertPlaylist(targetPlaylistArray, function(err) {
															if(err) {
																retVal.id = err;
																retVal.msg = helper.retval[err];
																logger.error('error occur when insert source playlist in target by list. ' + err);
																return res.send(JSON.stringify(retVal));
															}
															else {
																retVal.id = 0;
																retVal.msg = helper.retval[0];
																retVal.status = true;
																return res.send(JSON.stringify(retVal));
															}
														});
													});
												}
											});
										}
										else {
											retVal.id = 201;
											retVal.msg = helper.retval[retVal.id];
											logger.error('you have not enough privilege to paste schedule/channel information into group (%s).', groupPath);
											return res.send(JSON.stringify(retVal));
										}
									}
								});
							}
							else {
								retVal.id = 200;
								retVal.msg = helper.retval[retVal.id];
								logger.error('you have not enough privilege to get schedule/channel information in group (%s).', groupPath);
								return res.send(JSON.stringify(retVal));
							}
						}
					});
				}
				else {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(JSON.stringify(retVal));
				}
			});
		});
	}
};

module.exports = PasteScheduleItems;

