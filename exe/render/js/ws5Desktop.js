/*****************************************************************************
 * File:    ws5Desktop.js
 *
 * Purpose: 包含若干个ws5 Render播放区域，通常应该是全屏幕，用来控制是否可见，以及如何呈现等。
 *          一个desktop在这里默认为div元素。ws5Desktop包含若干个ws5RenderWindow.
 *
 * Author:	Cavan Joe
 *
 * Created:	2012-11-23 Cavan
 *
 * Updated: 2012-11-23 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///类ws5Desktop的构造函数, 该函数初始化视频区域的ID并且创建一个Desktop
function ws5Desktop(desktopItem)
{
	//产生全局唯一的ID
    var o = new ws5IDManager();
	this.strID = o.GetDesktopID();

	//产生全屏幕的桌面DIV,默认是不可见
	var screen = window.ws5ScreenTool;
	var rc = screen.getClientRect();
	var desktop = $('<div id="' + this.strID + '" class="desktopDIV"></div>');
	desktop.css({"background-color":"black", "position":"fixed", "top":"0px", "left":"0px", "display":"none"});
	desktop.css("width", rc.cx);
	desktop.css("height", rc.cy);

	//Append to body element
	var body = $("body");
	body.append(desktop);

	//Default is invisible
	this.bVisible = false;
	//保留JQuery元素
	this.div = desktop;
	//Reserve the desktop item
	this.item = desktopItem;

	//The rendering queue
	this.arRendering = new Array();
	//the preload queue
	this.arPreload = new Array();
}

///////////////////////////////////////////////////////////////////////////////
///de-constructor
ws5Desktop.prototype.Destroy = function()
{
	this.div.remove();
}

///////////////////////////////////////////////////////////////////////////////
///Return desktop window in JQuery object
ws5Desktop.prototype.GetWindow = function()
{
	return this.div;
}

///////////////////////////////////////////////////////////////////////////////
///Return desktop item. This is for time control to check when the desktop is
///going to show, hide or destroy.
ws5Desktop.prototype.GetItem = function()
{
	return this.item;
}

///////////////////////////////////////////////////////////////////////////////
///Return desktop item. This is for time control to check when the desktop is
///going to show, hide or destroy.
ws5Desktop.prototype.GetRenderingMedia = function()
{
	return this.arRendering;
}


///////////////////////////////////////////////////////////////////////////////
///Create render and preload the media window, put the render into preload
///queue.
ws5Desktop.prototype.AppendMediaItem = function(item)
{
	//If the item is a ticker, then check if there is already ticker item in
	//the desktop queue yet, just merge them.
	for(var i = 0; i < this.arRendering.length; ++i)
	{
		var render = this.arRendering[i];
		if(render.EqualTickerWidget(item))
		{
			render.ExtendDuration(item.dur);
			console.log((new Date().getTime())+' extend render to '+ render.GetItem().dur+ 'start='+render.GetItem().start);
			return;
		}
	}

	//Extend duration if a ticker render has already existent
	for(var i = 0; i < this.arPreload.length; ++i)
	{
		var render = this.arPreload[i];
		if(render.EqualTickerWidget(item))
		{
			render.ExtendDuration(item.dur);
			console.log((new Date().getTime())+' extend preload to '+ render.GetItem().dur+ 'start='+render.GetItem().start);
			return;
		}
	}

	//If it is not ticker or there is not same ticker in rendering or preloaded
	//status, then just add it.
	var render = new ws5Render(item);
	this.div.append(render.GetWindow());
	this.arPreload.push(render);
	if($("#"+this.strID + " #zone_"+item.zorder*100).length>0){
	}else{
		var zoneObj = $('<div id="zone_' + item.zorder*100 + '" class="zoneDIV"></div>');
		zoneObj.css({"position":"fixed", "display":"block"});
		zoneObj.css("left", item.left);
		zoneObj.css("top", item.top);
		zoneObj.css("width", item.width);
		zoneObj.css("height", item.height);
		zoneObj.css("z-index", item.zorder*100);
		zoneObj.css("overflow", "hidden");
		this.div.append(zoneObj);
	}
	$("#"+this.strID + " #zone_"+item.zorder*100).append(render.GetWindow());
	
	this.arPreload.sort(function(a,b){
		var item1= a.GetItem();
		var item2= b.GetItem();
		if(item1.start < item2.start)
		{
			return -1;
		}
		else
			return 1;	
	});
	
	/*if($("#"+render.ws5StrID).length>0){
		render.Stop();
	}*/
	if(item.type=="ppt" || item.type=="pdf" || item.type=="doc"){
   			var otherMediaData = {};
   			otherMediaData.path = item.localPath;
   			otherMediaData.dur = item.dur;
   			otherMediaData.start = item.start;
   			otherMediaData.type = item.type;
   			otherMediaData.autoScroll = item.autoScroll;
   			otherMediaData.zorder = item.zorder;
   			otherMediaData.name = item.name;
   			otherMediaData.id = item.id;
   			otherMediaData.lockRatio = item.lockRatio;
   			otherMediaData.shuffle = item.shuffle;
   			otherMediaData.vol = item.vol;
   			otherMediaData.te = item.te;
   			otherMediaData.width = item.widthPercent;
   			otherMediaData.height = item.heightPercent;
   			otherMediaData.left = item.leftPercent;
   			otherMediaData.top = item.topPercent;
   			//fitWidth,fitPage
   			otherMediaData.pdfZoom = "fitPage";
   			
			var jsonData = {};
			jsonData.data = otherMediaData;
			var strURL = window.ws5CONTROLLER + " /ws5/controller/playothermedia.js";
			 //var jsonData = $.parseJSON(pptData);
			 
			$.ajax(
				{
					type:   "POST",
					url:    strURL,
					data:   jsonData,
					dataType: "json",
					success: function(strResponseData)
					{
						ws5Log("ppt media send success.");
					},
					error: function(XmlHttpRequest, textStatus, errorThrow)
					{
						ws5Log("ws5Media::send ppt fail - " + JSON.stringify(errorThrow));
					}
				}
			)
			//ajax end
   }
   //end ppt, pdf, doc
}

