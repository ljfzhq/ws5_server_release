var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var FileUtils 	= require('../utils/fileutils');
var Helper 		= require('../utils/helper');
var Site 		= require('../models/site');
var Config 		= require('../models/config');
var AccountRole = require('../models/accountrole');
var autoBackupDB = require('./autoBackupDB');
var ControllerHelper = require('./controller/client/controllerhelper');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();
var controllerHelper = new ControllerHelper();

var Login = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var userid		= '';
		var pwd		 	= '';
		var sitename	= '';
		var site 		= null;
		var config 		= null;
		var accountrole	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var siteObj		= {};
		
		//get parameter from request
		userid 	= req.body.id;
		pwd 	= req.body.pwd;
		sitename= req.body.site;
//console.log(req.body);
//sitename = "defaultsite";
		
		if(!userid || !pwd || !sitename) {
			logger.error('wrong parameter for login.');
			return res.send(retVal);
		}

		site 	= new Site();
		site.getByName(sitename, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(retVal);
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			accountrole = new AccountRole(siteObj);
			accountrole.getAccountByName(userid, function(err, accountInfo) {
				if(err) {
					if(err === 5) {
						retVal.id = 512;
						retVal.msg = helper.retval[512];
					}
					else {
						retVal.id = err;
						retVal.msg = helper.retval[err];
					}
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(retVal);
				}
				
				if(!accountInfo || !accountInfo.name || !accountInfo._id) {
					retVal.id = 512;
					retVal.msg = helper.retval[512];
					return res.send(retVal);
				}
				else {
					if(accountInfo.pwd === pwd) {
						//check whether register or not, standalone or remote
						retVal.device = 'new';
						config = new Config();
						config.get('controller', function(err, controllerConfigObj) {
							if(err) {
								logger.error('can not get controller config data from db. err=' + err);
							}
							
							if(controllerHelper.config && controllerHelper.config.playersettings && !controllerHelper.config.playersettings.server) {
								if(controllerConfigObj.serverurl && controllerConfigObj.playerid && controllerConfigObj.siteid && controllerConfigObj.playername && 
									controllerConfigObj.playerpwd && controllerConfigObj.grouppath && controllerConfigObj.uuid) {
									if(controllerConfigObj.local) {
										retVal.device = 'standalone';
									}
									else {
										retVal.device = 'net';
									}
								}
								else {
									retVal.device = 'new';
								}
							}
							else {
								retVal.device = 'server'; //pure server
							}
						
							retVal.id = 0;
							retVal.msg = helper.retval[0];
							retVal.status = true;
							
							req.session.siteObj = siteObj;
							req.session.userid = accountInfo._id.toString();
							
							logger.error('before send login response');
							res.send(retVal);												
							autoBackupDB.triggerMe();
							return;
						});
					}
					else {
						retVal.id = 513;
						retVal.msg = helper.retval[513];
	
						return res.send(retVal);
					}	
				}
			});
		});
	}
};

module.exports = Login;

