var fs 			= require('fs');
var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var Media		= require('../../../models/media');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var GetFile = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var mediaPath	= '';
		var mediaType 	= '';
		var media		= null;
		var site 		= null;
		var accountrole	= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		
		logger.debug('enter media/get.js');
		
		//get parameter from request
		mediaPath = req.body.path;
		mediaType = req.body.type;
		
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

				media	 	= new Media(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if(!mediaPath) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('media', mediaPath, 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to get media information.    ' + mediaPath);
						return res.send(retVal);
					}
					else {
						if(have) {
							//create record in DB, create folder
							media.get(mediaPath, function(err, mediaObj) {
								retVal.id = err;
								retVal.msg = helper.retval[err];
								if(!err) {
									retVal.status = true;
									retVal.media = mediaObj;
								}
								logger.debug('return from media/get.js.');
								logger.debug(JSON.stringify(retVal, '', 4));
								return res.send(retVal);
							});
						}
						else {
							if(mediaType === 'folder') { retVal.id = 110; }
							else if(mediaType === 'playlist') { retVal.id = 111; }
							else { retVal.id = 112; }
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to get media in current path (%s).', mediaPath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = GetFile;

