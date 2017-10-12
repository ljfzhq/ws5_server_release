var ControllerHelper = require('../controllerhelper');
var helper 	= new ControllerHelper();
var logger 	= helper ? helper.logger : null;



(function() {
	var displayCommand = {};
	//internal variables and functions
	var settings = {
		baudRate	: 9600,
		dataLength	: 8,
		parityBit	: 0,
		stopBit		: 1,
		flowControl	: 0,
		commCode	: 'ASCII'
	};
	
	var SOH 		= 0x01;
	var STX			= 0x02;
	var ETX			= 0x03;
	var RESERVE 	= 0x30;
	var SOURCE		= 0x30;
	var delimiter 	= 0x0D;
	var messageType = {
		command			: 0x41, //'A',
		commandReply	: 0x42, //'B',
		get				: 0x43, //'C',
		getReply		: 0x44, //'D',
		set				: 0x45, //'E',
		setReply		: 0x46, //'F'
	};
	
	var sourceStatus = {
		poweroff	: '0000',
		initial		: '0001',
		search		: '0002',
		normal		: '0003',
		unsupport	: '0004',
		nosignal	: '0005',
		sleep		: '0006'
	};

	var audioSelect = {
		audio1		: '0001',
		audio2		: '0002',
		hdmi1		: '0003',
		hdmi2		: '0004'
	};
	
	var inputType = {
		vga1		: '0001',
		vga2		: '0002',
		hdmi1		: '0003',
		hdmi2		: '0004'
	};
	
	var imageSize = {
		fullscreen	: '0000',
		original	: '0001'
	};
	
	var powerSwitch = {
		on	: '0001',
		off	: '0000',
		sleep: '0002' //get only
	};
	
	var colorTemp = {
		ct5800	: '0047',
		ct6500	: '0054',
		ct9300	: '0069',
		ctsRGB	: '006A',
		ctUser1	: '006B'
	};

	
	var genHeader = function(cmdBuffer, monitorID, messageType) {
		if(!cmdBuffer || (cmdBuffer.length < 5)) {
			logger.error('got empty buffer or buffer size is not enough.');
			logger.error('monitorID=' + monitorID + ' msgType=' + messageType);
			return null;
		}
		
		cmdBuffer[0] = SOH;
		cmdBuffer[1] = RESERVE;
		cmdBuffer[2] = monitorID;
		cmdBuffer[3] = SOURCE;
		cmdBuffer[4] = messageType;

		return cmdBuffer;
	}
	
	var genMessage = function(cmdBuffer, opPage, opCode, param) {
		if(!cmdBuffer || (!param && (cmdBuffer.length < 12)) || (param && (cmdBuffer.length < 16))) {
			logger.error('got empty buffer or buffer size is not enough.');
			logger.error('opPage=' + opPage + ' opCode' + opCode + ' param=' + param);
			return null;
		}
		
		var messageLength = 1 + 2 + 2 + 1; //STX + PageCode + Code + ETX
		
		messageLength += param ? 4 : 0;
		
		cmdBuffer[5] = (messageLength / 0x0F).toString(16).toUpperCase().charCodeAt(0);
		cmdBuffer[6] = (messageLength % 0x0F).toString(16).toUpperCase().charCodeAt(0);
		cmdBuffer[7] = STX;
		cmdBuffer[8] = opPage.charCodeAt(0);
		cmdBuffer[9] = opPage.charCodeAt(1);
		cmdBuffer[10] = opCode.charCodeAt(0);
		cmdBuffer[11] = opCode.charCodeAt(1);

		if(param) {
			cmdBuffer[12] = param.charCodeAt(0);
			cmdBuffer[13] = param.charCodeAt(1);
			cmdBuffer[14] = param.charCodeAt(2);
			cmdBuffer[15] = param.charCodeAt(3);
		}
		
		cmdBuffer[cmdBuffer.length - 3] = ETX;
		
		return cmdBuffer;
	}
	
	var calcCheckCode = function(cmdBuffer) {
		if(!cmdBuffer || !cmdBuffer.length) { 
			logger.error('got empty data buffer.');
			return -1; 
		}
		
		var len = cmdBuffer.length - 2;
		var sum = cmdBuffer[1];
		for(var i = 2 ; i < len ; i ++) {
			sum ^= cmdBuffer[i];
		}
		
		return sum;
	}
	
	var genCheckCode = function(cmdBuffer) {
		if(!cmdBuffer || !cmdBuffer.length) { 
			logger.error('got empty data buffer.');
			return false; 
		}
		
		var sum = calcCheckCode(cmdBuffer);
		if(sum < 0) {
			logger.error('got wrong check code. code =' + sum);
			return false;
		}
		
		cmdBuffer[cmdBuffer.length - 2] = sum;
		return true;
	}
	
	var genCommand = function(monitorID, msgType, opPage, opCode, param) {
		var cmdBuffer = null;
		var bufferSize = 0;
		
		if(!monitorID || !opPage || !opCode) { 
			logger.error('got wrong parameters.');
			logger.error('monitorID=' + monitorID + ' opPage=' + opPage + ' opCode' + opCode);
			return null; 
		}

		if((msgType === messageType.set) && !param) { 
			logger.error('got wrong empty parameter for set command.');
			logger.error('monitorID=' + monitorID + ' opPage=' + opPage + ' opCode' + opCode + ' msgType=' + msgType + ' param=' + param);
			return null; 
		}
		
		switch(msgType) {
			case messageType.get:
				bufferSize = 15;
				break;
				
			case messageType.set:
				bufferSize = 19;
				break;
				
			default:
				return null;
		}
		
		cmdBuffer = new Buffer(bufferSize);
		cmdBuffer.fill(0);

		//generate command header
		if(!genHeader(cmdBuffer, monitorID, msgType)) { return null; }
		
		//generate message 
		if(!genMessage(cmdBuffer, opPage, opCode, param)) { return null; }
		
		//calculate check code
		if(!genCheckCode(cmdBuffer)) { return null; }
		
		cmdBuffer[bufferSize - 1] = delimiter;
		return cmdBuffer;
	} 
	
	var parseReply = function(dataBuffer) {
		if(!dataBuffer || (dataBuffer.length !== 27)) {
			logger.error('got wrong data buffer, or data buffer size is not enough. dataBuffer=');
			logger.error(dataBuffer);
			return null;
		}
		
		var reply = {};
		var codeString = String.fromCharCode(dataBuffer[8], dataBuffer[9]);
		reply.result = parseInt(codeString, 16);
		
		codeString = String.fromCharCode(dataBuffer[10], dataBuffer[11]);
		reply.codePage = parseInt(codeString, 16);
		
		codeString = String.fromCharCode(dataBuffer[12], dataBuffer[13]);
		reply.code = parseInt(codeString, 16);
		
		codeString = String.fromCharCode(dataBuffer[14], dataBuffer[15]);
		reply.opType = parseInt(codeString, 16);
		
		codeString = String.fromCharCode(dataBuffer[16], dataBuffer[17], dataBuffer[18], dataBuffer[19]);
		reply.max = parseInt(codeString, 16);
		
		codeString = String.fromCharCode(dataBuffer[20], dataBuffer[21], dataBuffer[22], dataBuffer[23]);
		reply.cur = parseInt(codeString, 16);
		
		reply.checkCode = dataBuffer[25];
		
		return reply;
	}
	



	//public functions
	displayCommand.init = function(baudRate, dataLength, parityBit, stopBit, flowControl, commCode) {
		settings.baudRate	= baudRate;
		settings.dataLength	= dataLength;
		settings.parityBit	= parityBit;
		settings.stopBit	= stopBit;
		settings.flowControl= flowControl;
		settings.commCode	= commCode;
	}
	
	displayCommand.setInput = function(input) {
		if((input !== inputType.vga1) && (input !== inputType.vga2) && (input !== inputType.hdmi1) && (input !== inputType.hdmi2)) {
			logger.error('wrong input for setInput(). input=' + input);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '60', input);
		return cmdBuffer;
	}
	
	displayCommand.getInput = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '60', null);
		return cmdBuffer;
	}
	
	displayCommand.setContrast = function(newValue) {
		if((newValue > '0064') || (newValue < '0000')) {
			logger.error('wrong newValue for setContrast(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '12', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getContrast = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '12', null);
		return cmdBuffer;
	}
	
	displayCommand.setBrightness = function(newValue) {
		if((newValue > '0064') || (newValue < '0000')) {
			logger.error('wrong newValue for setBrightness(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '10', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getBrightness = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '10', null);
		return cmdBuffer;
	}
	
	displayCommand.setSharpness = function(newValue) {
		if((newValue > '0004') || (newValue < '0000')) {
			logger.error('wrong newValue for setSharpness(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '8C', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getSharpness = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '8C', null);
		return cmdBuffer;
	}
	
	displayCommand.setColorTemp = function(newValue) {
		if((newValue !== colorTemp.ct5800) && (newValue !== colorTemp.ct6500) && (newValue !== colorTemp.ct9300) && (newValue !== colorTemp.ctsRGB) && (newValue !== colorTemp.ctUser1)) {
			logger.error('wrong newValue for setColorTemp(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '54', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getColorTemp = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '54', null);
		return cmdBuffer;
	}
	
	displayCommand.setMonitorID = function(newID) {
		if((newID > '003C') || (newID < '0001')) {
			logger.error('wrong newID for setMonitorID(). newID=' + newID);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '02', '3E', newID);
		return cmdBuffer;
	}
	
	displayCommand.getMonitorID = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '02', '3E', null);
		return cmdBuffer;
	}
	
	displayCommand.setVolume = function(newValue) {
		if((newValue > '0064') || (newValue < '0000')) {
			logger.error('wrong newValue for setVolume(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '62', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getVolume = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '62', null);
		return cmdBuffer;
	}
	
	displayCommand.setAudioMute = function(newValue) {
		if((newValue !== '0000') && (newValue !== '0001') && (newValue !== '0002')) {
			logger.error('wrong newValue for setAudioMute(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '8D', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getAudioMute = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '8D', null);
		return cmdBuffer;
	}
	
	displayCommand.setPowerSwitch = function() {
		if((newValue !== powerSwitch.on) && (newValue !== powerSwitch.off)) {
			logger.error('wrong newValue for setPowerSwitch(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '20', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getPowerSwitch = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '20', null);
		return cmdBuffer;
	}
	
	displayCommand.setAudioSelect = function(newValue) {
		if((newValue !== audioSelect.audio1) && (newValue !== audioSelect.audio2) && (newValue !== audioSelect.hdmi1) && (newValue !== audioSelect.hdmi2)) {
			logger.error('wrong newValue for setAudioSelect(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '02', '09', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getAudioSelect = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '02', '09', null);
		return cmdBuffer;		
	}
	
	displayCommand.setImageSize = function(newValue) {
		if((newValue !== imageSize.fullscreen) && (newValue !== imageSize.original)) {
			logger.error('wrong newValue for setImageSize(). newValue=' + newValue);
			return null;
		}
		
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '21', newValue);
		return cmdBuffer;
	}
	
	displayCommand.getImageSize = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', '21', null);
		return cmdBuffer;		
	}
	
	displayCommand.getThermalSensor = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '00', 'AA', null);
		return cmdBuffer;		
	}
	
	displayCommand.getSourceStatus = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '02', '03', null);
		return cmdBuffer;		
	}
	
	displayCommand.getLifeTime = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '02', '04', null);
		return cmdBuffer;		
	}
	
	displayCommand.getSoftwareVersion = function() {
		var cmdBuffer = genCommand(0x41, messageType.get, '02', '0A', null);
		return cmdBuffer;		
	}
	
	displayCommand.reset = function() {
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '25', '0001');
		return cmdBuffer;
	}
	
	displayCommand.autoAdjust = function() {
		var cmdBuffer = genCommand(0x2A, messageType.set, '00', '24', '0001');
		return cmdBuffer;
	}
	
	displayCommand.parseReplyData = function(dataString, msgType) {
		if(!dataString || !dataString.length) {
			logger.error('data string is empty when calling parseReplyData.');
			return null;
		}
		
		var strLen = dataString.length / 2;
		var dataBuffer = new Buffer(strLen);
		for(var i = 0; i < strLen; i++) {
			dataBuffer[i] = parseInt(dataString.slice(i * 2, i * 2 + 2), 16);
		}


		if(!dataBuffer || (dataBuffer.length !== 27)) {
			logger.error('data buffer size is not correct. buffer=');
			logger.error(dataBuffer);
			return null;
		}
		
		var reply = parseReply(dataBuffer);
		if(!reply) {
			logger.error('parse reply failed.');
			return null;
		}
		
		var sum = calcCheckCode(dataBuffer);
		if(sum < 0) return null;
		if(sum !== reply.checkCode) {
			logger.error('reply data check code is not correct. buffer=');
			logger.error(dataBuffer);
			logger.error(reply);
			logger.error('sum=' + sum);
			return null;
		}
		
		return reply;
	}
	
	module.exports = displayCommand;
})();
