var fs 			= require('fs');
var os 			= require('os');
var path 		= require('path');
var Helper 		= require('../../utils/helper');
var FileUtils 	= require('../../utils/fileutils');

var fileUtils	= new FileUtils();
var helper 		= new Helper();
var logger 		= helper.logger;
/* 
 * 检测对象是否是空对象(不包含任何可读属性)。 //如你上面的那个对象就是不含任何可读属性
 * 方法只既检测对象本身的属性，不检测从原型继承的属性。 
 */
function isOwnEmpty(obj) 
{ 
    for(var name in obj) 
    { 
        if(obj.hasOwnProperty(name)) 
        { 
            return false; 
        } 
    } 
    return true; 
}; 
 
/* 
 * 检测对象是否是空对象(不包含任何可读属性)。 
 * 方法既检测对象本身的属性，也检测从原型继承的属性(因此没有使hasOwnProperty)。 
 */
function isEmpty(obj) 
{ 
    for (var name in obj)  
    { 
        return false; 
    } 
    return true; 
}; 

var SetEvent = function() {
	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var dataObj 	= {};
		var expireMS 	= '';
		
		logger.debug('enter setevent.js');
		
		//get parameter from request
		if(req.body && !isOwnEmpty(req.body)) {
			dataObj = req.body;
		}
		else if(req.query && !isOwnEmpty(req.query)){
			dataObj = req.query;
		}
		else {
			logger.error('got wrong parameter for calling setevent.js.');
			return res.send(retVal);
		}
//console.log('dataObj=');
//console.log(dataObj);
/*
		dataObj = {
			regpwd: '123456',
			name: 'bbbb',
			expire: '40000',
			extra: {a:'asadads', b:'bertwertwert'}
		};
*/
		
		if(!dataObj || !dataObj.regpwd || !dataObj.name) {
			logger.error('got wrong parameter for calling setevent.js.');
			return res.send(retVal);
		}
		
		var encodedPWD = fileUtils.EncodeStringB64Sha256(dataObj.regpwd);
		if(encodedPWD !== helper.serversettings.playerpwd) {
			retVal.id = 452;
			retVal.msg = helper.retval[452];
			logger.error('got wrong password for calling setevent.js.');
			return res.send(retVal);
		}
		
		if(dataObj.expire) {
			expireMS = parseInt(dataObj.expire, 10);
			if(expireMS <= 0) {
				logger.error('got wrong parameter for calling setevent.js.');
				return res.send(retVal);
			}
			
			dataObj.expire = expireMS;
			dataObj.receiveTime = new Date().getTime();
		}
		
		var eventDataFilePath = helper.fileLibPath + path.sep + 'tmp' + path.sep + 'event.json';
		var obj = fileUtils.getDataObj(eventDataFilePath);
		var newEventArray = []; 
		if(obj && obj.length) {
			newEventArray = obj;
		}
		newEventArray.push(dataObj);
		
		fileUtils.writeDataFile(eventDataFilePath, newEventArray);
		
		retVal.status = true;
		retVal.id = 0;
		retVal.msg = helper.retval[0];
		return res.send(retVal);
	}
};
module.exports = SetEvent;

