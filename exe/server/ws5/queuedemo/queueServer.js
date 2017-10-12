var path = require('path');
var fs = require('fs');
var et = require('elementtree');
var ControllerHelper = require('../controller/client/controllerhelper');
var controllerHelper= new ControllerHelper();

/*
request:
{
	"op": "add" or "delete"
	"itemId": 
	"itemText":
	"logoImage": image url
	"audioFile":
	"audioText":
	"disableAudio":
}
*/

var queueServer = function() {
	this.do = function(req, res) {	
		if(req.body.op != "add" && req.body.op != "delete" && !req.body.itemId){
			//res.json(-1);
			//return;
		}
		var file = path.join(controllerHelper.serverPath, "public", "queuedemo", "queue.xml");
		var XML = et.XML;
		var ElementTree = et.ElementTree;
		var element = et.Element;
		var subElement = et.SubElement;
		var etree;
		var onlyChange = false;
		var lastIsSpace = false;
		fs.readFile(file, "utf-8", function(err, data){
			if(err){
				res.json(-2);
				return;
			}
			//endsWith method need newer version nodeJs 2016.9.7
			//if(data.endsWith(" ")) lastIsSpace = true;
			if(data.charAt(data.length - 1) == ' ') lastIsSpace = true;
			while(data.length > 0){
				//try to remove the BOM, otherwise, et.parse will throw error  2016.10.20 Jeff
				var c = data.charAt(0);
				if(c == '<') break;
				data = data.substr(1);
			}
			try{
				etree = et.parse(data);
				if(req.body.logoImage){
					var logo = etree.find('./ws/logoImage');
					if(!logo){
						logo = subElement(etree.find('./ws'), 'logoImage', {});
					}
					logo.text = req.body.logoImage;
				}
				if(req.body.audioFile){
					var aFile = etree.find('./ws/audio/file');
					if(!aFile){
						aFile = subElement(etree.find('./ws/audio'), 'file', {});
					}
					aFile.text = req.body.audioFile;
				}
				if(req.body.audioText){
					var aText = etree.find('./ws/audio/speech/text');
					if(!aText){
						aText = subElement(etree.find('./ws/audio/speech'), 'text', {});
					}
					aText.text = req.body.audioText;
				}
				if(req.body.disableAudio){
					var ad = etree.find('./ws/audio/disable');
					if(!ad){
						ad = subElement(etree.find('./ws/audio'), 'disable', {});
					}
					ad.text = req.body.disableAudio;
				}
				if(req.body.op == "delete"){
					var iid = req.body.itemId;
					var parent = etree.find('./ws/content');
					if(parent){					
						var item = parent.find('./item[@iid="' + iid + '"]');
						if(item){
							parent.remove(item);					
						}
						item = etree.find('./ws/content/item');
						if(!item){
							//if there is no any available items, try to show default welcome content
							var defaultItem = etree.find('./ws/defaultContent');
							if(defaultItem && defaultItem.text){
								item = subElement(parent, 'item', {"iid":"default"});
								if(item) item.text = defaultItem.text;
							}
						}
					}
					
				}else{
					var item = etree.find('./ws/content/item[@iid="' + req.body.itemId + '"]');
					if(!item){
						item = subElement(etree.find('./ws/content'), 'item', {"iid":req.body.itemId});
					}else onlyChange = true;
					item.text = req.body.itemText;
					var defaultItem = etree.find('./ws/content/item[@iid="default"]');					
					if(defaultItem){
						//because there is valid items, should remove default welcome content
						var parent = etree.find('./ws/content');
						if(parent) parent.remove(defaultItem);
					}					
				}
			}catch(ex){
				res.json(-5);
				return;
			}
			if(etree){
				var newXml = etree.write({'encoding': 'utf-8', 'indent':1});
				//console.log(newXml);
				if(onlyChange && !lastIsSpace) newXml += " ";
				fs.writeFileSync(file, newXml);		
				res.json(0);
			}else res.json(-6);
		});		
	}	
};
module.exports = queueServer;

