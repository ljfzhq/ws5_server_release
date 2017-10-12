var fs 			= require('fs');
var hfs 		= require('hfs');
var util 		= require('util');
var path 		= require('path');
var http 		= require('http');
var querystring = require('querystring');
var url 		= require('url');
var Shred 		= require("shred");
var ControllerHelper 	= require('./controllerhelper');

var shred 	= new Shred();
var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var ControllerDownloadFile = function() {
	this.do = function(req, res) {
		var fileURL 	= '';
		var fileURLbase64= '';
		var localPath 	= '';
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};

		var acceptable = false;
		acceptable = helper.checkAcceptable(req);
		if(!acceptable){
console.log('access invalid');
			logger.error('invalid access. referer=' + req.headers.referer + '   origin=' + req.headers.origin);
			return res.send(retVal);
		}

		//get parameter from request
		fileURL = req.query.url || '';
		
//console.log('url=' + fileURL);
		if(!fileURL)
		{
			return res.send(retVal);
		}
		
		fileURLbase64 = new Buffer(fileURL).toString('base64');
//console.log('fileURLbase64=' + fileURLbase64);
		localPath = helper.tmpPath + path.sep + fileURLbase64 + '.dat';
//console.log('localPath=' + localPath);
//console.log(req.session);
/*
		this.downloadFile(fileURL, localPath, '', function(err) {
console.log('finished download.' + err);
			if(err) {
				logger.error('error occurs when download file from URL: ' + fileURL);
				logger.error(err);
				return res.send(retVal);
			}
			
			retVal.status = true;
			retVal.id = 0;
			retVal.msg = helper.retval[0];
			return res.send(retVal);
		});
*/

		helper.getFileFromServer(fileURL, localPath, '', function(err, cookie) {
			if(err) {
				logger.error('error occurs when call getFileFromServer. ' + fileURL);
				logger.error(err);

				return res.send(retVal);
			}
			else {
//console.log(returnDataBuffer);				
				
				retVal.status = true;
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				return res.send(retVal);
			}
		});
	}
};
module.exports = ControllerDownloadFile;

