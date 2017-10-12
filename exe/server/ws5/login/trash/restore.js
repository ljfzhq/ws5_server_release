var Helper 		= require('../../../utils/helper');
var Trash	 	= require('../../../models/trash');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var RestoreTrashFile = function() {

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
		
		logger.debug('enter trash/restore.js');
		
		//get parameter from request
		var objArray = [{trashpath: '/trash/_deleted_5183008570267c4c10000001_Koala.jpg', type: 'image'}, {trashpath: '/trash/_deleted_5181f3b9170d974012000001_aaa', type: 'folder'}, {trashpath: '/trash/_deleted_5181f3bd170d974012000002_bbb', type: 'folder'}];
		
		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
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

				//analyze which module the path belongs to
				if(!objArray || (objArray.length === 0)) { return res.send(retVal); }
		
				trash = new Trash(siteObj);
				trash.restoreObj(objArray, accountInfo.name, function(err, failArray, confirmObj, unfinishedArray) {
					if(err && (err !== 141)) {
						retVal.id 		= err;
						retVal.msg 		= helper.retval[err];
						retVal.fails 	= failArray;
						logger.error('error occur when restore files in trash folder.');
						return res.send(retVal);
					}
					else {
						if(failArray && (failArray.length > 0)) { retVal.status = false; retVal.id = 14;}
						else { retVal.status = true; retVal.id = 0; }
						
						if(err === 141) { //need confirm
							req.session.restoreObjArray = unfinishedArray;
							req.session.failureObjArray = failArray;
							retVal.confirm = confirmObj;
						}

						retVal.id 		= err;
						retVal.msg 		= helper.retval[err];
						retVal.fails 	= failArray;
						logger.debug('return from trash/restore.js.');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
				});
			});
		});
	}
};

module.exports = RestoreTrashFile;

