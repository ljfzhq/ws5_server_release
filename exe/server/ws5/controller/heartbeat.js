var fs 			= require('fs');
var hfs 		= require('hfs');
var path		= require('path');
var Helper 		= require('../../utils/helper');
var Player		= require('../../models/player');
var Site		= require('../../models/site');
var Task		= require('../../models/task');
var FileUtils 	= require('../../utils/fileutils');

var fileUtils	= new FileUtils();
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var Heartbeat = function() {
	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= {};
		var tempObj 	= {};
		var player		= null;
		var task		= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var playerid	= '';
		var siteid		= '';
		var siteObj		= {};
		
		var snapshotLocalPath = '';
		var snapshotBuffer 	= null;
		var logLocalPath 	= '';
		var logBuffer 		= null;
//		var needUpdatePlayerInfo = false;

		//get parameter from request
		tempObj = JSON.parse(req.body.data);
		dataObj = tempObj;
//console.log(dataObj);
		
		if(dataObj && dataObj.versionstring && global.version) {
			if(dataObj.versionstring !== global.version) {
				logger.error('controller version does not match server version!');
				logger.error('controller version is:' + dataObj.versionstring);
				logger.error('server version is:' + global.version);
			}
			else {
//				console.log('version match!');
			}			
		}
		else {
			logger.error('does not get complete version infomration.');
			logger.error('controller version is:' + dataObj.versionstring);
			logger.error('server version is:' + global.version);
		}
		
		//get site information and player info from session.
		if(!req.session.playersiteobj || !req.session.playerid) {
			retVal.id = 450;
			retVal.msg = helper.retval[450];
			logger.error('not find siteid or playerid in session.');
			return res.send(retVal);
		}
		siteObj = req.session.playersiteobj;
		playerid= req.session.playerid;
		
		player 	= new Player(siteObj);
		task 	= new Task(siteObj);

		//get player for registered player.
		if(playerid) {
			player.getByID(playerid, function(err, playerInfo) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				if(err) {
					logger.error('error occur when get player information from DB. ' + err);
					logger.error(dataObj);
					return res.send(retVal);
				}

				//save snapshot if have
				if(dataObj.snapshot) {
					snapshotLocalPath = fileUtils.getFileLocalPath(siteObj, '/playersnapshot/' + playerid + '.jpg');
					snapshotBuffer = new Buffer(dataObj.snapshot, 'base64');
					
					try{
						hfs.mkdirSync(path.dirname(snapshotLocalPath));
						fs.writeFileSync(snapshotLocalPath, snapshotBuffer);
					}
					catch(e) {
						logger.error('Fail to write snapshot file for player ' + playerInfo.path);
					}
					
console.log('will reset snapshot flag');
					playerInfo.snapshot = false;
//					needUpdatePlayerInfo = true;
				}
				
				//save log package if have
				if(dataObj.logpackage) {
					if(playerInfo.logpath) {
						logLocalPath = path.normalize(playerInfo.logpath + playerInfo.path + '.zip');
						logBuffer = new Buffer(dataObj.logpackage, 'base64');
						
						try{
							hfs.mkdirSync(path.dirname(logLocalPath));
							fs.writeFileSync(logLocalPath, logBuffer);
						}
						catch(e) {
							logger.error('Fail to write log package file for player ' + playerInfo.path);
							logger.error(e);
						}
					}
					
console.log('will reset collect flag');
					playerInfo.collectlog = false;
					playerInfo.logpath = '';
//					needUpdatePlayerInfo = true;
				}
				
				//get all group id this player belongs to
				player.getAllGroupIDs(playerInfo, function(err, groupIDArray) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						return res.send(retVal);
					}
//console.log(groupIDArray);
					
					//get new task from task list to heartbeat.
					task.getAvailableTask(groupIDArray, playerid, dataObj.newesttasktime, playerInfo.timezoneoffset, function(err, taskArray) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							return res.send(retVal);
						}
						
						taskArray.sort(function(a,b) {
							if(a.createtime > b.createtime) return 1;
							else if(a.createtime < b.createtime) return -1;
							else return 0;
						});
						

						retVal.id 		= 0;
						retVal.msg 		= helper.retval[0];
						retVal.status 	= true;
						retVal.interval = helper.config.serversettings.heartbeatInterval;
						retVal.topfirst = helper.serversettings.topfirst;
						retVal.task 	= taskArray;
						retVal.belongs 	= groupIDArray;
						retVal.playername 	= playerInfo.name;
						retVal.grouppath 	= path.dirname(playerInfo.path);
						retVal.timezone 	= playerInfo.timezone;

//console.log('got task from server is:');
//console.log(taskArray);						

//console.log('playerInfo.snapshot=' + playerInfo.snapshot);
						//set data from player info to response, such as power setting
						if(dataObj.shutdown) {
							playerInfo.shutdown = false;
//							needUpdatePlayerInfo = true;
						}	
						
						if(dataObj.reboot) {
							playerInfo.reboot = false;
//							needUpdatePlayerInfo = true;
						}	
						
						
						playerInfo.version		  = dataObj.versionstring;
						playerInfo.lastonlinetime = new Date();
						playerInfo.status		  = 'online';
						playerInfo.playlist		  = dataObj.playlist || '';
						playerInfo.media		  = dataObj.media || [];
						playerInfo.ip			  = dataObj.ip || '';
						playerInfo.localtime	  = dataObj.localtime || '';
						playerInfo.timezone		  = (playerInfo.timezone) ? playerInfo.timezone : dataObj.timezone || '';
						playerInfo.machinename	  = dataObj.machinename || '';
						playerInfo.platform		  = dataObj.platform || '';
						playerInfo.arch			  = dataObj.arch || '';
						playerInfo.downloadprogress = dataObj.downloadprogress || 0;
						playerInfo.downloadspeed  = dataObj.downloadspeed || '0 KB/s';
						playerInfo.diskspace	  = dataObj.diskspace || 'Unknown';
						playerInfo.upgradestarttime	  = dataObj.upgradestarttime || 0;
						playerInfo.upgradepackagepath = dataObj.upgradepackagepath || '';
						if(dataObj.timezoneoffset !== undefined) { playerInfo.timezoneoffset = dataObj.timezoneoffset; }
						
						player.update(playerInfo.path, playerInfo, function(err) {
							retVal.snapshot = playerInfo.snapshot || false;
							retVal.shutdown = playerInfo.shutdown || false;
							retVal.reboot  = playerInfo.reboot || false;
							retVal.collectlog  = playerInfo.collectlog || false;
							retVal.powerschedule  = playerInfo.powerschedule;
							
							return res.send(retVal);
						});
					});
				});
			});
		}
	}
};

module.exports = Heartbeat;

