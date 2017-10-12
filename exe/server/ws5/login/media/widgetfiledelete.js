var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var util 		= require('util');
var AdmZip 		= require('adm-zip');
var Helper 		= require('../../../utils/helper');
var Media		= require('../../../models/media');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var DeleteWidgetFile = function() {

	helper.config = helper.loadConfig();

	this.deletWidgetFile = function deletWidgetFile(widgetMediaFolderLocalPath, fileList, callback) {
		var Emitter = require('events').EventEmitter;
		var emitter	= (new Emitter);
		var fileLocalPath	= '';
		var fileNumber 		= 0;
		var fileIndex 		= 0;
		
		emitter.on('DeleteWidgetFile', function(first) {
			if(!first) { fileIndex ++; }
			
			if(fileIndex >= fileNumber) {
				return callback(0);
			}
			
			fileLocalPath= path.normalize(widgetMediaFolderLocalPath + path.sep + fileList[fileIndex]);
			fs.unlink(fileLocalPath, function(err) {
				if(err) { return callback(err); }
				
				emitter.emit('DeleteWidgetFile', false);
			});
		});
		
		
		
		
		
		if(!widgetMediaFolderLocalPath || !fileList || !util.isArray(fileList)) {
			return callback(4);
		}
		
		fileNumber = fileList.length;
		
		emitter.emit('DeleteWidgetFile', true);
	}
	
	this.do = function(req, res) {
		var that		= this;
		var dataObj 	= null;
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
		var widgetMediaLocalPath= '';
		var widgetMediaFolderLocalPath= '';
		var zip 		= null;
		
		logger.debug('enter media/widgetfiledelete.js');

		//get parameter from request
		dataObj = req.body;
		dataObj.widgetpath='/media/ticker.widget';
		dataObj.filepath=['data/a.txt'];
		
//console.log(req);		
console.log('delete widget file');		
console.log(JSON.stringify(dataObj, '', 4));		

		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				logger.error(retVal.msg);
				
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
				if((!dataObj.filepath) || (!dataObj.widgetpath)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				//check the widget exist or not
				media.get(dataObj.widgetpath, function(err, mediaInfo) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get widget media from database.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					
					if(mediaInfo.type !== 'widget') {
						retVal.id = 166;
						retVal.msg = helper.retval[166];
						logger.error('media type is not widget.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					
					//check privilege, must have write privilege on parent node.
					privilege.checkPrivilege('media', dataObj.widgetpath, 'account', accountInfo.name, 2, function(err, have) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							logger.error('error occur when get privilege data from database or has not enough privilege to the widget media.');
							logger.error(dataObj);
							return res.send(retVal);
						}
						else {
							if(have) {
								//conside revision
								media.createRevisionFileForUpdateContent(mediaInfo, function(err) {
									if(err) {
										retVal.id 	= err;
										retVal.msg 	= helper.retval[err];
										
										logger.error('error occurs during createRevisionFileForUpdateContent(). ' + err);
										return res.send(retVal);
									}
								
									//delete the media file under widget folder then generate new file list
									widgetMediaLocalPath = fileUtils.getFileLocalPath(siteObj, dataObj.widgetpath);
									widgetMediaFolderLocalPath = fileUtils.getExtraFilesFolderPath(widgetMediaLocalPath);
									that.deletWidgetFile(widgetMediaFolderLocalPath, dataObj.filepath, function(err) {
										if(err) {
											logger.error('error occurs when delete widget file. ' + err);
											retVal.id = 165;
											retVal.msg = helper.retval[165];
											return res.send(retVal);
										}
										else {
											//zip widget folder to widget file
/*
											try {
												zip = new AdmZip();
												zip.addLocalFolder(widgetMediaFolderLocalPath);
												zip.writeZip(widgetMediaLocalPath);
											}
											catch(e) {
												logger.error('exception occurs when zip the widget folder.');
												logger.error(e);
												
												retVal.id = 172;
												retVal.msg = helper.retval[172];
												return res.send(retVal);
											}
*/										
							
											var pathArray = [];
											pathArray.push(widgetMediaFolderLocalPath + path.sep + '*');
											fileUtils.compressFile(pathArray, widgetMediaLocalPath, function(err) {
												if(err) {
													retVal.id = 172;
													retVal.msg = helper.retval[172];
													return res.send(retVal);
												}
												
												//update DB record and json
												media.update(mediaInfo.path, mediaInfo, accountInfo._id.toString(), function(err) {
													retVal.id = err;
													retVal.msg = helper.retval[err];
													if(err) {
														logger.error('error occur when update widget to DB after delete files. ' + err);
														return res.send(retVal);
													}
													else {
														retVal.status = true;
														retVal.id = 0;
														retVal.msg = helper.retval[0];
														logger.debug('return from media/widgetfiledelete.js.');
														logger.debug(JSON.stringify(retVal, '', 4));
														return res.send(retVal);
													}
												});
											});
										}
									});
								});
							}
							else {
								retVal.id = 112;
								retVal.msg = helper.retval[retVal.id];
								logger.error('you have not enough privilege to delete file in widget media (', dataObj.path + ').');
								return res.send(retVal);
							}
						}
					});
				})
			});
		});
	}
};

module.exports = DeleteWidgetFile;