///////////////////////////////////////////////////////////////////////////////
///Time control
///1. determine which preloaded media need to play
///2. determine which media need to stop
///3. destroy expired media
///@return
///
ws5Desktop.prototype.Process = function()
{
	var tmNow = new Date().getTime();

	var arPreload = this.arPreload;
	var arRendering = this.arRendering;

	//here we check who need to play
	//while(arPreload.length > 0)
	
	for(var i = 0; i < arPreload.length; )
	{
		//Get the first preload media render
		var render = arPreload[i];
		//Get its media item
		var item = render.GetItem();
		//Get the media start time
		var tmMO = item.start;
		//Find one media need to play

		//console.log(tmNow+"Check Playing media idx="+i+" [path=" + item.path + "] now");
		
		if(tmMO == 0 || tmMO <= tmNow)
		{
			arPreload.shift();
			for(var idx = 0; idx < arRendering.length; ++idx)
			{
				var runningRender = arRendering[idx];
				if(runningRender.EqualTickerWidget(item))
				{
					runningRender.ExtendDuration(item.dur);
					console.log((new Date().getTime())+' extend curr render to '+ runningRender.GetItem().dur+ 'start='+runningRender.GetItem().start);
					return true;
				}
			}
			
			//to time reached render, remove it from preload queue, and add it
			//to rendering queue
			arRendering.push(render);

			console.log(tmNow+" Playing media[path=" + item.path + "] now");
			//Begin to play and then immediately make it visible with user
			//defined transition effect type
			/*var vlcArr =  $(".VLC");
			ws5Log("###############vlcArr.length : " + vlcArr.length);
			for(var v=0; v<vlcArr.length; v++){
				var vlcDIV = $(vlcArr[v]).parent();
				ws5Log("### >> " + vlcDIV.attr("id"));
				//ws5Log("vlcDIV.width = " + vlcDIV.width() + (vlcDIV.width() == 0)); 
				//ws5Log("display == none : " +vlcDIV.css("display")+" , " +(vlcDIV.css("display") == "none"));
				
				if(vlcDIV.width() == 0){
						//render.Stop();
						//ws5Log("render.Stop() >>>>>>>>>>>width==0");
				}
			}*/
			render.Play();
			
			render.Show();
			//If desktop is invisible, the show it directly; if desktop is visible,
			//then show it with transition effect.
			//render.Show(!this.bVisible);
			
			continue;
		}

		//Quit the loop because preloaded media are all not reach its start time
		break;
	}

	//here we check who need to stop
	for(var i = 0; ; ++i)
	{
		if(i >= arRendering.length)
		{
			break;
		}

		while(true)
		{
			var render = arRendering[i];
			var item = render.GetItem();
			var tmEnd = parseInt(item.start, 10) + parseInt(item.dur, 10);

			if(tmEnd < tmNow)
			{
				arRendering.splice(i, 1);

				render.Pause();
				render.Hide();
				render.Destroy();
				ws5Log("Stop and destroy media[path=" + item.path + "]");

				if(i >= arRendering.length)
					break;
			}
			else
			{
				break;
			}
		}
	}
//zone Div controller，set zone DIV display=="none" when zone all children div display=="none"
	var dArr = [];
	dArr = $(".desktopDIV");
	//alert("dArr.length" + dArr.length);
	for(var d=0; d<dArr.length; d++){
		var zArr = [];
		zArr = $(dArr[d]).find('.zoneDIV');
		for(var z=0; z<zArr.length; z++){
			var rArr = [];
			var zoneDisplay = "none";
			rArr = $(zArr[z]).find('.renderDIV');
			for(var r=0; r<rArr.length; r++){
				if($(rArr[r]).css("display")!="none"){
					zoneDisplay = "block";
				}
			}
			$(zArr[z]).css("display",zoneDisplay);
		}		
	}
}


