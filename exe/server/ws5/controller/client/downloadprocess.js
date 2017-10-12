var url 	= require('url');
var path 	= require('path');
var util 	= require('util');
var fs	 	= require('fs');
var hfs	 	= require('hfs');
var qs	 	= require('querystring');
var AdmZip	= require('adm-zip');
var ControllerHelper = require('./controllerhelper');
var TaskManager 	= require('./taskmanager');
var DownloadQueue 	= require('./downloadqueue');

var helper 	= new ControllerHelper();
var logger 	= helper ? helper.logger : null;

var newTaskIn			= false;
var startImmediately	= false;
var taskmanager 		= null;
var cookieFromServer 	= '';

var Emitter 			= require('events').EventEmitter;
var downloadEmitter		= (new Emitter);
var taskObj 			= {};
var newTaskObj 			= {};
var fileObj 			= {};
var queueItem 			= {};
var downloadqueue		= null;
var controllerConfig 	= null;		
var timeoutHandler 		= null;

var taskIsRunning		= false;


console.log('start to download');	

//This function walk through the whole folder to get its file and subfolder, then output them into an object array. 
var getFileFolderList = function(fileFolderPath, oneLevel, callback) {
	var Emitter 	= require('events').EventEmitter;
	var emitter		= (new Emitter);
	var outputArray	= [];
	var pendingArray= [];
	var folderObj	= {};
	var regWidgetFolderFormat = /^(\.)(.*)(\.files)$/;
	var regZIPFolderFormat = /^(\.)(.*)(\.zipfiles)$/;

	emitter.on('finished', function() {
		pathObj = {};
		pathObj = pendingArray.pop();
		if(!pathObj)
		{
			return callback('', outputArray);
		}
		
		getOneLevelFileFolderList(pathObj);
	});
	
	emitter.on('failed', function(err) {
		return callback(err, []);
	});
	
	function getOneLevelFileFolderList(folderObj) {
		if(!folderObj || !folderObj.localpath) {
			emitter.emit('failed', 'wrong path');
			return;
		}
		
		var exist	= false;
		try{
			exist = fs.existsSync(folderObj.localpath);
		}
		catch(e) { 
			this.logger.error('exception occurs when check folder (%s) existence.', folderObj.localpath);
			this.logger.error(e);
			emitter.emit('failed', 'exception when check exitence');
			return; 
		}
		
		if(!exist) {
			emitter.emit('finished');
			return;
		}
		
		
		fs.readdir(folderObj.localpath, function(err, files) {
			var obj 	= {};
			var index	= 0;
			var stats 	= null;
			
			if(err || !files) {
				logger.error('error occurs when read dir. ' + err);
				emitter.emit('failed', 'read folder error');
				return;
    		}
    		
    		for(index = 0 ; index < files.length; index++) {
    			obj = {};
    			obj.localpath = folderObj.localpath + path.sep + files[index];;
    			
    			try {
	    			stats = fs.lstatSync(obj.localpath);
					if(stats.isDirectory()) {
						obj.type = 'folder';
					}
					else if(stats.isFile()) {
						obj.type = 'file';
					}
					else if(stats.isSymbolicLink()) {
						obj.type = 'link';
					}
					
					//not check the file under widget or zip folder, but keep this folder
					if((obj.type === 'folder') && (regWidgetFolderFormat.test(files[index]) === true)) {
						outputArray.push(obj);
					}
					else if((obj.type === 'folder') && (regZIPFolderFormat.test(files[index]) === true)) {
						outputArray.push(obj);
					}
					else {
						outputArray.push(obj);
						if((obj.type === 'folder') && (!oneLevel)) { pendingArray.push(obj); }
					}
	    		}
	    		catch(e) {
					logger.error('exception occurs when call lstatSync().');
					logger.error(e);
    				emitter.emit('failed', 'exception');
    				return;
    			}
    		}
    		
    		emitter.emit('finished');
		});
	}
	
	if(!fileFolderPath) { 
		return callback('empty input', []); 
	}
	
	folderObj = {};
	folderObj.localpath = fileFolderPath;
	
	folderObj.type = 'folder';
	
//	if(!oneLevel) { outputArray.push(folderObj); } //if oneLevel === true, that means only get its sub node.
	pendingArray.push(folderObj);
	
	emitter.emit('finished');
}

