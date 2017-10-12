/*****************************************************************************
 * File:    ws5TickerPainter.js
 *
 * Purpose: Consume texture from the queue, paint the texture to the canvas
 *
 * Author:	Cavan Joe
 *
 * Created:	2013-02-22 Cavan
 *
 * Updated: 2013-02-22 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012-2013 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///Constructor
function ws5TickerPainter(tkLoader, tkTexture)
{
	//Here save Ticker Loader instance
	this.loader = tkLoader;
	//Here save Ticker Texture instance
	this.texture = tkTexture;

	//The texture that will be rendering
	this.arTexture = new Array();
	//The textures are rendering
	this.arRendering = new Array();

	//Ticker canvas attributes
	var rc = tkLoader.GetRect();
	this.width = rc.cx;
	this.height = rc.cy;
	this.bkColor = ws5ToRGBA(tkLoader.GetBkColor(), tkLoader.GetAlpha());

	//Create ticker canvas with specified width/height
	var tickerDIV = $("<div></div>");
	tickerDIV.css("position", "fixed");
	tickerDIV.css("left", rc.x + 'px');
	tickerDIV.css("top", rc.y + 'px');
	tickerDIV.css("width", rc.cx + 'px');
	tickerDIV.css("height", rc.cy + 'px');
	tickerDIV.css("background-color", this.bkColor)
	this.tickerDIV = tickerDIV;

	//Create and add the canvas is visible
	this.canvasRendering = $("<canvas></canvas>");
	this.canvasRendering.attr("width", rc.cx + "px");
	this.canvasRendering.attr("height", rc.cy + "px");
	this.canvasRendering.appendTo(tickerDIV);
	//Create and add the canvas invisible for drawing at background
	this.canvasDrawing = $("<canvas></canvas>");
	this.canvasDrawing.attr("width", rc.cx + "px");
	this.canvasDrawing.attr("height", rc.cy + "px");
	this.canvasDrawing.attr("hidden", "hidden");
	this.canvasDrawing.appendTo(tickerDIV);
}

///////////////////////////////////////////////////////////////////////////////
///Destructor
ws5TickerPainter.prototype.Destroy = function()
{
	this.loader = null;
	this.texture = null;
	this.arTexture = null;
	this.arRendering = null;
	this.width = this.height = null;
	this.bkColor = null;
	this.mediaCtrl = null;
	this.canvasRendering = this.canvasDrawing = null;

	ws5Log("ws5TickerPainter is destroyed");
}

///////////////////////////////////////////////////////////////////////////////
///
ws5TickerPainter.prototype.Flip = function()
{
	//swap draw/render canvas
	var rendering = this.canvasDrawing;
	this.canvasDrawing = this.canvasRendering;
	this.canvasRendering = rendering;

	//flip
	this.canvasRendering.removeAttr("hidden");
	this.canvasDrawing.attr("hidden", "hidden");
}

///////////////////////////////////////////////////////////////////////////////
///
ws5TickerPainter.prototype.Draw = function(This)
{
	var arRendering = This.arRendering;
	var arTexture = This.arTexture;

	if(arRendering.length  == 0 && arTexture.length == 0)
	{
		var arNewTexture = This.texture.GetTextureQueue();
		for(var i = 0; i < arNewTexture.length; ++i)
		{
			arTexture.push(arNewTexture[i]);
		}
		ws5Log("ws5TickerPainter - Draw: Initial " + arNewTexture.length + " new texture to the waiting queue");
		return;
	}

	if(arRendering.length > 0)
	{
		var expiredTexture = arRendering[0];
		if(expiredTexture.x + expiredTexture.imgw <= 0)
		{
			expiredTexture = arRendering.shift();
			expiredTexture.Destroy();
		}
	}

	if(arRendering.length == 0)
	{
		var newTexture = arTexture.shift();
		arRendering.push(newTexture);
	}

	if(arRendering.length > 0)
	{
		var nLast = arRendering.length - 1;
		var lastTexture = arRendering[nLast];

		if(lastTexture.x + lastTexture.imgw <= This.width)
		{
			var newItem = arTexture.shift();
			newItem.x = lastTexture.x + lastTexture.imgw;
			arRendering.push(newItem);
		}
	}

	if(arTexture.length < window.tkMinTextureSize)
	{
		var arNewTexture = This.texture.GetTextureQueue();
		for(var i = 0; i < arNewTexture.length; ++i)
		{
			arTexture.push(arNewTexture[i]);
		}
		ws5Log("ws5TickerPainter - Draw: Add " + arNewTexture.length + " new texture to the waiting queue");
	}

	//Begin to paint to canvas
	var ctx = This.canvasDrawing[0].getContext("2d");
	ctx.clearRect(0, 0, This.width, This.height);

	for(var i = 0; i < arRendering.length; ++i)
	{
		var drawTexture = arRendering[i];
		ctx.drawImage(drawTexture.image, drawTexture.x, 0);
		drawTexture.x -= window.tkRedrawStep;
	}

	This.Flip();
}