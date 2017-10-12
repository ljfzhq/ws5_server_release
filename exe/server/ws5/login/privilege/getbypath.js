var fs 			= require('fs');
var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var privilege 	= null;
var site 		= null;
var accountrole	= null;
var GetByPath = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var siteid		= '';
		var siteObj		= {};
		var userid		= '';
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var	that		= this;
		var dataObj		= {};
		
		logger.debug('enter privilege/getbypath.js.');

		var _getPrivilege = function(filePath, fileModule, callback) {
			privilege.getPrivilegeByPath(filePath, fileModule, function(err, selfArray, inheritArray) {
				return callback(err, selfArray, inheritArray);
			});
		}
		
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

				privilege = new Privilege(siteObj);
				
				//get data from request
				dataObj = req.body.data;
				
				if(!dataObj || !dataObj.path || !dataObj.module) {
					logger.debug('bad parameter.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal);
				}

				//current user must have read privilege on specified path
				privilege.checkPrivilege(dataObj.module, dataObj.path, 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('Error occur when check privilege.');
						return res.send(retVal);
					}
					else {
						if(have) {
							_getPrivilege(dataObj.path, dataObj.module, function(err, selfArray, inheritArray) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									logger.error('Error occur when call getPrivilegeByPath().');
									return res.send(retVal);
								}
								else {
									retVal.status 				= true;
									retVal.id 					= 0;
									retVal.msg 					= helper.retval[0];
									retVal.inherit_privilege	= inheritArray;
									retVal.self_privilege		= selfArray;
									logger.debug('return from privilege/getbypath.js.');
									logger.debug(JSON.stringify(retVal, '', 4));
									return res.send(retVal);
								}
							});
						}
						else {
							retVal.id = 601;
							retVal.msg = helper.retval[601];
							logger.error('Current user (%s) has not enough privilege to get other user privilege', accountInfo.name);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = GetByPath;

