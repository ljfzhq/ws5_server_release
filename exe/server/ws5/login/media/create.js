var fs 			= require('fs');
var hfs 		= require('hfs');
var path 		= require('path');
var Helper 		= require('../../../utils/helper');
var Media		= require('../../../models/media');
var FileUtils 	= require('../../../utils/fileutils');
var Privilege 	= require('../../../models/privilege');
var Site 		= require('../../../models/site');
var AccountRole = require('../../../models/accountrole');

var helper 		= new Helper();
var logger 		= helper.logger;
var fileUtils 	= new FileUtils();

var CreateFile = function() {

	helper.config = helper.loadConfig();

	this.do = function(req, res) {
		var dataObj 	= null;
		var media		= null;
		var site 		= null;
		var accountrole	= null;
		var privilege 	= null;
		var mediaObj	= {};
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var bigThumbnailLocalPath = '';
		var smallThumbnailLocalPath = '';
		var matchResult = null;
		var smallThumbnailBuffer = null;
		var bigThumbnailBuffer = null;
			
		logger.debug('enter media/create.js');
		
		//get parameter from request
		dataObj = req.body;
		logger.debug(JSON.stringify(dataObj, '', 4));		
//console.log(req);		
//console.log(JSON.stringify(dataObj, '', 4));		

		//get siteID from session
		siteid 	= req.session.siteObj.siteID;
		
		site 	= new Site();
		site.getByID(siteid, function(err, siteInfo) {
			if(err) {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				logger.error('error occurs when get site info from db.');
				logger.error(retVal.msg);
				
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

				media	 	= new Media(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//check the parameters validation
				if(dataObj.type && (dataObj.type.indexOf('/') >= 0)) { dataObj.type = dataObj.type.slice(0, dataObj.type.indexOf('/')); }
				if((!dataObj.name) || (!dataObj.path) || (!dataObj.type)) {
					retVal.id = 4;
					retVal.msg = helper.retval[4];
					logger.error('the parameter from request is not correct. ');
					logger.error(dataObj);
					return res.send(retVal);
				}
		
				mediaObj 		= dataObj;
		    	mediaObj.path 	= dataObj.path + '/' + dataObj.name;
				
				//check privilege, must have write privilege on parent node.
				privilege.checkPrivilege('media', dataObj.path, 'account', accountInfo.name, 2, function(err, have) {
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
							media.create(mediaObj, function(err) {
								if(err) {
									logger.error('error occurs when call media.create(). ' + err);
									retVal.id = err;
									retVal.msg = helper.retval[err];
									return res.send(retVal);
								}
								else {
									if(dataObj.thumb && dataObj.path) {
										smallThumbnailLocalPath = fileUtils.getThumbnailLocalPath(siteObj, dataObj.path, false);
										matchResult = {};
										matchResult = dataObj.thumb.slice(0, 100).match(/^data\:(.*\/.*)\;base64\,(.*)/);
										if(matchResult) {
											smallThumbnailBuffer = null;
											smallThumbnailBuffer = new Buffer(dataObj.thumb.slice(5 + matchResult[1].length + 8), 'base64');
											
//											hfs.mkdir(path.dirname(smallThumbnailLocalPath), function(err) {
												try{
													fs.writeFileSync(smallThumbnailLocalPath, smallThumbnailBuffer);
												}
												catch(e) {
													logger.error('Fail to write small thumbnail file for ' + smallThumbnailLocalPath);
													logger.error(e);
												}
//											});
										}
									}

									if(dataObj.snapshot && dataObj.path) {
										bigThumbnailLocalPath = fileUtils.getThumbnailLocalPath(siteObj, dataObj.path, true);
										matchResult = {};
										matchResult = dataObj.snapshot.slice(0, 100).match(/^data\:(.*\/.*)\;base64\,(.*)/);
										//data:image/png;base64,

										if(matchResult) {
											bigThumbnailBuffer = null;
											bigThumbnailBuffer = new Buffer(dataObj.snapshot.slice(5 + matchResult[1].length + 8), 'base64');
											
//											hfs.mkdir(path.dirname(bigThumbnailLocalPath), function(err) {
												try{
													fs.writeFileSync(bigThumbnailLocalPath, bigThumbnailBuffer);
												}
												catch(e) {
													logger.error('Fail to write big thumbnail file for ' + bigThumbnailLocalPath);
													logger.error(e);
												}
//											});
										}
									}


									media.get(mediaObj.path, function(err, obj) {
										retVal.id = err;
										retVal.msg = helper.retval[err];
										if(!err) {
											retVal.status = true;
											retVal.media = obj;
										}
										
										logger.debug('return from media/create.js.');
										logger.debug(JSON.stringify(retVal, '', 4));
										return res.send(retVal);
									});
								}
							});
						}
						else {
							if(dataObj.type === 'folder') { retVal.id = 110; }
							else if(dataObj.type === 'playlist') { retVal.id = 111; }
							else { retVal.id = 112; }
							retVal.msg = helper.retval[retVal.id];
							logger.error('you have not enough privilege to create media in current path (%s).', dataObj.path);
							return res.send(retVal);
						}
					}
				});
			});
		});
	}
};

module.exports = CreateFile;

