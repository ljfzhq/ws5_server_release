var path 				= require('path');
var fs	 				= require('fs');
var util	 			= require('util');
var ControllerHelper 	= require('./controllerhelper');

var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var GetDownloadInfo = function() {
	this.do = function(req, res) {
		var dataObj 	= null;
		var retVal 		= {
			status: true,
			id: 0,
			msg: helper.retval[0],
		};

		var acceptable = false;
		acceptable = helper.checkAcceptable(req);
		if(!acceptable){
console.log('access invalid');
			logger.error('invalid access. referer=' + req.headers.referer + '   origin=' + req.headers.origin);
			return res.send(retVal);
		}

		var dataFilePath = helper.fileLibPath + path.sep + 'task' + path.sep + 'downloadInfo.json';
		
		fs.exists(dataFilePath, function(exists) {
			var queueArray 	= null;
			var downloaded 	= 0;
			var total		= 0;
			var pending		= 0;
			
			if(exists) {
				queueArray = helper.getDataObj(dataFilePath);	
			}
	
			if(queueArray && util.isArray(queueArray) && queueArray.length) {
				var itemIndex = 0;
				var itemNumber = queueArray.length;
				
				for(itemIndex = 0 ; itemIndex < itemNumber; itemIndex++) {
					downloaded += queueArray[itemIndex].downloaded;
					pending += queueArray[itemIndex].remain;
				}
				
				total = downloaded + pending;
			}
			
			retVal.downloaded 	= downloaded;
			retVal.total 		= total;
			return res.send(retVal);
		});
	}
};
module.exports = GetDownloadInfo;

