var displayCommand = require('./xxx');

var cmdBuffer = displayCommand.getInput();
console.log(cmdBuffer.toString('hex').toUpperCase());

var cmdBuffer = displayCommand.setInput('0004');
console.log(cmdBuffer.toString('hex').toUpperCase());

var cmdBuffer = displayCommand.setColorTemp('006B');
console.log(cmdBuffer.toString('hex').toUpperCase());

var cmdBuffer = displayCommand.setSharpness('0003');
console.log(cmdBuffer.toString('hex').toUpperCase());

var cmdBuffer = displayCommand.getSoftwareVersion();
console.log(cmdBuffer.toString('hex').toUpperCase());

//var reply = displayCommand.parseReplyData('01303041443132023030303035343030303046463030364303730D');
var reply = displayCommand.parseReplyData('01303041463132023030303031363030303036343030303003000D');
console.log(JSON.stringify(reply, '', 4));