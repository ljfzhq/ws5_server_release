var fs 			= require('fs');
var os 			= require('os');
var path 		= require('path');
var childProcess = require('child_process');
var ControllerHelper= require('./client/controllerhelper');
var ControllerCmd 	= require('./client/command');
var controllerCmd 	= new ControllerCmd();

var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var PlayOtherMedia = function() {
	this.do = function(req, res) {

		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var dataObj 	= {};
		var jsonDataObj = {};
		var jsonDataFilePath = '';
		
		logger.debug('enter playothermedia.js');
		
		var acceptable = false;
		acceptable = helper.checkAcceptable(req);
		if(!acceptable){
console.log('access invalid');
			logger.error('invalid access. referer=' + req.headers.referer + '   origin=' + req.headers.origin);
			return res.send(retVal);
		}

		//get parameter from request
		dataObj = req.body.data;

		//for testing
/*
		dataObj = {};
		dataObj.mediaPath 	= 'd:\\private\\ws5\\download\\defaultsite\\media\\test\\a.ppt';
		dataObj.type 		= 'ppt';
		dataObj.duration 	= '10000'; //ms
		dataObj.top 		= '100';
		dataObj.left 		= '100';
		dataObj.width 		= '300';
		dataObj.height 		= '200';
*/
//console.log(dataObj);
		
		if(!dataObj || !dataObj.path || !dataObj.type || !dataObj.dur || !dataObj.top || !dataObj.left || !dataObj.width || !dataObj.height) {
			logger.error('got wrong parameter for calling playothermedia.js.');
			return res.send(retVal);
		}
		
//console.log(dataObj.start);
//console.log(new Date().getTime());
		dataObj.starttimeString = new Date(parseInt(dataObj.start, 10)).toISOString();
		if((dataObj.type === 'ppt') || (dataObj.type === 'doc') || (dataObj.type === 'pdf')) {
/*		
{ 

  "media" :[   
      {            
                "path": "d:\\WS5\\download\\defaultsite\\media\\MDPlayerHelp.doc",
                "dur": 30000,
                "start": 1403102336000,
                "type": "doc",
                "te": "0",
                "autoScroll": "false",
                "pdfZoom": "fitPage",
                "zorder": "0",
                "width": "0.5442708333333334",
                "height": "0.9861111111111112",
                "name": "zone 1",
                "id": "1",
                "lockRatio": "false",
                "shuffle": "false",
                "left": "0.4557291666666667",
                "top": "0.013888888888888888",
                "vol": "1"         
    }           
   ]
}		
*/
			jsonDataObj = {};
			jsonDataObj.media = [];
			jsonDataObj.media.push(dataObj);
			jsonDataFilePath = helper.serverPath + 'addon' + path.sep + 'mdx86' + path.sep + 'jsonFile' + path.sep + dataObj.name + '_' + new Date().getTime() + '.json';
			jsonDataFilePath = jsonDataFilePath.replace(/ /g, '_');
			helper.writeDataFile(jsonDataFilePath, jsonDataObj);
//console.log('jsonDataFilePath='+jsonDataFilePath);
		}
		else {
			logger.error('got unsupported media type for calling playothermedia.js.');
			logger.error('dataObj.type=' + dataObj.type);
			return res.send(retVal);
		}
		
		var option = { play : jsonDataFilePath };
		controllerCmd.callMDPlayerScheduler(helper, option, function(err) {
			retVal.status = err ? false : true;
			retVal.id = err;
			retVal.msg = helper.retval[err];
			return res.send(retVal);
		});
	}
};
module.exports = PlayOtherMedia;

