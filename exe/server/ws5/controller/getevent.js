var fs 			= require('fs');
var os 			= require('os');
var crypto 		= require('crypto');
var path 		= require('path');
var Helper 		= require('../../utils/helper');
var FileUtils 	= require('../../utils/fileutils');

var fileUtils	= new FileUtils();
var helper 		= new Helper();
var logger 		= helper.logger;

var GetEvent = function() {
	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var eventArray= [];
		var startTime = new Date().getTime();
		var holdingDuration = helper.serversettings.holdingduration || 60000;
		var eventDataFilePath = helper.fileLibPath + path.sep + 'tmp' + path.sep + 'event.json';

		var acceptable = false;
		var ControllerHelper 	= require('./client/controllerhelper');
		var controllerhelper 	= new ControllerHelper();
		acceptable = controllerhelper.checkAcceptable(req);
		if(!acceptable){
			logger.error('invalid access. referer=' + req.headers.referer + '   origin=' + req.headers.origin);
			return res.send(retVal);
		}

		var checkEvents = function() {
			var obj = fileUtils.getDataObj(eventDataFilePath);
			var now = new Date().getTime();
			
			if(!obj || !obj.length) {
				if((now - startTime) > holdingDuration) {
					retVal.status = true;
					retVal.id = 0;
					retVal.msg = helper.retval[0];
					retVal.events = [];
					return res.send(retVal);
				}
				else {
//console.log((now - startTime));
					setTimeout(checkEvents, 1000);
					return;
				}
			}
			else {
				try {
					fs.unlinkSync(eventDataFilePath);
				}
				catch(e) { 
					logger.error('exception occurs when remove event data file.');
					logger.error(e);
				}
			}
			
			for(var i = 0 ; i < obj.length; i++) {
				if(obj[i].expire) {
					var now = new Date().getTime();
					if(now < (obj[i].receiveTime + obj[i].expire)) {
						eventArray.push(obj[i]);
					}
					else {
						logger.debug('event is expired.');					
						logger.debug(obj[i]);					
					}
				}
				else {
					eventArray.push(obj[i]);
				}
			}
			
			if(eventArray && eventArray.length) {
				retVal.events = eventArray;
				
				retVal.status = true;
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				return res.send(retVal);
			}
			else {
				if((now - startTime) > holdingDuration) {
					retVal.events = [];
					retVal.status = true;
					retVal.id = 0;
					retVal.msg = helper.retval[0];
					return res.send(retVal);
				}
				else {
//console.log((now - startTime));
					setTimeout(checkEvents, 1000);
					return;
				}
			}
		}


		logger.debug('enter getevent.js');
		checkEvents();
	}
};
module.exports = GetEvent;