ws5Desktop.prototype.nextProcess = function() {
	if (this.nextTime) {
		clearTimeout(this.nextTime);
		delete this.nextTime;
	}
	var next= (new Date().getTime())+window.WS5RENDER;

	var arPreload = this.arPreload;
	if (arPreload && arPreload.length>0) {
		var renderItem = arPreload[0].GetItem();
		if (next> renderItem.start) {
			next = renderItem.start;
		}
	}
	
	var arRendering = this.arRendering;
	for (var idx=0; arRendering && idx<arRendering.length; idx++) {
		var renderItem = arRendering[0].GetItem();
		if (next > renderItem.start+renderItem+dur) {
			next = next > renderItem.start+renderItem+dur;
		}
	}
	
	next -= (new Date().getTime());
	next = next<=0? 1: next;
	this.nextTime = setTimeout(function(){
		window.ws5MainFrame.Process();
	}, next);
}

///////////////////////////////////////////////////////////////////////////////
///Transition Effect Function - Show the desktop
///@bNoTransitionEffect
///true     Show desktop directly, no transition effect
///false    show desktop by user defined transition effect
ws5Desktop.prototype.Show = function(bNoTransitionEffect)
{
	var teType = this.item.te;
	var teDuration = this.item.tedur;

	//if(bNoTransitionEffect == true)
	if(true)
	{
		this.EndTransition(teType);
	}
	else
	{
		var te = new ws5TransitionEffect();
		te.DoTransition(this, teType, teDuration);
	}
}

///////////////////////////////////////////////////////////////////////////////
///Transition Effect Function - Immediately hide the desktop DIV
ws5Desktop.prototype.Hide = function()
{
	this.div.css("display", "none");
	this.bVisible = false;
}

///////////////////////////////////////////////////////////////////////////////
///Transition Effect Function - Call back by Transition Effect Manager
ws5Desktop.prototype.BeginTransition = function(nType)
{
}

///////////////////////////////////////////////////////////////////////////////
///Transition Effect Function - Call back by Transition Effect Manager
ws5Desktop.prototype.EndTransition = function(nType)
{
	//this.ws5Desktop.children().css("display", "block");
	this.div.css("display", "block");
	this.ws5Visible = true;
}
