var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var util 		= require('util');
var Helper 		= require('../../../utils/helper');
var Media		= require('../../../models/media');
var FileUtils 	= require('../../../utils/fileutils');
var Task	 	= require('../../../models/task');
var Privilege 	= require('../../../models/privilege');
var Player 		= require('../../../models/player');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var bluebird = require('bluebird')
bluebird.promisifyAll(fs)
bluebird.promisifyAll(hfs)

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var rangeFiles={};

var Update = function() {

	helper.config = helper.loadConfig();

	var parseContentRange = function(req){
		var rangeHeader = req.get('content-range');
		if (rangeHeader) {
			var rightFormat = rangeHeader.match(/bytes [0-9]+-[0-9]+\/[0-9]+/) 
			var rangeProp = rangeHeader.match(/[0-9]+/g)
			if (rightFormat && rangeProp && rangeProp.length==3) {
				var range={};
				range.start = parseInt(rangeProp[0]);
				range.end = parseInt(rangeProp[1]);
				range.wholeRangeSize = parseInt(rangeProp[2]);
				range.file = req.file.path;
				if (range.start<range.end && range.end<range.wholeRangeSize)
					return range;
				return;
			}
		}
	}

	var clearRangeInfo = function(req) {
		return new Promise(async function(resolve, reject){
			try{
				var thisFile = rangeFiles[req.session.uniqueUploadId];
				if (thisFile && thisFile.length>0) {
						Promise.all(thisFile.map(async function(item, idx){
							if (item.file) {
								try{
									await fs.unlinkAsync(item.file)
								}
								catch(e){}
							}
							return Promise.resolve();
						}))
				}
				delete rangeFiles[req.session.uniqueUploadId];
				return resolve()
			}catch(e){
				if ( rangeFiles[req.session.uniqueUploadId])
					delete rangeFiles[req.session.uniqueUploadId];
				logger.errorAndConsole(new Error(e))
				return reject()
			}
		})
	}

	var addRangeFileInfo = function(req, filePath, range) {
		var thisFile;
		thisFile = rangeFiles[req.session.uniqueUploadId];
		var newRange = {start:range.start, end:range.end, 
						file:req.file.path, wholeRangeSize:range.wholeRangeSize};
		if (thisFile && thisFile.length>0) {
			thisFile.push(newRange)
			if (newRange.end+1==newRange.wholeRangeSize) {
				return thisFile;
			}
		}
		else {
			rangeFiles[req.session.uniqueUploadId] = [newRange]
		}
	}
	
	// the resovled promise will be
	// 0 for non-chunked
	// 1 for chunked, not all chunks received yet
	// 2 chunked, all chunks received
	var combineChunkFiles = function(req, filePath) {
		return new Promise(async function(resolve, reject){
			try{
				var range = parseContentRange(req);
				if (!range) {
					return resolve(0)
				}

				var wholeRange = addRangeFileInfo(req, filePath, range)
				if (!wholeRange)
					return resolve(1);

				var fileSize = 0;
				var wholeFile;
				wholeRange.sort(function(a,b){
					return (a.start-b.start)
				})

				var idx=0;
				for (idx=0; idx<wholeRange.length; idx++){
					var item =wholeRange[idx];
					if (0==item.start) {
						wholeFile = item.file;
						fileSize = item.end;
					} else if ((fileSize+1)==item.start) {
						await fileUtils.appendFile(item.file, wholeFile)
						fileSize = item.end;
						if (fileSize+1 == item.wholeRangeSize){

							await fs.renameAsync(wholeFile, filePath)
							delete wholeRange[0].file;// so clearRangeInfo won't failed to del the file
							return resolve(2)
						}
					} else {
						logger.errorAndConsole(new Error('mixed chunks')) 
						return reject();
					}

				}
				logger.errorAndConsole(new Error('mixed chunks')) 
				reject()
			}catch(e){
				logger.errorAndConsole(new Error('appendFile failed '+e)) 
				reject();
			}
		})
	}

	var generatePreloadFile = function(reqInfo, obj, playerGroupList, dataFilePath) {
		return new Promise(async function(resolve, reject){
			try {
				var jsonObj			= {};
				var mediaList		= [];
				var filePath 		= '';
				var fileLocalPath 	= '';
				var randomString	= '';
				
				
				mediaList.push({'path': obj.path, 'type': obj.type});
				jsonObj.mediaList	= mediaList;
				jsonObj.type 		= 'preload';
				jsonObj.createTime 	= new Date();
				jsonObj.for 		= playerGroupList;
				
				if(dataFilePath) {
					filePath = dataFilePath;
				}
				else { //generate new one
					randomString = Math.random() + '';
					filePath = '/publish/preload/preload_' + new Date().toISOString().replace(/\:/g, '') + '_' + randomString.slice(2) + '.publ';
				}
				
				fileLocalPath = fileUtils.getFileLocalPath(reqInfo.siteObj, filePath);
				await hfs.mkdirAsync(path.dirname(fileLocalPath))
				await fileUtils.writeDataFile(fileLocalPath, jsonObj);
			
				return resolve(filePath);
			} catch(e){
				logger.error(new Error('error occurs when create preload folder in generatePreloadFile. 471 ' + e))
				return reject(471)

			}
		})
	}	
	
	var getPlayers = function(mediaInfo) {
		return new Promise(async function(resolve, reject){
			try{
				var playerArray = [];
				var alertObj = mediaInfo.alert;
		
				if(!alertObj) { 
					return resolve([])
				}

				if(alertObj.allplayers === 'true') { alertObj.allplayers = true; }
				if(alertObj.allplayers === 'false') { alertObj.allplayers = false; }
		
				if(!alertObj.allplayers && !alertObj.players) { 
					return resolve([])
				}
		
				if(mediaInfo.alert.allplayers) {
					var rootInfo = await reqInfo.player.get('/player')
					playerArray.push({'path': rootInfo.path, 'id': rootInfo._id.toString(), 'type': rootInfo.type});
					return resolve(playerArray);
				}
				else {
					if(alertObj.players && util.isArray(alertObj.players) && alertObj.players.length) {
						return resolve(mediaInfo.alert.players);
					}
					return resolve([])
				}
			}catch(e){
				logger.error(new Error(e))
				reject()
			}
		})
	}

	this.checkEachPlayerPrivilege = function(playerList, reqInfo) {
		var availablePlayerArray = [];
		return Promise.all(playerList.map(function(item, idx){
			return new Promise(async function(resolve, reject){
				try{
					await reqInfo.privilege.checkPrivilege('player', item.path, 'account', reqInfo.accountInfo ? reqInfo.accountInfo.name: '', 4)
					availablePlayerArray.push(item.id)
					return resolve(availablePlayerArray)
				} catch(e){
					logger.debug(new Error(e))
					return resolve(availablePlayerArray);
				}
			})
		}))
	}
	
	this.insertPreloadTask = function(playerArray, playerGroupArray, mediaInfo, preloadDataFilePath, reqInfo){
		var that = this;
		return new Promise(async function(resolve, reject){
			try {
				var groupPromises = playerGroupArray.map(function(item, idx){
					return new Promise(async function(innerResolve, innerRejct){
						try {
							if(item.type === 'group') {
								await reqInfo.privilege.checkPrivilege('player', item.path, 'account', reqInfo.accountInfo ? reqInfo.accountInfo.name: '', 4)
								var taskObj 				= {};
								taskObj.groupid 		= item.id;
								taskObj.tasktype 		= 'preload';  
								taskObj.taskobjectid 	= mediaInfo._id.toString();  
								taskObj.initialpath 	= preloadDataFilePath;  
								taskObj.accountid 		= accountInfo._id.toString();  								
								await reqInfo.task.insertPreloadTask(taskObj)
							}
							return innerResolve()
						} catch (e){
							logger.debug(new Error(e))
							return innerResolve()
						}
					})
				})

				var availablePlayers = await  that.checkEachPlayerPrivilege(playerArray, reqInfo)
				if(availablePlayers && util.isArray(availablePlayers) && availablePlayers.length) {
					var taskObj 				= {};
					taskObj.groupid 		= '';
					taskObj.playerlist 		= availablePlayers;
					taskObj.tasktype 		= 'preload';  
					taskObj.taskobjectid 	= mediaInfo._id.toString();  
					taskObj.initialpath 	= preloadDataFilePath;  
					taskObj.accountid 		= reqInfo.accountInfo._id.toString();  					
					await reqInfo.task.insertPreloadTask(taskObj)
				}
				return Promise.all(groupPromises)
			}catch(e) {
				logger.error(new Error(e))
				return reject(e)
			}
		})
	}


	this.preloadMedia = function(mediaInfo, reqInfo) {
		var playerArray = [];
		var playerGroupArray = [];
		var preloadDataFilePath = '';
		var that = this;

		
		return new Promise(async function(resolve, reject){
			try {
				//entry
				if(!mediaInfo || !mediaInfo.alert) { 
					return resolve(0)
				}
		
				var preloadArray =await getPlayers(mediaInfo)
				playerGroupArray = preloadArray;
				if(!playerGroupArray || !util.isArray(playerGroupArray) || !playerGroupArray.length) {
					return resolve(0)
				}				
			
				arrayLength = playerGroupArray.length;
				//push all single player into another new array
				for(var i = 0 ; i < arrayLength; i++) {
					if(playerGroupArray[i].type === 'player') {
						playerArray.push(playerGroupArray[i]);
					}
				}
			
				//generate media list file for alert under publish folder
				var taskInfo = await reqInfo.task.getPreloadTaskByMaterialID(mediaInfo._id.toString())
				var oldDataFilePath = '';
				
				if(taskInfo) {
					oldDataFilePath = taskInfo.initialpath;
				}
				
				var dataFilePath = await generatePreloadFile(reqInfo, mediaInfo, playerGroupArray, oldDataFilePath)
				preloadDataFilePath = dataFilePath;
				
				await that.insertPreloadTask(playerArray, playerGroupArray, mediaInfo, preloadDataFilePath, reqInfo)
				return resolve(0)
			}catch(e){
				logger.error(new Error(e))
				return reject(4)
			}
		})
	}	
		
	this.do =  async function(req, res) {
		try {
			var that		= this;
			var dataObj 	= null;
			var media		= null;
			var task		= null;
			var privilege 	= null;
			var player 		= null;
			var site 		= null;
			var accountrole	= null;
			var retVal 		= {
				status: false,
				id: 4,
				msg: helper.retval[4],
			};
			var userid		= '';
			var siteid		= '';
			var siteObj		= {};
			
			var newPath		= '';
			var oldPath		= '';
			
			var thumbnailData 	= '';
			var matchResult 	= null;
			var thumbnailBuffer = '';
			var smallThumbnailLocalPath = '';
			var bigThumbnailLocalPath = '';
			
			
			logger.debug('enter media/update.js');
			
			//get parameter from request
			dataObj = req.body;

			if(dataObj.alert) {
				if(dataObj.alert.allplayers === 'true')
					dataObj.alert.allplayers = true;
				if(dataObj.alert.allplayers === 'false')
					dataObj.alert.allplayers = false;
			}

			//get siteID from session
			siteid 	= req.session.siteObj.siteID;
			
			site 	= new Site();
			var siteInfo = await site.getByID(siteid)
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			//get userid from session
			userid = req.session.userid; 
			
			accountrole = new AccountRole(siteObj);
			var accountInfo = await	accountrole.getAccountByID(userid)
			
			task 		= new Task(siteObj);
			player 		= new Player(siteObj);
			media 		= new Media(siteObj);
			privilege 	= new Privilege(siteObj);
			
			var reqInfo={'task':task, 'privilege':privilege, 'player':player, 'media':media,
						'accountInfo':accountInfo, 'siteObj':siteObj}

			//check the parameters validation
			if(dataObj.type && (dataObj.type.indexOf('/') >= 0)) { 
				dataObj.type = dataObj.type.slice(0, dataObj.type.indexOf('/'));
			}
			if((!dataObj) || (!dataObj.path) || (!dataObj.type)) {
				retVal.id = 4;
				retVal.msg = helper.retval[4];
				logger.error(new Error('the parameter from request is not correct. '+dataObj));
				return res.send(retVal);
			}
			
			var localPath = fileUtils.getFileLocalPath(siteObj, dataObj.path);
			req.session.uniqueUploadId = req.body.uniqueUpload+req.sessionID;
			var waitForChunks = await combineChunkFiles(req, localPath)
			if (1==waitForChunks) {
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				retVal.status = true;
				retVal.media = mediaObj;
				
				logger.debug('return from media/update.js, waiting for chunks');
				return res.send(retVal);					
			}

			//check privilege, must have write privilege on parent node.
			await privilege.checkPrivilege('media', dataObj.path, 'account', accountInfo.name, 2)

			var mediaObj = await media.get(dataObj.path)
			await media.createRevisionFileForUpdateContent(mediaObj)

			if(req.file && req.file.path) {
				var tempFilePath = req.file.path;

				//handle revision issue in here
				//update media content								


				//if(dataObj.type === 'widget') moved below by joey
				//	await fileUtils.decompressFile(req.file.path, fileUtils.getExtraFilesFolderPath(req.file.path), 
				
				//updated by joey. since unzip is done for widget below.
				// typical movefile is ok. 
				// no need to move widget file folders since not unzip widget yet

				if (0==waitForChunks) 
					await fileUtils.moveFile(tempFilePath, localPath);
															
				if(dataObj.type === 'widget') {
					await fileUtils.decompressFile(localPath, fileUtils.getExtraFilesFolderPath(localPath)) 
					//copy data/defaultthumbnail.jpg to media's thumbnail file.
					var widgetThumbnailPath = fileUtils.getThumbnailFilePath(localPath, false);
					var widgetDefaultThumbnailPath = fileUtils.getExtraFilesFolderPath(localPath) + path.sep + 'data' + path.sep + 'defaultthumb.jpg';
					await fileUtils.moveFile(widgetDefaultThumbnailPath, widgetThumbnailPath)
				}
			}

			if(dataObj.thumb && dataObj.path) {

				smallThumbnailLocalPath = fileUtils.getThumbnailLocalPath(siteObj, dataObj.path, false);
				matchResult = dataObj.thumb.slice(0, 100).match(/^data\:(.*\/.*)\;base64\,(.*)/);
				if(matchResult) {
					thumbnailBuffer = new Buffer(dataObj.thumb.slice(5 + matchResult[1].length + 8), 'base64');
					await fs.writeFileAsync(smallThumbnailLocalPath, thumbnailBuffer);
				}
			}

			if((dataObj.snapshot || dataObj.snapshot0) && dataObj.path) {
				var snapshotData = '';
				if(dataObj.snapshot0) {
					var snapshot = 'snapshot';
					var index = 0;
					
					while(dataObj[(snapshot + index)]) {
						snapshotData += dataObj[(snapshot + index)];
						index++;
					}
				}
				else {
					snapshotData = dataObj.snapshot;
				}
				
				if(snapshotData) {
					bigThumbnailLocalPath = fileUtils.getThumbnailLocalPath(siteObj, dataObj.path, true);
					matchResult = {};
					matchResult = snapshotData.slice(0, 100).match(/^data\:(.*\/.*)\;base64\,(.*)/);
					//data:image/jpeg;base64,

					if(matchResult) {
						thumbnailBuffer = new Buffer(snapshotData.slice(5 + matchResult[1].length + 8), 'base64');
					}	

					await fs.writeFileAsync(bigThumbnailLocalPath, thumbnailBuffer);
				}
			}
												
			//update record in DB, if it is folder and pass different name, need to change the folder name and all sub nodes' path in db
			//if it is playlist or other media, will change its .plist, .wdgt, .link file and .json file
			if(dataObj.name) { 
				newPath = path.dirname(dataObj.path) + '/' + dataObj.name; 
			} else { newPath = dataObj.path; }


			oldPath = dataObj.path;
			dataObj.path = "";
			dataObj.path = newPath;			
			if(dataObj.thumb)  delete dataObj.thumb
			if(dataObj.snapshot) delete dataObj.snapshot

			var index = 0;
			while(dataObj[(snapshot + index)]) {
				delete dataObj[(snapshot + index)];
				index++;
			}
														
			await media.update(oldPath, dataObj, accountInfo._id.toString())
			await media.get(newPath)
			//check the media has assigned to some player and group or not, if so, publish task to those players
			await that.preloadMedia(mediaObj, reqInfo)
							
			retVal.id = 0;
			retVal.msg = helper.retval[0];
			retVal.status = true;
			retVal.media = mediaObj;
			
			logger.debug('return from media/update.js.');
			logger.debug(JSON.stringify(retVal, '', 4));
			res.send(retVal);
			await clearRangeInfo(req)

		} catch(e) {
			await clearRangeInfo(req)
			retVal.id=e.id || 112;
			retVal.msg = helper.retval[retVal.id];
			logger.error(new Error('update.js error: '+e))
			return res.send(retVal);
		}
	}


};

module.exports = Update;