var removeUnusedMedia = function(callback) {
	var downloadFolderPath 	= '';
	var mediaArray			= [];
	var mediaObj			= {};
	var publishFolder		= '';
	var mediaFolder			= '';
	var alertFolder			= '';
	var preloadFolder		= '';
	var upgradeFolder		= '';
	var mediaListMappingArray 	= [];
	var playlistMappingArray 	= [];
	var widgetMappingArray 		= [];
	var regWidgetFolderFormat 	= /^(\.)(.*)(\.files)$/;
	var zipMappingArray 		= [];
	var regZIPFolderFormat 	= /^(\.)(.*)(\.zipfiles)$/;
	
	var buildDateString = function(year, month, date) {//to yyyy:mm:dd
		var dateString = '';
		
		dateString = year + ':';
		if(month < 10) { dateString += '0' + month + ':'; }
		else { dateString += month + ':'; }
		
		if(date < 10) { dateString += '0' + date; }
		else { dateString += date; }
		
		return dateString;
	}
	
	var putPathIntoArray = function(mediaLocalpath, mappingArray, mediaArray) {
		var mediaFolderArray = [];
		var tempPath 	= '';
		var libBasePath = helper.fileLibPath + path.sep + controllerConfig.sitename;
		var tempObj 	= {};
		
		if(!mediaLocalpath || !mappingArray || !mediaArray || !util.isArray(mappingArray) || !util.isArray(mediaArray)) {
			return;
		}
		
		tempString = path.dirname(mediaLocalpath);
		while(tempString && (tempString !== libBasePath)) {
			if(mappingArray.indexOf(tempString) === -1) {
				mappingArray.push(tempString);
				
				tempObj = {};
				tempObj.localpath = tempString;
				tempObj.type = 'folder';
				
				mediaArray.push(tempObj);
			}
			
			tempString = path.dirname(tempString);
			
			if(path.dirname(tempString) === tempString) { break; }
		} 
		
		return;
	}
	
	var collectMediaToMap = function(mediaPath, mediaType, mediaListMappingArray, mediaArray) {
		var mediaFileObj 	= {};
		var mediaJsonObj 	= {};

		mediaFileObj.localpath = path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + mediaPath);
		mediaFileObj.type   	 = mediaType;

		mediaJsonObj.localpath  = path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + getJsonFilePath(mediaPath));
		mediaJsonObj.type		= 'json';

		if(mediaListMappingArray.indexOf(mediaFileObj.localpath) === -1) {
			mediaListMappingArray.push(mediaFileObj.localpath);
			mediaArray.push(mediaFileObj);
		}
		
		if(mediaListMappingArray.indexOf(mediaJsonObj.localpath) === -1) {
			mediaListMappingArray.push(mediaJsonObj.localpath);
			mediaArray.push(mediaJsonObj);
		}

		putPathIntoArray(mediaFileObj.localpath, mediaListMappingArray, mediaArray);
		
		return mediaFileObj;
	}

	//get all pbulish data file
	downloadFolderPath = path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename);
	publishFolder 	= downloadFolderPath + path.sep + 'publish';
	alertFolder 	= downloadFolderPath + path.sep + 'publish' + path.sep + 'alert';
	preloadFolder 	= downloadFolderPath + path.sep + 'publish' + path.sep + 'preload';
	mediaFolder 	= downloadFolderPath + path.sep + 'media';
	upgradeFolder 	= downloadFolderPath + path.sep + 'publish' + path.sep + 'upgrade';
	
	//get media from alert data file
	getFileFolderList(alertFolder, false, function(err, alertList) {
		var dataObj 		= {};
		var playlistArray	= [];
		var widgetArray		= [];
		
		var publishListIndex = 0;
		var publishListSize = 0;
		var today			= null;
		var todayDateString = '';
		
		var playlistList	= [];
		var playlistNumber	= 0;
		var playlistIndex	= 0;
		var playlistFileObj = {};
		var playlistJsonObj = {};

		var mediaList		= [];
		var mediaIndex		= 0; 
		var mediaNumber		= 0;
		var mediaFileObj 	= {};
		var mediaJsonObj 	= {};
		
		var widgetNumber	= 0;
		var widgetIndex		= 0;
		var fileName 		= '';
		var filePath 		= '';
		var widgetFolderLocalPath = '';
		var internalMediaListFilePath = '';
		
		var alertFileNumber	= 0;
		var alertFileIndex	= 0;
		var alertDataPath	= '';
		var alertMediaList	= [];
		var alertNumber		= 0;
		var alertIndex		= 0;
			
		var preloadFileNumber	= 0;
		var preloadFileIndex	= 0;
		var preloadDataPath		= '';
		var preloadMediaList	= [];
		var preloadNumber		= 0;
		var preloadIndex		= 0;
			
		var upgradeFileNumber	= 0;
		var upgradeFileIndex	= 0;
		var upgradeDataPath		= '';
		var upgradeMediaList	= [];
		var upgradeNumber		= 0;
		var upgradeIndex		= 0;
		
		//not care error of alert, becasue maybe no alert in there.
		//if(err) { return; }
	
//console.log('alertList=');
//console.log(alertList);
		if(alertList && (alertList.length > 0)) {
			alertFileNumber = alertList.length;
			for(alertFileIndex = 0; alertFileIndex < alertFileNumber; alertFileIndex++) {
				dataObj = {};
				dataObj = helper.getDataObj(alertList[alertFileIndex].localpath);
				
				if(dataObj && dataObj.mediaList && util.isArray(dataObj.mediaList) && (dataObj.mediaList.length > 0)) {
					alertNumber = 0;
					alertIndex = 0;
					alertMediaList = dataObj.mediaList;
					alertNumber = alertMediaList.length;
					
					for(alertIndex = 0; alertIndex < alertNumber; alertIndex ++) {
						mediaFileObj = {};
						mediaFileObj = collectMediaToMap(alertMediaList[alertIndex].path, alertMediaList[alertIndex].type, mediaListMappingArray, mediaArray);
						
						if(alertMediaList[alertIndex].type === 'widget') {
							if(widgetMappingArray.indexOf(mediaFileObj.localpath) === -1) {
								widgetMappingArray.push(mediaFileObj.localpath);
								widgetArray.push(mediaFileObj);
							}
						}
						else if(alertMediaList[alertIndex].type === 'playlist') {
							if(playlistMappingArray.indexOf(mediaFileObj.localpath) === -1) {
								playlistMappingArray.push(mediaFileObj.localpath);
								playlistArray.push(mediaFileObj);
							}
						}
					}
				}
			}
		}
		
		//get preload media
		getFileFolderList(preloadFolder, false, function(err, preloadList) {
//console.log('preloadList=');
//console.log(preloadList);
			if(preloadList && (preloadList.length > 0)) {
				preloadFileNumber = preloadList.length;
				for(preloadFileIndex = 0; preloadFileIndex < preloadFileNumber; preloadFileIndex++) {
					dataObj = {};
					dataObj = helper.getDataObj(preloadList[preloadFileIndex].localpath);
					
					if(dataObj && dataObj.mediaList && util.isArray(dataObj.mediaList) && (dataObj.mediaList.length > 0)) {
						preloadNumber = 0;
						preloadIndex = 0;
						preloadMediaList = dataObj.mediaList;
						preloadNumber = preloadMediaList.length;
						
						for(preloadIndex = 0; preloadIndex < preloadNumber; preloadIndex ++) {
							mediaFileObj = {};
							mediaFileObj = collectMediaToMap(preloadMediaList[preloadIndex].path, preloadMediaList[preloadIndex].type, mediaListMappingArray, mediaArray);
						
							if(preloadMediaList[preloadIndex].type === 'widget') {
								if(widgetMappingArray.indexOf(mediaFileObj.localpath) === -1) {
									widgetMappingArray.push(mediaFileObj.localpath);
									widgetArray.push(mediaFileObj);
								}
							}
							else if(preloadMediaList[preloadIndex].type === 'playlist') {
								if(playlistMappingArray.indexOf(mediaFileObj.localpath) === -1) {
									playlistMappingArray.push(mediaFileObj.localpath);
									playlistArray.push(mediaFileObj);
								}
							}
						}
					}
				}
			}
		
			//get upgrade media
			getFileFolderList(upgradeFolder, false, function(err, upgradeList) {
				if(upgradeList && (upgradeList.length > 0)) {
					upgradeFileNumber = upgradeList.length;
					var checkingDate = new Date(new Date() - 86400000).toISOString().slice(0, 10).replace(/\-/g, ':');
					var now = new Date().toISOString().slice(0, 10).replace(/\-/g, ':');
					
					for(upgradeFileIndex = 0; upgradeFileIndex < upgradeFileNumber; upgradeFileIndex++) {
						dataObj = {};
						dataObj = helper.getDataObj(upgradeList[upgradeFileIndex].localpath);
						
						if(dataObj && !dataObj.starttime) {
							dataObj.starttime = now;
						}
						
						if(dataObj && dataObj.mediaList && util.isArray(dataObj.mediaList) && (dataObj.mediaList.length > 0) && (dataObj.starttime.slice(0, 10) > checkingDate)) {
							upgradeNumber = 0;
							upgradeIndex = 0;
							upgradeMediaList = dataObj.mediaList;
							upgradeNumber = upgradeMediaList.length;
							
							for(upgradeIndex = 0; upgradeIndex < upgradeNumber; upgradeIndex ++) {
								if(upgradeMediaList[upgradeIndex].path) {
									mediaFileObj = {};
									mediaFileObj = collectMediaToMap(upgradeMediaList[upgradeIndex].path, upgradeMediaList[upgradeIndex].type, mediaListMappingArray, mediaArray);
								}
							}
						}
					}
				}
		
//console.log('media list is:');
//console.log(mediaArray);
//console.log('widget array is:');
//console.log(widgetArray);
//console.log('zip array is:');
//console.log(zipArray);

//console.log('publishFolder is:');
//console.log(publishFolder);
				getFileFolderList(publishFolder, false, function(err, publishList) {
//console.log('publish list is:');
//console.log(publishList);
		
			
					if(err) { return callback(1); }
					
					if(!publishList || !util.isArray(publishList) || !publishList.length) { return callback(0); }

					//parse each schedule file
					publishListSize = publishList.length;
					for(publishListIndex = 0 ; publishListIndex < publishListSize; publishListIndex++) {
						dataObj = {};
						if((publishList[publishListIndex].type === 'file') && (path.extname(publishList[publishListIndex].localpath) === '.publ')) {
							dataObj = helper.getDataObj(publishList[publishListIndex].localpath);
							
							
							if(dataObj && dataObj.listArray && (dataObj.listArray.length > 0)) {
								today = new Date();
								todayDateString = buildDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
								
								//check it is expired or not
								if(todayDateString <= dataObj.endDate) {
									playlistList	= dataObj.listArray;
									playlistNumber 	= playlistList.length;
									
									for(playlistIndex = 0; playlistIndex < playlistNumber; playlistIndex++) {
										playlistFileObj = {};
										playlistFileObj = collectMediaToMap(playlistList[playlistIndex].playlistpath, 'playlist', mediaListMappingArray, mediaArray);
										
										if(playlistMappingArray.indexOf(playlistFileObj.localpath) === -1) {
											playlistMappingArray.push(playlistFileObj.localpath);
											playlistArray.push(playlistFileObj);
										}
									}
								}
							}
						}
					}
//console.log('playlistArray is:');
//console.log(playlistArray);
			
					//parse each playlist to get its media
					playlistNumber	= playlistArray.length;
					playlistIndex	= 0;
					for(playlistIndex = 0 ; playlistIndex < playlistNumber; playlistIndex++) {
						dataObj = {};
						if(playlistArray[playlistIndex].type === 'playlist') {
							dataObj = helper.getDataObj(playlistArray[playlistIndex].localpath);
							
							if(dataObj && dataObj.filedata && dataObj.filedata.zones && util.isArray(dataObj.filedata.zones) && (dataObj.filedata.zones.length > 0)) {
								var zoneList = dataObj.filedata.zones;
								var zoneNumber = zoneList.length;
								
								for(var zoneIndex = 0 ; zoneIndex < zoneNumber; zoneIndex++) {
									if(zoneList && (zoneList[zoneIndex].eventZone !== 'true') && zoneList[zoneIndex].media && util.isArray(zoneList[zoneIndex].media) && (zoneList[zoneIndex].media.length > 0)) {
										mediaList	= zoneList[zoneIndex].media;
										mediaNumber = mediaList.length;
										
										for(mediaIndex = 0; mediaIndex < mediaNumber; mediaIndex++) {
											mediaFileObj = {};
											mediaFileObj = collectMediaToMap(mediaList[mediaIndex].path, mediaList[mediaIndex].type, mediaListMappingArray, mediaArray);
										
											if(mediaList[mediaIndex].type === 'widget') {
												if(widgetMappingArray.indexOf(mediaFileObj.localpath) === -1) {
													widgetMappingArray.push(mediaFileObj.localpath);
													widgetArray.push(mediaFileObj);
												}
											}
										}
									}
								}
								
								var eventMediaNumber = 0;
								var eventMediaIndex = 0;
								if(dataObj.filedata.extraMedia && dataObj.filedata.extraMedia.length) {
									eventMediaNumber = dataObj.filedata.extraMedia.length;
									for(eventMediaIndex = 0; eventMediaIndex < eventMediaNumber; eventMediaIndex++ ) {
										mediaFileObj = {};
										mediaFileObj = collectMediaToMap(dataObj.filedata.extraMedia[eventMediaIndex].path, dataObj.filedata.extraMedia[eventMediaIndex].type, mediaListMappingArray, mediaArray);
				
										if(dataObj.filedata.extraMedia[eventMediaIndex].type === 'widget') {
											if(widgetMappingArray.indexOf(mediaFileObj.localpath) === -1) {
												widgetMappingArray.push(mediaFileObj.localpath);
												widgetArray.push(mediaFileObj);
											}
										}
									}
								}
							}
						}
					}
					
					
					//parse each widget to get its media
					widgetNumber	= widgetArray.length;
					widgetIndex		= 0;
					for(widgetIndex = 0 ; widgetIndex < widgetNumber; widgetIndex++) {
						dataObj = {};
						if(widgetArray[widgetIndex].type === 'widget') {
							fileName = '';
							fileName = path.basename(widgetArray[widgetIndex].localpath);
							filePath = '';
							filePath = path.dirname(widgetArray[widgetIndex].localpath);
							widgetFolderLocalPath = '';
							widgetFolderLocalPath = filePath + path.sep + '.' + fileName + '.files';
							
							internalMediaListFilePath = '';
							internalMediaListFilePath = widgetFolderLocalPath + path.sep + 'data' + path.sep + 'media.json';
							dataObj = helper.getDataObj(internalMediaListFilePath);
							
							if(dataObj && util.isArray(dataObj) && (dataObj.length > 0)) {
								mediaNumber = dataObj.length;
								for(mediaIndex = 0 ; mediaIndex < mediaNumber; mediaIndex++ ) {
									mediaFileObj = {};
									mediaFileObj = collectMediaToMap(dataObj[mediaIndex].path, dataObj[mediaIndex].type, mediaListMappingArray, mediaArray);
			
									//not consider one widget include another widget case in here!!!!!!!!
									//may have problem.
								}
							}
						}
					}
				
//console.log('media list is:');
//console.log(mediaArray);
	
				
					//get all media
					getFileFolderList(mediaFolder, false, function(err, mediaList) {
						var totalMediaIndex  = 0;
						var totalMediaNumber = 0;
						var tempFolderName 	= '';
						var tempFolderPath 	= '';
						var widgetPath		= '';
						var zipPath		 	= '';
						var matchResult 	= [];
						
						var Emitter 	= require('events').EventEmitter;
						var emitter		= (new Emitter);
						
						if(err) { return callback(1); }
					
//console.log('total mediaList=');
//console.log(mediaList);

						totalMediaNumber = 	mediaList.length;
						for(totalMediaIndex = 0; totalMediaIndex < totalMediaNumber; totalMediaIndex++) {
							if(mediaListMappingArray.indexOf(mediaList[totalMediaIndex].localpath) === -1) {
								mediaList[totalMediaIndex].used = false;
							}
							else {
								mediaList[totalMediaIndex].used = true;
							}
							
							if(mediaList[totalMediaIndex].type === 'folder') {
								tempFolderPath = path.dirname(mediaList[totalMediaIndex].localpath);
								tempFolderName = path.basename(mediaList[totalMediaIndex].localpath);
								
								if(regWidgetFolderFormat.test(tempFolderName) === true) { //widget folder
									matchResult = tempFolderName.match(regWidgetFolderFormat);
									if(matchResult) {
										widgetPath = '';
										widgetPath = tempFolderPath + path.sep + matchResult[2];
										if(mediaListMappingArray.indexOf(widgetPath) !== -1) { //the widget is in using
											mediaList[totalMediaIndex].used = true;
										}
									}
								}
								else if(regZIPFolderFormat.test(tempFolderName) === true) { //zip folder
									matchResult = tempFolderName.match(regZIPFolderFormat);
									if(matchResult) {
										zipPath = '';
										zipPath = tempFolderPath + path.sep + matchResult[2];
										if(mediaListMappingArray.indexOf(zipPath) !== -1) { //the zip is in using
											mediaList[totalMediaIndex].used = true;
										}
									}
								}
							}
						}
//console.log('total mediaList11111111111111=');
//console.log(mediaList);
	
	
						//delete useless media file and folder.
						emitter.on('DeleteUnusedMedia' , function(first) {
							if(!first) { totalMediaIndex++; }
							
							if(totalMediaIndex >= totalMediaNumber) {
								return callback(0);
							}
							
							if(mediaList[totalMediaIndex].used) {
								emitter.emit('DeleteUnusedMedia', false);
								return;
							}
							else {
								logger.debug('will remove unused media: ' + mediaList[totalMediaIndex].localpath);
console.log('will remove unused media: ' + mediaList[totalMediaIndex].localpath);
								hfs.del(mediaList[totalMediaIndex].localpath, function(err) {
									if(err) {
										logger.error('error occurs when call hfs.del() to remove media: ' + mediaList[totalMediaIndex].localpath);
										logger.error(err);
//console.log('error occurs when delete unused media or folder.');
//console.log(err);
//console.log('mediapath=' + mediaList[totalMediaIndex].localpath);								
									}
									
									emitter.emit('DeleteUnusedMedia', false);
								});
							}
						});
					
					
						totalMediaNumber = 	mediaList.length;
						totalMediaIndex = 0;
						emitter.emit('DeleteUnusedMedia', true);
					});
				});
			});
		});
	});
}

