/*****************************************************************************
 * File:    ws5Render.js
 *
 * Purpose: Render expose APIs to control its play/pause/mute...
 *
 * Author:	Cavan Joe
 *
 * Created:	2012-11-22 Cavan
 *
 * Updated: 2012-11-22 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///Template Render Control 构造函数
function ws5RenderBase()
{
	//Save the render JQuery object
	this.mediaCtrl = null;
}

///////////////////////////////////////////////////////////////////////////////
///析构函数
ws5RenderBase.prototype.Destroy = function()
{
	this.mediaCtrl = null;
}

///////////////////////////////////////////////////////////////////////////////
///获取JQuery video 标记控件
ws5RenderBase.prototype.GetControl = function()
{
	return this.mediaCtrl;
}

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5RenderBase.prototype.Play = function()
{}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
ws5RenderBase.prototype.Pause = function()
{}

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5RenderBase.prototype.Stop = function()
{}

///////////////////////////////////////////////////////////////////////////////
///设置播放器的音量
///@param[in] nVol
///音量的大小,有效范围为0.0~1.0
ws5RenderBase.prototype.SetVolume = function(fVol)
{}

///////////////////////////////////////////////////////////////////////////////
///Video Render 构造函数
function ws5VideoRender(item)
{
	//创建一个video元素,默认preload="auto"
	//auto - 当页面加载后载入整个视频
	//meta - 当页面加载后只载入元数据
	//none - 当页面加载后不载入视频
	var video = $('<video class="ws5media" preload="auto"></video>');

	//设置movie属性
	var dateNum = new Date();
	video.attr("src", item.path+"&random="+dateNum.getTime());
	video.attr("loop", item.loop);
	video.attr("width", item.width);
	video.attr("height", item.height);
	//设置Dom属性
	video.get(0).volume = item.vol;

	//Save the render DOM
	this.mediaCtrl = video;
	this.item = item;
}
ws5VideoRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5VideoRender.prototype.Play = function()
{
	var video = this.mediaCtrl;
	var item = this.item;
	//
	var fRenderRatio = parseFloat(item.width)/parseFloat(item.height);
	var fVideoRatio = video.get(0).videoWidth/video.get(0).videoHeight;
	ws5Log("fRenderRatio = " + fRenderRatio + " fVideoRatio = " + fVideoRatio);
	if(fRenderRatio < fVideoRatio)
	{
		video.css('-webkit-transform','scaleY(' + fVideoRatio/fRenderRatio  + ')')
	}
	else if(fRenderRatio > fVideoRatio)
	{
		video.css('-webkit-transform','scaleX(' +  fRenderRatio/fVideoRatio  + ')')
	}

    this.mediaCtrl.get(0).play();
}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
ws5VideoRender.prototype.Pause = function()
{
    this.mediaCtrl.get(0).pause();
}

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5VideoRender.prototype.Stop = function()
{
    this.mediaCtrl.get(0).pause();
    this.mediaCtrl.get(0).currentTime = 0;
}

///////////////////////////////////////////////////////////////////////////////
///设置播放器的音量
///@param[in] nVol
///音量的大小,有效范围为0.0~1.0
ws5VideoRender.prototype.SetVolume = function(fVol)
{
    this.mediaCtrl.get(0).volume = fVol;
}
///////////////////////////////////////////////////////////////////////////////
///url Render 构造函数
function ws5UrlRender(item)
{
	var url = $("<iframe class='ws5media' ></iframe>");
	url.attr("width", item.width);
	url.attr("height", item.height);
	url.attr("overflow", "hidden");
	url.attr("frameborder", "0");
	url.attr("scrolling", "no");
	url.attr("src","");
	
	this.mediaCtrl = url;
	this.item = item;
	ws5UrlPathLoader(item,url);
}
function ws5UrlPathLoader(item,urlObj){
	$.getJSON(item.httppath, function(data){
		urlObj.attr("src", data.url);
		$("#"+item.rID).html(urlObj);
	});
}
ws5UrlRender.prototype = new ws5RenderBase();



///////////////////////////////////////////////////////////////////////////////
///Video Stream Render 构造函数
function ws5VideoStreamRender(item)
{
	
	var video = $('<embed  id="vlc" class="VLC ws5media"  toolbar = "no" branding = "no" type="application/x-vlc-plugin" pluginspage="http://www.videolan.org" version="VideoLAN.VLCPlugin.2"></embed>');

	//设置movie属性
	video.attr("autostart", "true");
	video.attr("src", "");
	video.attr("loop", item.loop);
	video.attr("width", item.width);
	video.attr("height", item.height);
	//设置Dom属性
	video.get(0).volume = item.vol;

	//Save the render DOM
	this.mediaCtrl = video;
	this.item = item;
	var srcPathArr = item.path.split("?");
	var srcPath = srcPathArr[0];
	if(item.playType == "otherVideo"){
		video.attr("src", "file:///"+item.localPath);
		$("#"+item.rID).html(video);
	}else{
		ws5StreamPathLoader(item,video);	
	}
}
function ws5StreamPathLoader(item,video){
	$.getJSON(item.path, function(data){
		video.attr("src", data.encodedURL);
		$("#"+item.rID).html(video);
	});
}
ws5VideoStreamRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5VideoStreamRender.prototype.Play = function()
{
	//var video = this.mediaCtrl;
	//var item = this.item;
	//
	//var fRenderRatio = parseFloat(item.width)/parseFloat(item.height);
	//var fVideoRatio = video.get(0).videoWidth/video.get(0).videoHeight;
	//ws5Log("fRenderRatio = " + fRenderRatio + " fVideoRatio = " + fVideoRatio);
	//if(fRenderRatio < fVideoRatio)
	//{
	//	video.css('-webkit-transform','scaleY(' + fVideoRatio/fRenderRatio  + ')')
	//}
	//else if(fRenderRatio > fVideoRatio)
	//{
	//	video.css('-webkit-transform','scaleX(' +  fRenderRatio/fVideoRatio  + ')')
	//}


    //var vlc = this.mediaCtrl.get(0);
    //vlc.playlist.play();
}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
ws5VideoStreamRender.prototype.Pause = function()
{
   // this.mediaCtrl.get(0).playlist.pause();
}

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5VideoStreamRender.prototype.Stop = function()
{
   //	this.mediaCtrl.get(0).playlist.stop();
  //  this.mediaCtrl.get(0).input.time = 0;
}

///////////////////////////////////////////////////////////////////////////////
///设置播放器的音量
///@param[in] nVol
///音量的大小,有效范围为0.0~1.0
ws5VideoStreamRender.prototype.SetVolume = function(fVol)
{
    this.mediaCtrl.get(0).audio.volume = fVol*200;
}
//Flash Render
///////////////////////////////////////////////////////////////////////////////
///Flash Render 构造函数
function ws5FlashRender(item)
{
	var src = '<embed class="ws5media" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash"></embed>';
	var flash = $(src);
	flash.attr("autostart", "false");
	flash.attr("loop", "true");
	flash.attr("quality", "high");
	flash.attr("width", item.width);
	flash.attr("height", item.height);
	flash.attr("src", item.path);

	this.mediaCtrl = flash;
	this.SetVolume(item.fVol);
}
ws5FlashRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5FlashRender.prototype.Play = function()
{
	this.mediaCtrl.attr("autostart", "true");
}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
ws5FlashRender.prototype.Pause = function()
{
	this.mediaCtrl.attr("autostart", "false");
}

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5FlashRender.prototype.Stop = function()
{
	this.mediaCtrl.attr("autostart", "false");
}

///////////////////////////////////////////////////////////////////////////////
///设置播放器的音量
///@param[in] nVol
///音量的大小,有效范围为0.0~1.0
ws5FlashRender.prototype.SetVolume = function(fVol)
{
	this.mediaCtrl.get(0).volume = Math.round(fVol * 100);
}
///////////////////////////////////////////////////////////////////////////////
///unknow media Render 构造函数
function ws5UnknowMediaRender()
{
	//Create image JQuery Element
	var image = $("<image class='ws5media' src=''></image>");
	image.attr("width", "0");
	image.attr("height", "0");
	image.addClass("eventZone"+item.eventZoneId);
	
	//Save the render JQuery Object
	this.mediaCtrl = image;
}
ws5UnknowMediaRender.prototype = new ws5RenderBase();
///////////////////////////////////////////////////////////////////////////////
///PPT Render 构造函数
function ws5PptRender(item)
{
	//Create ppt JQuery Element
	var ppt = $("<div class='ws5media' ></div>");
	ppt.addClass("eventZone"+item.eventZoneId);
	//Save the render JQuery Object
	this.mediaCtrl = ppt;
}
ws5PptRender.prototype = new ws5RenderBase();
///////////////////////////////////////////////////////////////////////////////
///PPT Render 构造函数
function ws5PdfRender(item)
{
	//Create ppt JQuery Element
	var pdf = $("<div class='ws5media' ></div>");
	pdf.addClass("eventZone"+item.eventZoneId);
	//Save the render JQuery Object
	this.mediaCtrl = pdf;
}
ws5PdfRender.prototype = new ws5RenderBase();
///////////////////////////////////////////////////////////////////////////////
///PPT Render 构造函数
function ws5DocRender(item)
{
	//Create ppt JQuery Element
	var doc = $("<div class='ws5media' ></div>");
	doc.addClass("eventZone"+item.eventZoneId);
	
	//Save the render JQuery Object
	this.mediaCtrl = doc;
}
ws5DocRender.prototype = new ws5RenderBase();
///////////////////////////////////////////////////////////////////////////////
///Image Render 构造函数
function ws5ImageRender(item)
{
	//Create image JQuery Element
	var image = $("<image class='ws5media' src='" + item.path + "'></image>");
	//image.attr("src", item.path);
	image.attr("width", item.width);
	image.attr("height", item.height);
	image.addClass("eventZone"+item.eventZoneId);

	//Show the image
	//var context = canvas[0].getContext("2d");
	//context.drawImage(image, 0, 0);

	//Save the render JQuery Object
	this.mediaCtrl = image;
}
ws5ImageRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///Html Render 构造函数
function ws5HtmlRender(item)
{
	this.prototype = new ws5RenderBase();

	var src = '<iframe class="ws5media" frameborder="0" scrolling="no" marginwidth="0" marginheight="0"></iframe>';

	//Use Flash player to show FLash
	var html = $(src);
	html.attr("width", item.width);
	html.attr("height", item.height);
	html.attr("src", item.path);
	html.addClass("eventZone"+item.eventZoneId);
	
	//Save the render JQuery Object
	this.mediaCtrl = html;
}
ws5HtmlRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///Widget Render 构造函数
function ws5WidgetRender(item)
{
	//Create widget JQuery Element
	var widget = $("<div class='ws5media'></div>");
	widget.attr("width", item.width);
	widget.attr("height", item.height);
	widget.css("width", item.width);
	widget.css("height", item.height);	
	widget.attr("overflow", "hidden");
	widget.addClass("eventZone"+item.eventZoneId);

	//tell widget its working path
	var nLastSlash = item.path.lastIndexOf("/") + 1;
	var strWidgetPath = "";
	var strWidgetEntry = "";	
	if(window.location.href.indexOf("/mdshell.html") > 0)
	{
		strWidgetPath = item.path.substring(0, nLastSlash - 1);		
	}else
	{
		var encodeUrl = encodeURIComponent(item.path.substring(nLastSlash));
		strWidgetPath = item.path.substring(0, nLastSlash) + '.' + encodeUrl + '.files';		
	}
	strWidgetEntry = strWidgetPath + '/index.htm';

	var widgetOption = {};
	widgetOption['baseDir'] = strWidgetPath;
	var ws5id= new Date().getTime()+'_'+Math.floor(Math.random()*1000000);
	widget.attr('ws5id', ws5id);
	
	//widget.data('ws5opt', widgetOption);
	//window.ws5.contextTag = widget;
	widget.load(strWidgetEntry, 
		function(){
			widget.find('.ws5mediaRoot').trigger('ws5mediaLoaded', 
				{	baseDir:strWidgetPath,
					ws5id: ws5id
				});
		}
	);

	//Save the render JQuery Object
	this.mediaCtrl = widget;
}
ws5WidgetRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5WidgetRender.prototype.Play = function()
{
	this.mediaCtrl.trigger("ws5play");
}

///////////////////////////////////////////////////////////////////////////////
///Audio Render 构造函数
function ws5AudioRender(item)
{
	//创建一个audio元素,默认preload="auto"
	//auto - 当页面加载后载入整个视频
	//meta - 当页面加载后只载入元数据
	//none - 当页面加载后不载入视频
	var audio = $('<audio class="ws5media" preload="auto"></audio>');

	//设置audio其它属性
	audio.attr("src", item.path);
	audio.attr("loop", item.loop);
	audio.attr("width", item.width);
	audio.attr("height", item.height);
	audio.addClass("eventZone"+item.eventZoneId);

	//设置DOM属性
	audio[0].volume = item.vol;

	//Save the render DOM
	this.mediaCtrl = audio;
	this.item = item;
}
ws5AudioRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5AudioRender.prototype.Play = function()
{
	this.mediaCtrl.get(0).play();
}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
ws5AudioRender.prototype.Pause = function()
{
	this.mediaCtrl.get(0).pause();
}

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5AudioRender.prototype.Stop = function()
{
	this.mediaCtrl.get(0).pause();
	this.mediaCtrl.get(0).currentTime = 0;
}

///////////////////////////////////////////////////////////////////////////////
///设置播放器的音量
///@param[in] nVol
///音量的大小,有效范围为0.0~1.0
ws5AudioRender.prototype.SetVolume = function(fVol)
{
	this.mediaCtrl.get(0).volume = fVol;
}


