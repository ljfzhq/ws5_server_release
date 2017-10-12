var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var Player		= require('../../../models/player');
var Site		= require('../../../models/site');
var Privilege 	= require('../../../models/privilege');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;

var Update = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= null;
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
		var newPath     = '';
		
		//get parameter from request
/*
		dataObj = {
			path			: '/player/group1',
			name			: 'gggg',
			note			: 'test rename',
			type			: 'group',
			meta			: [{"a":"rename"}]
	  	};
*/
		dataObj = req.body;
console.log(dataObj);
				
		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(JSON.stringify(retVal));
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
					
					return res.send(JSON.stringify(retVal));
				}

				player 		= new Player(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if((!dataObj) || (!dataObj.path) || (!dataObj.type)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(JSON.stringify(retVal));
				}
		
				//check privilege, must have write privilege on specified node.
				privilege.checkPrivilege('player', dataObj.path, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to update player/group.');
						logger.error(dataObj);
						return res.send(JSON.stringify(retVal));
					}
					else {
						if(have) {
							//update record in DB, if it is group and pass different name, need to change the group name and all sub nodes' path in db
							player.update(dataObj.path, dataObj, function(err) {
								retVal.id = err;
								retVal.msg = helper.retval[err];
								if(err) {
									return res.send(JSON.stringify(retVal));
								}
								else {
							   		if(dataObj.name) { newPath = path.dirname(dataObj.path) + '/' + dataObj.name; }
						   			else { newPath = dataObj.path; }
						   			
									player.get(newPath, function(err, playerObj) {
										retVal.id = err;
										retVal.msg = helper.retval[err];
										if(!err) {
											retVal.status = true;
											retVal.player = playerObj;
										}
										
										return res.send(JSON.stringify(retVal));
									});
								}
							});
						}
						else {
							if(dataObj.type === 'group') { retVal.id = 410; }
							else { retVal.id = 411; }
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to update player/group in current path (%s).', dataObj.path);
							return res.send(JSON.stringify(retVal));
						}
					}
				});
			});
		});
	}
};

module.exports = Update;