var getJsonFileName = function(fileName) {
	if(fileName) {
		return '.' + fileName + '.json';
	}
	else { return '';}
}

var getJsonFilePath = function(fileURLPath) {
	var fileName 	= '';
	var filePath 	= '';
	
	if(fileURLPath) {
		fileName = path.basename(fileURLPath);
		filePath = path.dirname(fileURLPath);
		return filePath + '/' + getJsonFileName(fileName);
	}
	else { return '';}
}

var prepareFileObj = function(lmt, start, end, type, revision) {
	var obj = {};
	
	obj.revision 		= revision || 0;
	obj.lastmodifytime 	= lmt;
	obj.starttime 		= start;
	obj.endtime 		= end;
	obj.receivetime 	= new Date();
	obj.failuretimes 	= 0;
	obj.type		 	= type; 
	
	return obj;
}

var generateRevisionPath = function(revision, filePath) {
	var revisionPath = '';
	var folderNameArray = [];

	revisionPath = filePath;
	
	//convert folder / file name to revision link name
	if(revision) {
		folderNameArray = filePath.split('/');
		revisionPath = '/' + folderNameArray[1];
		for(j = 2; j < folderNameArray.length; j++) {
			revisionPath += '/' + helper.config.playersettings.revisionprefix + revision + '_' + qs.escape(folderNameArray[j]) + helper.config.playersettings.revisionsuffix;
		}
	}

	return revisionPath;	
}

