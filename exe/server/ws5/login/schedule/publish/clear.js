var path		= require('path');
var Helper 		= require('../../../../utils/helper');
var Publish		= require('../../../../models/publish');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var Clear = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var publish		= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var dateString	= '';
		

		logger.debug('enter schedule/publish/clear.js');
		
		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id 	= err;
				retVal.msg 	= helper.retval[err];
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
					retVal.id 	= err;
					retVal.msg 	= helper.retval[err];
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(retVal);
				}

				publish		= new Publish(siteObj);
				
				dateString = new Date(new Date().getTime()/* - 86400000 * 2*/).toISOString().replace(/\-/g, ':').slice(0, 10);
console.log('dateString= ' + dateString);
				publish.removeOldPublishData(dateString, function(err) {
					if(err) {
						logger.error('error occurs when remove old publish data. ' + err);
					}
					else {
						retVal.status = true;
					}
					
					retVal.id = err;
					retVal.msg = helper.retval[err];
					
					return res.send(retVal);
				});
			});
		});
	}
};

module.exports = Clear;

