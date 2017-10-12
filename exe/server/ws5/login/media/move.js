var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var Media 		= require('../../../models/media');
var Privilege	= require('../../../models/privilege');
var FileUtils 	= require('../../../utils/fileutils');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var media 		= null;
var privilege	= null;
var site 		= null;
var accountrole	= null;
var fileUtils	= new FileUtils();

var Move = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal = {
			status	: false,
			id		: 4,
			msg		: helper.retval[4]
		};
		var accessibleArray 	= [];
		var inaccessibleArray 	= [];
		var folderArray 		= [];
		var mediaObj			= null; 
		var userid				= '';
		var targetPath			= '';
		var srcObj				= {};
		var confirmObj			= {};
		var siteid				= '';
		var siteObj				= {};
		var accountObj 			= {};
				
		logger.debug('enter media/move.js');
		
		//1. Sort accessibleArray by decsend order to let folder be popped first and copied first for the same root path. 
		//2. Start to copy file and folder.
		//3. Remove the finished item from accessibleArray, if it is a folder, copy it to folderArray for later removing; move the failed item into inaccessibleArray.
		//4. If meet conflict item, then save the folderArray, accessArray and inaccessibleArray into session, and return to caller for confirmation.
		//		4.1 After get confirm request in move/confirm.js, get data from session and continue the move operation.
		//		4.2 If user choose overwrite, overwrite the media/folder, json and db record.
		//		4.3 if user choose rename, rename the file or folder with "name (N).ext". N is 1, 2, ,3, .... until no duplicated name.
		//			If it is folder, after created renamed folder and copy its attribues, change its sub folders and files's target path in accessibleArray.
		//		4.4 If user choose skip, if it is a folder, remove itself, its sub folder and files in accessibleArray; if it is a file, just remove it from accessibleArray.
		//			add the skip items into inaccessibleArray with reason:'skip'
		// 		4.5 If user choose cancel, remove the folderArray, accessArray and inaccessibleArray from session.
		//		4.6 After copy file, remove the source media file.
		//		4.7 After all finished even have some failed items, remove the folder which is empty.
		//The move operation needs to copy:
		//		a. media file or folder.
		//		b. json file
		//		c. db record
		//		d. do not copy or change the settings in privilege table.
		function _pushFailedMediaToFailArray(obj, failReason) {
			var tempObj = {};
			var srcObj	= {};
			
			srcObj.path 		= obj.path;
			srcObj.type 		= obj.type;
			tempObj.src 		= srcObj;
			tempObj.targetPath	= obj.targetPath;
			tempObj.options		= failReason;
			
			inaccessibleArray.push(tempObj);
			
			return;
		}
		
		function _copyFolderFile(srcPath, targetPath, mediaType) {//confirmType=0 mean rename, confirmType=1 means overwrite
			media.checkAndCopy(srcPath, 2, targetPath, 2, accountObj.name, mediaType, function(err, resultString) {
				if(mediaType === 'widget') { //delete widget folder after copy
					sLocalPath = fileUtils.getFileLocalPath(siteObj, srcPath);
					widgetSrcFolderLocalPath = fileUtils.getExtraFilesFolderPath(sLocalPath);
					hfs.del(widgetSrcFolderLocalPath, function(err) {
						req.emit('finishedOneMedia', err, resultString);
						return;
					});
				}
				else {
					req.emit('finishedOneMedia', err, resultString);
					return;
				}
			});
		}

		req.on('finishedOneMedia', function(err, resultString){
			var i 		= 0;
			var tempObj	= {};
			
			if(err) {
				if(mediaObj) { 
					tempObj = {};
					srcObj.path 		= mediaObj.path;
					srcObj.type 		= mediaObj.type;
					tempObj.src 		= srcObj;
					tempObj.targetPath	= mediaObj.targetPath;
					tempObj.options		= err;

					inaccessibleArray.push(tempObj); 
				}
				retVal.id 		= err;
				retVal.msg 		= helper.retval[err];
				retVal.fails 	= inaccessibleArray;
				logger.debug('return from media/move.js with error.');
				logger.debug(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
			else {
				if(resultString) {
					if((resultString === 'unwritable target') || (resultString === 'unreadable source') || (resultString === 'unwritable source')) {
						_pushFailedMediaToFailArray(mediaObj, resultString);
						mediaObj = null;
					}
					else {
						srcObj.path 		= mediaObj.path;
						srcObj.type 		= mediaObj.type;
						confirmObj.src 		= srcObj;
						confirmObj.targetPath= mediaObj.targetPath;
						 
						if(resultString === 'confirm overwrite'){ confirmObj.options = 1; }
						else if(resultString === 'confirm overwrite/rename'){ confirmObj.options = 2; }
						else if(resultString === 'confirm rename'){ confirmObj.options = 0; }
						
						retVal.status 	= false;
						retVal.id 		= 141;
						retVal.msg 		= helper.retval[141];
						retVal.confirm 	= confirmObj;
						
						if(inaccessibleArray.length > 0) {
							retVal.fails	= inaccessibleArray;
						}
						
						req.session.moveAccessibleArray 	= accessibleArray;
						req.session.moveInaccessibleArray 	= inaccessibleArray;
						req.session.moveFolderArray			= folderArray;
						logger.debug('return from media/move.js.');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
				}

				media.deleteSingleMedia(mediaObj, function(err) {
					if(err) {
						logger.error('error occurs when call media.deleteSingleMedia(). ' + err);
						_pushFailedMediaToFailArray(mediaObj, 'fail to delete');
					}

					if(mediaObj && mediaObj.path && (mediaObj.type === 'folder')) { folderArray.push(mediaObj); } //folder will be removed later
					mediaObj = accessibleArray.pop();
					if(!mediaObj) {
						media.removeEmptyFolder(folderArray, inaccessibleArray, function(err, unremovableArray) {
							if(err && unremovableArray) { //add can not be removed folder into inaccessibleArray.
								logger.error('error occurs when call media.removeEmptyFolder(). ' + err);
								for(i = 0; i < unremovableArray.length; i++) {
									tempObj = {};
									tempObj = unremovableArray[i];
									_pushFailedMediaToFailArray(tempObj, 'fail to delete');
								}
							}

							if(inaccessibleArray.length > 0) {
								retVal.status 	= false;
								retVal.id 		= 143;
								retVal.fails	= inaccessibleArray;
							}
							else {
								retVal.status 	= true;
								retVal.id 		= 145;
							}
							
							retVal.msg 		= helper.retval[retVal.id];
							logger.debug('return from media/move.js.');
							logger.debug(JSON.stringify(retVal, '', 4));
							return res.send(retVal);
						});
					}
					else {
						_copyFolderFile(mediaObj.path, mediaObj.targetPath, mediaObj.type);
					}
				});
			}
		});
		
		
		
		
		//remove the garbage data in session for move
		if(req.session.moveAccessibleArray) delete req.session.moveAccessibleArray;
		if(req.session.moveInaccessibleArray) delete req.session.moveInaccessibleArray;
		if(req.session.moveFolderArray) delete req.session.moveFolderArray;
		
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

				accountObj = accountInfo;
				
				//get parameter
				/*
				var moveObj = {//test case of all fail for unreadable
					src:[{path: '/media/test/test4', type: 'folder'}],
					targetPath: '/media/test/test5'		
				}
				
				var moveObj = {//testcase of all fail for unwritable 
					src:[{path: '/media/test/test2', type: 'folder'}],
					targetPath: '/media/test/test4'		
				}
		
				var moveObj = {//test case of overwrite confirm
					src:[{path: '/media/test/test3/test31', type: 'folder'}],
					targetPath: '/media/test/test3'		
				}
				
				var moveObj = {//testcase of rename confirm
					src:[{path: '/media/test/test1/test11', type: 'folder'}],
					targetPath: '/media/test/test1'		
				}
				
				var moveObj = {//test case of overwrite and rename confirm
					src:[{path: '/media/test/test2/test21', type: 'folder'}],
					targetPath: '/media/test/test2'		
				}
				
				var moveObj = {//test case of all sucess
					src:[{path: '/media/test/test5/11/new2', type: 'folder'}],
					targetPath: '/media/test/test5'		
				}
				*/
				/*
				var moveObj = {//test case of all sucess
					src:[{path: '/media/test/test3/test31/media10.jpg', type: 'image'}],
					targetPath: '/media/test/test5/test3 (2)/test31'		
				}
				*/
				
				var moveObj = {};
				moveObj = req.body;
console.log(moveObj);	
	
				//check the parameters validation
				if((!moveObj) || (!moveObj.src) || (moveObj.src.length === 0) || (!moveObj.targetPath)) {
					logger.error('bad parameter.');
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					return res.send(retVal);
				}	
		
				media 		= new Media(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//Get all available media and unavailable media in two arrays with privilege checking(it will not check when copy), then prepare to deal with every one.
				//must have write privilege for target path
				privilege.checkPrivilege('media', moveObj.targetPath, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						logger.error('error occurs when call checkPrivilege(). ' + err);
						retVal.id = err;
						retVal.msg = helper.retval[err];
						return res.send(retVal);
					}
					
					if(!have) {
						logger.error('no right.');
						retVal.id = 147;
						retVal.msg = helper.retval[147];
						return res.send(retVal);
					}
					
					//must have write privilege for source path
					media.getMediaListByPrivilege(moveObj.src, accountInfo.name, 2, true, function(err, accessArray, inaccessArray) {
						if(err) {
							logger.error('error occurs when call media.getMediaListByPrivilege(). ' + err);
							retVal.id = err;
							retVal.msg = helper.retval[err];
							return res.send(retVal);
						}
						else {
							if(!accessArray || !accessArray.length) {
								logger.error('no available media.');
								retVal.id = 149;
								retVal.msg = helper.retval[149];
								return res.send(retVal);
							}
							
							accessibleArray = accessArray;
							inaccessibleArray = inaccessArray;
							
							accessibleArray.sort(function(a, b) {//sort Array, let shorter path be in the end of array, that means deal with folder first because teh confirmation of folder will affect media.
								return b.path.length - a.path.length;	
							});
							
							//calculate the target path for each item, otherwise confirm.js does not know where the item will be copied to if its parent folder is confirmed to rename.				
							for(i = 0; i < accessibleArray.length; i++) {
								targetPath = '';
								targetPath = fileUtils.getTargetPath(accessibleArray[i].path, moveObj.targetPath, accessibleArray[i].rootObj.path);
								accessibleArray[i].targetPath = targetPath;
							}				
							
							req.emit('finishedOneMedia', 0, ''); //after got the available media array, start to deal the move operation
						}
					});
				});
			});
		});
	}
};

module.exports = Move;

