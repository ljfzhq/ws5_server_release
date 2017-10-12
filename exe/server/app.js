/**
 * Module dependencies.
 */
var express = require('express');
var routes 	= require('./routes');
var http 	= require('http');
var path 	= require('path');
var os 		= require('os');
var fs 		= require('fs');
var hfs 	= require('hfs');
var fork 	= require('child_process').fork;
var partials = require('express-partials');
var session = require('express-session')
var MongoStore = require('connect-mongo')(session);
var Helper = require('./utils/helper');
var Player = require('./models/player');
var emailerModule = require('./ws5/emailer');
var autoBackupDBModule = require('./ws5/autoBackupDB');
var ControllerHelper 	= require('./ws5/controller/client/controllerhelper');
var ControllerCmd 	= require('./ws5/controller/client/command');

var controllerCmd 	= new ControllerCmd();
var controllerHelper= new ControllerHelper();
var helper = new Helper();
var logger = helper.logger;
var player = new Player({});
var emailer = new emailerModule();
var autoBackupDB = new autoBackupDBModule();

var app = express();
var rootPath = __dirname;
var fileLibPath = helper.fileLibPath;
var sendAliveMessageInterval = 3000;
var lastAliveMessageTime = null;
var versionString = '5.1_20170831';
var parameterArray = [];

helper.config = helper.loadConfig();
var mongoConnectionURL = 'mongodb://'+helper.dbsettings.host+':'+helper.dbsettings.port+'/' ;
var sessionStore = new MongoStore({ db: helper.dbsettings.db, host: helper.dbsettings.host, port: helper.dbsettings.port,
		url:mongoConnectionURL });

// Configuration
//app.configure(function(){
	var logPath = helper.logPath;
	var today = new Date();
	var dateString = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10).replace(/-/g,'');
	var accessLogfile = fs.createWriteStream(logPath + path.sep + 'accesslog' + dateString　+ '.log', {flags: 'a'});

	app.set('port', helper.serversettings.port || 80);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');

	exLogger = require('morgan');
	exFavIcon = require('serve-favicon')
	exBodyParser = require('body-parser')
	exStatic = require('serve-static')
	exCookieParser = require('cookie-parser')
	exMethodOverride = require('method-override')
	exErrorHandler = require('errorhandler')

	app.use(exLogger({stream: accessLogfile}));
	app.use(exFavIcon(__dirname + path.sep + 'ws5.ico'));
	app.use(exLogger('dev'));
//for we need check the session for all lib file, so, it seems we must pass them to route and need not treat them as static file
//but just use res.sendfile(). also rollback the changes in static.js
//  	app.use(exStatic(path.join(__dirname, 'public'), fileLibPath));
  	app.use(exStatic(path.join(__dirname, 'public')));
//
//	app.use(exBodyParser());
		app.use(exBodyParser.urlencoded({uploadDir: helper.tmpPath, limit:102400000, parameterLimit:9999}));
		app.use(exBodyParser.json({limit:102400000}));

  	app.use(exCookieParser());
	app.use(exMethodOverride());
	app.use(partials());
    app.use(session({
    	secret: helper.dbsettings.cookieSecret,
//    	cookie: {maxAge: 3600000},
    	store: sessionStore
  	}));
//});

//app.configure('development', function(){
	var env = process.env.NODE_ENV || 'development';
	if ('development'==env)  	
		app.use(exErrorHandler());
//});

routes(app, rootPath);
//console.log('NODE_UNIQUE_ID' in process.env);
var startPlayerScheduler = function() {
	var jsonDataFilePath = controllerHelper.serverPath + 'addon' + path.sep + 'mdx86' + path.sep + 'jsonFile';
	logger.debug('remove temp jspn data folder used by playerScheduler.exe. path=' + jsonDataFilePath);
	hfs.del(jsonDataFilePath, function(err) {
		if(err) { 
			console.log('error occurs when delete jspn data folder used by playerScheduler.exe.');
			logger.error('error occurs when delete jspn data folder used by playerScheduler.exe.');
		}
/*
		controllerCmd.callMDPlayerScheduler(helper, { reset: true }, function(err) {
			if(err) {
				logger.error('error occurs when start playerscheduler.exe. err=' + err);
			}
		});
*/
	
	});
}

var checkPlayer = async function() {
	try {
		var players = await player.markAbnormalPlayers();
		await emailer.sendAbnormalEmail(players);
		await player.markEmailSent(players)
		setTimeout(checkPlayer, helper.serversettings.abnormalCheckInterval * 1000);		
	} catch(e) {
		if (e && e.message != "") // skil logging no abnormal player found msg every min
			logger.error(e);		
		setTimeout(checkPlayer, helper.serversettings.abnormalCheckInterval * 1000);		
	}
}

