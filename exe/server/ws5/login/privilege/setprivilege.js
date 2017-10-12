var fs 			= require('fs');
var path 		= require('path');
var util 		= require('util');
var Helper 		= require('../../../utils/helper');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var FileUtils 	= require('../../../utils/fileutils');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();
var SetPrivilege = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var siteid		= '';
		var siteObj		= {};
		var userid		= '';
		var dataArray	= [];	
		var dataObj		= {};
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var privilege 	= null;
		var site 		= null;
		var accountrole	= null;
		var	that		= this;
		var failArray	= [];
		var tempDataObj	= {};
		var currentUser = '';
		
		logger.debug('enter privilege/setprivilege.js');
		
		//check current user's privilege, then set or delete privilege for specified path.
		var _SetPrivilege = function(module, path, type, name, permission, currentuser) {
			var localPath = '';
			
			if(!module || !path || !type || !name) { req.emit('ProcessOne', 4); return; }
			
			privilege.checkPrivilege(module, path, 'account', currentUser, 4, function(err, have) { //need have full control on this path to change its privilege
				if(err) { req.emit('ProcessOne', err); return; }
				else {
					if(have) {
						if(permission.charAt(0) === '-') {//delete privilege setting
							privilege.deletePrivilege(module, path, type, name, function(err) {
								req.emit('ProcessOne', err);
								return;
							});
						}
						else { //update or insert
							privilege.updatePrivilege(module, path, type, name, permission, function(err) {
								req.emit('ProcessOne', err);
								return;
							});
						}
					}
					else {//have not privilege on this module's this path.
						failArray.push(dataObj);
						req.emit('ProcessOne', 0);
						return;
					}
				}
			});
		}

		req.on('ProcessOne', function(err) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('Fail to change privilege for ' + dataObj.path + ' for ' + dataObj.name + ' with ' + dataObj.privilege + '  errNo=' + err);
				if(failArray.length !== 0) { retVal.fails = failArray; }
				return res.send(retVal);
			}
			
			dataObj = dataArray.pop();
			if(dataObj) {
				_SetPrivilege(dataObj.module, dataObj.path, dataObj.type, dataObj.name, dataObj.privilege);
			}
			else {
				if(failArray.length !== 0) {
					retVal.id = 601;
					retVal.fails = failArray;
				}
				else {
					retVal.status = true;
					retVal.id = 0;
				}
				
				retVal.msg = helper.retval[retVal.id];
				logger.debug('return from privilege/setprivilege.js.');
				logger.debug(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
		});
		
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
				currentUser = accountInfo.name;
				
				//get data from request
				dataArray = req.body.data;

				if(!dataArray || !util.isArray(dataArray) || !dataArray.length) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('bad parameter.');
					
					return res.send(retVal);
				}
				
				req.emit('ProcessOne', '');
			});
		});
	}
};

module.exports = SetPrivilege;

