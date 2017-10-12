var Helper 		= require('../../../utils/helper');
var Channel		= require('../../../models/channel');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var PasteChannel = function() {

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
		
		var index		= 0;
		var curChannelName = '';
		var failArray	= [];
		
		var dataObj 	= {};
		var channelArray= [];
		
		var _pasteOneChannel = function(srcChannelPath, targetChannelPath, option) {
			var confirmObj = {};
			var failObj = {};

			channel.copyChannel(srcChannelPath, targetChannelPath, option, function(err, reason) {
				if(err) {
					if(reason === 'exist') {
						req.session.pasteChannelData = dataObj;
						req.session.pasteChannelFail = failArray;
						
						confirmObj.sourcepath = srcChannelPath;
						confirmObj.targetpath = targetChannelPath;
						retVal.id = 270;
						retVal.msg = helper.retval[270];
						retVal.confirm = confirmObj;
						return res.send(retVal);
					}
					else {
						failObj.sourcepath = srcChannelPath;
						failObj.targetpath = targetChannelPath;
						failObj.reason = reason;
						failArray.push(failObj);
					}
				}
				
				req.emit('PasteChannel');
			});
		}

		req.on('PasteChannel', function() {
			var srcChannelPath = '';
			var targetChannelPath = '';
			
			curChannelName = dataObj.channels.pop();
			if(!curChannelName) { //finished all
				if(failArray && failArray.length) { 
					retVal.id = 271; 
					retVal.fails = failArray; 
				}
				else { 
					retVal.status = true; 
					retVal.id = 0; 
				}
				
				retVal.msg = helper.retval[retVal.id];
				logger.debug('return from schedule/paste.js');
				logger.debug(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
			
			srcChannelPath = dataObj.sourcegroup + '/' + curChannelName;
			targetChannelPath = dataObj.targetgroup + '/' + curChannelName;
			_pasteOneChannel(srcChannelPath, targetChannelPath, 'none');
		});
		
		
		
		//------------start from here ---------------------
		logger.debug('enter schedule/paste.js');
		//get parameter from request
/*
		channelArray = ['channel1.chnl', 'channel2.chnl'];
		dataObj.channels = channelArray;
		dataObj.sourcegroup = '/player/group1';
		dataObj.targetgroup = '/player/group2';
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
				
				if(req.session.pasteChannelData) delete req.session.pasteChannelData;
				if(req.session.pasteChannelFail) delete req.session.pasteChannelFail;
				
				//check the parameters validation
				if((!dataObj) || (!dataObj.sourcegroup) || (!dataObj.targetgroup) || (!dataObj.channels) || (!dataObj.channels.length)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				//check privilege, must have read privilege on source node.
				privilege.checkPrivilege('player', dataObj.sourcegroup, 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to read source channel info.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					else {
						if(have) {
							//check privilege, must have write privilege on target node.
							privilege.checkPrivilege('player', dataObj.targetgroup, 'account', accountInfo.name, 2, function(err, have) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									logger.error('error occur when get privilege data from database or has not enough privilege to write target channel info.');
									logger.error(dataObj);
									return res.send(retVal);
								}
								else {
									if(have) {
										req.emit('PasteChannel');
									}
									else {
										retVal.id = 250; 
										retVal.msg = helper.retval[250];
										logger.error('you have not enough privilege to write channel in current path (%s).', dataObj.targetgroup);
										return res.send(retVal);
									}
								}
							});
						}
						else {
							retVal.id = 254; 
							retVal.msg = helper.retval[254];
							logger.error('you have not enough privilege to get channel information in current path (%s).', dataObj.sourcegroup);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = PasteChannel;

