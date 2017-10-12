/*
 * Build basic information of WS5 Controller
 */
var os 			= require('os');
var fs 			= require('fs');
var hfs 		= require('hfs');
var util 		= require('util');
var path 		= require('path');
var http 		= require('http');
var querystring = require('querystring');
var url 		= require('url');
var childProcess = require('child_process');
var diskspace	= require("diskspace");
var consDef		= require('../../../utils/constant');


function ControllerCmd() {

	this.generateCmdJson = function(helper, dummyArray) {
		var logger 	= helper.logger;
		var cmdJsonObj	= {};
		var localPath	= '';
		
		logger.debug('dummyArray=');	
		logger.debug(JSON.stringify(dummyArray, '', 4));
		if(!dummyArray || !util.isArray(dummyArray) || !dummyArray.length) {
			return '';
		}
		
		cmdJsonObj.dummy = dummyArray;
		
		//generate localfile path
		var now = new Date().getTime();
		localPath = helper.serverPath + 'addon' + path.sep + 'commanddata' + path.sep + now + '.json';
//console.log('localPath= ' + localPath);
//console.log('cmdJsonObj= ');
//console.log( JSON.stringify(cmdJsonObj, '', 4));
		
		logger.debug('localPath=' + localPath);	
		logger.debug('cmdJsonObj=');	
		logger.debug(JSON.stringify(cmdJsonObj, '', 4));
		//output to local file
		if(!helper.writeDataFile(localPath, cmdJsonObj)) {
			return localPath;
		}
		else {
			return '';
		}
	}
	
	this.executeCmd = function(helper, dummy, otherFolder, newConsole, callback) {
		var logger 	= helper.logger;

		var localJsonFilePath 	= '';
		var commandLine 		= '';
		var platform 			= os.platform();
		var arch 				= os.arch();
		var cwd					= helper.serverPath + 'addon' + path.sep + (otherFolder? otherFolder: 'command');
		
		localJsonFilePath = this.generateCmdJson(helper, dummy);
		if(!localJsonFilePath) { 
			logger.error('got empty command json file path.');
			return callback('parameter error', '', ''); 
		} //wrong parameter
//console.log('localJsonFilePath= ' + localJsonFilePath);
		
		
		//execute command according to platform
		if(platform === 'win32') {
			if(arch === 'x64')
			{
				//to avoid the filepath contains white space, use '"' to closure it.
				if(newConsole) {
					commandLine = 'start /D ' + '\"' + helper.serverPath + 'addon' + path.sep + (otherFolder? otherFolder: 'command') + '\" ws5Cmd.exe ' + '\"' + localJsonFilePath + '\"'; 
				}
				else {
					commandLine = '\"' + helper.serverPath + 'addon' + path.sep + (otherFolder? otherFolder: 'command') + path.sep + 'ws5Cmd.exe\" ' + '\"' + localJsonFilePath + '\"'; 
				}
			}
			else {
				//to avoid the filepath contains white space, use '"' to closure it.
				if(newConsole) {
					commandLine = 'start /D ' + '\"' + helper.serverPath + 'addon' + path.sep + (otherFolder? otherFolder: 'command') + '\" ws5Cmd.exe ' + '\"' + localJsonFilePath + '\"'; 
				}
				else {
					commandLine = '\"' + helper.serverPath + 'addon' + path.sep + (otherFolder? otherFolder: 'command') + path.sep + 'ws5Cmd.exe\" ' + '\"' + localJsonFilePath + '\"'; 
				}
//console.log('not support command on 32 bits OS now.');
//				return callback('command error', '', '');
			}
		}
		else if(platform === 'linux') {
console.log('not support command on Linux OS now.');
			return callback('command error', '', '');
		}
		else {
			return callback('command error', '', '');
		}
		
		fs.exists(cwd + path.sep + 'ws5Cmd.exe', function(exists) {
			if(!exists) { 
				logger.error('ws5Cmd.exe does not exist.'); 
				logger.error(cwd + path.sep + 'ws5Cmd.exe');
				return callback('ws5Cmd.exe does not exist.', '', ''); 
			}
			

//console.log('commandLine= ' + commandLine);
			logger.debug('commandLine= ' + commandLine);
			logger.debug('dummy= ');
			logger.debug(JSON.stringify(dummy, '', 4));
			childProcess.exec(commandLine, {cwd: cwd}, function (error, stdout, stderr) {
//console.log('stdout: ' + stdout);
				return callback(error, stdout, localJsonFilePath);
			});
		});
	}
	
	
	this.dealwithCommandReturn = function(helper, outputDummyItem, sourceDummyItem) {
		var logger 	= helper.logger;

		var returnBase64Data = '';
		var snapshotPath = '';
		var returnData = '';
		
		//after upload the snapshot should set helper.config.playersettings.snapshot to false to avoid upload again;
		if(!outputDummyItem || !sourceDummyItem) { return; }
		
		if(sourceDummyItem.comment === 'get snapshot') {
			if(!outputDummyItem.cmd_set || !util.isArray(outputDummyItem.cmd_set)) { return; }
			
			returnBase64Data = outputDummyItem.cmd_set[0].output;
			if(returnBase64Data) {
				snapshotPath = new Buffer(returnBase64Data, 'base64').toString();		
console.log('get snapshot command output=' + snapshotPath);
			}	
		}
		else if(sourceDummyItem.comment === 'reboot') {
			if(!outputDummyItem.cmd_set || !util.isArray(outputDummyItem.cmd_set)) { return; }
			
			returnBase64Data = outputDummyItem.cmd_set[0].output;
			if(returnBase64Data) {
				returnData = new Buffer(returnBase64Data, 'base64').toString();		
console.log('reboot command output=' + returnData);
			}	
		}
		else if(sourceDummyItem.comment === 'shutdown') {
			if(!outputDummyItem.cmd_set || !util.isArray(outputDummyItem.cmd_set)) { return; }
			
			returnBase64Data = outputDummyItem.cmd_set[0].output;
			if(returnBase64Data) {
				returnData = new Buffer(returnBase64Data, 'base64').toString();		
console.log('shutdown command output=' + returnData);
			}	
		}
		else if(sourceDummyItem.comment === 'upgrade') {
			if(!outputDummyItem.cmd_set || !util.isArray(outputDummyItem.cmd_set)) { return; }
			
			returnBase64Data = outputDummyItem.cmd_set[0].output;
			if(returnBase64Data) {
				returnData = new Buffer(returnBase64Data, 'base64').toString();		
console.log('upgrade command output=' + returnData);
			}	
		}
	}
	
	this.executeCommand = function(helper, dummyArray, otherFolder, newConsole, callback) {
		var logger 	= helper.logger;

		var that = this;
		
		logger.debug('will execute command.');
		logger.debug('dummyArray=');	
		logger.debug(JSON.stringify(dummyArray, '', 4));
		this.executeCmd(helper, dummyArray, otherFolder, newConsole, function(err, outputString, jsonFilePath) {
			var sourceCmdSetIndex 	= 0;
			var sourceCmdSetNumber	= 0;
			var sourceCmdIndex 		= 0;
			var sourceCmdNumber		= 0;
			var sourceCmdSetID	  	= '';
			var returnCmdSetIndex 	= 0;
			var returnCmdSetNumber	= 0;
			var returnCmdIndex 	  	= 0;
			var returnCmdNumber	  	= 0;
			var output				= '';
			var outputObj 			= {};
			var cmdResultFilePath   = '';
			
			if(err) { //error occurs
				logger.error('error occurs when execute command (' + err + ').');
				logger.error('dummyArray=');
				logger.error(dummyArray);
			}
			else {
				logger.debug('return: ' + outputString);	
				if(outputString) {
					outputObj = JSON.parse(outputString);
					
					if(outputObj && !outputObj.retcode && outputObj.dummy) {
						sourceCmdSetNumber = dummyArray.length;
						
						for(sourceCmdSetIndex = 0; sourceCmdSetIndex < sourceCmdSetNumber; sourceCmdSetIndex++) {
							sourceCmdSetID = dummyArray[sourceCmdSetIndex].id;
							
							returnCmdSetNumber = outputObj.dummy.length;
							for(returnCmdSetIndex = 0; returnCmdSetIndex < returnCmdSetNumber; returnCmdSetIndex ++) {
								if(outputObj.dummy[returnCmdSetIndex].id === sourceCmdSetID) { //find it, get return data
									
									sourceCmdNumber = dummyArray[returnCmdSetIndex].cmd_set.length;
									returnCmdNumber = outputObj.dummy[returnCmdSetIndex].cmd_set.length;
									for(sourceCmdIndex = 0; sourceCmdIndex < sourceCmdNumber; sourceCmdIndex++) {
										if(sourceCmdIndex >= returnCmdNumber) { //not return all command result
											dummyArray[sourceCmdSetIndex].cmd_set[sourceCmdIndex].result = 'not execute';
										}
										else {
											if(outputObj.dummy[returnCmdSetIndex].cmd_set[sourceCmdIndex].retcode) { //error occurs when execute
												dummyArray[sourceCmdSetIndex].cmd_set[sourceCmdIndex].result = 'error occur';
												dummyArray[sourceCmdSetIndex].cmd_set[sourceCmdIndex].retcode = outputObj.dummy[returnCmdSetIndex].cmd_set[sourceCmdIndex].retcode;
											}
											else {
												dummyArray[sourceCmdSetIndex].cmd_set[sourceCmdIndex].result = 'success';
												dummyArray[sourceCmdSetIndex].cmd_set[sourceCmdIndex].retcode = outputObj.dummy[returnCmdSetIndex].cmd_set[sourceCmdIndex].retcode;
											}
										}
									}
									
									//deal with the command return according to the command output		
									that.dealwithCommandReturn(helper, outputObj.dummy[returnCmdSetIndex], dummyArray[sourceCmdSetIndex]);
									
									break;
								}
							}
							
							if(returnCmdSetIndex >= returnCmdSetNumber) { //did not get 
								dummyArray[sourceCmdSetIndex].result = 'not execute';
							}
						}

						cmdResultFilePath = jsonFilePath.slice(0, jsonFilePath.length - 5) + '_result.json';
						helper.writeDataFile(cmdResultFilePath, dummyArray);
					}
					else {
						logger.error('empty return or error return for command: ');
						logger.error(dummyArray);
						logger.error('output=');
						logger.error(outputObj);
					}
				}
				else {
					logger.error('empty return for command: ');
					logger.error(dummyArray);
				}	
			}
			
			return callback();
		});
	}
	
	this.getLocalTimeZoneId = function getLocalTimeZoneId(helper, callback) {
		var logger 	= helper.logger;

		var commandLine 		= '';
		var platform 			= os.platform();
		var arch 				= os.arch();

		if(platform === 'win32') {
			commandLine = 'tzutil /g'; 
		}
		else if(platform === 'linux') {
			logger.error('not support command on Linux OS now.');
			return callback(null);
		}
		else {
			logger.error('unknown platform');
			return callback(null);
		}
		
		childProcess.exec(commandLine, function (error, stdout, stderr) {
			if(error) {
				logger.error('error occurs when get local timezone id. ' + error);
				return callback('');				
			}
			return callback(stdout);
		});
	}
	
	this.setLocalTimeZone = function setLocalTimeZone(helper, timeZoneId, callback) {
		var logger 	= helper.logger;

		var commandLine = '';
		var platform 	= os.platform();
		
		if(!timeZoneId) {
			return callback(4);
		}
		
		if(platform === 'win32') {
			if(os.release() >= "6.0") { commandLine = 'tzutil /s \"' + timeZoneId + '\"'; }
			else { commandLine = 'tzchange /C \"' + timeZoneId + '\"'; }
		}
		else if(platform === 'linux') {
			logger.error('not support command on Linux OS now.');
			return callback(4);
		}
		else {
			logger.error('unknown platform');
			return callback(4);
		}
		
		childProcess.exec(commandLine, function (error, stdout, stderr) {
			if(error) {
				logger.error('error occurs when set local timezone id. ' + error + '(' + timeZoneId + ')');
				return callback(4);				
			}
			return callback(0);
		});
	}
	
	//disk check
	this.diskCheck = function(drive, callback) {
		diskspace.check(drive, function(total, free, status) {	
			return callback(total, free, status);
		});
	}
	
	//decompress file 
	this.decompressFile = function(helper, zipFile, targetPath, callback) {
		var logger 	= helper.logger;

		var commandLine = '';
		var platform 	= os.platform();
		var arch 		= os.arch();
		var that		= this;
		var cwd 		= helper.WS5Path + path.sep + 'exe' + path.sep + 'server' + path.sep + 'addon' + path.sep + 'command';

		fs.exists(cwd + path.sep + '7z.exe', function(exists) {
			if(!exists) { 
				logger.error('7z.exe does not exist.'); 
				return callback('7z.exe does not exist.'); 
			}
			
			fs.exists(zipFile, function(exists) {
		        if(exists === false) {
		    	    return callback('The zip file does not exist!');
		    	}
		    	
				//prepare command line according to the platform
				if(platform === 'win32') {
					commandLine = cwd + path.sep + '7z.exe x -r -y -o\"' + targetPath + '\" \"' + zipFile + '\"';
				}
				else if(platform === 'linux') {
					
				}
				else {
					
				}
				
				if(commandLine.length === 0) {
					return callback('command error');
				}
				
				
				logger.debug('decompress package commandline is: ' + commandLine);
console.log('decompress package commandline is: ' + commandLine);
				childProcess.exec(commandLine, {cwd: cwd}, function (error, stdout, stderr) {
					callback(error);
				});
			});
		});
	}
	
	//compress file
	this.compressFile = function(helper, srcPathArray, destPath, callback) {
		var logger 	= helper.logger;

		var commandLine 	= '';
		var platform 		= os.platform();
		var cwd 			= helper.WS5Path + path.sep + 'exe' + path.sep + 'server' + path.sep + 'addon' + path.sep + 'command';
		var srcFileList 	= '';
		var i 				= 0;

		if(!srcPathArray || !util.isArray(srcPathArray) || !srcPathArray.length || !destPath) {
			return callback(4);
		}

		for(i = 0 ; i < srcPathArray.length; i++) {
			if(fs.existsSync(srcPathArray[i])) {
				srcFileList += ' \"' + srcPathArray[i] + '\"';
			}
		}		
		
		if(!srcFileList || !srcFileList.length) {
			return callback(null);
		}
		
		fs.exists(cwd + path.sep + '7z.exe', function(exists) {
			if(!exists) { 
				logger.error('7z.exe does not exist.'); 
				return callback('7z.exe does not exist.'); 
			}
			
			//prepare command line according to the platform
			if(platform === 'win32') {
				commandLine = cwd + path.sep + '7z.exe a -y -tzip -r- -ssw ' + destPath + srcFileList;
			}
			else if(platform === 'linux') {
			}
			else {
			}
			
			if(commandLine.length === 0) {
				return callback('command error');
			}
			
			logger.debug('compress file/folder commandline is: ' + commandLine);
			childProcess.exec(commandLine, {cwd: cwd}, function (error, stdout, stderr) {
//console.log('stdout: ' + stdout);
				callback(error);
			});
		});
	}
	
	this.removeBinaryFileFromZipFile = function(helper, packagePath, callback) {
		var logger 	= helper.logger;

		var commandLine 	= '';
		var platform 		= os.platform();
		var cwd 			= helper.WS5Path + path.sep + 'exe' + path.sep + 'server' + path.sep + 'addon' + path.sep + 'command';

		if(!packagePath) {
			return callback(4);
		}

		//prepare command line according to the platform
		if(platform === 'win32') {
			commandLine = cwd + path.sep + '7z.exe d ' + packagePath + ' -r0 *.exe *.dll *.jpg';
		}
		else if(platform === 'linux') {
		}
		else {
		}
		
		if(commandLine.length === 0) {
			return callback('command error');
		}
		
		fs.exists(cwd + path.sep + '7z.exe', function(exists) {
			if(!exists) { 
				logger.error('7z.exe does not exist.'); 
				return callback('7z.exe does not exist.'); 
			}
			
			logger.debug('remove binary file from zip file, commandline is: ' + commandLine);
			childProcess.exec(commandLine, {cwd: cwd}, function (error, stdout, stderr) {
//console.log('stdout: ' + stdout);
				callback(error);
			});
		});
	}
	
	//compress file to buffer
	this.compressFileToBuffer = function(helper, srcPathArray, callback) {
		var logger 	= helper.logger;
		var that	= this;
		
		if(!srcPathArray || !util.isArray(srcPathArray) || !srcPathArray.length) {
			return callback(4, null);
		}
		
		var tempFile = helper.tmpPath + path.sep + new Date().getTime() + '.zip';
		this.compressFile(helper, srcPathArray, tempFile, function(err) {
			if(err) {
				logger.error('error occurs when compress file to buffer. ' + err);
				return callback(443, null);
			}
			
			that.removeBinaryFileFromZipFile(helper, tempFile, function(err) {
				if(err) {
					logger.error('error occurs when remove binary file from zip package. ' + err);
					return callback(443, null);
				}
			
				helper.readContentFromFile(tempFile, function(err, content) {
					hfs.delSync(tempFile);
					return callback(err, content);
				});
			});
		});
	}
	

	this.setLocalTime = function(helper, timeObj, callback) {
		var logger 	= helper.logger;

		var commandLine 	= '';
		var platform 		= os.platform();
		var cwd 			= helper.WS5Path + path.sep + 'exe' + path.sep + 'server' + path.sep + 'addon' + path.sep + 'command';

		if(!timeObj) {
			return callback(4);
		}
		
		var paramArray = [];
		paramArray[0] = timeObj.getUTCFullYear();
		paramArray[1] = timeObj.getUTCMonth() + 1;
		paramArray[2] = timeObj.getUTCDate();
		paramArray[3] = timeObj.getUTCDay();
		paramArray[4] = timeObj.getUTCHours();
		paramArray[5] = timeObj.getUTCMinutes();
		paramArray[6] = timeObj.getUTCSeconds();
		paramArray[7] = timeObj.getUTCMilliseconds();
		
		var paramString = paramArray.join(',');
		//prepare command line according to the platform
		if(platform === 'win32') {
			commandLine = cwd + path.sep + 'settime.exe ' + paramString;
		}
		else if(platform === 'linux') {
		}
		else {
		}
		
		if(commandLine.length === 0) {
			return callback('command error');
		}
		
		fs.exists(cwd + path.sep + 'settime.exe', function(exists) {
			if(!exists) { 
				logger.error('settime.exe does not exist.'); 
				return callback('settime.exe does not exist.'); 
			}

console.log('setlocaltime commandline is: ' + commandLine);
			logger.debug('setlocaltime commandline commandline is: ' + commandLine);
			childProcess.exec(commandLine, {cwd: cwd}, function (error, stdout, stderr) {
console.log('stdout: ' + stdout);
				if(stdout && (stdout.indexOf('error:') === 0)) {
					logger.error('set time error: ' + stdout);
					return callback(stdout.slice(6));
				}
				else if(stdout && (stdout.indexOf('successfully') === 0)) {
					return callback(0);
				}
				else {
					logger.error('set time error: ' + stdout);
					return callback('unknown error');
				}
			});
		});
	}
	
	this.callMDPlayerScheduler = function(helper, option, callback) {
		if(!option || !helper) {
			return callback(4);
		}	
		
		var logger 	= helper.logger;
		var commandPath = helper.serverPath + 'addon' + path.sep + 'mdx86' + path.sep + 'playerScheduler.exe';
		var args = [];
				
		//start to execute command
		var platform	= os.platform();
		var arch 		= os.arch();
		var cwd			= path.dirname(commandPath);
		
		if(platform !== 'win32') {
			logger.error('not support command on other OS except Windows.');
			return callback(22);
		}
		
		if(option.exit) {
			args.push('/exit');
		}
		else if(option.reset) {
			args.push('/reset');
		}
		else if(option.play) {
			args.push(option.play);
		}
		else {
			return callback(4);
		}

		fs.exists(commandPath, function(exists) {
			if(!exists) { 
				logger.error('playerScheduler.exe does not exist.'); 
				return callback('playerScheduler.exe does not exist.'); 
			}

console.log('launch app. commandPath= ' + commandPath);
console.log(args);
console.log('cwd= ' + cwd);
			logger.debug('launch app. commandPath= ' + commandPath);
			logger.debug(args);
			logger.debug('cwd= ' + cwd);
			childProcess.spawn(commandPath, args, {cwd: cwd}, function (error, stdout, stderr) {
//console.log('stdout: ' + stdout);
//console.log('stderr: ' + stderr);
//console.log('error: ' + error);
				if(error) {
					logger.error('error occurs when launch app process. stderr: ' + stderr);
					logger.error('error: ' + error);
//				return callback(0);
				}
				else {
					logger.debug('app process is launched.');
				}
			});
		});
		
		return callback(0);

	}
	
	this.callUpgradePatch = function(helper, packageLocalPath, callback) {
		var newPatchPath = '';
		
		if(!packageLocalPath) {
			return;
		}
		
		var logger 	= helper.logger;

		//start to execute command
		var platform	= os.platform();
		var arch 		= os.arch();
		var cwd			= path.dirname(packageLocalPath);
		
		if(platform !== 'win32') {
			logger.error('not support command on other OS except Windows.');
			return callback(22);
		}
		

		newPatchPath = packageLocalPath.replace(/\.ws5$/, '.exe');
console.log('launch patch app. packageLocalPath= ' + newPatchPath);
console.log('cwd= ' + cwd);
		logger.debug('launch patch app. packageLocalPath= ' + newPatchPath);
		logger.debug('cwd= ' + cwd);
		
		fs.unlink(newPatchPath, function(err) {
			if(err) {
				logger.error('error occurs or file does not exist when remove old patch file: ' + newPatchPath);
				logger.error(err);
			}
			fs.rename(packageLocalPath, newPatchPath, function(err) {
				if(!err) {
					fs.exists(newPatchPath, function(exists) {
						if(!exists) { 
							logger.error('patch does not exist.'); 
							return callback('patch does not exist.'); 
						}
			
						childProcess.exec(newPatchPath + ' /startws5', {cwd: cwd}, function (error, stdout, stderr) {
console.log('stdout: ' + stdout);
console.log('stderr: ' + stderr);
console.log('error: ' + error);
							if(error) {
								logger.error('error occurs when launch app process. stderr: ' + stderr);
								logger.error('error: ' + error);
//							return callback(0);
							}
							else {
								logger.debug('app process is launched.');
							}
						});
					
						return callback(0);
					});
				}
				else {
console.log('failed to rename ws5 patch file to exe.');
console.log(err);
					logger.error('failed to rename ws5 patch file to exe.');
					logger.error(err);
				}
			});
		});
	}
	
	this.controlRender = function(helper, op, callback) { //stop or start render
		var commandLine = '';
		var platform 	= os.platform();
		var arch 		= os.arch();
		var cwd 		= helper.serverPath + 'addon' + path.sep + 'command';
		var that = this;
		var logger 	= helper.logger;
		
		//prepare command line according to the platform
		if(platform === 'win32') {
			if(arch === 'x64')
			{
				commandLine = cwd + path.sep + 'ws5Ctrl ' + op + ' render';
			}
			else {
				commandLine = cwd + path.sep + 'ws5Ctrl ' + op + ' render';
			}
		}
		else if(platform === 'linux') {
		}
		else {
		}
		
		if(commandLine.length === 0) {
			return callback('command error');
		}
		
		
		logger.debug(op + ' render: ' + commandLine);
		fs.exists(cwd + path.sep + 'ws5Ctrl.exe', function(exists) {
			if(!exists) { 
				logger.error('ws5ctrl does not exist.'); 
				return callback('ws5ctrl does not exist.'); 
			}

			childProcess.exec(commandLine, {cwd: cwd}, function (error, stdout, stderr) {
//console.log('stdout: ' + stdout);
				callback(error);
			});
		});
	}		
	
	this.restartRender = function(helper, callback) {
		var that = this;
		var logger 	= helper.logger;
		
		that.controlRender(helper, 'stop', function(err) {
			if(err) {
console.log('error occurs when stop render. ' + err);
				logger.error('error occurs when stop render. ' + err);
				return callback(err);
			}
			else {
				process.nextTick(function() {
					that.controlRender(helper, 'start', function(err) {
						if(err) {
console.log('error occurs when start render. ' + err);
							logger.error('error occurs when start render. ' + err);
							return callback(err);
						}
						
						return callback(0);
					});
				});
			}
		});
	}		
	
	this.callRSSCommand = function(helper, option, callback) {
		if(!option || !helper) {
			return callback(4, null);
		}	
		
		var logger 	= helper.logger;
		var commandPath = helper.serverPath + 'addon' + path.sep + 'command' + path.sep + 'RS232Cmd.exe';
		var args = [];
				
		//start to execute command
		var platform	= os.platform();
		var arch 		= os.arch();
		var cwd			= path.dirname(commandPath);
		
		if(platform !== 'win32') {
			logger.error('do not support command on other OS except Windows.');
			return callback(22, null);
		}
		
		fs.exists(commandPath, function(exists) {
			if(!exists) { 
				logger.error('RS232Cmd.exe does not exist.'); 
				return callback(8, null); 
			}

console.log('launch app. commandPath= ' + commandPath);
console.log(args);
console.log('cwd= ' + cwd);
			logger.debug('launch app. commandPath= ' + commandPath);
			logger.debug(args);
			logger.debug('cwd= ' + cwd);
			childProcess.spawn(commandPath, args, {cwd: cwd}, function (error, stdout, stderr) {
console.log('stdout: ' + stdout);
console.log('stderr: ' + stderr);
console.log('error: ' + error);
				if(error) {
					logger.error('error occurs when launch app process. stderr: ' + stderr);
					logger.error('error: ' + error);
					return callback(error, null);
				}
				else {
					logger.debug('RS232 command is executed.');
					return callback(0, stdout);
				}
			});
		});
		
		return callback(0);
	}
};
module.exports = ControllerCmd;

