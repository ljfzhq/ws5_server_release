var fs 			= require('fs');
var hfs 		= require('hfs');
var util 		= require('util');
var path 		= require('path');
var http 		= require('http');
var querystring = require('querystring');
var url 		= require('url');
var Config 		= require('../../models/config.js');
var Helper 		= require('../../utils/helper.js');
var ControllerHelper = require('../controller/client/controllerhelper.js');
var FileUtils 	= require('../../utils/fileutils');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils	= new FileUtils();

var controllerHelper = new ControllerHelper();

var Proxy = function() {
	helper.config 			= helper.loadConfig();

	this.getFile = function(urlString, method, cookie, postdata, targetPath, callback) {
		var req 		= null;
		var urlObj 		= {};
		var that 		= this;
		var bufferArray	= [];
		var bufferIndex = 0;
		var finalBuffer = null;
		var status 		= true;
		var cookie		= '';
		var bufferSize 	= 0;
		var lastModifiedTime = '';
		
		if(!urlString) { return callback(4, ''); }
		if(!targetPath) { return callback(4, ''); }
		if(!method) { return callback(4, ''); }
		
		that.getFileLastModifiedTime(targetPath, function(err, lmt) {
			urlObj 			= url.parse(urlString);
			urlObj.method 	= method;
		
			urlObj.headers = {	
							accept: '*/*; q=0.01',
							'If-Modified-Since': lastModifiedTime,
							Cookie: cookie }	;

			req = http.request(urlObj, function(res) {
			  	res.on('data', function (chunk) {
//console.log('receive data event for get. ' + chunk.length);	
					if(res.statusCode === 200) {
						bufferArray[bufferIndex] = chunk;
						bufferIndex++;
						bufferSize += chunk.length;	  		
	
						if(res.headers['set-cookie']) { cookie = res.headers['set-cookie']; }
					}
					else {
//console.log('res.statusCode=' + res.statusCode);
						status = false;
					}		
			  	});
			  	
			  	res.on('end', function () {
//console.log(res.statusCode);
//console.log('receive end event for get.');	
					if(status) {
						if(bufferIndex === 0) { //never download at all
							return callback(0, cookie);
						}
					 	else {
						 	if(bufferIndex === 1) {
								finalBuffer = bufferArray[0];
							}
							else {
								finalBuffer = Buffer.concat(bufferArray, bufferSize);
							}
			
							try{
								hfs.mkdirSync(path.dirname(targetPath));
								fs.writeFileSync(targetPath, finalBuffer);
							}
							catch(e) {
								logger.error('Fail to write data file to ' + targetPath);
								return callback('Fail to write data file', '');
							}
						}
						
						return callback(0, cookie);
					}
					else {
						return callback('http error ' + res.statusCode, '');
					}	  		
				});
			  	res.on('close', function (err) {
//console.log('receive close event for get.' + err);		  		
				});
			});
			
			req.on('error', function(e) {
				logger.error('problem with request: ' + e.message);
				return callback('download error', '');
			});
			
			req.end();	
		});	
	}

	this.sendRequestToServer = function(urlString, method, postdata, proxy, cookie, callback) {
		var proxyReq	= null;
		var urlObj 		= {};
		var that 		= this;
		var bufferArray	= [];
		var bufferIndex = 0;
		var finalBuffer = null;
		var status 		= true;
		var bufferSize 	= 0;
		var chunkString	= '';
		var cookie		= '';
		
		if(!urlString) { return callback(4, '', '', ''); }
		if(!method) { return callback(4, '', '', ''); }
		if((method === 'POST') && !postdata) { return callback(4, '', '', ''); }

		
		var bypass = false;	
		urlObj = url.parse(urlString);
		if(proxy && proxy.bypass && util.isArray(proxy.bypass)) {
			bypass = controllerHelper.matchByPass(proxy, urlObj);
		}
		
		if(!bypass && proxy && proxy.host && proxy.port) {
			urlObj.host = proxy.host;
			urlObj.port = proxy.port;
			urlObj.headers = {};
			if(proxy.id) {
				authBuffer = new Buffer(proxy.id + ':' + proxy.pwd);

				urlObj.auth = proxy.id + ':' + proxy.pwd;
				urlObj.headers['Proxy-Connection'] = 'keep-alive';
				urlObj.headers['Proxy-Authorization'] = 'Basic ' + authBuffer.toString('base64');
			}
			urlObj.path = urlString;
		}	
		else {
			urlObj		= url.parse(urlString);
			urlObj.headers = {};
		}

		urlObj.method 	= method;
		
		if(method === 'POST') {
			urlObj.headers = {	connection: 'keep-alive',
								accept: 'application/json, text/javascript, */*; q=0.01',
								'Content-Type': 'application/x-www-form-urlencoded',
								'Content-Length': postdata.length,
								Cookie: cookie 
							 };
		}
		else {
			urlObj.headers = {	connection: 'keep-alive',
								accept: 'application/json, text/javascript, */*; q=0.01',
								Cookie: cookie 
							 };
		}
		
		try{
		proxyReq = http.request(urlObj, function(proxyRes) {
		  	proxyRes.on('data', function (chunk) {
				if(proxyRes.statusCode === 200) {
					bufferArray[bufferIndex] = chunk;
					bufferIndex++;
					bufferSize += chunk.length;	  		

					if(proxyRes.headers['set-cookie']) { cookie = proxyRes.headers['set-cookie']; }
				}
				else {
					status = false;
				}	
		  	});
		  	
		  	proxyRes.on('end', function () {
				if(!cookie) { cookie = proxyRes.headers['set-cookie']; }	
								
				if(status) {
					if(chunkString) {
						return callback(0, chunkString, proxyRes.headers['content-type'], cookie);
					}
					else {
						if(bufferIndex === 0) { //never download at all
							return callback(0, '', proxyRes.headers['content-type'], cookie);
						}
					 	else {
						 	if(bufferIndex === 1) {
								finalBuffer = bufferArray[0];
							}
							else {
//console.log('buffer size=' + bufferSize);
								finalBuffer = Buffer.concat(bufferArray, bufferSize);
//console.log('buffer size=' + finalBuffer.length);
							}
						}
						
						return callback(0, finalBuffer, proxyRes.headers['content-type'], cookie);
					}
				}
				else {
					return callback('http error ' + proxyRes.statusCode, '', '', '');
				}	  		
			});
			
		  	proxyRes.on('close', function (err) {
			});
		});
		}catch(ex){
			logger.error('exception with request: ' + ex.message);
			return callback('download error', '', '', '');
		}
		proxyReq.on('error', function(e) {
			logger.error('problem with request: ' + e.message);
			return callback('download error', '', '', '');
		});
		
		// write data to request body
		if(method === 'POST') {
			proxyReq.write(postdata);
		}
		
		proxyReq.end();		
	}


	this.do = function(req, res) {
		var fileURL 	= '';
		var localPath 	= '';
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var dataObj 	= {};
		var postString	= '';
		
		logger.debug('enter proxy.js');
		
		//get parameter from request
		dataObj = req.body;

/*
dataObj = {
	url: 'http://localhost:2000/lib/defaultsite/media/201306133.jpg',
	type:'get',
	postdata:''
};

var obj = {
	siteid: '50dd19a9f11bc57013000031',
	playerid: '51cd8fb69c3d4b9813000001',
	pwd: 'e10adc3949ba59abbe56e057f20f883e'
};
		
dataObj = {
	url: 'http://localhost:2000/ws5/login/controller/login.js',
	type:'post',
	postdata: querystring.stringify(obj)
};

dataObj = {
	url: 'http://www.douban.com/note/77547342/',
	type:'get'
};
dataObj = {
	url: 'http://news.qq.com/newsgn/rss_newsgn.xml',
	type:'get'
};
*/	

		if(!dataObj || !dataObj.url || !dataObj.type)
		{
			logger.error('bad parameter.');
			return res.send(retVal);
		}
		
		dataObj.type = dataObj.type.toUpperCase();
		
		if((dataObj.type === 'POST') && !dataObj.postdata) {
			logger.error('without postdata');
			return res.send(retVal);
		}
//console.log(dataObj);

		var proxy = {};
		var config = new Config();
		var that = this;
		config.get('controller', function(err, controllerConfig) {
			if(err) {
				logger.error('error occurs when get controller config. err=' + err);
				controllerConfig = null;
			}
			
			if(req.headers.referer && req.headers.origin && controllerConfig) {
				if(req.headers.referer.slice(req.headers.origin.length) === '/render/ws5.html') {
					proxy = controllerConfig.proxy;
				}
			}

			that.sendRequestToServer(dataObj.url, dataObj.type, dataObj.postdata, proxy, '', function(err, returnData, contentType, contentLength, cookie) {
				if(err) {
//console.log('error occurs when get remote data. ' + err);
					logger.error('error occurs when call postRequestToServer() to get content from (' + dataObj.url + '). err code is: ' + err);
					logger.error(dataObj);
	
					return res.send(retVal);
				}
				else {
					retVal.status = true;
					retVal.id = 0;
					retVal.msg = helper.retval[0];
					retVal.contentType = contentType;
					retVal.content = returnData.toString('base64');
					
					logger.debug('return from proxy.js');
					return res.send(retVal);
				}
			});
		});
	}
};
module.exports = Proxy;

