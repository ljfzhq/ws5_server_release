var path 	= require('path');
var fs 		= require('fs');

var Helper 	= require('../../../utils/helper');
var Player	= require('../../../models/player');
var Site	= require('../../../models/site');
var FileUtils 	= require('../../../utils/fileutils');

var fileUtils	= new FileUtils();
var helper 	= new Helper();
var logger 	= helper.logger;

var GetPlayerSnapshot = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var playerID	= '';
		var site		= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var siteid		= '';
		var siteObj		= {};
		
		var snapshotPath = '';
		var thumbnailPath = '';
		
		logger.debug('enter player/getsnapshot.js');

		//get parameter from request
		playerID = req.query.playerid || '';
		
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
			
			thumbnailPath = helper.fileLibPath + path.sep + 'default thumbnail' + path.sep + 'player.jpg';
			snapshotPath = fileUtils.getFileLocalPath(siteObj, '/playersnapshot/' + playerID + '.jpg');
			//check the parameters validation
			if(!playerID) {
				return res.sendfile(thumbnailPath);
			}
			else {
				fs.exists(snapshotPath, function(exist) {
					if(exist) {
						return res.sendfile(snapshotPath);
					}
					else {
						return res.sendfile(thumbnailPath, { maxAge : 0 });
					}
				});
			}
		});
	}
};

module.exports = GetPlayerSnapshot;

