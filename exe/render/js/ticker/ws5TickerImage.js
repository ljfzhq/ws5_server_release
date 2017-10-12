/*****************************************************************************
 * File:    ws5TickerImage.js
 *
 * Purpose: Convert ticker text to image, then put it into image queue.
 *          Each image width must wide than ticker zone width. We will never
 *          meet situation the text queue is empty because the ticker text
 *          loader will hold an old copy of queue, if new queue is not ready
 *          then just return old queue.
 *
 * Author:	Cavan Joe
 *
 * Created:	2013-02-19 Cavan
 *
 * Updated: 2013-02-27 Cavan Optimize the ticker image
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012-2013 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///Texture item definition
function ws5ImageItem(text, image, x, imgw)
{
	var This = this;

	//The ticker text string. It is here just for debug purpose.
	This.text = text;
	//The image of the ticker text string
	This.image = image;
	//The x coordinates when it is drawing
	This.x = x;
	//The image width
	This.imgw = imgw;

	ws5Log("Create ticker texture[" + This.text + "]");
}

///////////////////////////////////////////////////////////////////////////////
///Destructor
ws5ImageItem.prototype.Destroy = function()
{
	//Ticker texture image is destroyed.
	ws5Log("Destroy ticker texture[" + this.text + "]");
}

///////////////////////////////////////////////////////////////////////////////
///Constructor
function ws5TickerImage(tkLoader)
{
	var This = this;

	//Flag to avoid timer re-entry
	This.bLoading = false;

	//Here save Ticker Loader instance
	This.loader = tkLoader;

	//The ticker text queue fetched from ticker loader
	This.txtQueue = new Array();

	//The ticker text that has been shifted from the fetched queue but
	//has not been created for texture
	This.txtRemain = '';
	//Ticker texture queue
	This.imgQueue = new Array();

	//Ticker canvas attributes, store a copy here for convenience
	var rc = tkLoader.GetRect();
	This.width = rc.cx;
	This.height = rc.cy;

	//Create invisible canvas for creating texture
	This.canvas = $("<canvas hidden='hidden'></canvas>");
	This.canvas.attr("height", This.width + 'px');
	This.canvas.attr("height", This.height + 'px');

	//Save canvas context and initial static properties
	This.ctx = This.canvas[0].getContext('2d');
	This.ctx.globalAlpha = 1.0;
	This.ctx.fillStyle = This.loader.GetFontColor();
	This.ctx.textBaseline = "middle";
	This.ctx.font = This.loader.GetFontFaceSize();
	This.ctx.fontWeight = This.loader.GetFontWeight();

}

///////////////////////////////////////////////////////////////////////////////
///Destructor
ws5TickerImage.prototype.Destroy = function()
{
	var This = this;

	This.loader = null;
	This.txtRemain = null;
	for(var i = 0; i < This.imgQueue.length; ++i)
	{
		This.imgQueue[i].Destroy();
	}
	This.imgQueue = null;

	This.ctx = null;
	This.canvas.remove();
	This.canvas = null;

	This.txtFetchedQueue = null;

	ws5Log('ws5TickerImage is destroyed');
}

///////////////////////////////////////////////////////////////////////////////
///Get the first string in the string array; if string queue is not so much
///then tell loader to append new text string; if string queue is empty, then
///get a new text queue.
///PRIVATE
ws5TickerImage.prototype.GetNextString = function()
{
	var This = this;

	//Local text buffer
	var queue = This.txtQueue;

	//If local text buffer is not so much, then get more from ticker loader
	if(queue.length < window.tkMinStringSize)
	{
		var txtNewQueue = This.loader.GetTextQueue();
		//Pay attention "queue.concat" returns a copy, need re-assign variable
		This.txtQueue = queue = queue.concat(txtNewQueue);
	}

	if(queue.length == 0)
	{
		ws5Log("ws5TickerImage::GetNextString - Text queue in my hand is empty..., should be bug, return empty.");
		return "";
	}
	else
	{
		var strRet = queue.shift();
		return strRet;
	}
}

///////////////////////////////////////////////////////////////////////////////
///Get a qualified string for preparing texture. The condition to make texture
///1. The string is long enough to wide than at least one ticker rect width.
///2. If the string is too long, then may need to create several textures.
///PRIVATE
ws5TickerImage.prototype.GetTextureText = function()
{
	var This = this;

	//Get the correct text string,
	var ctx = This.ctx;

	//If remainder text is still long enough, then need not get new string
	var text;
	if(ctx.measureText(This.txtRemain).width > This.width)
	{
		text = This.txtRemain;
	}
	else
	{
		text = This.GetNextString();
		if(text.length == 0)
		{
			return '';
		}

		text = This.txtRemain + " " + text;
	}

	var tkWidth = ctx.measureText(text).width;
	while(tkWidth < This.width)
	{
		var newText = This.GetNextString();
		if(newText.length == 0)
		{
			This.txtRemain = text;
			return '';
		}

		text = text + " " + newText;
		tkWidth = ctx.measureText(text).width;
	}

	return text;
}

///////////////////////////////////////////////////////////////////////////////
///Split the string and just return first chunk that maximum enough for the
///ticker width.
///PRIVATE
ws5TickerImage.prototype.SplitText = function(text)
{
	//consume 3 characters every time
	var nChunkSize = 3;

	var strRet = '';

	var ctx = this.ctx;

	var nTextWidth = ctx.measureText(text).width;
	if(nTextWidth > this.width && nTextWidth < 1.2*this.width)
	{
		return text;
	}

	var chunk = '';
	while(text.length >= nChunkSize)
	{
		chunk += text.slice(0, nChunkSize);
		text = text.slice(nChunkSize);

		var tkWidth = ctx.measureText(chunk).width;

		if(tkWidth > this.width)
		{
			strRet = chunk;
			chunk = '';
			break;
		}
	}

	this.txtRemain = chunk + text;
	return strRet;
}


///////////////////////////////////////////////////////////////////////////////
///Create texture and put each into texture array
ws5TickerImage.prototype.CreateTextureQueue = function(paramThis)
{
	var This = (arguments.length == 0)?this:paramThis;

	var imgQueue = This.imgQueue = new Array();

	var ctx = This.ctx;
	var canvas = This.canvas[0];

	for(var k = imgQueue.length; k < window.tkMaxTextureSize;)
	{
		var text = This.GetTextureText();
		if(text.length == 0) break;

		text = This.SplitText(text);

		var imgWidth = ctx.measureText(text).width;
		if(imgWidth != canvas.width)
		{
			//Change canvas size will reset canvas status, so all parameter must be set again.
			canvas.width = imgWidth
			ctx.globalAlpha = 1.0;
			ctx.fillStyle = This.loader.GetFontColor();
			ctx.textBaseline = "middle";
			ctx.font = This.loader.GetFontFaceSize();
			ctx.fontWeight = This.loader.GetFontWeight();
		}

		//Begin to paint to canvas
		ctx.fillText(text, 0, canvas.height/2);

		//Save the painting to image (png)
		var imgData = canvas.toDataURL();
		var img = new Image();
		img.src = imgData;

		//Save texture
		var tkItem = new ws5ImageItem(text, img, This.width, imgWidth);
		imgQueue.push(tkItem);

		++k;
	}
	This.bLoading = false;
}

///////////////////////////////////////////////////////////////////////////////
///Create texture and put each into texture array
ws5TickerImage.prototype.GetTextureQueue = function()
{
	var This = this;

	var arRet = This.imgQueue;
	window.setTimeout(This.CreateTextureQueue, 0, This);
	return arRet;
}
