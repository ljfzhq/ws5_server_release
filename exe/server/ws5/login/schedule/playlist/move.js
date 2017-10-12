var path		= require('path');
var util		= require('util');
var Helper 		= require('../../../../utils/helper');
var Schedule	= require('../../../../models/schedule');
var Privilege 	= require('../../../../models/privilege');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');
var PasteMove	= require('./pastemove.js');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var MoveScheduleItems = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var schedule 	= null;
		var privilege 	= null;
		var pasteMove 	= null;
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
		var rangeSize 			 = 0;
		var sourcePlaylistArray  = [];
		var targetPlaylistArray  = [];
		var targetConflictPlaylistArray  = [];
		var newTargetConflictPlaylistArray  = [];
		var conflictArraySize 	 = 0;
		var delta 				 = 0;
		var index 				 = 0;
		var i	 				 = 0;
		var overwrite			 = '';
		
		var srcObj 		= {};
		var targetObj 	= {};
		var dataObj		= {};
		var listObj		= {};
		var dateArray	= [];
		var srcArray	= [];
		var expandedSourceArray	= [];

		
		logger.debug('enter schedule/playlist/move.js');
		dataObj = req.body;
console.log('request data for move playlist:');
console.log(JSON.stringify(dataObj, '', 4));

		if(!dataObj.overwrite) {
console.log('request data for move playlist:');
console.log(dataObj);
			//remove the garbage data in session for move
			if(req.session.movePlaylistData) delete req.session.movePlaylistData;
		}
		else {
			overwrite = dataObj.overwrite;
			//get parameter from session
			if(req.session.movePlaylistData) { dataObj = req.session.movePlaylistData; }
			else { return res.send(retVal); }
			
			delete req.session.movePlaylistData;

console.log('request data for move playlist in session:');
console.log(JSON.stringify(dataObj, '', 4));

			if(overwrite === 'cancel') { 
				retVal.id = 240;
				retVal.msg = helper.retval[240];
				logger.debug('User cancelled the move operation.');
				return res.send(retVal);
			}
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
				pasteMove 	= new PasteMove(schedule, siteObj);
				
				//check the parameters validation
				if(!dataObj) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				if((dataObj.mode === 'bydate') &&
					((!dataObj.src) || (!dataObj.target) || (!dataObj.startdate) || 
					(!dataObj.src.schedulepath) || (!dataObj.src.scheduletype) || (!dataObj.src.listtype) || (!dataObj.src.date) || (!dataObj.src.date.length) || 
					(!dataObj.target.schedulepath) || (!dataObj.target.scheduletype) || (!dataObj.target.listtype))) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
				
				if((dataObj.mode === 'bylist') &&
					((!dataObj.src) || (!dataObj.src.length) || (!dataObj.target) || 
					(!dataObj.target.schedulepath) || (!dataObj.target.scheduletype) || (!dataObj.target.listtype) || (!dataObj.target.start))) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				if((dataObj.mode !== 'bydate') && (dataObj.mode !== 'bylist')) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				var regTimeFormat = /^\d{4}\:\d{2}\:\d{2}\:\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regTimeFormat2= /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
				var regDateFormat = /^\d{4}\:\d{2}\:\d{2}$/;
				if(dataObj.mode === 'bydate') {
					if(regDateFormat.test(dataObj.startdate) === false) {
						retVal.id = 4;
						retVal.msg = helper.retval[4];
						logger.error('the parameter from request is not correct. ');
						return res.send(retVal);
					}
					
					for(var x = 0 ; x < dataObj.src.date.length; x++) {
						if(regDateFormat.test(dataObj.src.date[x]) === false) {
							retVal.id = 4;
							retVal.msg = helper.retval[4];
							logger.error('the parameter from request is not correct. ');
							return res.send(retVal);
						}
					}
				}
				
				if(dataObj.mode === 'bylist') {
					for(var y = 0 ; y < dataObj.src.length; y++) {
						if((regTimeFormat.test(dataObj.src[y].start) === false) || (regTimeFormat.test(dataObj.src[y].end) === false)) {
							retVal.id = 4;
							retVal.msg = helper.retval[4];
							logger.error('the parameter from request is not correct. ');
							return res.send(retVal);
						}
					}
					
					if(regTimeFormat.test(dataObj.target.start) === false) {
						retVal.id = 4;
						retVal.msg = helper.retval[4];
						logger.error('the parameter from request is not correct. ');
						return res.send(retVal);
					}
				}
				
//ffff 20130903
				for(var i = 0, l = dataObj.src.length; i < l; i++) {
					if((dataObj.src[i].recurrence === 'true') || (dataObj.src[i].recurrence === true)) {
						dataObj.src[i].recurrence = true;
					}
					else {
						dataObj.src[i].recurrence = false;
					}
				}
//				
				
				if(dataObj.mode === 'bydate') {
					if(dataObj.src.scheduletype === 'schedule') { groupPath = dataObj.src.schedulepath; }
					else { groupPath = path.dirname(dataObj.src.schedulepath); }  //channel
					
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
								if(dataObj.target.scheduletype === 'schedule') { groupPath = dataObj.target.schedulepath; }
								else { groupPath = path.dirname(dataObj.target.schedulepath); }  //channel
		
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
											//1. Collect the date in src object, merge continuous date into one object
											//2. From source date range and target start date, build target date range array
											//3. For every target date range in range array, get its playlist set, expand playlist to get conflict playlist items.
											//  3.1 if the number of playlist in the set is not 0, and overwrite is not defined, then return for user confirm.
											// 	3.2 if overwrite === 'overwrite' or conflict playlist array is empty,
											//		3.2.1 collect all playlist set by each source date range, save the playlist set into each date range object.
											//				also expand to playlist item into source playlist array
											//		3.2.2 delete all playlist or playlist item in the conflict array from DB.
											//		3.2.3 expand source playlist in source range playlist set into array, delete all of them.
											//		3.2.4 check every playlist in source range playlist set, if its recurrence scope exceed the source range, 
											//				change its scope to fit into TARGET range.
											//		3.2.4 insert those playlist into DB. 
		
		
											//1. Collect the date in src object, merge contiuous date into one object
											sourceDateRangeArray = schedule._mergeDateToRange(dataObj.src.date);
		
											//even paste/move by date, but for across day playlist, the date range is not strict date range, 
											//maybe one playlist across to previous day, one playlist across to the next day, 
											//need to enlarge the date range to include them.
											schedule._adjustSourceDateRange(dataObj.src.schedulepath, dataObj.src.scheduletype, dataObj.src.listtype,
																			sourceDateRangeArray, function(err, newSourceDateRangeArray) {
												if(err) {
													retVal.id = err;
													retVal.msg = helper.retval[err];
													logger.error('error occur when adjust source date range to support across day playlist by date range. ' + err);
													return res.send(retVal);
												}
												sourceDateRangeArray = newSourceDateRangeArray;
											
												//2. From source date range and target start date, build target date range array
												targetDateRangeArray = schedule._buildTargetRangeArray(sourceDateRangeArray, dataObj.startdate);
												
												//3. For every target date range in range array, get its playlist set, expand playlist to get conflict playlist items.
												schedule.collectPlaylistSet2RangeArray(dataObj.target.schedulepath, dataObj.target.scheduletype, dataObj.target.listtype, 
															targetDateRangeArray, true, function(err, playlistArray) {
													if(err) {
														retVal.id = err;
														retVal.msg = helper.retval[err];
														logger.error('error occur when get target playlist set before move playlist by date range. ' + err);
														return res.send(retVal);
													}
													
													//if target date range and source date range are overlapped, need to remove the conflict items which are in source date range 
													//because they will be removed when move.
													rangeSize = sourceDateRangeArray.length;
													if(schedule._withinRange(targetDateRangeArray[0].start, targetDateRangeArray[rangeSize - 1].end, 
													                         sourceDateRangeArray[0].startTime, sourceDateRangeArray[rangeSize - 1].endTime)) {
														conflictArraySize = playlistArray.length;
														for(index = 0; index < conflictArraySize; index++) {
															for(i = 0; i < rangeSize; i ++) {
																if(schedule._withinRange(playlistArray[index].start, playlistArray[index].end, 
																						sourceDateRangeArray[i].startTime, sourceDateRangeArray[i].endTime) === false) {
																	targetConflictPlaylistArray.push(playlistArray[index]);
																}
															}
														}
													}
													else { targetConflictPlaylistArray = playlistArray; }
													
													//  3.1 if the number of playlist in the set is not 0, and overwrite is not defined, then return for user confirm.
													if(targetConflictPlaylistArray.length && !overwrite) {
														req.session.movePlaylistData = dataObj;
														
														retVal.id = 241;
														retVal.msg = helper.retval[241];
														retVal.confirm = targetConflictPlaylistArray;
														logger.error('Found playlist in target date range, need confirm before overwrite them.');
														return res.send(retVal);
													}
													else { //empty or confirmed to overwrite
														// 	3.2 if overwrite === 'overwrite' or playlist set is empty,
														//		3.2.1 collect all playlist set by each source date range, save the playlist set into each date range object. 
														//				also expand to playlist item into source playlist array
														schedule.collectPlaylistSet2RangeArray(dataObj.src.schedulepath, dataObj.src.scheduletype, dataObj.src.listtype,
																	sourceDateRangeArray, true, function(err, playlistArray) {
															if(err) {
																retVal.id = err;
																retVal.msg = helper.retval[err];
																logger.error('error occur when get source playlist set before move playlist by date range. ' + err);
																return res.send(retVal);
															}
			
															sourcePlaylistArray = playlistArray; //for delete in later
															if(sourcePlaylistArray.length === 0) {
																retVal.id = 242;
																retVal.msg = helper.retval[242];
																logger.error('empty source.');
																return res.send(retVal);
															}
															
															//		3.2.2 delete all playlist or playlist item in the conflict array from DB.
															for(index = 0; index < targetConflictPlaylistArray.length; index ++) {
																targetConflictPlaylistArray[index].rootobjid = targetConflictPlaylistArray[index].objid.toString();
															}
															
//			console.log('the target playlist will be delete:');
//			console.log(targetConflictPlaylistArray);
															schedule.deletePlaylistArray(targetConflictPlaylistArray, function(err) { 
																if(err) {
																	retVal.id = err;
																	retVal.msg = helper.retval[err];
																	logger.error('error occur when delete playlist in target before move playlist by date range. ' + err);
																	return res.send(retVal);
																}
																
//			console.log('the source playlist will be delete:');
//			console.log(sourcePlaylistArray);
																//		3.2.3 delete all of items in source playlist array.
																for(index = 0; index < sourcePlaylistArray.length; index ++) {
																	sourcePlaylistArray[index].rootobjid = sourcePlaylistArray[index].objid.toString();
																}
																schedule.deletePlaylistArray(sourcePlaylistArray, function(err) { 
																	if(err) {
																		retVal.id = err;
																		retVal.msg = helper.retval[err];
																		logger.error('error occur when delete playlist in source before move playlist by date range. ' + err);
																		return res.send(retVal);
																	}
																	
																
																	//		3.2.4 check every playlist in source range playlist set, if its recurrence scope exceed the source range, 
																	//				change its scope to fit into TARGET range.
																	delta = schedule._calcDelta(sourceDateRangeArray[0].startTime, targetDateRangeArray[0].start);
																	targetPlaylistArray = schedule._makeSourcePlaylistIntoTargetRange(dataObj.target.schedulepath, 
																										dataObj.target.scheduletype, sourceDateRangeArray, delta);
				
//			console.log('the playlist will be inserted:');
//			console.log(targetPlaylistArray);
																	//		3.2.5 insert those playlist into DB. 
																	schedule.batchInsertPlaylist(targetPlaylistArray, function(err) {
																		if(err) {
																			retVal.id = err;
																			retVal.msg = helper.retval[err];
																			logger.error('error occur when insert source playlist in target by date range. ' + err);
																			return res.send(retVal);
																		}
																		else {
																			retVal.id = 0;
																			retVal.msg = helper.retval[0];
																			retVal.status = true;
																			logger.debug('return from schedule/playlist/move.js');
																			logger.debug(JSON.stringify(retVal, '', 4));
																			return res.send(retVal);
																		}
																	});
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
											logger.error('you have not enough privilege to move schedule/channel information into group (%s).', groupPath);
											return res.send(retVal);
										}
									}
								});
							}
							else {
								retVal.id = 200;
								retVal.msg = helper.retval[retVal.id];
								logger.error('you have not enough privilege to get schedule/channel information in group (%s).', groupPath);
								return res.send(retVal);
							}
						}
					});
				}
				else if(dataObj.mode === 'bylist'){ //by list
					if(dataObj.src[0].scheduletype === 'schedule') { groupPath = dataObj.src[0].schedulepath; }
					else { groupPath = path.dirname(dataObj.src[0].schedulepath); }  //channel
					
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
								if(dataObj.target.scheduletype === 'schedule') { groupPath = dataObj.target.schedulepath; }
								else { groupPath = path.dirname(dataObj.target.schedulepath); }  //channel
		
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
//ffff 20130903
											//0. expand recurrence playlist to items
//
											//1. From expanded source list and target start time, build target playlist array with correct target time
											//2. For every target time range in range array, get its playlist set and expand it to get conflict array.
											//	2.1 there maybe duplicate item for one playlist may overlap with multiple playlist, it'd better to sort them by start time
											//		then filter the duplicated one and save the data into new array.
											//	2.2 if the conflict array include the playlist which is in source playlist array, remove it from conflict array
											//  2.3 if the number of target conflict array is not 0, and overwrite is not defined, then return for user confirm.
											// 	2.4 if overwrite === 'overwrite' or playlist set is empty,
											//		2.4.1 delete all playlist or playlist item in the target array from DB. 
											//		2.4.2 delete the playlist in source playlist array
											//		2.4.3 insert target playlist array into DB. 

//ffff 20130903
											dataObj.src.sort(function(a, b) {
												var ret = 0;
												
												if(a.start > b.start) { ret = 1; }
												else if(a.start < b.start) { ret = -1; }
												else { ret = 0; }
												
												return ret;			
											});
											
											//0. expand recurrence playlist to items
											expandedSourceArray = pasteMove.expandRecurrencePlaylist(dataObj.src);
											if(!expandedSourceArray || !util.isArray(expandedSourceArray) || !expandedSourceArray.length) {
												logger.error('bad postdata');
												return res.send(retVal);
											}
											else {
console.log(JSON.stringify(expandedSourceArray, '', 4));
											}
//											
											//1. From expanded source list and target start time, build target playlist array with correct target time
											var sourceTargetIsTheSame = (dataObj.target.schedulepath === dataObj.src[0].schedulepath) && 
																		(dataObj.target.scheduletype === dataObj.src[0].scheduletype) && 
																		(dataObj.target.listtype === dataObj.src[0].listtype);
											targetPlaylistArray = schedule._buildTargetArrayFromSourceArray(expandedSourceArray, dataObj.target.schedulepath, 
																											dataObj.target.scheduletype, dataObj.target.listtype, dataObj.target.start, sourceTargetIsTheSame);
											
//		console.log('targetPlaylistArray=');
//		console.log(targetPlaylistArray);
											if(targetPlaylistArray.length === 0) { //not need to move
												retVal.id = 0;
												retVal.msg = helper.retval[0];
												retVal.status = true;
												
												logger.debug('no target.');
												return res.send(retVal);
											}
											
											//2. For every target time range in range array, get its playlist set and expand it to get conflict array.
											schedule.collectPlaylistSet2RangeArray(dataObj.target.schedulepath, dataObj.target.scheduletype, dataObj.target.listtype,
														targetPlaylistArray, true, function(err, playlistArray) {
												if(err) {
													retVal.id = err;
													retVal.msg = helper.retval[err];
													logger.error('error occur when get source playlist set before move playlist by list. ' + err);
													return res.send(retVal);
												}
												
												//	2.1 there maybe duplicate item for one playlist may overlap with multiple playlist, it'd better to sort them by start time
												//		then filter the duplicated one and save the data into new array.
												targetConflictPlaylistArray = schedule.removeDuplicatedItem(playlistArray);
//		console.log('targetConflictPlaylistArray=');
//		console.log(targetConflictPlaylistArray);
		
												//	2.2 if the conflict array include the playlist which is in source playlist array, remove it from conflict array
												rangeSize = expandedSourceArray.length;
												conflictArraySize = targetConflictPlaylistArray.length;
												for(index = 0; index < conflictArraySize; index ++) {
												   	targetConflictPlaylistArray[index].inSource = false;
													for(i = 0; i < rangeSize; i++) {

														if((targetConflictPlaylistArray[index].start === expandedSourceArray[i].start) && 
														   (targetConflictPlaylistArray[index].end === expandedSourceArray[i].end) && 
														   (targetConflictPlaylistArray[index].playlistpath === expandedSourceArray[i].playlistpath)) {
														   	targetConflictPlaylistArray[index].inSource = true;
														}
													}
												}
												
												for(index = 0; index < conflictArraySize; index ++) {
												   	if(targetConflictPlaylistArray[index].inSource === false) {
												   		newTargetConflictPlaylistArray.push(targetConflictPlaylistArray[index]);
												   	}
												}
												
//		console.log('newTargetConflictPlaylistArray=');
//		console.log(newTargetConflictPlaylistArray);
												//  2.3 if the number of target conflict array is not 0, and overwrite is not defined, then return for user confirm.
												conflictArraySize = newTargetConflictPlaylistArray.length;
												if(conflictArraySize && !overwrite) {
													req.session.movePlaylistData = dataObj;
//		console.log('req.session.movePlaylistData=');											
//		console.log(req.session.movePlaylistData);											
													retVal.id = 241;
													retVal.msg = helper.retval[241];
													retVal.confirm = newTargetConflictPlaylistArray;
													logger.error('Found playlist in target, need confirm before overwrite them.');
													return res.send(retVal);
												}
												else { //empty or confirmed to overwrite
													// 	2.4 if overwrite === 'overwrite' or playlist set is empty,
													for(index = 0; index < conflictArraySize; index ++) {
														delete newTargetConflictPlaylistArray[index].inSource;
														newTargetConflictPlaylistArray[index].rootobjid = newTargetConflictPlaylistArray[index].objid.toString();
													}
													
													//		2.4.1 delete all playlist or playlist item in the target array from DB. 
//		console.log('will delete in target:');
//		console.log(newTargetConflictPlaylistArray);

													schedule.deletePlaylistArray(newTargetConflictPlaylistArray, function(err) { 
														if(err) {
															retVal.id = err;
															retVal.msg = helper.retval[err];
															logger.error('error occur when delete playlist in target before move playlist by list. ' + err);
															return res.send(retVal);
														}
														
														//		2.4.2 delete the playlist in source playlist array
//		console.log('will delete in source:');
//		console.log(expandedSourceArray);
														schedule.deletePlaylistArray(expandedSourceArray, function(err) { 
															if(err) {
																retVal.id = err;
																retVal.msg = helper.retval[err];
																logger.error('error occur when delete source playlist before move playlist by list. ' + err);
																return res.send(retVal);
															}
														
		
															//		2.4.3 insert target playlist array into DB. 
															rangeSize = targetPlaylistArray.length;
															for(index = 0; index < rangeSize; index++) {
																delete targetPlaylistArray[index].playlistArray;
															}
//		console.log('will insert:');
//		console.log(targetPlaylistArray);
															
//ffff 20130903
															targetPlaylistArray = [];
															targetPlaylistArray = pasteMove.calculateNewPlaylist(dataObj);
//
															schedule.batchInsertPlaylist(targetPlaylistArray, function(err) {
																if(err) {
																	retVal.id = err;
																	retVal.msg = helper.retval[err];
																	logger.error('error occur when insert source playlist in target by list. ' + err);
																	return res.send(retVal);
																}
																else {
																	retVal.id = 0;
																	retVal.msg = helper.retval[0];
																	retVal.status = true;
																	logger.debug('return from schedule/playlist/move.js');
																	logger.debug(JSON.stringify(retVal, '', 4));
																	return res.send(retVal);
																}
															});
														});
													});
												}
											});
										}
										else {
											retVal.id = 201;
											retVal.msg = helper.retval[retVal.id];
											logger.error('you have not enough privilege to move schedule/channel information into group (%s).', groupPath);
											return res.send(retVal);
										}
									}
								});
							}
							else {
								retVal.id = 200;
								retVal.msg = helper.retval[retVal.id];
								logger.error('you have not enough privilege to get schedule/channel information in group (%s).', groupPath);
								return res.send(retVal);
							}
						}
					});
				}
				else {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
			});
		});
	}
};

module.exports = MoveScheduleItems;

