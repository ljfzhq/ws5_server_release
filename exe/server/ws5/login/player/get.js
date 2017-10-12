var Helper 		= require('../../../utils/helper');
var Player		= require('../../../models/player');
var Site		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');
var Privilege 	= require('../../../models/privilege');

var helper 		= new Helper();
var logger 		= helper.logger;

var GetPlayer = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var playerPath	= '';
		var playerType 	= '';
		var player		= null;
		var site		= null;
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
		
		logger.debug('enter player/get.js');
		
		//get parameter from request
//		playerPath = '/player/group1';
		playerPath = req.body.path || '';
		
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

				player	 	= new Player(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if(!playerPath) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				//check privilege.
				privilege.checkPrivilege('player', playerPath, 'account', accountInfo.name, 1, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to get group/player.');
						return res.send(retVal);
					}
					else {
						if(have) {
							//get player/group info
							player.get(playerPath, function(err, playerObj) {
								retVal.id = err;
								retVal.msg = helper.retval[err];
								if(!err) {
									retVal.status = true;
									retVal.info = playerObj;
								}
								
								logger.debug('return from player/get.js.');
								logger.debug(JSON.stringify(retVal, '', 4));
//console.log(JSON.stringify(retVal, '', 4));
								return res.send(retVal);
							});
						}
						else {
							if(playerType === 'group') { retVal.id = 110; }
							else { retVal.id = 112; }
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to get player/group info in current path (%s).', localPath);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = GetPlayer;

