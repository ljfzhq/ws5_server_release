var path 	= require('path');
var Helper 	= require('../../../utils/helper');
var Media 	= require('../../../models/media');
var Site 	= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;
var media 		= null;

var ReadFolder = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var filterObj 	= {};
		var basePath 	= '';
		var resultObj	= {};
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
			files: []
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};

		//data for test
		var metaArray 	= [];
		var lmtObj 		= {};
		var extArray 	= [];
		var typeArray 	= [];

		var dataObj 	= {};
		
		logger.debug('enter media/read.js');
		
		dataObj = req.body;
/*for unload a module
var configpath = path.normalize(helper.basePath + '/config/serverconfig.json');
if(configpath.charAt(1) === ':') {
	configpath = configpath.charAt(0).toUpperCase() + configpath.slice(1);
}
console.log(configpath);
console.log(require.cache[configpath]);
delete require.cache[configpath];
*/

//console.log(dataObj);		
/*
		if(!dataObj.data) { //fail
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('wrong data in request.');
			
			return res.send(retVal);
		}
*/
		basePath = dataObj.path;
		if(dataObj.filter) { filterObj = dataObj.filter; }

/*	
		//create test parameter
		metaArray.push({"remote": "false"});
		extArray.push('jpg');
		extArray.push('gif');
		typeArray.push('folder');
		typeArray.push('image');
//		typeArray.push('playlist');
//		typeArray.push('link');
//		typeArray.push('widget');
		lmtObj.start = new Date('2012/11/01');
		lmtObj.end = new Date('2012/12/31').toString();
				
		filterObj.type = typeArray;
//		filterObj.ext = extArray;
//		filterObj.note = 'media';
		filterObj.lastmodifytime = lmtObj;
//		filterObj.meta = metaArray;
//		filterObj.all = true;

		//get parameter from request and check its validation
		basePath = '/media/test';
*/
		
		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(retVal);
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			//get userid from session
			userid = req.session.userid; 
			
			accountrole = new AccountRole(siteObj);
			accountrole.getAccountByID(userid, function(err, accountInfo) {
				if(err) {
					retVal.id = err;
					retVal.msg = helper.retval[err];
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(retVal);
				}

				//get current folder's property
				media = new Media(siteObj);
				media.get(basePath, function(err, folderInfo) {
					if(err) { //fail
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occurs when get folder info from db. err:' + err + '  basePath:' + basePath);
						
						return res.send(retVal);
					}
					else //success
					{
						//call searchMediaByCondition to get result.
						media.searchMediaByCondition(filterObj, basePath, 0, accountInfo.name, 1, function(err, validArray, invalidArray) {
							if(!err) {
								retVal.status 	= true;
								retVal.id 		= 0;
								retVal.msg 		= helper.retval[0];
								retVal.lmt 		= folderInfo.lastmodifytime;
								retVal.note 	= folderInfo.note;
								retVal.files 	= validArray;
							}
							else {
								retVal.id 		= err;
								retVal.msg 		= helper.retval[err];
								retVal.lmt 		= null;
								retVal.note 	= '';
								retVal.files 	= [];
							}

							logger.debug('return from media/read.js. basePath:' + basePath + '  err:' + err);
//							logger.debug(JSON.stringify(retVal, '', 4));
							return res.send(retVal);
						});
					}				
				});
			});
		});
	}
};

module.exports = ReadFolder;

