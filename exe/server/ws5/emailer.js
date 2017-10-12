var Helper 		= require('../utils/helper.js');
var AccountRole = require('../models/accountrole');
var nodeEmailer = require('nodemailer');
var Site 		= require('../models/site');



var helper 		= new Helper();
var logger 		= helper.logger;
const defaultSite = 'defaultsite';

function emailer() {
	var base = __dirname;

	var emailTemplate={};
	emailTemplate.en = require('./emailTemplate.en.json');

	// smtp URL should be in such format smtps://joeyhuang1@gmail.com:password@smtp.gmail.com/
	this.getSender = function(smtp) {
		var addrs=smtp.split(':');
		return addrs[1].substr(2);
	}

	this.getEmailTemplate = function() {
		var emailLang = helper.serversettings.emailLang || 'en';
		if (emailTemplate[emailLang]===undefined)
			emailTemplate[emailLang] = require('./emailTemplate.'+emailLang+'.json');

		if (emailTemplate[emailLang]===undefined)
			return emailTemplate['en'];
		return emailTemplate[emailLang];
	}

	this.sendAbnormalEmail = async function (emailPlayers) {
		var thisEmailer = this;
		return new Promise(function(resolve, reject){

			if (emailPlayers.newAbnormals.length<=0 && emailPlayers.newNormals.length<=0)
				return reject();

			helper.config = helper.loadConfig();	
			if (!helper.serversettings.abnormalEmail || !helper.serversettings.emailServer)
				return reject();	

			var localEmail = thisEmailer.getEmailTemplate();

			var site 	= new Site();
			site.getByName(defaultSite, async function(err, siteInfo) {
				if(err) {
					var errMsg = 'error occurs when get site info from db.' + defaultSite;
					logger.error(errMsg);
					reject(new Error(errMsg))
				}
			
				var siteObj = {};
				siteObj.siteID = siteInfo._id.toString();
				siteObj.siteName = siteInfo.sitename;
				var accountrole = new AccountRole(siteObj);
				var adminEmail = await accountrole.getAdminEmail();
				try{
					var emailTransport = nodeEmailer.createTransport(helper.serversettings.emailServer);
					var email = {};

					email.from = thisEmailer.getSender(helper.serversettings.emailServer);
					email.to = adminEmail;
					email.subject = localEmail.subject;//"WS5 player status changed";
					email.html= "";
					if (emailPlayers.newAbnormals.length>0) {
						//email.html += '<p>Following players became abnormal:<br/>';
						email.html += ('<p>'+localEmail.abnormalSection+'<br/>');
						emailPlayers.newAbnormals.forEach(function(item, idx){
							email.html += (item.path+'<br/>');
						})
						email.html += '</p>';
					}

					if (emailPlayers.newNormals.length>0) {
						//email.html +='<p>Following players were back to normal:<br/>';
						email.html += ('<p>'+localEmail.normalSection+'<br/>');
						emailPlayers.newNormals.forEach(function(item, idx){
							email.html += (item.path+'<br/>');
						})
						email.html += '</p>';
					}

					emailTransport.sendMail(email, (error, info) => {
					    if (error) {
					        logger.debug(error);
					        return reject();
					    }
					    else {
					    	logger.debug('Message %s sent: %s', info.messageId, info.response);
					    	return resolve(emailPlayers);
						}
					});
				}catch(e){
					return reject(e);
				}
			})
		})
	}
	
};
module.exports = emailer;




