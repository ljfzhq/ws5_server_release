var fs 			= require('fs');
var hfs 		= require('hfs');
var util 		= require('util');
var path 		= require('path');
var Helper 		= require('../../utils/helper.js');
var FileUtils 	= require('../../utils/fileutils');
var Site		= require('../../models/site');
var Privilege 	= require('../../models/privilege');
var AccountRole = require('../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils	= new FileUtils();

var Setting = function() {
	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var site 		= null;
		var accountrole	= null;
		var privilege 	= null;
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};

		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var dataObj 	= {};
		var encodedPwd 	= '';
		var hbInterval	= 0;
		var topfirst	= true;
		var changed		= false;
		
		
		logger.debug('enter setting.js');
		
		//get parameter from request
		dataObj = req.body.data;

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

				privilege 	= new Privilege(siteObj);

				if(!dataObj)
				{
					//check privilege, must have write privilege on parent node.
					privilege.checkPrivilege('system', '/setting', 'account', accountInfo.name, 1, function(err, have) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							logger.error('error occur when get privilege data from database or has not enough privilege to get system setting. ' + accountInfo.name);
							return res.send(retVal);
						}
						else {
							if(have) {
								retVal.status = true;
								retVal.id = 0;
								retVal.msg = helper.retval[retVal.id];
								
								retVal.hbinterval = helper.serversettings.heartbeatInterval;
								retVal.topfirst = helper.serversettings.topfirst;
								retVal.emailServer = helper.serversettings.emailServer;
								retVal.emailLang = helper.serversettings.emailLang;
								retVal.abnormalEmail = helper.serversettings.abnormalEmail;
								 
								logger.debug('return from setting.js for get settings');
								return res.send(retVal);
							}
							else {
								retVal.id = 551;
								retVal.msg = helper.retval[retVal.id];
								logger.error('you have not enough privilege to get system setting.');
								return res.send(retVal);
							}
						}
					});	
				}
				else {
					//check privilege, must have write privilege on parent node.
					privilege.checkPrivilege('system', '/setting', 'account', accountInfo.name, 1, function(err, have) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							logger.error('error occur when get privilege data from database or has not enough privilege to change system setting. ' + accountInfo.name);
							return res.send(retVal);
						}
						else {
							if(have) {
								if(dataObj.playerregpwd && (dataObj.playerregpwd.length > 0) && (helper.serversettings.playerpwd !== dataObj.playerregpwd)) {
									helper.serversettings.playerpwd = dataObj.playerregpwd;
									changed = true;
								}
								
								if(dataObj.hbinterval) {
									hbInterval = parseInt(dataObj.hbinterval, 10);
									if((hbInterval > 0) && (hbInterval !== helper.serversettings.heartbeatInterval)) {
										helper.serversettings.heartbeatInterval = hbInterval;
										changed = true;
									}
								}
								
								if(dataObj.emailServer !== helper.serversettings.emailServer) {
									helper.serversettings.emailServer = dataObj.emailServer;
									changed = true;
								}
								
								if(dataObj.abnormalEmail !== helper.serversettings.abnormalEmail) {
									helper.serversettings.abnormalEmail = dataObj.abnormalEmail;
									changed = true;
								}
								
								if(dataObj.emailLang !== helper.serversettings.emailLang) {
									helper.serversettings.emailLang = dataObj.emailLang;
									changed = true;
								}
								
								if(dataObj.topfirst) {
									topfirst = (dataObj.topfirst === true) || (dataObj.topfirst === 'true');
									if(topfirst !== helper.serversettings.topfirst) {
										helper.serversettings.topfirst = topfirst;
										changed = true;
									}
								}
								
								if(changed) {
									helper.writeConfigFile(helper.config, function(err) {
										if(err) {
											retVal.status = false;
											retVal.id = 19;
										}
										else {
											retVal.status = true;
											retVal.id = 0;
										}
						
										retVal.msg = helper.retval[retVal.id];
										retVal.hbinterval = helper.serversettings.heartbeatInterval;
										retVal.topfirst = helper.serversettings.topfirst;
										
										logger.debug('return from setting.js');
										return res.send(retVal);
									});
								}
							}
							else {
								retVal.id = 550;
								retVal.msg = helper.retval[retVal.id];
								logger.error('you have not enough privilege to change system setting.');
								return res.send(retVal);
							}
						}
					});	
				}
			});
		});
	}
};
module.exports = Setting;

