var Helper 		= require('../../../utils/helper');
var Channel		= require('../../../models/channel');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var DeleteChannel = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var channel		= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		
		var dataObj 	= {};
		var dataArray 	= [];


		logger.debug('enter schedule/delete.js');
		//get parameter from request
/*
		dataObj.channelpath = '/player/group1/channel1.chnl';
		dataArray.push(dataObj);
		
		dataObj = {};
		dataObj.channelpath = '/player/group1/channel2.chnl';
		dataArray.push(dataObj);
*/
		
		dataArray = req.body;
		
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

				channel	 	= new Channel(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!dataArray) || (!dataArray.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('player', dataArray[0].channelpath, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to delete channel.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					else {
						if(have) {
							//create channel
							channel.deleteChannelArray(dataArray, function(err) {
								retVal.id = err;
								retVal.msg = helper.retval[err];
								if(!err) {
									retVal.status = true;
								}
								
								logger.debug('return from schedule/delete.js');
								logger.debug(JSON.stringify(retVal, '', 4));
								return res.send(retVal);
							});
						}
						else {
							retVal.id = 250; 
							retVal.msg = helper.retval[250];
							logger.error('you have not enough privilege to delete channel in current path (%s).',  dataArray[0].channelpath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = DeleteChannel;

