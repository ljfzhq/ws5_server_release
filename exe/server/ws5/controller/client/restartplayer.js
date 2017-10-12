var ControllerHelper 	= require('./controllerhelper');
var ControllerCmd 	= require('./command');

var controllerCmd 	= new ControllerCmd();
var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var RestartPlayer = function() {
	this.do = function(req, res) {
		var retVal 		= {
			status: false,
			id: 4,
			msg: helper.retval[4],
		};

		logger.debug('enter restartplayer.js');
		
		var acceptable = false;
		acceptable = helper.checkAcceptable(req);
		if(!acceptable){
console.log('access invalid');
			logger.error('invalid access. referer=' + req.headers.referer + '   origin=' + req.headers.origin);
			return res.send(retVal);
		}

		//call app to reload render
		controllerCmd.restartRender(helper, function(err) {
			retVal.status = err ? false : true;
			retVal.id = err ? 23 : 0;
			retVal.msg = helper.retval[retVal.id];
			return res.send(retVal);
		});
	}
};
module.exports = RestartPlayer;

