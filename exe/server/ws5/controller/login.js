var Helper 		= require('../../utils/helper');
var Player		= require('../../models/player');
var Site		= require('../../models/site');

var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var LoginPlayer = function() {
	helper.config = helper.loadConfig();

	this.do = function(req, res) {
		var dataObj 	= null;
		var player		= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var siteObj		= {};

		//get parameter from request
		dataObj = req.body;
//console.log('in server login:');
//console.log(req.body);
/*		
		dataObj = {
			siteid		: 'site1',
			playerid	: 'player111',
			pwd			: '123456'
	  	};
*/

		//check the parameters validation
		if((!dataObj.siteid) || (!dataObj.playerid)) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('the parameter from request is not correct. ');
			logger.error(dataObj);
			return res.send(retVal);
		}
		
		//check password is valid or not
		if(dataObj.pwd !== helper.serversettings.playerpwd) {
			retVal.id = 452;
			retVal.msg = helper.retval[452];
			logger.error('wrong player password.');
			logger.error(dataObj.pwd);
			return res.send(retVal);
		}

		//get site information to check the site name is valid or not.
		site 	= new Site();
		site.getByID(dataObj.siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(retVal);
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			player	 	= new Player(siteObj);
			
			//get player for registered player.
			player.getByID(dataObj.playerid, function(err, playerInfo) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				if(err) {
					logger.error('error occur when get player information from DB. ' + err);
					logger.error(dataObj);
				}
				else { 
					retVal.status = true; 
					req.session.playerid = playerInfo._id.toString();
					req.session.playersiteobj = siteObj;
				}
				
				return res.send(retVal);
			});
		});
	}
};

module.exports = LoginPlayer;

