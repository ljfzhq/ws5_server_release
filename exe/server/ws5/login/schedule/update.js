var path		= require('path');
var Helper 		= require('../../../utils/helper');
var Player		= require('../../../models/player');
var Channel		= require('../../../models/channel');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var UpdateChannelName = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= {};
		var player		= null;
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
		var newChannelPath	= '';
		
		logger.debug('enter schedule/update.js');
		//get parameter from request
/*
    	dataObj.name = 'channel3.chnl';
    	dataObj.path = '/player/group1/channel1.chnl';
*/
		dataObj = req.body;
		

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
				if((!dataObj) || (!dataObj.name) || (!dataObj.path)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('player', dataObj.path, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to read channel info.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					else {
						if(have) {
							groupPath = path.dirname(dataObj.path);
					
							player = new Player(siteObj);
							player.get(groupPath, function(err, groupObj) {
								if(err && (err != 5)) {
									retVal.id = err; 
									retVal.msg = helper.retval[err];
									logger.error('error occur when call player.get() in create.js');
									return res.send(retVal);
								}
								
								if(!groupObj || (err === 5)) {
									retVal.id = 251; 
									retVal.msg = helper.retval[251];
									logger.error('group does not exist. ' + dataObj.grouppath);
									return res.send(retVal);
								}
								
								if(groupObj.type !== 'group') {
									retVal.id = 252; 
									retVal.msg = helper.retval[252];
									logger.error('its type is not a group. ' + dataObj.grouppath);
									return res.send(retVal);
								}
		
								//update channel name
								newChannelPath = path.dirname(dataObj.path) + '/' + dataObj.name;
								channel.updateChannelName(newChannelPath, dataObj.path, function(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									if(!err) {
										retVal.status = true;
									}
									
									logger.debug('return from schedule/update.js');
									logger.debug(JSON.stringify(retVal, '', 4));
									return res.send(retVal);
								});
							});
						}
						else {
							retVal.id = 250; 
							retVal.msg = helper.retval[250];
							logger.error('you have not enough privilege to get channel information in current path (%s).', dataObj.path);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = UpdateChannelName;