var pushMediaToDownloadQueue = function(mediaPath, lmt, start, end, mediaType, revision) {
		var FileObj	= {};
		
		FileObj = prepareFileObj(lmt, start, end, mediaType, revision);
		
		filePath 			= mediaPath;
		FileObj.localpath   = path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + filePath);
		
		var newFilePath		= generateRevisionPath(revision, filePath);
		urlObj 				= url.parse(controllerConfig.serverurl);
		FileObj.filepath 	= urlObj.protocol + '//' + urlObj.host + '/lib/' + controllerConfig.sitename + newFilePath;

		downloadqueue.appendFileToQueue(FileObj);
}

var parsePreloadFile = function(dataObj, start, end, revision) {
	var FileObj 		= {};
	var JsonObj 		= {};
	var fileNumber		= 0;
	var mediaList		= [];
	var filePath		= '';
	var folderNameArray = [];
	var urlObj			= {};
	var i 				= 0;
	var j 				= 0;
	
	if(!dataObj || !dataObj.mediaList || (dataObj.mediaList.length <= 0)) {
		logger.error('empty alert file.');
		logger.error(JSON.stringify(dataObj, '', 4));
		return;
	}
	
	mediaList	= dataObj.mediaList;
	fileNumber 	= mediaList.length;
	
	for(i = 0; i < fileNumber; i++) {
		pushMediaToDownloadQueue(mediaList[i].path, new Date(2000, 0, 1).toISOString(), start, end, mediaList[i].type, revision);
		pushMediaToDownloadQueue(getJsonFilePath(mediaList[i].path), new Date(2000, 0, 1).toISOString(), start, end, 'json', revision);
	}
	
	return;
}

var parseAlertFile = function(dataObj, start, end, revision) {
	var FileObj 		= {};
	var JsonObj 		= {};
	var fileNumber		= 0;
	var mediaList		= [];
	var filePath		= '';
	var folderNameArray = {};
	var urlObj			= {};
	var i 				= 0;
	var j 				= 0;
	
	
	if(!dataObj || !dataObj.mediaList || (dataObj.mediaList.length <= 0)) {
		logger.error('empty alert file.');
		logger.error(JSON.stringify(dataObj, '', 4));
		return;
	}
	
	mediaList	= dataObj.mediaList;
	fileNumber 	= mediaList.length;
	
	for(i = 0; i < fileNumber; i++) {
		pushMediaToDownloadQueue(mediaList[i].path, new Date(2000, 0, 1).toISOString(), start, end, mediaList[i].type, revision);
		pushMediaToDownloadQueue(getJsonFilePath(mediaList[i].path), new Date(2000, 0, 1).toISOString(), start, end, 'json', revision);
	}
	
	return;
}

var parseScheduleFile = function(dataObj, revision) {
	var playlistFileObj = {};
	var playlistJsonObj = {};
	var playlistNumber	= 0;
	var playlistList	= [];
	var filePath		= '';
	var folderNameArray = {};
	var urlObj			= {};
	var i 				= 0;
	var j 				= 0;
	var start			= '';
	var end				= '';
	
	
	if(!dataObj || !dataObj.listArray || (dataObj.listArray.length <= 0) || !dataObj.listArray[0].lastmodifytime) {
		logger.error('empty schedule file.');
		logger.error(JSON.stringify(dataObj, '', 4));
		return;
	}
	
	playlistList	= dataObj.listArray;
	playlistNumber 	= playlistList.length;
	
	for(i = 0; i < playlistNumber; i++) {
		if(playlistList[i].recurrence) {
			start = playlistList[i].recurrencesetting.startdate;
			end = playlistList[i].recurrencesetting.enddate;
		}
		else {
			start = playlistList[i].start.slice(0, 10);
			end = playlistList[i].end.slice(0, 10);
		}
		
		pushMediaToDownloadQueue(playlistList[i].playlistpath, playlistList[i].lastmodifytime, start, end, 'playlist', revision);
		pushMediaToDownloadQueue(getJsonFilePath(playlistList[i].playlistpath), playlistList[i].lastmodifytime, start, end, 'json', revision);
	}
	
	return;
}

var parsePlaylistFile = function(playlistObj, start, end, revision) {
	var zoneNumber  	= 0;
	var mediaNumber 	= 0;
	var zoneArray		= [];
	var mediaArray		= [];
	var mediaObj		= {};
	var zoneIndex   	= 0;
	var mediaIndex  	= 0;

	if(!playlistObj || !playlistObj.filedata || !playlistObj.filedata.zones || (playlistObj.filedata.zones.length <= 0)) {
		logger.error('empty playlist file.');
		logger.error(JSON.stringify(playlistObj, '', 4));
		return;
	}
	
	var dealPlaylistMedia = function(mediaObj, start, end, revision) {
		var j 				= 0;
		var mediaFileObj 	= {};
		var mediaJsonObj 	= {};
		var filePath		= '';
		var folderNameArray = {};
		var urlObj			= {};
		var mediaFolderArray = [];

		pushMediaToDownloadQueue(mediaObj.path, new Date(2000, 0, 1).toISOString(), start, end, mediaObj.type, revision);
		pushMediaToDownloadQueue(getJsonFilePath(mediaObj.path), new Date(2000, 0, 1).toISOString(), start, end, 'json', revision);

		return;
	}
	
	zoneArray = playlistObj.filedata.zones;
	zoneNumber = zoneArray.length;
	for(zoneIndex = 0 ; zoneIndex < zoneNumber; zoneIndex++) {
		if((zoneArray[zoneIndex].eventZone !== 'true') && zoneArray[zoneIndex].media && zoneArray[zoneIndex].media.length) {
			mediaArray = zoneArray[zoneIndex].media;
			mediaNumber = mediaArray.length;
			for(mediaIndex = 0; mediaIndex < mediaNumber; mediaIndex++) {
				dealPlaylistMedia(mediaArray[mediaIndex], start, end, revision);
			}
		}
	}
	
	var eventMediaNumber = 0;
	var eventMediaIndex = 0;
	if(playlistObj.filedata.extraMedia && playlistObj.filedata.extraMedia.length) {
		eventMediaNumber = playlistObj.filedata.extraMedia.length;
		for(eventMediaIndex = 0; eventMediaIndex < eventMediaNumber; eventMediaIndex++ ) {
			dealPlaylistMedia(playlistObj.filedata.extraMedia[eventMediaIndex], start, end, revision);
		}
	}
	
	return;
}

//unzip widget package then get its used media list, put those file into queue
var handleWidgetMedia = function(widgetLocalPath, start, end, revision) {
	var widgetFolderLocalPath 	= '';
	var filePath 			= '';
	var fileName 			= '';
	var mediaListArray 		= [];
	var widgetFileNumber	= 0;
	var widgetFileIndex		= 0;
	var folderNameArray 	= {};
	var urlObj				= {};
	var mediaFileObj 		= {};
	var mediaJsonObj 		= {};
	var widgetPath			= '';
	var internalMediaListFilePath = '';
	var siteLocalPath 		= '';
	
	if(!widgetLocalPath) {
		logger.error('empty widget file path.');
		return;
	}
	
	//for preloaduc task, the initialpath is just widget path, so its json file is not downloaded, need download it in here.
	//convert local path to relative path
	siteLocalPath				= helper.fileLibPath + path.sep + controllerConfig.sitename;
	widgetPath					= widgetLocalPath.slice(siteLocalPath.length).replace(/\\/g, '\/');
	pushMediaToDownloadQueue(getJsonFilePath(widgetPath), new Date(2000, 0, 1).toISOString(), start, end, 'json', revision);
	
	fileName = path.basename(widgetLocalPath);
	filePath = path.dirname(widgetLocalPath);
	widgetFolderLocalPath = filePath + path.sep + '.' + fileName + '.files';
	
	//unzip the widget package
	try {
//console.log('widgetLocalPath=' + widgetLocalPath);
//console.log('widgetFolderLocalPath=' + widgetFolderLocalPath);
	    // reading archives
	    var zip = new AdmZip(widgetLocalPath);

	    // extracts everything
	    zip.extractAllTo(/*target path*/widgetFolderLocalPath, /*overwrite*/true);
		}
		catch(e) {
//console.log('exception when unzip widget media package after download. ' + e);
		logger.error('error occurs when extract widget zip file. ' + e);
		return;
	}
	
	//get the media used in this widget then download them
	internalMediaListFilePath = widgetFolderLocalPath + path.sep + 'data' + path.sep + 'media.json';
	mediaListArray = helper.getDataObj(internalMediaListFilePath);
//console.log('mediaListArray=');
//console.log(mediaListArray);
	if(mediaListArray && util.isArray(mediaListArray) && (mediaListArray.length > 0)) {
		widgetFileNumber = mediaListArray.length;
		for(widgetFileIndex = 0 ; widgetFileIndex < widgetFileNumber; widgetFileIndex++ ) {
			pushMediaToDownloadQueue(mediaListArray[widgetFileIndex].path, new Date(2000, 0, 1).toISOString(), start, end, mediaListArray[widgetFileIndex].type, revision);
			pushMediaToDownloadQueue(getJsonFilePath(mediaListArray[widgetFileIndex].path), new Date(2000, 0, 1).toISOString(), start, end, 'json', revision);
		}
	}
}

