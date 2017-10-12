var Helper 	= require('../../../utils/helper');
var Player 	= require('../../../models/player');
var Site 	= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var player 		= null;
var site 		= null;
var accountrole	= null;

var SearchPlayer = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var filterObj 	= {};
		var metaArray 	= [];
		var lmtObj 		= {};
		var nameString 	= [];
		var typeArray 	= [];
		var basePath 	= '';
		var resultObj	= {};
		var userid		= '';
		var retVal = {
			status: false,
			id: 4,
			msg: helper.retval[4]
		};
		var siteid		= '';
		var siteObj		= {};
		var i 			= 0;

		logger.debug('enter player/search.js');
		
		metaArray.push({"a": "b"});
		typeArray.push('group');
		typeArray.push('player');
		lmtObj.start = new Date('2012/11/01');
		lmtObj.end = new Date('2013/2/21').toString();
				
//		filterObj.name = 'layer';		
		filterObj.type = typeArray;
//		filterObj.note = 'test';
		filterObj.lastmodifytime = lmtObj;
//		filterObj.meta = metaArray;

		//get parameter from request and check its validation
//		basePath = '/player/group1';
		
		basePath = req.body.path;
		
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
				player.searchByCondition(filterObj, basePath, 1, accountInfo.name, 1, function(err, validArray, invalidArray) {
					if(!err) {
						retVal.status 	= true;
						retVal.id 		= 0;
						retVal.msg 		= helper.retval[0];
								
						for(i = 0; i < validArray.length; i++) {
							delete validArray[i].valid;
							delete validArray[i].siteid;
							delete validArray[i]._id;
						}
						retVal.files 	= validArray;
					}
					else {
						retVal.id 		= err;
						retVal.msg 		= helper.retval[err];
						retVal.files 	= [];
					}
		
					logger.debug('return from player/search.js.');
					logger.debug(JSON.stringify(retVal, '', 4));
					return res.send(retVal);
				});
			});
		});
	}
};

module.exports = SearchPlayer;

