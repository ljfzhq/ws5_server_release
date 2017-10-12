var ControllerHelper 	= require('./client/controllerhelper');

var helper 	= new ControllerHelper();
var logger 	= helper.logger;

var Test = function() {
	this.do = function(req, res) {

		//get parameter from request
		helper.downloadFile('http://127.0.0.1:2000/a.txt', 'd:\\a.txt', 'jjjj', function(err) {
console.log('finished download.' + err);
			if(err) {
console.log(err);
return res.send(400);
			}
			else {
				return res.send(200);
			}
		});
	}
};
module.exports = Test;