//unzip zip package
var handleZIPMedia = function(zipLocalPath, start, end, revision) {
	var mediaJsonObj 		= {};
	var siteLocalPath 		= '';
	var filePath			= '';
	var fileName 			= '';
	var zipPath				= '';
	var folderNameArray 	= {};
	var urlObj				= {};
	var zipFolderLocalPath 	= '';

	if(!zipLocalPath) {
		logger.error('empty zip file path.');
		return;
	}
	
	//for preloaduc task, the initialpath is just zip path, so its json file is not downloaded, need download it in here.
	//convert local path to relative path
	siteLocalPath			= helper.fileLibPath + path.sep + controllerConfig.sitename;
	zipPath					= zipLocalPath.slice(siteLocalPath.length).replace(/\\/g, '\/');
	pushMediaToDownloadQueue(getJsonFilePath(zipPath), new Date(2000, 0, 1).toISOString(), start, end, 'json', revision);

	
	fileName = path.basename(zipLocalPath);
	filePath = path.dirname(zipLocalPath);
	zipFolderLocalPath = filePath + path.sep + '.' + fileName + '.zipfiles';
	
	/* fuli 20151228 for admzip can not extract big zip file(1.1GB) 
	//unzip the zip package
	try {
console.log('zipLocalPath=' + zipLocalPath);
console.log('zipFolderLocalPath=' + zipFolderLocalPath);
	    // reading archives
	    var zip = new AdmZip(zipLocalPath);
console.log('before extract');

	    // extracts everything
	    zip.extractAllTo(zipFolderLocalPath, true);
		}
		catch(e) {
console.log('exception when unzip zip media package after download. ' + e);
		logger.error('error occurs when extract zip file. ' + e);
		return;
	}
	*/
    helper.decompressFile(zipLocalPath, zipFolderLocalPath, function(err) {
    	if(err) {
//console.log('exception when unzip zip media package after download. ' + err);
			logger.error('error occurs when extract zip file. ' + err);
    	}
		return;
    });
}

//update Download status into local file
var updateDownloadInfo = function(queueFilePath, queueSize) {
	var dataFilePath = helper.fileLibPath + path.sep + 'task' + path.sep + 'downloadInfo.json';
	var newObj = {};
	
	if(!queueFilePath) {
		logger.error('pass empty path of queue.');
		return;
	}
	
	newObj = {};
	newObj.queuePath 	= queueFilePath;
	newObj.remain 		= queueSize;
	newObj.downloaded 	= 1;
	newObj.modifyTime 	= new Date();
	
	fs.exists(dataFilePath, function(exists) {
		var queueArray = null;
		var newQueueArray = [];
		
		if(exists) {
			queueArray = helper.getDataObj(dataFilePath);	
		}

		if(!queueArray || !util.isArray(queueArray) || !queueArray.length) {
			queueArray = [];
			queueArray.push(newObj);
		}
		else {
			var itemIndex = 0;
			var itemNumber = queueArray.length;
			
			for(itemIndex = 0 ; itemIndex < itemNumber; itemIndex++) {
				if(queueFilePath === queueArray[itemIndex].queuePath) {
					break;
				}
			}
			
			if(itemIndex < itemNumber) {
				queueArray[itemIndex].remain 		= queueSize;
				queueArray[itemIndex].downloaded 	+= 1;
				queueArray[itemIndex].modifyTime 	= new Date();
			}
			else {
				queueArray.push(newObj);
			}
		}
		
		//remove the old item
			//the old file will be removed in cluster.js when controller startup every time 
		
		
		
		helper.writeDataFile(dataFilePath, queueArray);
	});
}

var resetTimeoutHandler = function(newTimeOutMS){
	//logger.error('resetTimeoutHandler(%d), current handler:%d', newTimeOutMS, timeoutHandler);
	if(timeoutHandler) 
	{
		clearTimeout(timeoutHandler);
		timeoutHandler = null;
	}
	if(newTimeOutMS >= 0)timeoutHandler = setTimeout(startToDownloadWrapper, newTimeOutMS);
	return;
}

var downloadFunc = function(url, localPath, cookie) {
	var configsetting = [];
	var settingObj = {};
	
	if(!url || !localPath) {
		downloadEmitter.emit('DownloadNextFile', 4, 'error');
		return;
	}
	
	helper.downloadFile(url, localPath, cookie, controllerConfig.proxy, function(err, speed) {
//console.log('finished download.' + err);
		if(err) {
			//depends on error type, if need retry should update the file object and remove the current one then append it to the end of queue
			downloadEmitter.emit('DownloadNextFile', err, 'error');
			return;
		}
		
		if(speed) {
			controllerConfig.downloadspeed = speed;
			settingObj = {}; 
			settingObj.name = 'downloadspeed'; 
			settingObj.value = controllerConfig.downloadspeed; 
			configsetting.push(settingObj); 
			
			process.send({'configsetting': { 'from': 'downloadprocess', 'data': configsetting}});
		}

		downloadEmitter.emit('DownloadNextFile', 0, 'finished');
		return;
	});
}

