var Helper 		= require('../../../utils/helper');
var Player		= require('../../../models/player');
var Site		= require('../../../models/site');
var Privilege 	= require('../../../models/privilege');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;

var CreatePlayer = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= null;
		var player		= null;
		var site		= null;
		var accountrole	= null;
		var privilege 	= null;
		var playerObj	= {};
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		
		//get parameter from request
/*
		dataObj = {
			name			: 'group1',
	    	path			: '/player',
			note			: 'test',
			type			: 'group',
			meta			: [{"a":"b"},{"city":"beijing"}]
	  	};

		dataObj = {
			name			: 'group2',
	    	path			: '/player',
			note			: 'test',
			type			: 'group',
			meta			: [{"a":"b"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'group11',
	    	path			: '/player/group1',
			note			: 'test',
			type			: 'group',
			meta			: [{"a":"b"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'group12',
	    	path			: '/player/group1',
			note			: 'test',
			type			: 'group',
			meta			: [{"a":"b"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'group21',
	    	path			: '/player/group2',
			note			: 'test',
			type			: 'group',
			meta			: [{"a":"b"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'group22',
	    	path			: '/player/group2',
			note			: 'test',
			type			: 'group',
			meta			: [{"a":"b"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'player1',
	    	path			: '/player/group1',
			note			: 'player',
			type			: 'player',
			meta			: [{"type":"player"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'player2',
	    	path			: '/player/group1/group11',
			note			: 'player',
			type			: 'player',
			meta			: [{"type":"player"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'player3',
	    	path			: '/player/group1/group12',
			note			: 'player',
			type			: 'player',
			meta			: [{"type":"player"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'player4',
	    	path			: '/player/group1/group12',
			note			: 'player',
			type			: 'player',
			meta			: [{"type":"player"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'player5',
	    	path			: '/player/group2',
			note			: 'player',
			type			: 'player',
			meta			: [{"type":"player"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'player6',
	    	path			: '/player/group2/group21',
			note			: 'player',
			type			: 'player',
			meta			: [{"type":"player"},{"city":"beijing"}]
	  	};
		dataObj = {
			name			: 'player7',
	    	path			: '/player/group2/group22',
			note			: 'player',
			type			: 'player',
			meta			: [{"type":"player"},{"city":"beijing"}]
	  	};
*/
/*
*/	
		logger.debug('enter player/create.js');

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
				if((!dataObj.name) || (!dataObj.path) || (!dataObj.type)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				playerObj 		= dataObj;
		    	playerObj.path 	= dataObj.path + '/' + dataObj.name;
				
				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('player', dataObj.path, 'account', accountInfo.name, 2, function(err, have) {
					if(err) {
						retVal.id = err;
						retVal.msg = helper.retval[err];
						logger.error('error occur when get privilege data from database or has not enough privilege to create folder.');
						logger.error(dataObj);
						return res.send(retVal);
					}
					else {
						if(have) {
							//create record in DB, create folder
							player.create(playerObj, function(err) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									logger.error('error occurs when call player.create(). ' + err);
									return res.send(retVal);
								}

								player.get(playerObj.path, function(err, playerObj) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									if(!err) {
										retVal.status = true;
										retVal.info = playerObj;
									}
									logger.debug('return from player/create.js.');
									logger.debug(JSON.stringify(retVal, '', 4));
									return res.send(retVal);
								});
							});
						}
						else {
							if(dataObj.type === 'group') { retVal.id = 410; }
							else { retVal.id = 411; }
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to create player/group in current path (%s).', dataObj.path);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = CreatePlayer;

