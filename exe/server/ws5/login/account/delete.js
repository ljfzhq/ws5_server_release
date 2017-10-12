var Helper 	= require('../../../utils/helper');
var Privilege= require('../../../models/privilege');
var Site 	= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var privilege	= null;
var site 		= null;

var DeleteAccount = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal = {
			status: false,
			id: 100,
			msg: helper.retval[100],
		};
		var site 				= null;
		var accountrole			= null;
		var userid				= '';
		var siteid				= '';
		var siteObj				= {};

		var accountid			= '';
		
		logger.debug('enter account/delete.js.');
		
		accountid = req.body.id;
console.log('delete account');		
console.log(req.body);		

		//check the parameters validation
		if(!accountid) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('the parameter from request is not correct. ');
			return res.send(retVal);
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

				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('system', '/account', 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to delete account.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					else {
						if(have) {
							//delete record in DB
							accountrole.deleteAccountByID(accountid, function(err) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									logger.error('error occurs when call deleteAccountByID(). ' + err);
									return res.send(retVal);
								}
								else {
									retVal.id = 0;
									retVal.msg = helper.retval[0];
									retVal.status = true;

									logger.debug('return from account/delete.js.');
									logger.debug(JSON.stringify(retVal, '', 4));
									
									return res.send(retVal);
								}
							});
						}
						else {
							retVal.id = 521;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to delete account.');
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = DeleteAccount;