//deal with task download
downloadEmitter.on('DownloadNextFile', function(err, status) {
	var urlObj 			= {};
	var serverURL	 	= '';
	var localPath	 	= '';
	var taskType 	 	= '';
	var dataObj 		= {};
	var configsetting   = [];
	var settingObj		= {};
	var currentDate		= new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10).replace(/\-/g, ':');
	var dealItNextTime	= false;
	
//console.log('enter event.');
	//if no task, then wait for next cycle
	if(!taskObj || !taskObj.taskid || !queueItem || !downloadqueue) {
//console.log('will enter after.' + helper.config.playersettings.defaultinterval);
//console.log('now = ' + new Date());
	
		resetTimeoutHandler(-1);		
		process.nextTick(function() {
//console.log('set time output in next tick.')
			resetTimeoutHandler(helper.config.playersettings.defaultinterval);
			return;
		});		
		return;
	}
	
//console.log('err =' + err);
	if(err) {//check the error type
		if(err === 4) { //error data
			//remove the finished file item and get the next one
			downloadqueue.removeFileFromQueue();
		}
		else if(err === 21) { //file error or file does not exist.
//console.log('remove from queue for file does not exist.');			
			logger.error('remove from queue for file does not exist.');			
			logger.error(queueItem);			
			queueItem = downloadqueue.removeFileFromQueue();
		}
		else {
//console.log('error return from download function.');
//console.log(err);			
//console.log(queueItem);			
//console.log('retried ' + queueItem.failuretimes + ' times.');			
			queueItem.failuretimes ++;
			var curTaskType = taskObj.tasktype.slice(2);
			
			if(queueItem.failuretimes <= helper.config.playersettings.downloadretrytimes) 
			{
				downloadqueue.appendFileToQueue(queueItem);
				queueItem = downloadqueue.removeFileFromQueue();
			}
			else if ((queueItem.endtime >= currentDate) && ((curTaskType === 'schedule') || (curTaskType === 'channel') || (curTaskType === 'upgrade') || (curTaskType === 'preload'))) {//not expire
				//move it to end
				downloadqueue.appendFileToQueue(queueItem);
				queueItem = downloadqueue.removeFileFromQueue();

				if(downloadqueue.isAllRetried()) {
//console.log('not expire, need wait a while then dwonload');				
					downloadqueue.clearRetrytimes();
					queueItem = null;
					dealItNextTime = true;
				}
			}
			else {//expired
//console.log('remove from queue.');			
				queueItem = downloadqueue.removeFileFromQueue();
			}
		}
	}
	
	if(status === 'finished') {
		//if it is playlist, schedule, uc, parse it and append its sub file to download queue
		//also inherit the revision from parent
		//set filepath, localpath and type into queue obj
//console.log('downloaded the file:');
//console.log(queueItem);	
		if(queueItem && (queueItem.type === 'schedule')) {
			dataObj = helper.getDataObj(queueItem.localpath);
			parseScheduleFile(dataObj, queueItem.revision);
		}
		else if(queueItem && (queueItem.type === 'playlist')){
			dataObj = helper.getDataObj(queueItem.localpath);
			parsePlaylistFile(dataObj, queueItem.starttime, queueItem.endtime, queueItem.revision);
		}
		else if(queueItem && (queueItem.type === 'uc')){
			dataObj = helper.getDataObj(queueItem.localpath);
			parseAlertFile(dataObj, queueItem.starttime, queueItem.endtime, queueItem.revision);
		}
		else if(queueItem && (queueItem.type === 'preload')){
			dataObj = helper.getDataObj(queueItem.localpath);
			parsePreloadFile(dataObj, queueItem.starttime, queueItem.endtime, queueItem.revision);
		}
		else if(queueItem && (queueItem.type === 'upgrade')){
			dataObj = helper.getDataObj(queueItem.localpath);
			parsePreloadFile(dataObj, queueItem.starttime, queueItem.endtime, queueItem.revision);
		}
		else if(queueItem && (queueItem.type === 'widget')){
			handleWidgetMedia(queueItem.localpath, queueItem.starttime, queueItem.endtime, queueItem.revision);
		}
		else if(queueItem && (queueItem.type === 'zip')){
			handleZIPMedia(queueItem.localpath, queueItem.starttime, queueItem.endtime, queueItem.revision);
		}
		
		
		//remove the finished file item and get the next one
		queueItem = downloadqueue.removeFileFromQueue();
//console.log('get new item:');
//console.log(queueItem);	

		//set download queue info
		var queueSize = downloadqueue.size();

		//update Download status into local file
		updateDownloadInfo(downloadqueue.getQueueFilePath(), queueSize);
		
		configsetting = [];
		controllerConfig.downloadprogress = queueSize;
		settingObj = {}; 
		settingObj.name = 'downloadprogress'; 
		settingObj.value = controllerConfig.downloadprogress; 
		configsetting.push(settingObj); 
		
		if(queueSize === 0) {
			controllerConfig.downloadspeed = '';
			settingObj = {}; 
			settingObj.name = 'downloadspeed'; 
			settingObj.value = controllerConfig.downloadspeed; 
			configsetting.push(settingObj);
		}
		process.send({'configsetting': { 'from': 'downloadprocess', 'data': configsetting}});
	}
			
	//check have new task or not, if have, then refresh the task list,
	if(newTaskIn) {
		newTaskIn = false;
console.log('got new task message.')		
		//refresh task list
		taskmanager.loadTaskList();
	
		//get the highest priority task for download
		newTaskObj = taskmanager.getNewTask();

		//if the top task has high priority, stop current task
		if(newTaskObj.taskid !== taskObj.taskid) {
			if((newTaskObj.tasktype.slice(2) === 'preview') || (newTaskObj.tasktype.slice(2) === 'uc')) { startImmediately = true; }
			
			if(newTaskObj.tasktype.slice(2) === 'uc') { //remove alert folder to only keep one alert record
//console.log('uc task come in, remove the old uc data file.');
				var alertFolderLocalPath   	= path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + '/publish/alert');
				hfs.delSync(alertFolderLocalPath);
			}
			
			//if got new task and urgent than current one
			if(startImmediately) {
				startImmediately = false;
				resetTimeoutHandler(-1);
				
				process.nextTick(function() {
//console.log('set time output in next tick.')
					resetTimeoutHandler(1);
					return;
				});		
			}
			else {
				resetTimeoutHandler(helper.config.playersettings.defaultinterval);
			}
			return;
		}
	}
	
	if(queueItem && queueItem.filepath && (queueItem.type !== 'reject')) {
//console.log('download:');
//console.log(queueItem);	
		//download it
		var parameterArray = [];
		parameterArray.push(queueItem.filepath);
		parameterArray.push(queueItem.localpath);
		parameterArray.push(cookieFromServer);
		
		setTimeout(downloadFunc, 100, queueItem.filepath, queueItem.localpath, cookieFromServer);
	}
	else {
//console.log('check queue is empty or not.');
		if(queueItem && (queueItem.type === 'reject')) {
//console.log('it is reject task, will remove this task.');
			downloadqueue.removeFileFromQueue();
//console.log('is it the queue changed to empty? ' + downloadqueue.isEmpty());
		}
		
		if(downloadqueue.isEmpty() || dealItNextTime) {
//console.log('empty.');
			taskType = taskObj.tasktype.slice(2);
			
			//finished one task, need to inform render if it is related with current playing
			//check this task is related with current playling or not ---- current playing schedule changed, uc published, preview task received.
			//then set config to let render know when heartbeat the next time.
			if((taskType === 'uc') && !dealItNextTime) {
				//inform render
				configsetting = [];
				controllerConfig.uc = true;
				settingObj = {}; 
				settingObj.name = 'uc'; 
				settingObj.value = controllerConfig.uc; 
				configsetting.push(settingObj); 
				
				controllerConfig.ucduration = parseInt(taskObj.dur, 10);
				settingObj = {}; 
				settingObj.name = 'ucduration'; 
				settingObj.value = controllerConfig.ucduration; 
				configsetting.push(settingObj); 
				
				var alertDataFileLocalPath = path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + taskObj.initialpath);
				var alertdataObj = helper.getDataObj(alertDataFileLocalPath);
				controllerConfig.ucmedia = (alertdataObj && alertdataObj.mediaList) ? alertdataObj.mediaList : [];
				settingObj = {}; 
				settingObj.name = 'ucmedia'; 
				settingObj.value = controllerConfig.ucmedia; 
				configsetting.push(settingObj); 
				
				process.send({'configsetting': { 'from': 'downloadprocess', 'data': configsetting}});
				helper.invokeRenderHB();
			}
			else if((taskType === 'upgrade') && !dealItNextTime) {
				//inform render
				var upgradeDataFileLocalPath = path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + taskObj.initialpath);
				var upgradedataObj = helper.getDataObj(upgradeDataFileLocalPath);
		  		var starttime = null;
		  		var packagePath = '';
		  		
				if(upgradedataObj) {
					packagePath = upgradedataObj.mediaList[0].path;
					
					if(packagePath) {
						if(upgradedataObj.starttime) {
							var starttimeString = upgradedataObj.starttime;
					  		var year = month = day = hour = minute = second = ms = 0;
					  		var dateArray = [];
					  		
							dateArray = starttimeString.split(':');
							if(dateArray.length === 3) {
								year = parseInt(dateArray[0], 10); 
								month = parseInt(dateArray[1], 10); 
								day = parseInt(dateArray[2], 10); 
							}
							else {
								year = parseInt(dateArray[0], 10); 
								month = parseInt(dateArray[1], 10); 
								day = parseInt(dateArray[2], 10); 
								hour = parseInt(dateArray[3], 10); 
								minute = parseInt(dateArray[4], 10); 
								second = parseInt(dateArray[5].slice(0, 2), 10); 
								ms = parseInt(dateArray[5].slice(3), 10);
							}
							starttime = new Date(year, month - 1, day, hour, minute, second, ms);
						}
						else {
							starttime = 0;
						}
					}
					else {
						starttime = 0;
						packagePath	= '';
					}
				}
				
				configsetting = [];

				controllerConfig.upgradestarttime = starttime;
				settingObj = {}; 
				settingObj.name = 'upgradestarttime'; 
				settingObj.value = controllerConfig.upgradestarttime; 
				configsetting.push(settingObj); 
				
				controllerConfig.packagepath = packagePath;
				settingObj = {}; 
				settingObj.name = 'packagepath'; 
				settingObj.value = controllerConfig.packagepath; 
				configsetting.push(settingObj); 
				
				process.send({'configsetting': { 'from': 'downloadprocess', 'data': configsetting}});
			}
			else if((taskType === 'preview') && !dealItNextTime) {
				//need to regenerate playing schedule file
				
				
				//inform render
				configsetting = [];
				controllerConfig.needreload = true;
				settingObj = {}; 
				settingObj.name = 'needreload'; 
				settingObj.value = controllerConfig.needreload; 
				configsetting.push(settingObj); 
				
				controllerConfig.lastdesktoppath = '';
				settingObj = {}; 
				settingObj.name = 'lastdesktoppath'; 
				settingObj.value = controllerConfig.lastdesktoppath; 
				configsetting.push(settingObj); 
				
				process.send({'configsetting': { 'from': 'downloadprocess', 'data': configsetting}});
			}
			else {
				if((taskType === 'schedule') || (taskType === 'channel') || (taskType === 'reject')) {
					var taskIncludeToday = function(task) {
						if(!task || !task.tasktype) {
							return false;
						}
						
						var today = new Date();
						var todayString = helper.buildDateTimeString(today.getFullYear(), today.getMonth() + 1, today.getDate(), 0,0,0,0).slice(0, 10);
						var tempStart = todayString + ":00:00:01.000"; //adding 1second is useful when make tempEnd=tempStart below
						var lastTimeOfParsedSchedule = new Date(controllerConfig.lastscheduleparsetime);
						var lastString = helper.buildDateTimeString(lastTimeOfParsedSchedule.getFullYear(), lastTimeOfParsedSchedule.getMonth() + 1, 
															lastTimeOfParsedSchedule.getDate(), lastTimeOfParsedSchedule.getHours(), lastTimeOfParsedSchedule.getMinutes(), 
															lastTimeOfParsedSchedule.getSeconds(), 0);
															
						var tempEnd = lastString;
//console.log('check including.');
						if(tempEnd < tempStart)
						{
							logger.error('tempStart(%s) after tempEnd(%s), should be the 1st publish task', tempStart, tempEnd);
							tempEnd = tempStart; //this is why adding 1 second on tempStart just. otherwise helper.withinRange may return false unexpectedly
						}						
						if(helper.withinRange(tempStart, tempEnd, task.starttime, task.endtime)) {
							logger.debug('the task affect current rendercontent.json.')
							return true;
						}						
						return false;
					}
					
					if(taskType === 'reject') {
						logger.debug('remove publish data file.');
						var publishFileLocalPath = '';
						publishFileLocalPath = path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + taskObj.initialpath);
						logger.debug('got reject task.');
						logger.debug('the publish file will be deleted is: ' + publishFileLocalPath);	
						try {
							fs.unlinkSync(publishFileLocalPath);
						}
						catch(e) {
							logger.error('error occur when delete rejected publish file. ' + publishFileLocalPath + ' ,  or the file does not exist.');
						}

/*meaningless
						try {
							var newFileName = 'rendercontent' + new Date().getTime() + '.json';
							var tempNewFilePath = helper.fileLibPath + path.sep + controllerConfig.sitename + path.sep + 'publish' + path.sep + newFileName;
							fs.unlinkSync(tempNewFilePath);
						}
						catch(e) {
							logger.error('error occur when delete rendercontent file. ' + tempNewFilePath + ' ,  or the file does not exist.');
						}				
*/
					}
					
					if((!taskmanager.getTaskDownloadTime(taskObj.taskid, taskObj.tasktype) || downloadqueue.isEmpty()) 
						 && taskIncludeToday(taskObj)) {//not a retried task or all items are downloaded in the task
						if((taskType === 'reject') && (taskObj.noreload === true)) {//if still has following publish task, not set reload to render to avoid black screen
							logger.debug('still has following publish task, not generate new rendercontent.json.');
						}
						else {
							//merge schedules for all groups which the player belongs to
							helper.loadDynamicConfig(function(err, configObj) {
								if(err) {
console.log('error occurs when get controller config from DB. err=' + err);
									logger.error('error occurs when get controller config from DB. err=' + err);
									return;
								}
//console.log('got config.');
								
								controllerConfig = configObj || controllerConfig;
								if(!controllerConfig) { //config wrong
									return;
								}

								helper.mergeSchedulePlaylist(controllerConfig.belongs, controllerConfig.topfirst, controllerConfig, 'downloadprocess');
								logger.debug('finished generate new render content.    tasktype=' + taskType);
								
								//inform render to reload if the scope include today
								var lastTime = null;
								var nextTime = null;
								var timeString  = '';
								var timeString1 = '';
								var timeString2 = '';
								
								if(controllerConfig.lastgetscheduletime && controllerConfig.nextgetscheduletime) {
									lastTime = new Date(controllerConfig.lastgetscheduletime);
									nextTime = new Date(controllerConfig.nextgetscheduletime);
									timeString = new Date(lastTime.getTime() - lastTime.getTimezoneOffset() * 60000).toISOString();
									timeString1 = timeString.slice(0, 10).replace(/\-/g, ':') + ':' + timeString.slice(11, 23);
									timeString = '';
									timeString = new Date(nextTime - nextTime.getTimezoneOffset() * 60000).toISOString();
									timeString2 = timeString.slice(0, 10).replace(/\-/g, ':') + ':' + timeString.slice(11, 23);
									logger.debug('last get schedule at %s, next get schedule in %s.', timeString1, timeString2);
									logger.debug('task start time %s, end time %s', taskObj.starttime, taskObj.endtime);
									if(	   (timeString1.slice(0, 10) <= '2001:01:01') 
										|| (timeString2.slice(0, 10) <= '2001:01:01')
										|| (helper.withinRange(timeString1, timeString2, taskObj.starttime, taskObj.endtime) 
											&& !taskmanager.getTaskDownloadTime(taskObj.taskid, taskObj.tasktype))) 
									{ //NOT inform render if it is a failed task
										//delay a while to inform render to reload schedule to avoid the conflict when render just started --- render just restart will get reload event too.
										var delayMS = helper.config.playersettings.renderhbinterval;
										delayMS = 1000;//it seems no problem even render is just started now (render won't reset the players immediately for reset)
										setTimeout(function() {
											if((taskType === 'reject') && (taskObj.noreload === true)) {//if still has following publish task, not set reload to render to avoid black screen
												logger.debug('still has following publish task, not set reload to render to avoid black screen.');
												return;
											}
											
											
											logger.debug('the new task affect current gotten schedule in render, will let it reload.');
											controllerConfig.needreload = true;
											settingObj = {}; 
											configsetting = [];
											settingObj.name = 'needreload'; 
											settingObj.value = controllerConfig.needreload; 
											configsetting.push(settingObj); 
				
											controllerConfig.lastdesktoppath = '';
											settingObj = {}; 
											settingObj.name = 'lastdesktoppath'; 
											settingObj.value = controllerConfig.lastdesktoppath; 
											configsetting.push(settingObj); 
				
											process.send({'configsetting': { 'from': 'downloadprocess', 'data': configsetting}});
											//helper.invokeRenderHB();
										}, (taskType === 'reject') ? 1 : delayMS); //if it is reject, set flag right away to let render got empty media when get schedule.
									}
								}
							});
						}
					}
				} 
			}
			var nextCallInterval = helper.config.playersettings.defaultinterval;
		 	if(!dealItNextTime) {
				taskmanager.removeTask(taskObj);
				if(downloadqueue) {
//console.log('remove empty queue ' + downloadqueue.getQueueFilePath());
					try{
						fs.unlinkSync(downloadqueue.getQueueFilePath());	
						downloadqueue = null;
					}
					catch(e) {
						logger.error('exception occurs when delete download queue file. ' + downloadqueue.getQueueFilePath());
						logger.error(e);
					}
				}	
				//if there is other task in the manager, should exec the next loop soon (e.g. republish(reject + schedule))
				if(taskmanager.getTaskNumber() > 0) nextCallInterval = 10;
		 	}
			else {
				dealItNextTime = false;
				taskmanager.setTaskDownloadTime(taskObj.taskid, taskObj.tasktype, new Date(new Date().getTime() + 5 * 60000)); //redownload 5 minute later.
			}
			
			
			//if no task list file and file is empty, that means no task for downloading, then start a timer to check it periodly
