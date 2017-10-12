var fs 		= require('fs');
var path 	= require('path');
var util 	= require('util');
var hfs 	= require('hfs');
var Helper 	= require('../../../utils/helper');
var Media 	= require('../../../models/media');
var Privilege= require('../../../models/privilege');
var Site 	= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var FileUtils 	= require('../../../utils/fileutils');

var helper 		= new Helper();
var logger 		= helper.logger;
var media 		= null;
var privilege	= null;
var site 		= null;
var fileUtils 	= new FileUtils();

var Delete = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal = {
			status: false,
			id: 100,
			msg: helper.retval[100],
		};
		var site 				= null;
		var accountrole			= null;
		var accessibleArray 	= [];
		var inaccessibleArray 	= [];
		var folderArray 		= [];
		var i 					= 0;
		var mediaObj			= {}; 
		var userid				= '';
		var siteid				= '';
		var siteObj				= {};

		var dataObj				= {};
		var mediaArray 			= [];
		var forcedelete 		= false;
		
		logger.debug('enter media/delete.js');
		
		//when got event, check the returned value, if it is critical issues return directly, otherwise move the item to inaccessibleArray and continue.
		//loop to delete media file first, and pick the folder object to another array during this loop.
		//after all media are deleted, sort the folder array with path length, delete the folder which path is longer.
		//(I think longer path is deeper in path, so it has more possibility be empty, if it is not empty, it means it really can not be removed.)
		var deleteOneMedia = function(eventString, deleteObj) {
			var mediaId						= '';
			var mediaLocalPath 				= '';
			var newPath						= '';
			var widgetFolderLocalPath 		= '';
			var newWidgetFolderLocalPath	= '';
			var jsonFilePath				= '';
			var newJsonFilePath 			= '';
			var bigThumbnailPath			= '';
			var smallThumbnailPath			= '';
			var newBigThumbnailPath			= '';
			var newSmallThumbnailPath		= '';
			var newPathFolder				= '';
			
			//prepare the path for rename
			mediaId = deleteObj._id || deleteObj.idObj;
			trashFolderPath = fileUtils.getFileLocalPath(siteObj, '/' + helper.serversettings.trashfoldername) + path.sep;
				

			if(deleteObj.type === 'folder') {
				mediaLocalPath 	= fileUtils.getFileLocalPath(siteObj, deleteObj.path);
				newPath 		= fileUtils.getTrashMediaLocalPath(siteObj, deleteObj.name, mediaId);
																															
				//json file and path
				jsonFilePath 	= fileUtils.getJsonFileLocalPath(mediaLocalPath);
				newJsonFilePath = fileUtils.getTrashMediaLocalPath(siteObj, path.basename(jsonFilePath), mediaId);
																																
				//thumbnail
				bigThumbnailPath 		= fileUtils.getThumbnailLocalPath(siteObj, deleteObj.path, true);
				smallThumbnailPath 		= fileUtils.getThumbnailLocalPath(siteObj, deleteObj.path, false);
				newBigThumbnailPath 	= fileUtils.getTrashMediaLocalPath(siteObj, path.basename(bigThumbnailPath), mediaId);
				newSmallThumbnailPath 	= fileUtils.getTrashMediaLocalPath(siteObj, path.basename(smallThumbnailPath), mediaId);
			}
			else { //for delete file directly
				mediaLocalPath 	= fileUtils.getFileLocalPath(siteObj, deleteObj.path);
				newPath 		= fileUtils.getTrashMediaLocalPath(siteObj, deleteObj.name, mediaId);
																															
				//json file and path
				jsonFilePath 	= fileUtils.getJsonFileLocalPath(mediaLocalPath);
				newJsonFilePath = fileUtils.getTrashMediaLocalPath(siteObj, path.basename(jsonFilePath), mediaId);
																																
				//thumbnail
				bigThumbnailPath 		= fileUtils.getThumbnailLocalPath(siteObj, deleteObj.path, true);
				smallThumbnailPath 		= fileUtils.getThumbnailLocalPath(siteObj, deleteObj.path, false);
				newBigThumbnailPath 	= fileUtils.getTrashMediaLocalPath(siteObj, path.basename(bigThumbnailPath), mediaId);
				newSmallThumbnailPath 	= fileUtils.getTrashMediaLocalPath(siteObj, path.basename(smallThumbnailPath), mediaId);

				if(deleteObj.type === 'widget') { 
					widgetFolderLocalPath = fileUtils.getExtraFilesFolderPath(mediaLocalPath); 
					newWidgetFolderLocalPath = fileUtils.getTrashMediaLocalPath(siteObj, path.basename(widgetFolderLocalPath), mediaId);
				}
			}
			
			newPathFolder = path.dirname(newPath);
			
			fs.exists(mediaLocalPath, function(exists) {
				if(!exists) { logger.error('media does not exist.'); req.emit(eventString, 'notexist', 0); return; }

				fs.exists(jsonFilePath, function(exists) {
					if(!exists) { logger.error('json does not exist.'); req.emit(eventString, 'json notexist', 0); return;}

					hfs.mkdir(newPathFolder, function(err) {
						if(err) { logger.error('fail to mkdir. ' + err); req.emit(eventString, 'fail to create folder in trash', 0); return; }

						fs.rename(jsonFilePath, newJsonFilePath, function(err) {
							if(err) { logger.error('fail to rename json file. ' + err); req.emit(eventString, 'fail to rename json', 0); return; }

							fs.rename(bigThumbnailPath, newBigThumbnailPath, function(err) {
								if(err) { logger.error('fail to rename big thumbnail file. ' + err); req.emit(eventString, 'fail to rename big thumbnail', 0); return; }
	
								fs.rename(smallThumbnailPath, newSmallThumbnailPath, function(err) {
									if(err) { logger.error('fail to rename small thumbnail file. ' + err); req.emit(eventString, 'fail to rename small thumbnail', 0); return; }
		
									fs.rename(mediaLocalPath, newPath, function(err) {
										if(err) { logger.error('fail to rename media file. ' + err); req.emit(eventString, 'fail to rename media file', err);  return; }
										else {
											//if the file is widget, rename its files folder to trash too.
											if(deleteObj.type === 'widget') {
												fs.rename(widgetFolderLocalPath, newWidgetFolderLocalPath, function(err) {
													if(err) { logger.error('fail to rename widget folder file. ' + err); req.emit(eventString, 'fail to rename widget folder', err); return; }
													else {
														//add delete mark to media in db
														media.moveMediaToTrash(deleteObj, function(err) {
															if(err) { logger.error('fail to move db record to trash record. ' + err); req.emit(eventString, 'fail in db', err); return; }
															else { 
																media.updateAllLinksForDelete(deleteObj, mediaId, function(err) {
																	if(err) { logger.error('fail to update link.' + err); req.emit(eventString, 'fail to update link', err); return; }
																	else { req.emit(eventString, '', 0); return; }
																});
															}
														});
													}
												});
											}
											else {
												//add delete mark to media in db
												media.moveMediaToTrash(deleteObj, function(err) {
													if(err) { logger.error('fail to call moveMediaToTrash().' + err); req.emit(eventString, 'fail in db', err); return; }
													else { 
														media.updateAllLinksForDelete(deleteObj, mediaId, function(err) {
															if(err) { logger.error('fail to call updateAllLinksForDelete().' + err); req.emit(eventString, 'fail to update link', err); return; }
															else { req.emit(eventString, '', 0); return; }
														});
													}
												});
											}
										}
									});
								});
							});
						});
					});
				});
			});
		}

		var deleteMediaAndPrivFromDB = function(deleteObj, callback) {
			var mediaId	= '';

			mediaId = deleteObj._id || deleteObj.idObj;

			//delete media in db
			media.deleteMediaRecordUnderFolder(deleteObj.path, false, function(err) {
				if(err) { 
					logger.error('delete folder/file record (' + deleteObj.path + ') encountered problem in deleteOneMediaPermanently.');
					logger.error(err);
				}
				
				//delete privilege in db
    			privilege.deletePrivilegeUnderFolder('media', deleteObj.path, function(err) {
    				if(err) {
    					logger.error('error occurs when remove media/folder privilege in deleteOneMediaPermanently().' + err);
    				}
    				
    				return callback(0);
    			});
			});
		}
			
		var deleteOneMediaPermanently = function(eventString, deleteObj) {
			media.deleteOneMediaPermanently(mediaObj, function(err) {
				req.emit(eventString, '', err);
				return;
			});
		}

		req.on('finishedOneMedia', function(err, errNo) {
			if(err) {
				logger.error('internal error occurs when delete media in deleteOneMedia(), maybe no effect---' + err);
				if((errNo !== 0) && (errNo !== 5)) {
					retVal.id = errNo;
					retVal.msg = helper.retval[errNo];
					logger.error('db error(%d) occurs when delete media in deleteOneMedia().', errNo);
					return res.send(retVal);
				}
				else { mediaObj.reason = err; inaccessibleArray.push(mediaObj); }
			}

			mediaObj = accessibleArray.pop();
			if(!mediaObj) { //no more items in the array, need to deal with folder.
				folderArray.sort(function(a, b) { //sort the array, longer path obj will be put in the end of the array, so it will be process first.
					return a.path.length - b.path.length;
				});
				req.emit('finishedOneFolder', '', 0);
				return;
			}
			else {
				if(mediaObj.type === 'folder') { 
					folderArray.push(mediaObj);
					req.emit('finishedOneMedia', '', 0);
					return;
				}
				else { 
					if(forcedelete) { deleteOneMediaPermanently('finishedOneMedia', mediaObj); }
					else { deleteOneMedia('finishedOneMedia', mediaObj); }
					
					return;
				}
			}
		});
		
		req.on('finishedOneFolder', function(err, errNo) {
			if(err) {
				logger.error('internal error occurs when delete media in deleteOneMedia(), maybe no effect---' + err);
				if((errNo !== 0) && (errNo !== 5)) {
					retVal.id = errNo;
					retVal.msg = helper.retval[errNo];
					logger.error('db error(%d) occurs when delete folder in deleteOneMedia().', errNo);
					res.send(retVal);
					return;
				}
				else { mediaObj.reason = err; inaccessibleArray.push(mediaObj); }
			}

			mediaObj = folderArray.pop();
			if(!mediaObj) { //no more items in the array, finished all.
				for(i = 0; i < inaccessibleArray.length; i++) {
					delete inaccessibleArray[i].idObj;
					delete inaccessibleArray[i].rootObj;
					delete inaccessibleArray[i].valid;
				}
				
				if(inaccessibleArray && inaccessibleArray.length) {
					retVal.id = 9;
					retVal.msg = helper.retval[9];
					retVal.fails = inaccessibleArray;
				}
				else {
					retVal.status = true;
					retVal.id = 0;
					retVal.msg = helper.retval[0];
				}
				logger.debug('return from media/delete.js.');
				logger.debug(JSON.stringify(retVal, '', 4));
				res.send(retVal);
			}
			else {
				//if the folder has elements in inaccessibleArray, that means the folder is not empty, so can not remove it.
				for(i = 0 ; i < inaccessibleArray.length; i++) {
					if(inaccessibleArray[i].path.indexOf(mediaObj.path) === 0) { break; }//find child
				}

				if(i >= inaccessibleArray.length) { 
					if(forcedelete) { deleteOneMediaPermanently('finishedOneFolder', mediaObj); }
					else { deleteOneMedia('finishedOneFolder', mediaObj); }

					return; 
				}
				else { //has undeleted child
					mediaObj.reason = 'not empty'; 
					inaccessibleArray.push(mediaObj);
					req.emit('finishedOneFolder', '', 0);
					return;
				}
			}
		});
		
		
		dataObj = req.body;
