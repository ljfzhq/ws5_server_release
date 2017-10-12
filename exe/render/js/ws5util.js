(function($, undefined) {
	window.ws5 = window.ws5|| new Object();

	$(document).ready(function() {
		window.ws5.errTemplate = $('#msgBox').load('/common/ws5util.htm #msgTemplate');
	});

	/**
	* add ?ws5ver=xxx into URL to avoid using old version file but still have cache
	* xxx is from cookie
	*
	* @method ws5UrlVer
	* @param {String} url, will prefix 'en.' or another language to it
	* @return {String} append ?ws5ver=xxx after URL if URL did not have ?, otherwise add &ws5ver=xxx
	*/		
	function ws5UrlVer(url) {
		window.ws5ver= window.ws5ver || $.cookies.get('ws5ver') || '1';
		if (url.indexOf('?')<0)
			return url+'?ws5ver='+window.ws5ver;
		return url+'&ws5ver='+window.ws5ver;	
	}
	
	/**
	* load string used in GUI so easier to localization 
	* then can access those string by ws5.msg.module.stringName
	*
	* @method loadMsg
	* @param {String} url, will prefix 'en.' or another language to it
	* @param {String} module name
	* @param {Function} callback(lang, param) function after strings are loaded, with param like 'en', 'cn'
	* @param {Array} parameter array passed into callback function
	*/		
	window.ws5.loadMsg = function(url, module, callback, param) {
		window.ws5.msg = window.ws5.msg || new Object();

		var loadLang =  $.cookies.get('lang') ||'en';	
	
		if (window.ws5.lang==loadLang && window.ws5.msg[module]!=null) {
			if (callback)
				callback(loadLang, param);
			return;
		}
			
		window.ws5.msg[module] = window.ws5.msg[module] || new Object();
		var loadModule = module;
		var callbackFunc = callback;
		var callbackParam = param;
		$.getJSON(url+'.'+loadLang+'.json', 
				function(data) {
					//window.ws5.msg[loadModule]=data; 
					//if (callbackFunc)
					//	callbackFunc(loadLang, callbackParam);
		}).always(function(data){
			window.ws5.msg[loadModule]=data; 
			if (callbackFunc)
				callbackFunc(loadLang, callbackParam);
		});	
	};

	window.ws5.localize = function(rootEle, localMsg) {
		rootEle.find('.ws5local').each(function(idx, item){
			var id = $(item).prop('id');
			if (id && localMsg[id]) {
				$(item).text(localMsg[id]);
			}
		});			

		rootEle.find('.ws5localTip').each(function(idx, item){
			var id = $(item).prop('id');
			if (id && localMsg[id]) {
				$(item).prop('title', localMsg[id]);
			}
		});			
	}
	
	window.ws5.parentDir = function(path) {
		var lastPath = path.lastIndexOf('/');
		var parentDir;
		if (lastPath>=0) {
			parentDir = path.substr(0, lastPath);
		}
		return parentDir;
	}

	/**
	* convert duration into hh:mm:ss;ff format for video and hh.mm:ss.ss for others
	*
	* @method durFormat
	* @param {Integer} dur, 100 is for 1s, everything below 100 is for ff
	* @param {bool} isViewo
	* @return {String} in xxx,yyy.zzz GB xxx,yyy.zzz MB or xxx,yyy.zzz KB
	*/		
	window.ws5.durFormat = function(dur, fullFormat) {
		var ret;
		//var dur = parseInt(durData);
		//if (isNaN(durData)) {
		//	dur = parseInt(durData);
		//}
		
		//if (isVideo)
		//	ret = sprintf('%02d:%02d:%02d;%02d', dur/3600000, (dur%3600000)/60000, (dur%60000)/1000, dur%1000);
		//else
		
		if (dur>3600000 || fullFormat) {
			ret = sprintf('%02d:%02d:%02d.%03d', Math.floor(dur/3600000), (dur%3600000)/60000, (dur%60000)/1000, dur%1000);
		}
		else if (dur>60000) {
			ret = sprintf('%02d:%02d.%03d', (dur%3600000)/60000, (dur%60000)/1000, dur%1000);
		}
		else {
			ret = sprintf('%02d.%03d',  (dur%60000)/1000, dur%1000);
		}
		return ret;
	};

	/**
	* convert lmt into yyyy-mm-dd, hh:mm:ss
	*
	* @method lmtFormat
	* @param {string} string, standard w3 date time, like yyyy-mm-ddThh:mm:ss.sssZ
	* @return {String} lmt in yyyy-mm-dd, hh:mm:ss
	*/		
	window.ws5.lmtFormat = function(lmt) {
		var fromGMT = new timezoneJS.Date(lmt);
		var localTime = fromGMT.toString();
		return localTime;
		
		//var ret = lmt.replace('T', ', ');
		//ret = ret.substr(0, 20);
		//return ret;
	};

	/**
	* convert lmt into yyyy-mm-dd, hh:mm:ss
	*
	* @method isoDate2ws5
	* @param {string} string, standard w3 date time, like yyyy-mm-ddThh:mm:ss.sssZ
	* @return {String} date in yyyy-mm-dd
	*/		
	window.ws5.isoDate2ws5 = function(date) {

		var ret;
		if (date instanceof Date) {
			ret =sprintf('%04d:%02d:%02d', date.getFullYear(), (date.getMonth()+1),date.getDate());
		}
		else if (typeof date == 'string'){
			ret = date;
		}
		else {
			return;
		}
		
		ret = ret.replace(/-/g, ":");
		return ret;
	};

	/**
	* convert yyyy-mm-dd into JS Date
	*
	* @method toIsoDate
	* @param {string} string,  like yyyy-mm-dd
	* @return {String} date 
	*/		
	window.ws5.toIsoDate = function(dateStr) {
		if (dateStr instanceof Date) {
			return dateStr;
		}
		
		var retDate = new Date();
		retDate.setFullYear(dateStr.substr(0, 4));
		var test=parseInt(dateStr.substr(5, 2))-1;
		retDate.setMonth(parseInt(dateStr.substr(5, 2))-1, 
			dateStr.substr(8, 2));
		//retDate.setDate(dateStr.substr(8, 2));
		retDate.setHours(0,0,0,0);
		return retDate;
	};
	
	
	/**
	* convert duration from hh:mm:ss;ff format into 1/100s e.g. 2:03 will be 12300
	*
	* @method durFormat
	* @param {InteStringger} durString in hh:mm:ss;ff format
	* @return {integer} in 1/100 second
	*/		
	window.ws5.string2Dur = function(durString) {
		var parts = durString.split(':');
		var ret = 0;
		if (parts.length>3) {
			ret = -1;
		}
		else {
			var ms;
			var last = parts.length-1;
			ms = parts[last].split('.');
			var lastNum=0;
			if (ms.length==1 && parts[last]>=0 && parts[last]<60) {
				lastNum = parseInt(parts[last])*1000;
			}
			else if (ms.length==2 && ms[0]<60 && ms[0]>=0 && ms[1]<999 && ms[1]>=0) {
				lastNum = parseInt(ms[0])*1000+parseInt(ms[1]);
			}
			else {
				return -1;
			}

			if (last==2) {
				ret = parseInt(parts[0])*3600000+parseInt(parts[1])*60000+lastNum;
			}
			else if (last==1) {
				ret = parseInt(parts[0])*60000+lastNum;
			}
			else {
				ret = lastNum;
			}
		}

		return ret;
	};

	/**
	* convert bytes in KB, MB, GB in 123,456,789 format
	*
	* @method sizeFormat
	* @param {Integer} size in bytes
	* @return {String} in xxx,yyy.zzz GB xxx,yyy.zzz MB or xxx,yyy.zzz KB
	*/		
	window.ws5.sizeFormat = function(size) {
		var unit=0;
		if (size< 1024)
			return sprintf('%d '+ window.ws5.msg.media.bytes, size);
		else if (size <1024*1024) {
			unit = 1024;
			if (size%unit==0)
				return sprintf('%d '+ window.ws5.msg.media.kb, size/unit);
			else
				return sprintf('%d.%2d '+ window.ws5.msg.media.kb, size/unit, size%unit/unit*100);
		}
		else if (size <1024*1024*1024) {
			unit = 1024*1024;
			if (size%unit==0)
				return sprintf('%d '+ window.ws5.msg.media.mb, size/unit);
			else
				return sprintf('%d.%2d '+ window.ws5.msg.media.mb, size/unit, size%unit/unit*100);
		}
		else {
			unit = 1024*1024*1024;
			if (size%unit==0)
				return sprintf('%d '+ window.ws5.msg.media.gb, size/unit);
			else
				return sprintf('%d.%2d '+ window.ws5.msg.media.gb, size/unit, size%unit/unit*100);
		}
	};
	
	window.ws5.flashIcon = function(icon) {
		var iconEle = icon;
		if (!iconEle.hasClass('tb_iconWrap')) {
			iconEle = iconEle.parents('.tb_iconWrap');
		}
		iconEle.toggleClass('ws5disabled');
		setTimeout(function(){iconEle.toggleClass('ws5disabled');}, 100);
	}
	
	window.ws5.dimFormat = function(width, height) {
		if (width && height) {
			return width+'x'+height +' '+window.ws5.msg.media.px;
		}
		return '';
	}
	
	/**
	* convert widthxheight into integer
	*
	* @method parseDim
	* @param {String} dim in width x height format
	* @return {Object} .width, .height, and .format a formalized string
	*/		
	window.ws5.parseDim = function(dimString) {
		var obj = {};
		var format = dimString.match(/\d+\s*x\s*\d+/g);
		if (format) {
			obj.format = format[0];
			obj.width = parseInt(obj.format);
			obj.height = obj.format.substr(obj.format.indexOf('x')+1);
			obj.height = parseInt(obj.height);
		}
		return obj;
	}
	
	/**
	* convert left, top into integer
	*
	* @method parsePos
	* @param {String} dim in left, top format
	* @return {Object} .left, .top, and .format a formalized string
	*/		
	window.ws5.parsePos = function(posString) {
		var obj = {};
		var format = posString.match(/\d+\s*,\s*\d+/g);
		if (format) {
			obj.format = format[0];
			obj.left = parseInt(obj.format);
			obj.top = obj.format.substr(obj.format.indexOf(',')+1);
			obj.top = parseInt(obj.top);
		}
		return obj;
	}
	
	
	/**
	* find ancestor of tag who has a widget applied
	*
	* @method findWidgetObj
	* @param {jQuery} tag
	* @param {String} widgetname
	* @return {Object} widget object
	*/		
	window.ws5.findWidgetObj = function(tag, widgetName) {
		var parent= tag.parent();
		while (parent.length>0) {
			var data = parent.data(widgetName);
			if (data) {
				return data;
			}
			parent = parent.parent();
		}
	}
	
	/**
	* convert full path file name (media, playlist) to its attribute
	*
	* @method fileNameAttr
	* @param {String} fullPath
	* @param {Object} item object, will have attr like name, thumb, parent (path, no ending /), snapshot (original size image)
	*/		
	window.ws5.fileNameAttr = function(fullPath, obj) {
		if (!fullPath) {
			console.log('window.ws5.fileNameAttr >'+fullPath);
		}
		obj.name = obj.name || fullPath.substr(fullPath.lastIndexOf('/')+1);
		obj.parent = obj.parent || fullPath.substr(0, fullPath.length-obj.name.length-1);
		
		//todo, use full image for now, should change to thumb
		obj.thumb = obj.thumb || '/lib/'+window.ws5.site+obj.parent + '/.' + obj.name +'.jpg';
		obj.libPath = obj.libPath || '/lib/'+window.ws5.site+obj.path;
		obj.snapshot = obj.snapshot || '/lib/'+window.ws5.site+obj.parent + '/.' + obj.name +'.full.jpg';
		if (obj.dur) {
			obj.dur = parseInt(obj.dur);
		}
		else {
			delete obj.dur;
		}
		obj.width = parseInt(obj.width);
		obj.height = parseInt(obj.height);
		
		if (obj.width && obj.height) {
			obj.dim = obj.dim || window.ws5.dimFormat(obj.width, obj.height);
		}
		if (obj.lmt) 
			obj.lmt = window.ws5.lmtFormat(obj.lmt);
		if (obj.lastmodifytime) 
			obj.lastmodifytime = window.ws5.lmtFormat(obj.lastmodifytime);
		if (obj.lastonlinetime) 
			obj.lastonlinetime = window.ws5.lmtFormat(obj.lastonlinetime);
	}

	window.ws5.round2min = function(time, grid) {
		var round = grid || 600000;
		var remain = time%round;
		var roundUp = 0;
		if (remain>round/2) {
			roundUp = round;
		}
		return time-remain+roundUp;
	}
	
	window.ws5.overlap = function(start1, end1, start2, end2) {
		if (start1<start2 && start2<end1 
				|| start1<end2 && end2<end1
				|| start2<start1 && start1<end2
				|| start2<end1 && end1<end2) {
			return true;
		}
		return false;
	}
	
	window.ws5.str2num = function(str, min, max) {
		if (typeof str != 'string')
			return;
		if (str.length<=0)
			return;
			
		var nonDigit = str.match(/[^0-9]/g);
		if (nonDigit!=null && typeof nonDigit !='undefined') {
			return;
		}
		var num = parseInt(str);
		if (!(min<=num && num<=max)) {
			return;
		}
		return num;
	}
	
	window.ws5.rename = function(path, name) {
		var lastPath = path.lastIndexOf('/');
		if (lastPath<0)
			return name;
		return path.substr(0, lastPath+1)+name;
	}
	
	window.ws5.removeEndingSlash = function(str) {
		if (str && str.charAt(str.length-1)=='/')
			return str.substr(0, str.length-1);
		return str;
	}
	
	// ajax with last base dir, may not be the one of doc. Should bind with history
	window.ws5.ajaxBeforeSend = function(xhr, setting) {
		window.ws5.dynURL = setting.url;
	};

	window.ws5.ajaxDataFilter = function(data, filter) {
		return data;
	};



	/**
	* show a modaless error message dialog
	*
	* @method window.ws5.showErrorDialog
	* @param {Object} info, has .msg (main content) and .items (one line per item after .msg)
	*/		
	window.ws5.showMsg = function (info, items, timeout) {
		if (info.id==302) {
			window.location.href='/ws5/index.htm';
			return;
		}

		if (!window.ws5.msgTemplate) {
			$('#msgBox').load('/common/ws5util.htm #msgTemplate', function(responseText, textStatus, XMLHttpRequest) {
					window.ws5.msgTemplate = $('#msgBox');
					window.ws5.showMsg(info, items, timeout);
				})
				.blur( function(event) {
					$('#msgBox').dialog('close');
				});
		}
		else {
			var closeTime = timeout || 8000;
			if (closeTime>0) {
				setTimeout(function(){
					$('#msgBox').dialog('close');
				}, closeTime);
			}
			
			if (info.msg && info.id) {		
				window.ws5.errTemplate.find('#msg').text(info.id+': '+info.msg);
			}	
			else if (info.msg) {			
				window.ws5.errTemplate.find('#msg').text(info.msg);
			}
			else {
				window.ws5.errTemplate.find('#msg').text('error '+info.id);
			}
			
			if (items) {
				var itemContainer = $(window.ws5.msgTemplate).find('#item').html();
				$(window.ws5.msgTemplate).find('#item').remove();
				for (var idx=0; idx<items.length; idx++) {
					var item = $.html(itemContainer).text(info.items[idx]).appendTo($(window.ws5.msgTemplate));
				}
				$(window.ws5.msgTemplate).find('#item').show();
			}
			else
				$(window.ws5.msgTemplate).find('#item').hide();
			
			window.ws5.msgTemplate.show().dialog().focus();
			//$(window.ws5.msgTemplate).show().find('#msg').focus();
		}
	}
	
	
	/**
	* similar to jquery getJSON, but with post method.
	* AND it sets the context as data
	*
	* @method postJSON
	* @param {Object} JSON, must have url, data, and success function as getJSON, context is optional
	*/		
	$.postJSON = function(options) {
		var xhr;
		if (options.context) {
			xhr= $.ajax({
			  dataType: "json",
			  type: 'POST',
			  url: options.url,
			  context: options.context,
			  data: options.data,
			  success: function(resp) {
			  	if (!resp.status && resp.id==302) {
					window.location.href='/ws5/index.htm';
			  	}
			  	else
			  		options.success.call(options.context, resp);
			  }
			});
		}
		else {
			xhr= $.ajax({
			  dataType: "json",
			  type: 'POST',
			  url: options.url,
			  data: options.data,
			  success: function(resp) {
			  	if (!resp.status && resp.id==302) {
					window.location.href='/ws5/index.htm';
			  	}
			  	else if (options.success)
			  		options.success(resp);
			  }
			});
		}
		return xhr;
	};
	
	window.ws5.getPlayerThumb = function(playerObj) {
		var thumb;
		if (playerObj.type=='group') {
			thumb = '/lib/default thumbnail/group.jpg';
		}
		else {
			thumb = '/ws5/login/player/getsnapshot.js?playerid='+playerObj.id;
		}
		return thumb;
	}
	
	window.ws5.getTips = function (template, data) {
		try {
			var tips = template.children();
			var id;
			for (var idx=0; idx<tips.length; idx++) {
				id = $(tips[idx]).attr('id');
				if (data[id] !=null) {
					if (id=='dim') {
						//$(tips[idx]).find('span:nth-child(2)').text(data[id].width+ ' x '+ data[id].height +' px');
						$(tips[idx]).find('span:nth-child(2)').text(data[id]);
					}
					else if (id=='size')
						$(tips[idx]).find('span:nth-child(2)').text(window.ws5.sizeFormat(data[id]));
					else if (id=='dur' || id=='start' || id=='calcuStart')
						$(tips[idx]).find('span:nth-child(2)').text(window.ws5.durFormat(data[id]));
					else if (id=='thumb') {
						$(tips[idx]).prop('src', data.thumb);
					}
					else
						$(tips[idx]).find('span:nth-child(2)').text(data[id]);
					$(tips[idx]).show();
				}
				else
					$(tips[idx]).hide();
			}
			return template.html();
		} catch(e) {
			return '';
		}
	};
	
	/**
	* show an error message
	*
	* @method showError
	* @param {Object} err, can be an error string, error id, or q xhr
	*/		
	window.ws5.showError = function(info, items) {
		if (info.id==302) {
			window.location.href='/ws5/index.htm';
			return;
		}
		
		if (!window.ws5.errTemplate) {
			window.ws5.errTemplate = $('#msgBox')
				.load('/common/ws5util.htm #msgTemplate', function(responseText, textStatus, XMLHttpRequest) {
					window.ws5.showError(info, items);
				}).blur( function(event) {
					window.ws5.errTemplate.dialog('close');
				});;
		}
		else {
			if (info.msg && info.id) {		
				window.ws5.errTemplate.find('#msg').text(info.id+': '+info.msg);
			}	
			else if (info.msg) {			
				window.ws5.errTemplate.find('#msg').text(info.msg);
			}
			else {
				window.ws5.errTemplate.find('#msg').text('error '+info.id);
			}
			
			if (items) {
				var itemContainer = $(window.ws5.errTemplate).find('#item').html();
				$(window.ws5.errTemplate).find('#item').remove();
				for (var idx=0; idx<items.length; idx++) {
					var item = $.html(itemContainer).text(info.items[idx]).appendTo($(window.ws5.errTemplate));
				}
				$(window.ws5.errTemplate).find('#item').show();
			}
			else
				$(window.ws5.errTemplate).find('#item').hide();
			
			window.ws5.errTemplate.show().dialog().focus();
			//$(window.ws5.errTemplate).show().find('#msg').focus();
		}
	}
	
	$.ajaxSetup({beforeSend: window.ws5.ajaxBeforeSend, dataFilter:window.ws5.ajaxDataFilter});

	/**
	* convert a string to array buffer for post
	*
	* @method window.ws5.str2ab
	* @param {String} string to convert
	*/			
	window.ws5.str2ab = function (str) {
		  var buf = new ArrayBuffer(str.length); 
		  var bufView = new Uint8Array(buf);
		  for (var i=0, strLen=str.length; i<strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		  }
		  return buf;
	};

	/**
	* convert an array buffer back to string
	*
	* @method window.ws5.ab2str
	* @param {ArrayBuffer} array buffer to convert
	*/			
	window.ws5.ab2str = function (buf) {
		  return String.fromCharCode.apply(null, new Uint16Array(buf));
	}	

/*
Copyright Vassilis Petroulias [DRDigit]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/	
	var B64 = {
		alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
		lookup: null,
		ie: /MSIE /.test(navigator.userAgent),
		ieo: /MSIE [67]/.test(navigator.userAgent),
		encode: function (s) {
			var buffer = B64.toUtf8(s),
				position = -1,
				len = buffer.length,
				nan1, nan2, enc = [, , , ];
			if (B64.ie) {
				var result = [];
				while (++position < len) {
					nan1 = buffer[position + 1], nan2 = buffer[position + 2];
					enc[0] = buffer[position] >> 2;
					enc[1] = ((buffer[position] & 3) << 4) | (buffer[++position] >> 4);
					if (isNaN(nan1)) enc[2] = enc[3] = 64;
					else {
						enc[2] = ((buffer[position] & 15) << 2) | (buffer[++position] >> 6);
						enc[3] = (isNaN(nan2)) ? 64 : buffer[position] & 63;
					}
					result.push(B64.alphabet[enc[0]], B64.alphabet[enc[1]], B64.alphabet[enc[2]], B64.alphabet[enc[3]]);
				}
				return result.join('');
			} else {
				result = '';
				while (++position < len) {
					nan1 = buffer[position + 1], nan2 = buffer[position + 2];
					enc[0] = buffer[position] >> 2;
					enc[1] = ((buffer[position] & 3) << 4) | (buffer[++position] >> 4);
					if (isNaN(nan1)) enc[2] = enc[3] = 64;
					else {
						enc[2] = ((buffer[position] & 15) << 2) | (buffer[++position] >> 6);
						enc[3] = (isNaN(nan2)) ? 64 : buffer[position] & 63;
					}
					result += B64.alphabet[enc[0]] + B64.alphabet[enc[1]] + B64.alphabet[enc[2]] + B64.alphabet[enc[3]];
				}
				return result;
			}
		},
		decode: function (s) {
			var buffer = B64.fromUtf8(s),
				position = 0,
				len = buffer.length;
			if (B64.ieo) {
				result = [];
				while (position < len) {
					if (buffer[position] < 128) result.push(String.fromCharCode(buffer[position++]));
					else if (buffer[position] > 191 && buffer[position] < 224) result.push(String.fromCharCode(((buffer[position++] & 31) << 6) | (buffer[position++] & 63)));
					else result.push(String.fromCharCode(((buffer[position++] & 15) << 12) | ((buffer[position++] & 63) << 6) | (buffer[position++] & 63)));
				}
				return result.join('');
			} else {
				result = '';
				while (position < len) {
					if (buffer[position] < 128) result += String.fromCharCode(buffer[position++]);
					else if (buffer[position] > 191 && buffer[position] < 224) result += String.fromCharCode(((buffer[position++] & 31) << 6) | (buffer[position++] & 63));
					else result += String.fromCharCode(((buffer[position++] & 15) << 12) | ((buffer[position++] & 63) << 6) | (buffer[position++] & 63));
				}
				return result;
			}
		},
		toUtf8: function (s) {
			var position = -1,
				len = s.length,
				chr, buffer = [];
			if (/^[\x00-\x7f]*$/.test(s)) while (++position < len)
			buffer.push(s.charCodeAt(position));
			else while (++position < len) {
				chr = s.charCodeAt(position);
				if (chr < 128) buffer.push(chr);
				else if (chr < 2048) buffer.push((chr >> 6) | 192, (chr & 63) | 128);
				else buffer.push((chr >> 12) | 224, ((chr >> 6) & 63) | 128, (chr & 63) | 128);
			}
			return buffer;
		},
		fromUtf8: function (s) {
			var position = -1,
				len, buffer = [],
				enc = [, , , ];
			if (!B64.lookup) {
				len = B64.alphabet.length;
				B64.lookup = {};
				while (++position < len)
				B64.lookup[B64.alphabet[position]] = position;
				position = -1;
			}
			len = s.length;
			while (position < len) {
				enc[0] = B64.lookup[s.charAt(++position)];
				enc[1] = B64.lookup[s.charAt(++position)];
				buffer.push((enc[0] << 2) | (enc[1] >> 4));
				enc[2] = B64.lookup[s.charAt(++position)];
				if (enc[2] == 64) break;
				buffer.push(((enc[1] & 15) << 4) | (enc[2] >> 2));
				enc[3] = B64.lookup[s.charAt(++position)];
				if (enc[3] == 64) break;
				buffer.push(((enc[2] & 3) << 6) | enc[3]);
			}
			return buffer;
		}
	};

	window.ws5btoa = window.ws5btoa || B64.encode; 
	window.ws5atob = window.ws5atob || B64.decode;
	
	
})(jQuery);

//@ sourceURL=ws5util.js