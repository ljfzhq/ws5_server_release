var Helper 		= require('../../../utils/helper');
var Channel		= require('../../../models/channel');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');

var site 		= null;
var accountrole	= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var MoveConfirm = function() {

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
		var curDataObj 	= {};
		var failObj 	= {};
		
		var _moveOneChannel = function(srcChannelPath, targetChannelPath, option) {
			var confirmObj = {};

			channel.moveChannel(srcChannelPath, targetChannelPath, option, function(err, reason) {
				if(err) {
					if(reason === 'exist') {
						req.session.moveChannelData = dataObj;
						req.session.moveChannelFail = failArray;
						
						confirmObj.sourcepath = srcChannelPath;
						confirmObj.targetpath = targetChannelPath;
						retVal.id = 270;
						retVal.msg = helper.retval[270];
						retVal.confirm = confirmObj;
						return res.send(retVal);
					}
					else {
						failObj = {};
						failObj.sourcepath = srcChannelPath;
						failObj.targetpath = targetChannelPath;
						failObj.reason = reason;
						failArray.push(failObj);
					}
				}
				
				req.emit('MoveChannelConfirm');
			});
		}

		req.on('MoveChannelConfirm', function() {
			var srcChannelPath = '';
			var targetChannelPath = '';
			
			if(!dataObj.channels || (dataObj.channels.length === 0)) {
				if(failArray && failArray.length) { 
					retVal.id = 275; 
					retVal.fails = failArray; 
				}
				else { 
					retVal.status = true; 
					retVal.id = 0; 
				}
				
				retVal.msg = helper.retval[retVal.id];
				logger.debug('return from schedule/moveconfirm.js');
				logger.debug(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
			
			curChannelName = dataObj.channels.pop();
			if(!curChannelName) { //finished all
				if(failArray && failArray.length) { 
					retVal.id = 275; 
					retVal.fails = failArray; 
				}
				else { 
					retVal.status = true; 
					retVal.id = 0; 
				}
				
				retVal.msg = helper.retval[retVal.id];
				logger.debug('return from schedule/moveconfirm.js');
				logger.debug(JSON.stringify(retVal, '', 4));
				return res.send(retVal);
			}
			
			srcChannelPath = dataObj.sourcegroup + '/' + curChannelName;
			targetChannelPath = dataObj.targetgroup + '/' + curChannelName;
			if(curDataObj.all === true) { 
				if(curDataObj.option === 0) {//rename all
					_moveOneChannel(srcChannelPath, targetChannelPath, 'rename');
				}
				else if(curDataObj.option === 1) {//overwrite all
					_moveOneChannel(srcChannelPath, targetChannelPath, 'overwrite');
				}
			}
			else {
				_moveOneChannel(srcChannelPath, targetChannelPath, 'none');
			}
		});
		
		
		//------------start from here ---------------------
		logger.debug('enter schedule/moveconfirm.js');
		//get parameter from request
		dataObj = req.session.moveChannelData;
		failArray = req.session.moveChannelFail;

		if(req.session.moveChannelData) delete req.session.moveChannelData;
		if(req.session.moveChannelFail) delete req.session.moveChannelFail;

/*		
		//rename
		curDataObj.sourcepath = '/player/group1/channel2.chnl';
		curDataObj.targetpath = '/player/group2/channel2.chnl';
		curDataObj.option = 0;
		curDataObj.all = false;

		//overwrite
		curDataObj.sourcepath = '/player/group1/channel2.chnl';
		curDataObj.targetpath = '/player/group2/channel2.chnl';
		curDataObj.option = 1;
		curDataObj.all = false;
		
		//rename all
		curDataObj.sourcepath = '/player/group1/channel2.chnl';
		curDataObj.targetpath = '/player/group2/channel2.chnl';
		curDataObj.option = 0;
		curDataObj.all = true;
		
		//overwrite all
		curDataObj.sourcepath = '/player/group1/channel2.chnl';
		curDataObj.targetpath = '/player/group2/channel2.chnl';
		curDataObj.option = 1;
		curDataObj.all = true;


		//skip
		curDataObj.sourcepath = '/player/group1/channel2.chnl';
		curDataObj.targetpath = '/player/group2/channel2.chnl';
		curDataObj.option = 2;
		curDataObj.all = false;


		//skip all
		curDataObj.sourcepath = '/player/group1/channel2.chnl';
		curDataObj.targetpath = '/player/group2/channel2.chnl';
		curDataObj.option = 2;
		curDataObj.all = true;


		//cancel
		curDataObj.sourcepath = '/player/group1/channel2.chnl';
		curDataObj.targetpath = '/player/group2/channel2.chnl';
		curDataObj.option = 3;
		curDataObj.all = false;
*/		

		curDataObj = req.body;

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
				if(!dataObj || (!curDataObj) || (!curDataObj.sourcepath) || (!curDataObj.targetpath) || (curDataObj.option < 0) || (curDataObj.option > 16)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(curDataObj);
					return res.send(retVal);
				}
		
				if(curDataObj.option === 3) {
					retVal.id = 276;
					retVal.msg = helper.retval[276];
					logger.debug('user cancnelled the move channel operation.');
					logger.debug(curDataObj);
					return res.send(retVal);
				}
				else if((curDataObj.option === 2) && (curDataObj.all === true)) {
					logger.debug('user skipped all move items.');
					logger.debug(curDataObj);
					
					failObj = {};
					failObj.sourcepath = curDataObj.sourcepath;
					failObj.targetpath = curDataObj.targetpath;
					failObj.reason = 'skipped by user.';
					failArray.push(failObj);
		
					if(dataObj.channels && (dataObj.channels.length > 0)) {
						for(index = 0; index < dataObj.channels.length; index++) {
							failObj = {};
							failObj.sourcepath = dataObj.sourcegroup + '/' + dataObj.channels[index];
							failObj.targetpath = dataObj.targetgroup + '/' + dataObj.channels[index];
							failObj.reason = 'skipped by user.';
							failArray.push(failObj);
						}
					}
					
					retVal.id = 277;
					retVal.msg = helper.retval[277];
					if(failArray && failArray.length) { 
						retVal.fails = failArray; 
					}
					return res.send(retVal);
				}
				else if((curDataObj.option === 2) && (curDataObj.all !== true)) { //goto the next one
					failObj = {};
					failObj.sourcepath = curDataObj.sourcepath;
					failObj.targetpath = curDataObj.targetpath;
					failObj.reason = 'skipped by user.';
					failArray.push(failObj);
		
					req.emit('MoveChannelConfirm');
				}
				else { //deal with ethe confirmmed item
					//check privilege, must have write privilege on source node.
					privilege.checkPrivilege('player', curDataObj.sourcepath, 'account', accountInfo.name, 2, function(err, have) {
						if(err) {
							retVal.id = err;
							retVal.msg = helper.retval[err];
							logger.error('error occur when get privilege data from database or has not enough privilege to write source channel.');
							logger.error(curDataObj);
							return res.send(retVal);
						}
						else {
							if(have) {
								//check privilege, must have write privilege on target node.
								privilege.checkPrivilege('player', curDataObj.targetpath, 'account', accountInfo.name, 2, function(err, have) {
									if(err) {
										retVal.id = err;
										retVal.msg = helper.retval[err];
										logger.error('error occur when get privilege data from database or has not enough privilege to write target channel info.');
										logger.error(curDataObj);
										return res.send(retVal);
									}
									else {
										if(have) {
											if(curDataObj.option === 0) {//rename
												_moveOneChannel(curDataObj.sourcepath, curDataObj.targetpath, 'rename');
											}
											else if(curDataObj.option === 1) {//overwrite
												_moveOneChannel(curDataObj.sourcepath, curDataObj.targetpath, 'overwrite');
											}
										}
										else {
											retVal.id = 250; 
											retVal.msg = helper.retval[250];
											logger.error('you have not enough privilege to write channel in current path (%s).', curDataObj.targetpath);
											return res.send(retVal);
										}
									}
								});
							}
							else {
								retVal.id = 250; 
								retVal.msg = helper.retval[250];
								logger.error('you have not enough privilege to write channel in current path (%s).', curDataObj.sourcepath);
								return res.send(retVal);
							}
						}
					});
				}
			});
		});
	}
};

module.exports = MoveConfirm;

