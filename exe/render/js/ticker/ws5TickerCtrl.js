/*****************************************************************************
 * File:    ws5TickerCtrl.js
 *
 * Purpose: Ticker Media Controller
 *
 * Author:	Cavan Joe
 *
 * Created:	2013-02-05 Cavan
 *
 * Updated: 2013-02-05 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///Ticker Global variables are defined here.
function ws5TickerInit()
{
	//Ticker global maximum string buffer size, used by ticker loader
	window.tkMaxStringSize = 50;
	//Ticker global minimum string buffer size, used by ticker image
	window.tkMinStringSize = 10;
	//Ticker global maximum texture buffer size
	window.tkMaxTextureSize = 2;
	//Ticker global minimum texture buffer size
	window.tkMinTextureSize = 1;
	//The time interval for a step of ticker (redraw speed)
	window.tkRedrawInterval = 10;
	//The step for each redraw
	window.tkRedrawStep = 2;
}

///////////////////////////////////////////////////////////////////////////////
///Ticker Render 构造函数
function ws5TickerRender(item)
{
	//the ticker string loader
	this.loader = new ws5TickerLoader(item);

	//The ticker texture
	this.texture = new ws5TickerImage(this.loader);
	this.texture.CreateTextureQueue();

	//The ticker painter
	this.painter = new ws5TickerPainter(this.loader, this.texture);

	//Save the canvas JQuery object
	this.mediaCtrl = this.painter.tickerDIV;

	//The ticker media item, it is an array
	this.mediaItem = item;
	//The ticker timer ID
	this.idTimer = null;
}
ws5TickerRender.prototype = new ws5RenderBase();

///////////////////////////////////////////////////////////////////////////////
///Destructor
ws5TickerRender.prototype.Destroy = function()
{
	this.loader.Destroy();
	this.loader = null;

	this.texture.Destroy();
	this.texture = null;

	this.painter.Destroy();
	this.painter = null;
}

///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5TickerRender.prototype.Play = function()
{
	var interval = window.tkRedrawInterval;
	this.idTimer = window.setInterval(this.Process, interval, this);
}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
ws5TickerRender.prototype.Pause = function()
{
	window.clearInterval(this.idTimer);
	this.idTimer = null;
}

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5TickerRender.prototype.Stop = function()
{
	this.Pause();
}

ws5TickerRender.prototype.Process = function(This)
{
	This.painter.Draw(This.painter);
}
