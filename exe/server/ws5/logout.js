var Helper 		= require('../utils/helper');

var helper 		= new Helper();
var logger 		= helper.logger;

var Logout = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		var retVal 		= {
			status: true,
			id: 0,
			msg: helper.retval[0],
		};

		delete req.session.siteObj;
		delete req.session.userid;
		
		return res.send(retVal);
	}
};

module.exports = Logout;