var sendAliveMessage = function() {
	var curTime = new Date();
	
	if(lastAliveMessageTime && (Math.abs(lastAliveMessageTime.getTime() - curTime.getTime()) > (sendAliveMessageInterval * 60))) {
		if(global.loginProcess && !global.loginProcess.exitCode && global.loginProcess.connected) {
			logger.error('old login process is ' + global.loginProcess.pid);
			logger.error('let it exit.');
			global.loginProcess.send({action: 'exit'});
		}
		
		lastAliveMessageTime = new Date();
		global.loginProcess = fork(helper.serverPath + 'ws5/controller/client/loginprocess.js', parameterArray);	
		logger.error('System Time changed, In app.js, launch login process is ' + global.loginProcess.pid);
	}
	else {
		if(global.loginProcess && !global.loginProcess.exitCode && global.loginProcess.connected) {
			lastAliveMessageTime = new Date();
			global.loginProcess.send({'parent': 'alive'});
		}
	}
	
	setTimeout(sendAliveMessage, sendAliveMessageInterval);
}

fs.exists(helper.tmpPath, function(exists) {
	if(!exists) {
		hfs.mkdir(helper.tmpPath, function(err) {
			
		});
	}
});

global.version = versionString;
parameterArray.push(versionString);

var launchSubProcess = function() {
	controllerHelper.loadDynamicConfig(function(err, controllerConfig) {
		if(!err && controllerConfig) {
			if((process.env.primary === 'true') || (process.env.primary === true)) {
				//lauch login process
				logger.debug('version: ' + versionString);
				
				if(controllerHelper && controllerHelper.config && controllerHelper.config.playersettings && !controllerHelper.config.playersettings.server) {
					global.loginProcess = fork(helper.serverPath + 'ws5/controller/client/loginprocess.js', parameterArray);	
					logger.debug('In app.js, launch login process is ' + global.loginProcess.pid);
				    
					setTimeout(sendAliveMessage, sendAliveMessageInterval);
				}
			    setTimeout(checkPlayer, helper.serversettings.abnormalCheckInterval * 1000);
			    startPlayerScheduler();
			    
			    //clear commanddata folder
			    var localCmdDataPath = helper.serverPath + 'addon' + path.sep + 'commanddata';
			    hfs.del(localCmdDataPath, function(err) {});
				
				autoBackupDB.start();
			}
			else if (!module.parent) {
				logger.debug('in mode 2, version: ' + versionString);
				
				http.createServer(app).listen(app.get('port'), function(){
				  	console.log("Express server(process id=%d) listening on port %d in %s mode", process.pid, app.get('port'), app.settings.env);
				});
			
				//lauch login process
				if(controllerHelper && controllerHelper.config && controllerHelper.config.playersettings && !controllerHelper.config.playersettings.server) {
					global.loginProcess = fork(helper.serverPath + 'ws5/controller/client/loginprocess.js', parameterArray);	
					logger.debug('In app.js, launch login process is ' + global.loginProcess.pid);
				    
					setTimeout(sendAliveMessage, sendAliveMessageInterval);
				}
			    setTimeout(checkPlayer, helper.serversettings.abnormalCheckInterval * 1000);
				startPlayerScheduler();

			    //clear commanddata folder
			    var localCmdDataPath = helper.serverPath + 'addon' + path.sep + 'commanddata';
			    hfs.del(localCmdDataPath, function(err) {});
				
				autoBackupDB.start();
			}
		}
		else {
			setTimeout(launchSubProcess, 10);
		}
	});
}

launchSubProcess();

//write ip to a file.
if(controllerHelper && controllerHelper.config && controllerHelper.config.playersettings && !controllerHelper.config.playersettings.server) {
	var IP = controllerHelper.getIP();
	var ipFilePath = helper.serverPath + path.sep + 'public' + path.sep + 'ip.json';
	var ipPath4Render = helper.WS5Path + path.sep + 'exe' + path.sep + 'render' + path.sep + 'ip.json';
	var ipObj = {};
	ipObj.ip = IP;
	ipObj.hostname = os.hostname();
	ipObj.port = helper.serversettings.port || 80;
	fs.writeFileSync(ipFilePath, JSON.stringify(ipObj));
	fs.writeFileSync(ipPath4Render, JSON.stringify(ipObj));
}
/*
process.on('SIGINT', function() {
  logger.warn('receive SIGINT in app.js.');
});
process.on('exit', function() {
	console.log('receive exit in app.js.');
  logger.warn('receive exit in app.js.');
});
process.on('disconnect', function () {
	console.log('receive disconnect in app.js.');
	logger.warn('recieve disconnect. ');
}); 

process.on('SIGTERM', function(){
	console.log('receive SIGTERM in app.js.');
	logger.warn('recieve SIGTERM. ');
});

process.on('uncaughtException', function(error){
	console.log('receive uncaughtException in app.js.');
	logger.warn('recieve uncaughtException.');
});
*/
module.exports = app;