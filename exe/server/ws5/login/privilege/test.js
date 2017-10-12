var fs = require('fs');
var path = require('path');
var Helper = require('../../../utils/helper');
var Privilege = require('../../../models/privilege');
var Site 	= require('../../../models/site');
var FileUtils = require('../../../utils/fileutils');

var helper 		= new Helper();
var logger = helper.logger;
var privilege = null;
var site 		= null;

var Test = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var siteid			= '';
		var siteObj			= {};

		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(JSON.stringify(retVal));
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			privilege = new Privilege(siteObj);
			
			//test addPrivilege(priviObj, callback) 
	/*
	*/
	//		var privObj = {module:'media', path:'/media/test/test1', account:'account1', privilege:'1', deleted: false};
	//		var privObj = {module:'media', path:'/media/test/test1', role:'role1', privilege:'2', deleted: false};
	//		var privObj = {module:'media', path:'/media/test/test1/media1.jpg', account:'account1', privilege:'2', deleted: false};
	//		var privObj = {module:'media', path:'/media/test', account:'account2', privilege:'8', deleted: false};
	//		var privObj = {module:'media', path:'/media/test/test3/test31', account:'account2', privilege:'2', deleted: false};
			var privObj = {module:'player', path:'/player/group2/group22/player7', account:'account2', privilege:'0', deleted: false};
			privilege.addPrivilege(privObj, function(err) {
				return res.send(err);
			});
	
			//test deletePrivilege(module, filePath, accType, name, callback) 
	/*
	//		privilege.deletePrivilege('media', '/media/test/test1', 'account', 'account1', function(err) {
	//		privilege.deletePrivilege('', '', 'account', 'account1', function(err) {
			privilege.deletePrivilege('', '', 'role', 'role1', function(err) {
				console.log(err);
				return res.send('what you saw?');
			});
	*/
	
			//test updatePrivilege(module, filePath, accType, name, newPrivilege, callback)  
	/*
			privilege.updatePrivilege('media', '/media/test/test1', 'account', 'account1', 14, function(err) {
				console.log(err);
				return res.send('what you saw?');
			});
	*/		
			
			//test updatePrivilegeForTrashObj(module, filePath, suffix, callback)
	/*
			privilege.updatePrivilegeForTrashObj('media', '/media/test/test1', '_delete_idasdasdasdasdasdaffgdsfgsdfg', function(err) {
				console.log(err);
				return res.send('what you saw?');
			});
	*/		
			
			//test updateFolderName(module, oPath, nPath, callback) 
	/*
			privilege.updateFolderName('media', '/media/test/test1', '/media/test/test3333', function(err) {
				console.log(err);
				return res.send('what you saw?');
			});
	*/	
			
			//test updateAccountName(accType, oName, nName, callback)
	/*
	//		privilege.updateAccountName('account', 'account1', 'account2', function(err) {
			privilege.updateAccountName('role', 'role1', 'role2', function(err) {
				console.log(err);
				return res.send('what you saw?');
			});
	*/
			
			//test checkPrivilege(module, filePath, acctype, name, privilege, callback) 
	/*
			privilege.checkPrivilege('media', '/media/test/test1', 'account', 'account2', 1, function(err) {
				console.log(err);
				return res.send('what you saw?');
			});
	*/		
		});
	}
};

module.exports = Test;

