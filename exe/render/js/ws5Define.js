/*****************************************************************************
 * File:    ws5Define.js
 *
 * Purpose: ws5 Project generate definition javascript file
 *
 * Author:	Cavan Joe
 *
 * Created:	2012-11-21 Cavan
 *
 * Updated: 2012-11-21 Cavan
 *          2012-02-18 Cavan Add "netProcess" function
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
function ws5Log(strMsg)
{
	return;
	console.log("[" + new Date().toLocaleTimeString() + "]" + strMsg);
}

///////////////////////////////////////////////////////////////////////////////
///全局初始化函数，此函数依赖JQuery
function ws5Init()
{
	return;

    $.getScript("js/ws5Common.js", function(response, status)
    {
        ws5Log("Load ws5Common.js result is - " + status);
    });

	$.getScript("js/ws5Media.js", function(response, status)
	{
		ws5Log("Load ws5Media.js result is - " + status);
	});

	$.getScript("js/ws5IDManager.js", function(response, status)
	{
		ws5Log("Load ws5IDManager.js result is - " + status);
	});

    $.getScript("js/ws5Desktop.js", function(response, status)
    {
	    ws5Log("Load ws5Desktop.js result is - " + status);
    });

    $.getScript("js/ws5TransitionEffect.js", function(response, status)
    {
	    ws5Log("Load ws5TransitionEffect.js result is - " + status);
    });

	$.getScript("js/ws5RenderCtrl.js", function(response, status)
	{
		ws5Log("Load ws5RenderCtrl.js result is - " + status);
	});

    $.getScript("js/ws5Render.js", function(response, status)
    {
	    ws5Log("Load ws5Render.js result is - " + status);
    });

	$.getScript("js/ws5PreloadManager.js", function(response, status)
	{
		ws5Log("Load ws5PreloadManager.js result is - " + status);
	});

	$.getScript("js/ticker/ws5TickerLoader.js", function(response, status)
	{
		ws5Log("Load js/ticker/ws5TickerLoader.js result is - " + status);
	});

	$.getScript("js/ticker/ws5TickerImage.js", function(response, status)
	{
		ws5Log("Load js/ticker/ws5TickerImage.js result is - " + status);
	});

	$.getScript("js/ticker/ws5TickerPainter.js", function(response, status)
	{
		ws5Log("Load js/ticker/ws5TickerPainter.js result is - " + status);
	});

	$.getScript("js/ticker/ws5TickerCtrl.js", function(response, status)
	{
		ws5Log("Load js/ticker/ws5TickerCtrl.js result is - " + status);
	});

	$.getScript("js/ws5eventZoneRenderCtrl.js", function(response, status)
	{
		ws5Log("Load js/ws5eventZoneRenderCtrl.js result is - " + status);
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function ws5Main()
{
//Public
	window.ws5 = new Object;
	//Preload media in advance, default 10s.
	window.WS5PRELOAD = 10000;
	//Render timer internal, default 500ms.
	window.WS5RENDER = 7000;//500;
	//Heart beat timer interval, default is 10s
	window.WS5HEARTBEAT = 10000;
	//The controller Web Address
	window.ws5CONTROLLER = "";
	//Global ws5Main instance for usage at other places
	window.ws5MainFrame = this;
	//Global screen manipulation instance
	window.ws5ScreenTool = new ws5Screen();
	//Global media parser
	window.ws5MediaTool = new ws5Media();
	//Global normal media/command queue
	window.ws5MediaQueue = new Array();
	//Global just received media/command queue
	window.ws5NewMediaQueue = new Array();
	//Global preload manager who manipulate desktop on when to play/hide/destroy
	window.ws5Preload = new ws5PreloadManager();

//Private
	this.m_bWelcomePage = false;

//Initialize

	//enter full screen mode
	window.ws5ScreenTool.setFullScreen(true);

	//Set global ticker working environment
	ws5TickerInit();

	//Start net process and render process
	window.setTimeout(this.netProcess, 0);
	var self = this;
	window.setTimeout(function(){
		self.Process();
		self.processTimer = setInterval(function(){
			self.Process();
		},window.WS5RENDER);
	}, 1);
}
///////////////////////////////////////////////////////////////////////////////
///Show or hide welcome message
ws5Main.prototype.ShowWelcomePage = function(bOn)
{
	var body = $("body");

	if(bOn != this.m_bWelcomePage)
	{
		if(bOn == true)
		{
			//Show welcome page
			var welcome = $('<div id="welcome"><div>');
			welcome.load("/playerWelcome.htm");
			body.append(welcome);
		}
		else
		{
			var welcome = $('#welcome');
			welcome.remove();
		}

		this.m_bWelcomePage = bOn;
	}
}

///////////////////////////////////////////////////////////////////////////////
///Reset Player
ws5Main.prototype.Reset = function()
{
	ws5Log("Player is reset now.");

	window.ws5Preload.Destroy();
	window.ws5MediaTool.Destroy();
	window.ws5MediaQueue = window.ws5NewMediaQueue;
	window.ws5NewMediaQueue = new Array();

	window.ws5MediaTool = new ws5Media();
	window.ws5Preload = new ws5PreloadManager();
}

///////////////////////////////////////////////////////////////////////////////
///Render-Controller通讯时控主入口函数
ws5Main.prototype.netProcess = function()
{
	window.ws5MediaTool.ReportHeartBeat("true");
}

///////////////////////////////////////////////////////////////////////////////
///Render时控主入口函数
ws5Main.prototype.Process = function()
{
	//To get new data from controller, parse new data, add to media queue.
	window.ws5MediaTool.Process();
	//To preload media/desktop
	window.ws5Preload.Process();
	
	//Set a timer for next process
	//window.setTimeout(function(){
	//	window.ws5MainFrame.Process();
	//}, window.WS5RENDER); // even it's 7000, it's back very quick
}

//A new cosmos really starts from here, big bang ...
$(document).ready(function()
{
	ws5Init();
	setTimeout("new ws5Main();", 1000);
});