//console.log(req.body);		

		if(!dataObj || !dataObj.data) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('the parameter from request is not correct. ');
			return res.send(retVal);
		}
		
		mediaArray = dataObj.data;
		
		if(dataObj.forcedelete === 'false') forcedelete = false;
		else forcedelete = true;
		
		//for not provide trash function in the 1st version, so always force delete
		forcedelete = true;
		
//console.log('forcedelete=' + forcedelete);		
//console.log(mediaArray);		
		
		//check the parameters validation
		if((!util.isArray(mediaArray)) || (!mediaArray) || (mediaArray.length <= 0)) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('the parameter from request is not correct. ');
			return res.send(retVal);
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

				//Get all available media and unavailable media in two arrays, then prepare to deal with every one.
				media = new Media(siteObj);
				privilege = new Privilege(siteObj);
				media.getMediaListByPrivilege(mediaArray, accountInfo.name, 2, false, function(err, accessArray, inaccessArray) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						return res.send(retVal);
					}
					else {
						accessibleArray = accessArray;
						inaccessibleArray = inaccessArray;
//console.log(accessibleArray);
//res.send(inaccessibleArray);
						req.emit('finishedOneMedia', '', 0); //after got the available media array, start to deal the delete operation
					}
				});
			});
		});
	}
};

module.exports = Delete;

