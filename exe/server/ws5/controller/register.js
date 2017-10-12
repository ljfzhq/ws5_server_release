var path 		= require('path');
var Helper 		= require('../../utils/helper');
var Player		= require('../../models/player');
var Site		= require('../../models/site');

var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var RegisterPlayer = function() {
	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var dataObj 	= null;
		var player		= null;
		var playerObj	= {};
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var siteid		= '';
		var siteObj		= {};
		
		//get parameter from request
		dataObj = req.body;
/*
		dataObj = {
			serverurl		: 'http://localhost:2000/ws5/controller/register.js',
			sitename		: 'defaultsite',
	    	path			: '',
			player			: 'player111',
			pwd				: '123456',
			uuid			: ''
	  	};
*/
//console.log('dataObj in server = ');
//console.log(dataObj);
		//check the parameters validation
		if((!dataObj.sitename) || (!dataObj.player) || (!dataObj.pwd) || (!dataObj.uuid)) {
			retVal.id = 4;
			retVal.msg = helper.retval[4];
			logger.error('the parameter from request is not correct. ');
			logger.error(dataObj);
			return res.send(retVal);
		}
		
		if(!dataObj.path) { //empty path means register to not assigned group
			dataObj.path = helper.serversettings.unassigned;
		}
		else {
			if(dataObj.path.slice(0, 7) !== '/player') {
				dataObj.path = '/player' + dataObj.path;
			}
		}
		
		playerObj.name = dataObj.player;
		playerObj.type = 'player';
    	playerObj.path = dataObj.path + '/' + dataObj.player;
    	playerObj.uuid = dataObj.uuid;
		playerObj.ip			= dataObj.ip || '';
		playerObj.localtime		= dataObj.localtime || '';
		playerObj.timezone		= dataObj.timezone || '';
		playerObj.machinename	= dataObj.machinename || '';
		playerObj.platform		= dataObj.platform || '';
		playerObj.arch			= dataObj.arch || '';
		playerObj.status		= 'online';
		
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
		site.getByName(dataObj.sitename, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				
				return res.send(retVal);
			}
			
			siteObj.siteID = siteInfo._id.toString();
			siteObj.siteName = siteInfo.sitename;

			player	 	= new Player(siteObj);
			
			//the first time register or register again
			player.get(playerObj.path, function(err, playerInfo) {
				if(err && (err !== 5)) {
					retVal.id = err;
					retVal.msg = helper.retval[err];
					logger.error('error occur when get player information from DB. ' + err);
					logger.error(dataObj);
					return res.send(retVal);
				}
	
				if(err === 5 || !playerInfo) {
					player.get(path.dirname(playerObj.path), function(err, playerInfo) { //check group exist or not
						if(err) { //group not exist
							if(err === 5) { retVal.id = 451; }
							else { retVal.id = err; }
							retVal.msg = helper.retval[retVal.id];
							logger.error('error occur when get player information from DB. ' + err);
							logger.error(dataObj);
							return res.send(retVal);
						}
	
						//create record in DB, create folder
						player.create(playerObj, function(err) {
							if(err) {
								if(err === 5) { retVal.id = 451; }
								else { retVal.id = err; }
								retVal.msg = helper.retval[retVal.id];
								logger.error('error occur when create player in DB. ' + err);
								return res.send(retVal);
							}
							
							player.get(playerObj.path, function(err, playerInfo) {
								if(err) {
									retVal.id = err;
									retVal.msg = helper.retval[err];
									logger.error('error occur when get player information from DB. ' + err);
									return res.send(retVal);
								}
								
								
								retVal.id = 0;
								retVal.msg = helper.retval[0];
								retVal.status = true;
								retVal.playerid = playerInfo._id.toString();
								retVal.grouppath = path.dirname(playerInfo.path);
								retVal.siteid = siteObj.siteID;
								return res.send(retVal);
							});
						});
					});
				}
				else {
					if(playerInfo.uuid === playerObj.uuid) { //the same player
						retVal.id = 0;
						retVal.msg = helper.retval[0];
						retVal.status = true;
						retVal.playerid = playerInfo._id.toString();
						retVal.grouppath = path.dirname(playerInfo.path);
						retVal.siteid = siteObj.siteID;
						return res.send(retVal);
					}
					else {
						retVal.id = 400;
						retVal.msg = helper.retval[400];
						logger.error('duplicated player alreaydy exist in DB. ' + playerObj.path);
						return res.send(retVal);
					}
				}
			});
		});
	}
};

module.exports = RegisterPlayer;

