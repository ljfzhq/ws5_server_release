var path 	= require('path');
var fs 		= require('fs');
var childProcess = require('child_process');
var Helper 	= require('../utils/helper.js');
var wsTask  = require('../models/task.js');
var Emitter = require('events').EventEmitter;

var helper 	= new Helper();
var logger 	= helper.logger;


var hasStarted = false;
var lastTaskTime = null;
var lastBakTime = null;
var myEmitter = null;
var myTask	= new wsTask(null);
function autoBackupDB() {
	this.checkBackup = autoBackupDB.checkBackup;
	this.start = autoBackupDB.start;	
	this.triggerMe = autoBackupDB.triggerMe;
}

autoBackupDB.checkBackup =  function(){
	try{
		var lastbackupFile = path.join(helper.fileLibPath, 'backupdb', 'lastbackup');		
		if(!lastTaskTime && fs.existsSync(lastbackupFile)){
			var t = fs.readFileSync(lastbackupFile) + '';
			if(t && t.indexOf(',') > 0){
				var arr = t.split(',');				
				lastTaskTime = new Date(parseInt(arr[0], 10));
				lastBakTime = new Date(parseInt(arr[1], 10));
				logger.error("lastTaskTime:" + lastTaskTime + "  lastBakTime:" + lastBakTime);
			}
		}
		var now = new Date();
		if(lastBakTime && lastBakTime.getTime() > now.getTime() && (lastBakTime.getTime() - now.getTime()) > 86400000){
			logger.error('lastbacktime is abnormal, will reset it');
			lastBakTime = null;
			lastTaskTime = null;
		}
		var bakIntervalMS = 86400000;
		//bakIntervalMS = 10000;
		if(!lastBakTime || (now.getTime() - lastBakTime.getTime()) > bakIntervalMS){
			logger.error("before get newest task");
			myTask.getNewestTaskCreateTime(lastTaskTime, function(newTime){
				logger.error("checkBackup, task time:" + newTime);
				if(newTime){
					var backupBatFile = path.join(helper.fileLibPath, 'backup_script.bat');
					if(fs.existsSync(backupBatFile)){
						var args = [];
						args.push( helper.dbsettings.port);
						var ls = childProcess.spawn(backupBatFile, args);		
						ls.stdout.on('data', function (data) {
							logger.error('stdout: ' + data);
						});

						ls.stderr.on('data', function (data) {
							logger.error('stderr: ' + data);
						});

						ls.on('exit', function (code) {
							logger.error('child process exited with code ' + code);
						});					
						lastTaskTime = newTime;
						lastBakTime = now;					
						fs.writeFileSync(lastbackupFile, newTime.getTime().toString() + ',' +  lastBakTime.getTime().toString())
					}else logger.error('' + backupBatFile + ' does not exist!!');
				}				
			});
		}
	}catch(e) {
		if (e && e.message != "") 
			logger.error(' there is exception:' + e);				
	}
	setTimeout(autoBackupDB.checkBackup, 600000);
}

autoBackupDB.start = function(){
		if(helper.dbsettings.autoBackup == 0){
			logger.error("Not backup DB automatically because dbsettings.autoBackup:" + helper.dbsettings.autoBackup);
			return;
		}
		if(!myEmitter){			
			myEmitter		= (new Emitter);
		}
		logger.error("autoBackupDB.start()-----enter, hasStarted:" + hasStarted);
		myEmitter.on('wsLoginOK', function() {
			logger.error("autoBackupDB, loginOK event, hasStarted:" + hasStarted);
			if(!hasStarted){
				setTimeout(autoBackupDB.checkBackup, 10000);
				hasStarted = true;
			}
		});
}	

autoBackupDB.triggerMe = function(){
		logger.error('before send login ok event, emitter:' + myEmitter);
		if(myEmitter){
			myEmitter.emit('wsLoginOK');
		}		
}
module.exports = autoBackupDB;




