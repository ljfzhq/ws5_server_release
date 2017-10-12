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
///构造函数
function ws5Render(item)
{
	//Create exclusive render ID
	this.ws5StrID = new ws5IDManager().GetRenderID();
	this.zorder = item.zorder*100;
	var wnd = $('<div id="' + this.ws5StrID + '" class="renderDIV"></div>');
	wnd.attr("te",item.te);
	wnd.css({"position":"fixed", "display":"none"});
	wnd.css("left", item.left);
	wnd.css("top", item.top);
	wnd.css("width", item.width);
	wnd.css("height", item.height);
	wnd.css("z-index", item.zorder*100);
	wnd.addClass(item.uid);
	
	item.rID = this.ws5StrID;

	//console.log(new Date().getTime()+':ws5Render '+ item.type +' '+item.path);
	
	//Create render control
	var render = null;
	switch (item.type){
		case "video" :
			var fileExtArr =/\.[^\.]+/.exec(item.path);
			var arr = fileExtArr[0].split("?");
			var fileExt = arr[0].toLowerCase();
			if (fileExt==".mp4"){
				render = new ws5VideoRender(item);	
			}else{
				item.playType = "otherVideo";
				render = new ws5VideoStreamRender(item);
			}
			break;
		case "stream":
			render = new ws5VideoStreamRender(item);
			break;
		case "audio":
			render = new ws5AudioRender(item);
			break;
		case "image":
			render = new ws5ImageRender(item);
			break;
		case "widget":
			render = new ws5WidgetRender(item);
			break;
		case "flash":
			render = new ws5FlashRender(item);
			break;
		case "html":
			render = new ws5HtmlRender(item);
			break;
		case "ticker":
			render = new ws5TickerRender(item);
			break;
		case "link":
			render = new ws5UrlRender(item);
			break;
		case "ppt":
			render = new ws5PptRender(item);
			break;
		case "pdf":
			render = new ws5PdfRender(item);
			break;
		case "doc":
			render = new ws5DocRender(item);
			break;
		case "inlineEventZoneWidget":
			render = new ws5eventZoneRender(item);
			break;
		default:
			render = new ws5UnknowMediaRender(item);
	}

	//Append the video to the DIV
	wnd.append(render.GetControl());

	//Save the render DOM
	this.div = wnd;
	this.render = render;
	this.mediaItem = item;
}


///////////////////////////////////////////////////////////////////////////////
///析构函数
ws5Render.prototype.Destroy = function()
{
	//Give a chance to render to destroy itself.
	this.render.Destroy();
	//Directly remove DIV, this will auto remove its children as well.
	var renderTotal = $("#zone_"+this.zorder).children("div").length;
	if(renderTotal>3){
		$("#zone_"+this.zorder+" div:first-child").remove();
		$("#zone_"+this.zorder+" div:first-child").css("z-index",this.zorder);
		//this.div.remove();
	}
	if($(this.div).attr("te_runing") == "true"){
		$(this.div).css("display","block");
	}
}

///////////////////////////////////////////////////////////////////////////////
///Retrive the media item instance
ws5Render.prototype.GetItem = function()
{
	return this.mediaItem;
}

///////////////////////////////////////////////////////////////////////////////
///Check if the two media item is the same
///@param [in] anotherItem
/// One another media item
ws5Render.prototype.EqualTickerWidget = function(anotherItem)
{
	var itemA = this.mediaItem;
	var itemB = anotherItem;
	//Only merge ticker
	if(itemA.type != itemA.type || 
		(itemA.type != "widget" && itemA.type != "inlineEventZoneWidget"))
	{
		return false;
	}

	//Check if ticker zone attributes are different
	if((itemA.left != itemB.left) ||
		(itemA.top != itemB.top) ||
		(itemA.width != itemB.width) ||
		(itemA.height != itemB.height) ||
		(itemA.zorder != itemB.zorder) ||
		(itemA.path != itemB.path) ||
		(itemA.httppath != itemB.httppath))
	{
		ws5Log("Append not-merged widget to desktop - widget zone attribute does not match.");
		return false;
	}

	return true;
}

///////////////////////////////////////////////////////////////////////////////
///Extend current render duration by specified seconds
///@param [in] nSeconds
/// How long need to be extended
ws5Render.prototype.ExtendDuration = function(nSeconds)
{
	var itemA = this.mediaItem;
	itemA.dur += nSeconds;
}

///////////////////////////////////////////////////////////////////////////////
///获取JQuery render div 标记控件
ws5Render.prototype.GetWindow = function()
{
	return this.div;
}

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5Render.prototype.Play = function()
{
    this.render.Play();
}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
ws5Render.prototype.Pause = function()
{
    this.render.Pause();
}

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5Render.prototype.Stop = function()
{
    this.render.Stop();
}

///////////////////////////////////////////////////////////////////////////////
///设置播放器的音量
///@param[in] nVol
///音量的大小,有效范围为0.0~1.0
ws5Render.prototype.SetVolume = function(fVol)
{
    this.render.SetVolume(fVol);
}

///////////////////////////////////////////////////////////////////////////////
///Show the Render Window
///@bNoTransitionEffect
///true     直接进场;
//false     进场的时候使用指定的效果
//ws5Render.prototype.Show = function(bNoTransitionEffect)
ws5Render.prototype.Show = function()
{
	var item = this.mediaItem;

	//if(bNoTransitionEffect == true)
	//if(item.te != "")
	//{
		//this.EndTransition(item.te);
	//}
	//else
	//{
		var te = new ws5TransitionEffect();
		te.DoTransition(this, item.te, item.tedur);
	//}
}

///////////////////////////////////////////////////////////////////////////////
///Hide the desktop
ws5Render.prototype.Hide = function()
{
	this.div.css("display", "none");
}

///////////////////////////////////////////////////////////////////////////////
///Call back function for transition effect manager
ws5Render.prototype.BeginTransition = function(nType)
{
}

///////////////////////////////////////////////////////////////////////////////
///Call back function for transition effect manager
ws5Render.prototype.EndTransition = function(nType)
{
	this.div.css("display", "block");
}