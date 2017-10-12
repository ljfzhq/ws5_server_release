var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var Media		= require('../../../models/media');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var Saveas = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var media		= null;
		var site 		= null;
		var accountrole	= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		
		var dataObj		= {};
		
		var copyFile = function copyFile(srcFile, newFile, callback) {
			fs.exists(srcFile, function(exists) {
		        if(!exists) {
		    	    return callback(182);
		    	}
				
				hfs.mkdir(path.dirname(newFile), function(err) {
					if(err) {
						return callback(103);
					}
					
					fs.lstat(srcFile, function(err, stat) { //拷贝快捷方式与文件
						if (stat.isSymbolicLink()) {
							return callback(183);
						}
						else if (stat.isDirectory()) {
							return callback(180);
						}
						else {
							fs.readFile(srcFile, function(err, data) {
								if(err) {
									return callback(184);
								}
								
								fs.writeFile(newFile, data, function(err) {
									if(err) {
										return callback(185);
									}
									
									return callback(0);
								});
							});
						}
					});
				});
			});
		}
		
		logger.debug('enter media/saveas.js');
		

		//get parameter from request
		dataObj = req.body;
//dataObj = { srcPath : '/media/bbb/playlist2.plist', srcType: 'playlist', targetPath: '/media/bbb/playlist88.plist' };
//console.log('dataObj');		
//console.log(dataObj);		
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

				media	 	= new Media(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if(!dataObj.srcPath || !dataObj.targetPath || !dataObj.srcType) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				if(dataObj.srcType === 'folder') {
					retVal.id = 180;
					retVal.msg = helper.retval[180];
					logger.error('not support save a folder to another.');
					return res.send(retVal);
				}
		
				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('media', dataObj.srcPath, 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to read the source media. ' + dataObj.srcPath);
						return res.send(retVal);
					}
					else {
						if(have) {
							privilege.checkPrivilege('media', dataObj.targetPath, 'account', accountInfo.name, 2, function(err, have) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									logger.error('error occur when get privilege data from database or has not enough privilege to create new media. ' + dataObj.targetPath);
									return res.send(retVal);
								}
								else {
									if(have) {
										//check existence of source media
										media.get(dataObj.srcPath, function(err, sourceMediaObj) {
											if(err) {
												retVal.id = err;
												retVal.msg = helper.retval[err];
												logger.error('source media does not exist or db error. ' + err);
												return res.send(retVal);
											}
											
											//check existence of target media
											media.get(dataObj.targetPath, function(err, targetMediaObj) {
												if(err && (err !== 5)) {
													retVal.id = err;
													retVal.msg = helper.retval[err];
													logger.error('db error. ' + err);
													return res.send(retVal);
												}
												
												if(!err) {//target exist
													if((dataObj.overwrite !== true) && (dataObj.overwrite !== 'true')) {
														retVal.id = 181;
														retVal.msg = helper.retval[181];
														logger.error('target media already exists.');
														return res.send(retVal);
													}
												}
												
												media.deleteOneMediaPermanently(targetMediaObj, function(err) {
													if(err) {
														retVal.id = err;
														retVal.msg = helper.retval[err];
														logger.error('failed to delete target media.');
														return res.send(retVal);
													}
													
													var srcMediaLocalPath 				= '';
													var srcMediaJsonLocalPath			= '';
													var srcMediaBigThumbnailLocalPath	= '';
													var srcMediaSmallThumbnailLocalPath	= '';
													var srcWidgetFolderLocalPath 		= '';
													var targetMediaLocalPath 				= '';
													var targetMediaJsonLocalPath			= '';
													var targetMediaBigThumbnailLocalPath	= '';
													var targetMediaSmallThumbnailLocalPath	= '';
													var targetWidgetFolderLocalPath 		= '';
			
													srcMediaLocalPath 				= fileUtils.getFileLocalPath(siteObj, sourceMediaObj.path);
													srcWidgetFolderLocalPath 		= fileUtils.getExtraFilesFolderPath(srcMediaLocalPath); 
													srcMediaJsonLocalPath 			= fileUtils.getJsonFileLocalPath(srcMediaLocalPath);
													srcMediaBigThumbnailLocalPath	= fileUtils.getThumbnailLocalPath(siteObj, sourceMediaObj.path, true);
													srcMediaSmallThumbnailLocalPath	= fileUtils.getThumbnailLocalPath(siteObj, sourceMediaObj.path, false);
													
													
													targetMediaLocalPath 				= fileUtils.getFileLocalPath(siteObj, dataObj.targetPath);
													targetWidgetFolderLocalPath 		= fileUtils.getExtraFilesFolderPath(targetMediaLocalPath); 
													targetMediaJsonLocalPath 			= fileUtils.getJsonFileLocalPath(targetMediaLocalPath);
													targetMediaBigThumbnailLocalPath	= fileUtils.getThumbnailLocalPath(siteObj, dataObj.targetPath, true);
													targetMediaSmallThumbnailLocalPath	= fileUtils.getThumbnailLocalPath(siteObj, dataObj.targetPath, false);
	
													delete sourceMediaObj._id;
													delete sourceMediaObj.lastmodifytime;
													sourceMediaObj.name = path.basename(dataObj.targetPath);
													sourceMediaObj.path = dataObj.targetPath;
													
													//copy file
													//copy media file
													//create db record
													media.create(sourceMediaObj, function(err) {
														if(err) {
															logger.error('Fail to create new media in db for ' + sourceMediaObj.path + '.   err=' + err);
	
															retVal.id = err;
															retVal.msg = helper.retval[err];
															return res.send(retVal);
														}
										
														copyFile(srcMediaLocalPath, targetMediaLocalPath, function(err) {
															if(err) {
																logger.error('Fail to copy media file. ' + err);
																logger.error('source=' + srcMediaLocalPath + '     target=' + targetMediaLocalPath);
		
																retVal.id = err;
																retVal.msg = helper.retval[err];
																return res.send(retVal);
															}
															
															//copy media json file
															copyFile(srcMediaJsonLocalPath, targetMediaJsonLocalPath, function(err) {
																if(err) {
																	logger.error('Fail to copy json file. ' + err);
																	logger.error('source=' + srcMediaJsonLocalPath + '     target=' + targetMediaJsonLocalPath);
			
																	retVal.id = err;
																	retVal.msg = helper.retval[err];
																	return res.send(retVal);
																}
																
																//copy media big thumbnail
																copyFile(srcMediaBigThumbnailLocalPath, targetMediaBigThumbnailLocalPath, function(err) {
																	if(err) {
																		logger.error('Fail to copy big thumbnail file. ' + err);
																		logger.error('source=' + srcMediaBigThumbnailLocalPath + '     target=' + targetMediaBigThumbnailLocalPath);
				
																		retVal.id = err;
																		retVal.msg = helper.retval[err];
																		return res.send(retVal);
																	}
																	
																	//copy media small thumbnail
																	copyFile(srcMediaSmallThumbnailLocalPath, targetMediaSmallThumbnailLocalPath, function(err) {
																		if(err) {
																			logger.error('Fail to copy small thumbnail file. ' + err);
																			logger.error('source=' + srcMediaSmallThumbnailLocalPath + '     target=' + targetMediaSmallThumbnailLocalPath);
					
																			retVal.id = err;
																			retVal.msg = helper.retval[err];
																			return res.send(retVal);
																		}
																		
																		//copy widget package folder
																		if(dataObj.srcType === 'widget') {
//console.log('srcWidgetFolderLocalPath=' + srcWidgetFolderLocalPath);
//console.log('targetWidgetFolderLocalPath=' + targetWidgetFolderLocalPath);
																			hfs.cpdir(srcWidgetFolderLocalPath, targetWidgetFolderLocalPath, function(err) {
//console.log('err=' + err);
																				if(err) {
																					logger.error('Fail to copy widget folder. ' + err);
																					logger.error('source=' + srcWidgetFolderLocalPath + '     target=' + targetWidgetFolderLocalPath);
							
																					retVal.id = 186;
																					retVal.msg = helper.retval[186];
																					return res.send(retVal);
																				}
																		
																				media.get(sourceMediaObj.path, function(err, newMediaObj) {
																					retVal.id = err;
																					retVal.msg = helper.retval[err];
																					if(!err) {
																						retVal.status = true;
																						retVal.media = newMediaObj;
																					}
																					logger.debug('return from media/saveas.js.');
																					logger.debug(JSON.stringify(retVal, '', 4));
																					return res.send(retVal);
																				});
																			});
																		}
																		else {
																			media.get(sourceMediaObj.path, function(err, newMediaObj) {
																				retVal.id = err;
																				retVal.msg = helper.retval[err];
																				if(!err) {
																					retVal.status = true;
																					retVal.media = newMediaObj;
																				}
																				logger.debug('return from media/saveas.js.');
																				logger.debug(JSON.stringify(retVal, '', 4));
																				return res.send(retVal);
																			});
																		}
																	});
																});
															});
														});
													});
												});
											});
										});
									}
									else {
										if(dataObj.srcType === 'folder') { retVal.id = 110; }
										else if(dataObj.srcType === 'playlist') { retVal.id = 111; }
										else { retVal.id = 112; }
										retVal.msg = helper.retval[retVal.id];
										logger.error('you have not enough privilege to create media in current path (%s).', dataObj.targetPath);
										return res.send(retVal);
									}
								}
							});
						}
						else {
							if(dataObj.srcType === 'folder') { retVal.id = 110; }
							else if(dataObj.srcType === 'playlist') { retVal.id = 111; }
							else { retVal.id = 112; }
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to get media in current path (%s).', dataObj.srcPath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = Saveas;

