var Helper 		= require('../../../utils/helper');
var Trash	 	= require('../../../models/trash');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var RestoreTrashFileConfirm = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var trash	 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var failureArray= [];
		var objArray	= [];
		var tempArray	= [];
		var confirmOption = '';
		
		logger.debug('enter trash/restoreconfirm.js');
		
		//get parameter from request
		var confirmedObj = {"trashpath":"/trash/_deleted_5181f3bd170d974012000002_bbb",
							"type":"folder",
							"module":"media",
							"objid":"5181f3bd170d974012000002",
							"path":"/media/bbb",
							"name":"bbb",
							"confirm" : "overwrite",
							"applytoall":true
							};
		tempArray.push(confirmedObj);
		
		if(!confirmedObj || !confirmedObj.trashpath || !confirmedObj.type || !confirmedObj.path || !confirmedObj.confirm) { 
			return res.send(retVal); 
		}
		
		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		objArray 		= req.session.restoreObjArray;
		failureArray 	= req.session.failureObjArray;
		
		if(req.session.restoreObjArray) delete req.session.restoreObjArray;
		if(req.session.failureObjArray) delete req.session.failureObjArray;
		
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

				trash = new Trash(siteObj);

				if((confirmedObj.confirm === 'cancel') || ((confirmedObj.confirm === 'skip') && (confirmedObj.applytoall === true))) {
					retVal.id = 0;
					retVal.msg = helper.retval[0];
					return res.send(retVal);
				}
				else {
					if(confirmedObj.confirm === 'skip') {
						if(objArray && objArray.length) {
							trash.dealWithRestore(objArray, failureArray, 'needconfirm', function(err, confirmObj, processingArray) {
								if(err && (err !== 141)) {
									retVal.id 		= err;
									retVal.msg 		= helper.retval[err];
									retVal.fails 	= failureArray;
									logger.error('error occur when restore files in trash folder.');
									return res.send(retVal);
								}
								else {
									if(failureArray && (failureArray.length > 0)) { retVal.status = false; retVal.id = 14;}
									else { retVal.status = true; retVal.id = 0; }
									
									if(err === 141) { //need confirm
										req.session.restoreObjArray = processingArray;
										req.session.failureObjArray = failureArray;
										retVal.confirm = confirmObj;
									}
			
									retVal.id 		= err;
									retVal.msg 		= helper.retval[err];
									retVal.fails 	= failureArray;
									logger.debug('return from trash/restoreconfirm.js.');
									logger.debug(JSON.stringify(retVal, '', 4));
									return res.send(retVal);
								}
							});
						}
						else {
							retVal.id = 0;
							retVal.msg = helper.retval[0];
							logger.debug('return from trash/restoreconfirm.js.');
							logger.debug(JSON.stringify(retVal, '', 4));
							return res.send(retVal);
						}
					}
					else {
						trash.dealWithRestore(tempArray, failureArray, confirmedObj.confirm, function(err, confirmObj, processingArray) {
							if(err) {
								retVal.id 		= err;
								retVal.msg 		= helper.retval[err];
								retVal.fails 	= failureArray;
								logger.error('error occur when restore files in trash folder.');
								return res.send(retVal);
							}
							else {
								if(confirmedObj.applytoall) { confirmOption = confirmedObj.confirm; }
								else { confirmOption = 'needconfirm'; }
								
								if(objArray && objArray.length) {
									trash.dealWithRestore(objArray, failureArray, confirmOption, function(err, confirmObj, processingArray) {
										if(err) {
											retVal.id 		= err;
											retVal.msg 		= helper.retval[err];
											retVal.fails 	= failureArray;
											logger.error('error occur when restore files in trash folder.');
											return res.send(retVal);
										}
										else {
											if(failureArray && (failureArray.length > 0)) { retVal.status = false; retVal.id = 14;}
											else { retVal.status = true; retVal.id = 0; }
											
											if(err === 141) { //need confirm
												req.session.restoreObjArray = unfinishedArray;
												req.session.failureObjArray = failureArray;
												retVal.confirm = confirmObj;
											}
					
											retVal.id 		= err;
											retVal.msg 		= helper.retval[err];
											retVal.fails 	= failureArray;
											logger.debug('return from trash/restoreconfirm.js.');
											logger.debug(JSON.stringify(retVal, '', 4));
											return res.send(retVal);
										}
									});
								}
								else {
									retVal.id = 0;
									retVal.msg = helper.retval[0];
									logger.debug('return from trash/restoreconfirm.js.');
									logger.debug(JSON.stringify(retVal, '', 4));
									return res.send(retVal);
								}
							}
						});
					}
				}
			});
		});
	}
};

module.exports = RestoreTrashFileConfirm;

