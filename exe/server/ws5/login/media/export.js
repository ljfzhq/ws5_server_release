//var mongodb = require('./db');
var Helper = require('../../../utils/helper');

var helper 	= new Helper();
var logger 	= helper.logger;

var ExportMedia = function() {

	helper.config = helper.loadConfig();
	
	this.do = function(req, res) {
		res.send('not suport now.');
	}
};

module.exports = ExportMedia;

