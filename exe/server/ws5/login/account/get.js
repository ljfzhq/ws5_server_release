var Helper 		= require('../../../utils/helper');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;

var GetAccountInfo = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
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
		var accountid		= '';
		
		logger.debug('enter account/get.js');
		
		//get parameter from request
		accountid = req.body.id;
		
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
				
				//check the parameters validation
				if(!accountid) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('system', '/account', 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to read account information.');
						return res.send(retVal);
					}
					else {
						if(have) {
							//get record in DB
							accountrole.getAccountByID(accountid, function(err, obj) {
								retVal.id = err;
								retVal.msg = helper.retval[err];
								if(!err) {
									retVal.status = true;
									retVal.account = obj;
								}
								else {
									logger.error('error occurs when call getAccountByID(). ' + err);
								}
								
								logger.debug('return from account/get.js.');
								logger.debug(JSON.stringify(retVal, '', 4));
								return res.send(retVal);
							});
						}
						else {
							retVal.id = 521;
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to read account information.');
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = GetAccountInfo;

