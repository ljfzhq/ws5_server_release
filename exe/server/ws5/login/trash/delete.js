var Helper 		= require('../../../utils/helper');
var Trash	 	= require('../../../models/trash');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var DeleteTrashFile = function() {

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
		
		logger.debug('enter trash/delete.js');
		
		//get parameter from request
		var objArray = [{trashpath: '/trash/_deleted_517b957ee71e93d808000001_abcabc', type: 'folder'}];
		
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

				//analyze which module the path belongs to
				if(!objArray || !objArray.length) { return res.send(retVal); }
		
				trash = new Trash(siteObj);
				trash.deleteObj(objArray, accountInfo.name, function(err, failArray) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when delete files in trash folder.');
						return res.send(retVal);
					}
					else {
						if(failArray && (failArray.length > 0)) { retVal.status = false; retVal.id = 9;}
						else { retVal.status = true; retVal.id = 0;}
		
						retVal.msg 		= helper.retval[retVal.id];
						retVal.fails 	= failArray;
						logger.debug('return from trash/delete.js.');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
				});
			});
		});
	}
};

module.exports = DeleteTrashFile;

