var Helper 	= require('../../../utils/helper');
var Media 	= require('../../../models/media');
var Site 	= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var media 		= null;
var site 		= null;
var accountrole	= null;

var SearchMedia = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
/*
		var metaArray 	= [];
		var lmtObj 		= {};
		var extArray 	= [];
		var typeArray 	= [];
*/
		var filterObj 	= {};
		var basePath 	= '';
		var resultObj	= {};
		var userid		= '';
		var retVal = {
			status: false,
			id: 100,
			msg: helper.retval[100]
		};
		var siteid		= '';
		var siteObj		= {};
	
		logger.debug('enter media/search.js');

/*		
		metaArray.push({"remote": "false"});
		extArray.push('jpg');
		extArray.push('gif');
		typeArray.push('folder');
//		typeArray.push('image');
		typeArray.push('playlist');
		typeArray.push('link');
		typeArray.push('widget');
		lmtObj.start = new Date('2012/11/01');
		lmtObj.end = new Date('2012/12/31').toString();
				
				
		filterObj.type = typeArray;
//		filterObj.ext = extArray;
//		filterObj.note = 'media';
		filterObj.lastmodifytime = lmtObj;
//		filterObj.meta = metaArray;
		filterObj.all = true;

		//get parameter from request and check its validation
		basePath = '/media/test';
*/
		basePath = req.body.path;
		filterObj = req.body.filter;
		
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
				media.searchMediaByCondition(filterObj, basePath, 1, accountInfo.name, 1, function(err, validArray, invalidArray) {
					if(!err) {
						retVal.status 	= true;
						retVal.id 		= 0;
						retVal.msg 		= helper.retval[0];
						retVal.files 	= validArray;
					}
					else {
						retVal.id 		= err;
						retVal.msg 		= helper.retval[err];
						retVal.files 	= [];
					}
		
					logger.debug('return from media/search.js.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal);
				});
			});
		});
	}
};

module.exports = SearchMedia;

