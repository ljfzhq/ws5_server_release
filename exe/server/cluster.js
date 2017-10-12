var cluster = require('cluster');
var fs 		= require('fs');
var http 	= require('http');
var path 	= require('path');
var childprocess = require('child_process');

var Helper 	= require('./utils/helper');
var ControllerHelper 	= require('./ws5/controller/client/controllerhelper');

var controllerHelper 	= new ControllerHelper();
var helper = new Helper();
var logger = helper.logger;
var workers = {};
var numProcesses = helper.config.serversettings.processnumber;

var during 	= 60000;
var restart = [];
var limit	= 10;
var isTooFrequently = function() {
	var now = Date.now();
	var length = restart.push(now);
	if(length > limit) {
		restart = restart.slice(limit * (-1));
	}
	
	length = restart.length;
	return length >= limit && ((restart[length - 1] - restart[0]) < during);
}

logger.error("\n\n\nstart a new server!!!!");
//cluster.schedulingPolicy = cluster.SCHED_RR; //use Round-Robin
//cluster.schedulingPolicy = cluster.SCHED_NONE;//not use Round-Robin
if (cluster.isMaster) {
	// 主進程分支
	cluster.on('online', function(worker){ console.log('got online event. worker.id=' + worker.id); });
	cluster.on('fork', function(worker){ console.log('got fork event. worker.id=' + worker.id); });
	cluster.on('listening', function(worker, address){ console.log('got listening event. address=' + JSON.stringify(address)); });
	cluster.on('disconnect', function(worker){ console.log('got disconnect event. worker.id=' + worker.id); });
	cluster.on('setup', function(){ console.log('got setup event.'); });
	cluster.on('exit', function(worker, code ,signal){
		logger.warn('recieve exit.   ' + worker.process.pid + '   ' + code);

		if(code === 99) {//force exit
			for(var id in workers) {
				if(workers[id] !== worker) {
					logger.debug('kill ' + workers[id].process.pid);
					process.kill(workers[id].process.pid, 'SIGTERM');
					//workers[id].process.emit('upgrade', workers[id].process.pid);
				}
			}
			
			process.exit(99);
		}
		else {
			// 當一個工作進程結束時，重啓工作進程
			logger.warn('one process( %d ) is dead.', worker.process.pid)
			if(isTooFrequently()) {
				logger.error('create worker process tooooo freuently.');
			}
			
			var newWorker = null;
			if(worker.primary === true) {
				newWorker = cluster.fork({'primary' : true });
				newWorker.primary = true;
			}
			else {
				newWorker = cluster.fork({'primary' : false });
				newWorker.primary = false;
			}
			
			delete workers[worker.id];
			workers[newWorker.id] = newWorker;
			logger.warn('a new process( %d ) is created.', newWorker.process.pid);
		}
	});
	
	//清除旧的日志文件
	helper.cleanuplog();
	if(controllerHelper && controllerHelper.config) {
		controllerHelper.cleanuplog();
		
		//remove download information file
		var dataFilePath = controllerHelper.fileLibPath + path.sep + 'task' + path.sep + 'downloadInfo.json';
		try {
			if(fs.existsSync(dataFilePath)) {
				fs.unlinkSync(dataFilePath);
			}
		}
		catch(e) { console.log(e); }
   	}
   
    
	// 初始開啓與 CPU 數量相同的工作進程
	for (var i = 0; i < numProcesses; i++) {
		var worker = null;
		if(i === 0) {
			worker = cluster.fork({'primary':true});
			worker.primary = true;
		}
		else {
			worker = cluster.fork({'primary':false});
			worker.primary = false;
		}
		
		workers[worker.id] = worker;
	}
	
//	logger.debug('worker list is: ' + workers[1].process.pid + '  ' + workers[2].process.pid + '  ' + workers[3].process.pid + '  ' + workers[4].process.pid);
/*
	//lauch render process
	global.renderProcess = childprocess.execFile('d:\\private\\ws5\\exe\\render\\athens.bat', function (error, stdout, stderr) {
		logger.debug('launch render process is ' + global.renderProcess.pid);
		logger.debug(error);
		logger.debug(stdout);
		logger.debug(stderr);
	});	
*/
} else {
	// 工作進程分支，啓動服務器
	var app = require('./app');
	http.createServer(app).listen(app.get('port'), function(){
	  	logger.warn("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
	});
}

// 當主進程被終止時，關閉所有工作進程
process.on('SIGTERM', function () {
//does not work, because process can only control itself, the workers object ca not be accessed by wrker process
//	for (var pid in workers) {
//		process.kill(pid);
//	}

	logger.warn('recieve SIGTERM.   ');
	process.exit(0);
});
/*
process.on('fork', function () {
	logger.warn('recieve fork. ');
});
process.on('disconnect', function () {
	logger.warn('recieve disconnect. ');
});
process.on('listening', function () {
	logger.warn('recieve listening. ');
});
process.on('online', function () {
	logger.warn('recieve online. ');
});
process.on('setup', function () {
	logger.warn('recieve setup. ');
});
process.on('exit', function () {
	logger.warn('recieve exit. ');
});
*/

process.on('upgrade', function (id) {
	logger.debug('upgrade event from process ' + id);
	process.exit(99);
});
