var path		= require('path');
var Helper 		= require('../../../../utils/helper');
var Publish		= require('../../../../models/publish');
var Player	 	= require('../../../../models/player');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var GetPublishHistory = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var publish		= null;
		var player 		= null;
		var accountrole	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};

		var size		= 0;
		var publishRejectItemArray	= [];
		var itemNumber	= 0;
		var itemIndex	= 0;
		var outputArray	= [];


		
		logger.debug('enter schedule/publish/gethistory.js');
		//get parameter from request
		size 	 = parseInt(req.body.size, 10);
		
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
				player	 	= new Player(siteObj);
				
				//check the parameters validation
				if(size <= 0) {
					retVal.id 	= 4;
					retVal.msg 	= helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					return res.send(retVal);
				}
		
				
				req.on('PrepareOutputData', function(firstTime) {
					var publishRejectItem = {};
					
					if(!firstTime) { itemIndex ++; }
					
					if(itemIndex >= itemNumber) {
						
						retVal.status	= true;
						retVal.id 		= 0;
						retVal.msg 		= helper.retval[0];
						retVal.history  = outputArray;
						logger.debug('return from schedule/publish/gethistory.js');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
					
					if(publishRejectItemArray[itemIndex].status === 'published') {
						publishRejectItem.type = 'publish';
					}
					else {
						publishRejectItem.type = 'reject';
					}	
					
					publishRejectItem.time = publishRejectItemArray[itemIndex].lastmodifytime;
					publishRejectItem.postdata = {
						startdate: publishRejectItemArray[itemIndex].startdate,
						enddate: publishRejectItemArray[itemIndex].enddate,
						listtype: publishRejectItemArray[itemIndex].listtype,
						scheduletype: publishRejectItemArray[itemIndex].channelid ? 'channel' : 'schedule'
					};
					
					accountrole.getAccountByID(publishRejectItemArray[itemIndex].accountid, function(err, accountObj) {
						if(err) {
							logger.error('error occurs when get account information in PrepareOutputData Event.' + err);
							publishRejectItem.username = 'unknown account';
						}
						else {
							publishRejectItem.username = accountObj.name;
						}
						
						player.getByID(publishRejectItemArray[itemIndex].groupid, function(err, groupInfo) {
							if(err) {
								logger.error('error occurs when get group information in PrepareOutputData Event.' + err);
								publishRejectItem.postdata.grouppath = 'unknow group';
							}
							else {
								publishRejectItem.postdata.grouppath = groupInfo.path;
							}
							
							outputArray.push(publishRejectItem);
							
							req.emit('PrepareOutputData', false);
						});
					});
				});
				
				
				
				//----------------Entry--------------------//
				publish.getAllPublishedRejectedItems(size, function(err, itemArray) {
					if(err) {
						retVal.id 	= err;
						retVal.msg 	= helper.retval[err];
						logger.error('error occrs when call getAllPublishedRejectedItems(). ' + err);
						return res.send(retVal);
					}
					
					publishRejectItemArray = itemArray;
					itemNumber 	= publishRejectItemArray.length;
					itemIndex	= 0;

					req.emit('PrepareOutputData', true);
				});
			});
		});
	}
};

module.exports = GetPublishHistory;

