var fs 			= require('fs');
var path 		= require('path');
var Helper 		= require('../../../../utils/helper');
var Media 		= require('../../../../models/media');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');
var FileUtils 	= require('../../../../utils/fileutils');

var helper 		= new Helper();
var logger 		= helper.logger;
var media 		= null;
var site 		= null;
var accountrole	= null;
var fileUtils	= new FileUtils();

var ConfirmPaste = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal = {
			status	: false,
			id		: 4,
			msg		: helper.retval[4]
		};
		var accessibleArray 	= [];
		var inaccessibleArray 	= [];
		var userid				= '';
		var i					= 0;
		var tempAccessArray		= [];
		var mediaObj			= {}; 
		var confirmObj			= {};
		var srcObj				= {};
		var siteid				= '';
		var siteObj				= {};
		var accountObj			= {};
		
		logger.debug('enter media/paste/confirm.js.');
		
		//1 If user choose overwrite, overwrite the media/folder, json and db record.
		//2 if user choose rename, rename the file or folder with "name (N).ext". N is 1, 2, ,3, .... until no duplicated name.
		//		If it is folder, after created renamed folder and copy its attribues, change its sub folders and files's target path in accessibleArray.
		//3 If user choose skip, if it is a folder, remove itself, its sub folder and files in accessibleArray; if it is a file, just remove it from accessibleArray.
		//4 If user chose cancel, remove the accessArray and inaccessibleArray from session.
		//The copy operation needs to copy:
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
		
		
		function _copyFolderFile(srcPath, targetPath, mediaType) {
			media.checkAndCopy(srcPath, 1, targetPath, 2, accountObj.name, mediaType, function(err, resultString) {
				req.emit('PasteNextMedia', err, resultString);
				return;
			});
		}
		
		function _processMediaByConfirm(srcPath, targetPath, mediaType, option, callback) {
			if((option === 1) || (option === 'overwrite')) {
				media.copyFolderFile(srcPath, targetPath, mediaType, function(err) {
					return callback(err);
				});
			}
			else if((option === 0) || (option === 'rename')){//rename
				fileUtils.getAvailableName(siteObj, targetPath, function(err, newPathObj) {
					if(err || !newPathObj || !newPathObj.path || !newPathObj.name) { 
						logger.error('error occurs when call fileUtils.getAvailableName(). ' + err);
						return callback(err); 
					}
					else {
						media.copyFolderFile(srcPath, newPathObj.path, mediaType, function(err) {
							if(err) { 
								logger.error('error occurs when call media.copyFolderFile(). ' + err);
								return callback(err); 
							}
							else {//if it is folder, rename the subnodes' path.
								if(mediaType === 'folder') {
									for(i = 0; i < accessibleArray.length; i++) {
										if(accessibleArray[i].targetPath.indexOf(targetPath) === 0) { 
											accessibleArray[i].targetPath = newPathObj.path + accessibleArray[i].targetPath.slice(targetPath.length);
										}
									}
								}
								return callback(0);
							}
						});
					}	
				});
			}
			else { return callback(4);}
		}

		//deal with the items in array
		req.on('PasteNextMedia', function(err, resultString){
			if(err) {
				if(mediaObj) { 
					_pushFailedMediaToFailArray(mediaObj, resultString);
				}
				retVal.id 		= err;
				retVal.msg 		= helper.retval[err];
				retVal.fails 	= inaccessibleArray;

				logger.error('error occurs in event PasteNextMedia. ' + err);
				return res.send(retVal);
			}
			else {
				if(resultString) {
					if((resultString === 'unwritable target') || (resultString === 'unreadable source')) {
						_pushFailedMediaToFailArray(mediaObj, resultString);
					}
					else {
						if((confirmObj.options === 1) && (confirmObj.all === true) && ((resultString === 'confirm overwrite') || (resultString === 'confirm overwrite/rename'))) {
							_processMediaByConfirm(mediaObj.path, mediaObj.targetPath, mediaObj.type, 'overwrite', function(err) {
								if(err) {
									logger.error('error occurs when call _processMediaByConfirm() for overwrite. ' + err);
									_pushFailedMediaToFailArray(mediaObj, 'Fail to overwrite');
									retVal.id 		= err;
									retVal.msg 		= helper.retval[err];
									retVal.fails 	= inaccessibleArray;
									return res.send(retVal);
								}
								req.emit('PasteNextMedia', 0, '');
							});
							return;//leave event handler, wait for the result of _processMediaByConfirm()
						}
						else if((confirmObj.options === 0) && (confirmObj.all === true) && ((resultString === 'confirm rename') || (resultString === 'confirm overwrite/rename'))) {
							_processMediaByConfirm(mediaObj.path, mediaObj.targetPath, mediaObj.type, 'rename', function(err) {
								if(err) {
									logger.error('error occurs when call _processMediaByConfirm() for rename. ' + err);
									_pushFailedMediaToFailArray(mediaObj, 'Fail to rename');
									retVal.id 		= err;
									retVal.msg 		= helper.retval[err];
									retVal.fails 	= inaccessibleArray;
									return res.send(retVal);
								}
								req.emit('PasteNextMedia', 0, '');
							});
							return;//leave event handler, wait for the result of _processMediaByConfirm()
						}
						else {
							srcObj.path 		= mediaObj.path;
							srcObj.type 		= mediaObj.type;
							confirmObj.src 		= srcObj;
							confirmObj.targetPath= mediaObj.targetPath;
							delete confirmObj.all;
							 
							if(resultString === 'confirm overwrite'){ confirmObj.options = 0; }
							else if(resultString === 'confirm overwrite/rename'){ confirmObj.options = 2; }
							else if(resultString === 'confirm rename'){ confirmObj.options = 1; }
							
							retVal.status 	= false;
							retVal.id 		= 141;
							retVal.msg 		= helper.retval[141];
							retVal.confirm 	= confirmObj;
							
							if(inaccessibleArray.length > 0) {
								retVal.fails	= inaccessibleArray;
							}
							
							req.session.pasteAccessibleArray 	= accessibleArray;
							req.session.pasteInaccessibleArray 	= inaccessibleArray;
							
							logger.debug('return from media/paste/confirm.js.');
							logger.debug(JSON.stringify(retVal, '', 4));
							return res.send(retVal);
						}
					}
				}

				mediaObj = accessibleArray.pop();
				if(!mediaObj) {
					if(inaccessibleArray.length > 0) {
						retVal.status 	= false;
						retVal.id 		= 142;
						retVal.fails	= inaccessibleArray;
					}
					else {
						retVal.status 	= true;
						retVal.id 		= 144;
					}
					
					retVal.msg 		= helper.retval[retVal.id];
					logger.debug('return from media/paste/confirm.js.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal);
				}
				else {
					_copyFolderFile(mediaObj.path, mediaObj.targetPath, mediaObj.type);
				}
			}
		});
		


		//get data from session for paste
		if(req.session.pasteAccessibleArray) { accessibleArray = req.session.pasteAccessibleArray; }
		else { return res.send(retVal); }

		if(req.session.pasteInaccessibleArray) { inaccessibleArray = req.session.pasteInaccessibleArray; }
		else { return res.send(retVal); }

		delete req.session.pasteAccessibleArray;
		delete req.session.pasteInaccessibleArray;

		//get parameter
		/*
		var confirmObj = {//test case of rename
			src:{path: '/media/test/test3', type: 'folder'},
			targetPath: '/media/test/test5/test3',
			type: 0,
			all: false
		}
		
		var confirmObj = {//test case of overwrite
			src:{path: '/media/test/test3', type: 'folder'},
			targetPath: '/media/test/test5/test3',
			type: 1,
			all: false
		}
		var confirmObj = {//test case of rename all
			src:{path: '/media/test/test3', type: 'folder'},
			targetPath: '/media/test/test5/test3',
			type: 0,
			all: true		
		}
		var confirmObj = {//test case of rename media file
			src:{path: '/media/test/test3/test31/media10.jpg', type: 'image'},
			targetPath: '/media/test/test5/test3 (2)/test31/media10.jpg',
			type: 0,
			all: true		
		}
		var confirmObj = {//test case of overwrite all
			src:{path: '/media/test/test3', type: 'folder'},
			targetPath: '/media/test/test5/test3',
			type: 1,
			all: true		
		}
		*/
		/*
		var confirmObj = {//test case of skip
			src:{path: '/media/test/test3', type: 'folder'},
			targetPath: '/media/test/test5/test3',
			type: 2,
			all: false		
		}
		var confirmObj = {//test case of cancel
			src:{path: '/media/test/test3', type: 'folder'},
			targetPath: '/media/test/test5/test3',
			type: 3,
			all: false		
		}
		*/

		confirmObj = req.body;
console.log(confirmObj);
		
		//check the parameters validation
		if((!confirmObj) || (!confirmObj.src) || (!confirmObj.src.path) || (confirmObj.src.path.length === 0)  || 
				(!confirmObj.src.type) || (!confirmObj.targetPath) || (confirmObj.targetPath.length === 0)) {
			logger.error('bad parameter');
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			return res.send(retVal);
		}	

		if(confirmObj.options) {
			confirmObj.options = parseInt(confirmObj.options) || 0;
		}
		
		if(confirmObj.all && ((confirmObj.all === 'true') || (confirmObj.all === true))) {
			confirmObj.all  = true;
		}
		else {
			confirmObj.all  = false;
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
					logger.error('error occurs when get account info from db. ' + err);
					logger.error(retVal.msg);
					
					return res.send(retVal);
				}
				
				accountObj = accountInfo;
				media = new Media(siteObj);
				
				//process the current one
				tempObj 			= {};
				tempObj.idObj 		= confirmObj.src.path;
				tempObj.path 		= confirmObj.src.path;
				tempObj.name		= path.basename(confirmObj.src.path);
				tempObj.type		= confirmObj.src.type;
				tempObj.targetPath 	= confirmObj.targetPath;
				if((confirmObj.options === 0) || (confirmObj.options === 1)) {//rename or overwrite
					_processMediaByConfirm(confirmObj.src.path, confirmObj.targetPath, confirmObj.src.type, confirmObj.options, function(err) {
						if(err) {
							logger.error('error occurs when call _processMediaByConfirm(). ' + err);
							_pushFailedMediaToFailArray(tempObj, 'fail to copy');
							retVal.id 		= err;
							retVal.msg 		= helper.retval[err];
							retVal.fails 	= inaccessibleArray;
							return res.send(retVal);
						}
						else {
							req.emit('PasteNextMedia', 0, '');  //will continue for other media in accessibleArray in below.
							return;
						}				
					});
				}
				else if(confirmObj.options === 2) {//skip, if it is folder, remove all of its subnode from accessibleArray
					_pushFailedMediaToFailArray(tempObj, 'skipped by user');
					if(confirmObj.src.type === 'folder') {
						for(i = 0; i < accessibleArray.length; i++) {
							if(accessibleArray[i].path.indexOf(confirmObj.src.path) !== 0) { tempAccessArray.push(accessibleArray[i]);}
							else { _pushFailedMediaToFailArray(accessibleArray[i], 'skipped by user'); }
						}
						
						accessibleArray = [];
						accessibleArray = tempAccessArray;
					}
					req.emit('PasteNextMedia', 0, ''); //will continue for other media in accessibleArray in below.
				}
				else if(confirmObj.options === 3) {//cancel
					retVal.id 	= 146;
					retVal.msg 	= helper.retval[146];
					logger.debug('return from media/paste/confirm.js.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal);
				}
				else {//wrong parameter 
					logger.debug('return from media/paste/confirm.js for bad parameter.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal); 
				} 
			});
		});
	}
}
		
module.exports = ConfirmPaste;

