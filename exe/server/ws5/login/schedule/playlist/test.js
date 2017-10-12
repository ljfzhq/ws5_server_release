var path		= require('path');
var Helper 		= require('../../../../utils/helper');
var Schedule	= require('../../../../models/schedule');
var Privilege 	= require('../../../../models/privilege');
var Site 		= require('../../../../models/site');
var AccountRole = require('../../../../models/accountrole');

var accountrole	= null;
var site 		= null;
var helper 		= new Helper();
var logger 		= helper.logger;

var GetScheduleItems = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var schedule			= null;
		var privilege 	= null;
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};
		var userid		= '';
		var siteid		= '';
		var siteObj		= {};
		var groupPath	= '';

		
		//get siteID from session
		siteid 	= '50dd19a9f11bc57013000031';
		
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
			userid = '50c8516bde2a26440e000121'; 
			
			accountrole = new AccountRole(siteObj);
			accountrole.getAccountByID(userid, function(err, accountInfo) {
				if(err) {
					retVal.id = err;
					retVal.msg = helper.retval[err];
					logger.error('error occurs when get account info from db.');
					logger.error(retVal.msg);
					
					return res.send(JSON.stringify(retVal));
				}

				schedule	= new Schedule(siteObj);
				privilege 	= new Privilege(siteObj);
				
				//50f77355d595488412000001            50f7732e8a31d8d812000001
/*
		//test overlap.
		schedule.getPlaylistByID('50f77355d595488412000001', function(err, obj) {
			if(!err && obj) {
				var overlapped = schedule._isOverlap(obj, '2013:03:15:00:02:00.000', '2013:03:15:00:12:00.000');
				retVal.id = 0;
				retVal.msg = overlapped;
				return res.send(JSON.stringify(retVal));
			}
			else {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				return res.send(JSON.stringify(retVal));
			}
		});

		//test expandPlaylist().
		var scheduleArray = [];
		var index = 0;
		schedule.getPlaylistSet('/player/group1', 'schedule', 'playlist', '2013:03:01', '2013:03:10', function(err, itemArray) {
			if(!err) {
				console.log('itemArray is:');
				console.log(itemArray);
				//expand the palylist array into a new array
				if(itemArray && itemArray.length > 0) {
					for(index = 0 ; index < itemArray.length; index ++) {
						schedule._expandPlaylist(itemArray[index], scheduleArray, '2013:03:01', '2013:03:10');
					}
				}
				console.log('scheduleArray is:');
				console.log(scheduleArray);
				retVal.id = 0;
				retVal.msg = helper.retval[0];
				retVal.result = scheduleArray;
				return res.send(JSON.stringify(retVal));
			}
			else {
				retVal.id = err;
				retVal.msg = helper.retval[err];
				return res.send(JSON.stringify(retVal));
			}
		});

		//test _mergeDateToRange()
//		var dateArray = ['2013:01:07','2013:01:08','2013:01:10','2013:01:02','2013:01:01','2013:01:05','2013:01:03','2013:01:04'];
		var dateArray = ['2013:02:27','2013:07:01','2013:03:01','2013:03:31','2013:02:28','2013:04:01','2013:03:30','2013:06:30'];
		var dateRangeArray = schedule._mergeDateToRange(dateArray);
console.log(dateRangeArray);
		//test _buildTargetRangeArray()
		var newDateRangeArray = schedule._buildTargetRangeArray(dateRangeArray, '2013:12:01');
		return res.send(newDateRangeArray);
*/

				//test _getPrevDay1() and _getPrevDay()
				console.log(schedule._getPrevDay('2000:03:01:00:00:00.999'));
				console.log(schedule._getPrevDay1('2000:03:01:00:00:00.999'));
				console.log(schedule._getNextDay('2016:02:28:00:00:00.999'));
				console.log(schedule._getNextDay1('2016:02:28:00:00:00.999'));
/*
*/
			});
		});
	}
};

module.exports = GetScheduleItems;