//console.log('wait for next time coming.');
			resetTimeoutHandler(nextCallInterval);
		}
		else {
			logger.error('no queue item can be gotten, but it says the queue is not empty, may have problem.');
		}
	}
});
	

var startToDownload = function() {
	var urlObj 		= {};
	var now 		= new Date();
	var timeString 	= '';
	var queuePath	= '';
	var tempStart	= '';
	var tempEnd		= '';
	
	if(helper && !helper.config) {
		return;
	}
//console.log('check download.');
//logger.error(process.memoryUsage());
	
	//send active time back to parent process
	process.send({'action' : 'HB', 'HBTime': new Date() });
	logger.debug('download process send message to server for HBTime: ' + now);

	//initialize variables
	taskObj 		= {};
	newTaskObj 		= {};
	fileObj 		= {};
	queueItem 		= {};
	downloadqueue	= null;
	
	helper.loadDynamicConfig(function(err, configObj) {
		if(err) {
			console.log('error occurs when get controller config from DB. err=' + err);
			logger.error('error occurs when get controller config from DB. err=' + err);
			return;
		}
		
		controllerConfig = configObj;
		if(!controllerConfig) { //config wrong
			console.log('error occurs when get controller config from DB. err=' + err);
			return;
		}

		//refresh task list
		taskmanager.loadTaskList();
	
//console.log('enter a new loop.')		
		//get the highest priority task for download
		taskObj = taskmanager.getNewTask();
		if(taskObj) {
			logger.debug('The task got in download (' + process.pid + '):');
			logger.debug(taskObj);
		}
	
		//omit the old task
		timeString = now.toISOString().slice(0, 10).replace(/\-/g, ':');
		timeString += ':' + now.toISOString().slice(11, 23);
		if(taskObj && taskObj.endtime && (timeString >= (taskObj.endtime + ':24:00:00.000'))) {
			logger.debug('remove old task (' + taskObj.taskid + ') which should be ended at ' + taskObj.endtime);
			
//console.log('The task will be removed (' + process.pid + '):');
//console.log(timeString);
//console.log(taskObj.endtime + ':24:00:00.000');
//console.log(taskObj);
	
			taskmanager.removeTask(taskObj);
			resetTimeoutHandler(100);
			return;
		}
		
		if(taskObj) {
//console.log('The task will be processed (' + process.pid + '):');
//console.log(taskObj);
		}

		if(taskObj && taskObj.taskid && taskObj.tasktype && taskObj.initialpath) {
			if(taskObj.tasktype.slice(2) === 'uc') {
				var alertFolderLocalPath   	= path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + '/publish/alert');
//console.log('will delete alert folder: ' + alertFolderLocalPath );
				hfs.delSync(alertFolderLocalPath);
			}
			
			//initial download queue
			tempStart 	= taskObj.starttime || '';
			tempEnd 	= taskObj.endtime || '';
			queuePath 	= taskObj.tasktype.slice(2) + '_' + taskObj.taskid + '_' + tempStart.slice(0, 10).replace(/\:/g, '') + '-' + tempEnd.slice(0, 10).replace(/\:/g, '');
			downloadqueue = new DownloadQueue(queuePath);
		
			if(!downloadqueue.isExist()) {//never downloaded
				//put initial file into download queue
				fileObj.filepath 		= taskObj.initialpath || '';
				fileObj.revision 		= taskObj.revision || 0;
				fileObj.lastmodifytime 	= taskObj.lmt;
				fileObj.starttime 		= taskObj.starttime;
				fileObj.endtime 		= taskObj.endtime;
				fileObj.receivetime 	= new Date();
				fileObj.failuretimes 	= 0;
				fileObj.type		 	= taskObj.tasktype.slice(2); //schedule, ...
				fileObj.noreload		= taskObj.noreload || false;
				
				urlObj 					= url.parse(controllerConfig.serverurl);
				fileObj.filepath 		= urlObj.protocol + '//' + urlObj.host + '/lib/' + controllerConfig.sitename + taskObj.initialpath;
				fileObj.localpath   	= path.normalize(helper.fileLibPath + path.sep + controllerConfig.sitename + taskObj.initialpath);
				
				
//console.log('will isert download file to queue:');
//console.log(fileObj);
				downloadqueue.appendFileToQueue(fileObj);
				
				queueItem = fileObj;
			}
			else {
				queueItem = downloadqueue.getNewElement();
			}
		}
		else {//no task
			if((controllerConfig.downloadprogress !== 0) || controllerConfig.downloadspeed) {
				var configsetting = [];
				var settingObj = {}; 
				controllerConfig.downloadprogress = 0;
				settingObj.name = 'downloadprogress'; 
				settingObj.value = controllerConfig.downloadprogress; 
				configsetting.push(settingObj); 
				
				controllerConfig.downloadspeed = '';
				settingObj = {}; 
				settingObj.name = 'downloadspeed'; 
				settingObj.value = controllerConfig.downloadspeed; 
				configsetting.push(settingObj); 
	
				process.send({'configsetting': { 'from': 'downloadprocess', 'data': configsetting}});
			}
		}
/*
console.log('start download timer procedure.');
console.log('taskObj=');
console.log(taskObj);
console.log('queueItem=');
console.log(queueItem);
*/
		helper.getFreeSpacePercent(function(total, free) {
			if((parseInt(total, 10) * helper.config.playersettings.minimumfreespace / 100) > parseInt(free, 10)) {
//console.log('total disk space is: ' + total + '    free disk space is: ' + free);
//console.log('Free disk space is lower than threshold ' + helper.config.playersettings.minimumfreespace + '%');
				logger.error('total disk space is: ' + total + '    free disk space is: ' + free);
				logger.error('Free disk space is lower than threshold ' + helper.config.playersettings.minimumfreespace + '%');
				removeUnusedMedia(function(err) {
					if(err) { logger.error('Error occurs when cleanup disk'); }
					
					downloadEmitter.emit('DownloadNextFile', 0, 'start');
				});
			}
			else {
				downloadEmitter.emit('DownloadNextFile', 0, 'start');
			}
		});
	});
}
		
	
if(!helper.config) {
	return;
}

var startToDownloadWrapper = function()
{
	logger.debug('startToDownloadWrapper-----enter, taskIsRunning:%d', taskIsRunning);
	if(taskIsRunning)
	{
		logger.error('startToDownloadWrapper-----task is running, wait 10ms');
		setTimeout(startToDownloadWrapper, 10);
		return;
	}
	taskIsRunning = true;
	startToDownload();
	taskIsRunning = false;
}

//console.log('the parameter got from caller is:');
//console.log(process.argv[2]);
cookieFromServer = process.argv[3];
//console.log('cookie:' + cookieFromServer);

taskmanager = new TaskManager();

startToDownloadWrapper();

process.on('message', function (m) {
	if(m && (m.action) && (m.action === 'exit')) {//got exit message
		logger.error('receive exit message from login process.');
		logger.error('download process [' + process.pid + '] will exit.');
		process.nextTick(function() {
			process.exit(1);	
		});
	}
	else if(m && (m.action) && (m.action === 'newtask')) {//got new task message
		logger.debug('receive new task message from login process.');

		newTaskIn = true;
		setImmediate(function() {
		//make startToDownload() called ASAP
			resetTimeoutHandler(1);	
		});		
		
	}
	
});

