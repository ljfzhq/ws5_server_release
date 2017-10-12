var Helper 	= require('../../../utils/helper');
var Player 	= require('../../../models/player');
var Site 	= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var player 		= null;
var site 		= null;
var accountrole	= null;

var GetDownloadingPlayers = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var resultObj	= {};
		var userid		= '';
		var retVal = {
			status: false,
			id: 4,
			msg: helper.retval[4]
		};
		var siteid		= '';
		var siteObj		= {};
		
		var size		= 0;
		var start		= 0;
		
		logger.debug('enter player/getdownloadingplayers.js');

		if(req.body.size) { size = parseInt(req.body.size, 10); }
		if(req.body.start) { start = parseInt(req.body.start, 10); }
console.log('size= '+ size + '   start=' + start);	

		if((size <= 0) || (start < 0)) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('parameter error in getdownloadingplayers.js.');
			
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

				//get current folder's property
				player = new Player(siteObj);
				player.getDownloadingPlayers(size, start, function(err, playerArray, totalPlayers, totalDownloadings) {
					if(err) {
						retVal.id 		= err;
						retVal.msg 		= helper.retval[err];
						logger.error('error occurs when call player.getDownloadingPlayers(). ' + err);
						return res.send(retVal);
					}
					else {
						retVal.status 	= true;
						retVal.id 		= 0;
						retVal.msg 		= helper.retval[0];
						
						if(playerArray) {
							retVal.downloadingplayers = playerArray;
						}
						else {
							retVal.downloadingplayers = [];
						}
						
						retVal.totalplayers 		= totalPlayers;
						retVal.totaldownloadingplayers 	= totalDownloadings;
						retVal.start 				= start;
						
						logger.debug('return from player/getdownloadingplayers.js.');
						logger.debug(JSON.stringify(retVal, '', 4));
						return res.send(retVal);
					}
				});
			});
		});
	}
};

module.exports = GetDownloadingPlayers;

