/*****************************************************************************
 * File:    ws5TickerLoader.js
 *
 * Purpose: Load RSS ticker and prepare text ticker queue. It deals with
 *          1.Parse RSS, add title/description to the ticker text queue
 *          2.When parse RSS, if the RSS is not ready, then use last old
 *            complete rss text queue.
 *          3.Auto go on parse next ticker media item if there are many
 *          4.Provide APIs for accessing ticker media item properties
 *
 * Author:	Cavan Joe
 *
 * Created:	2013-02-18 Cavan
 *
 * Updated: 2013-02-27 Cavan    Optimize the ticker text loader
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012-2013 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///Constructor
function ws5TickerLoader(item)
{
	var This = this;

	//Here save the ticker item
	This.item = item;
	//Records the last ticker item that we have parsed early time. It is
	//an digit of "item.content[nLastTk]".
	This.nLastTk = 0;
	//Here stores the ticker text during appending
	This.txtQueue = new Array();
	//Here stores the ticker text for returning.
	This.txtLastQueue = new Array();
	//false when new text queue is not ready; true when new text queue is ready
	//and never be used.
	This.bNewContent = false;

	//Initialize the queue asynchronously
	window.setTimeout(This.CreateTextQueue, 0, This);
}

///////////////////////////////////////////////////////////////////////////////
///Destructor
ws5TickerLoader.prototype.Destroy = function()
{
	var This = this;

	This.item = null;
	This.nLastTk = null;
	This.txtQueue = null
	This.txtLastQueue = null;
	This.bNewContent = null;

	ws5Log('ws5TickerLoader is destroyed');
}

///////////////////////////////////////////////////////////////////////////////
///By the specified local path, parse the RSS xml file, then append each rss
///item into ticker text queue. Note RSS parser does not care limitation of
///text queue size, it make sure all the rss texts are appended to the queue.
ws5TickerLoader.prototype.LoadRSS = function(strURL, bRssDetail)
{
	var This = this;

	//Initialize the xml document object for later to load rss
	var xmlDoc = null;
	{
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET",strURL,false);
		xmlhttp.send(null);
		xmlDoc=xmlhttp.responseXML;
	}

	var nodes = xmlDoc.getElementsByTagName("item")
	for(var i = 0; i < nodes.length; ++i)
	{
		var text = nodes[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
		if(bRssDetail == "true")
		{
			//Some RSS may have no "description" tag.
			var nodeDescription = nodes[i].getElementsByTagName("description");
			if(nodeDescription.length > 0)
			{
				var description = nodeDescription[0].childNodes[0].nodeValue;
				text = text + ": " + description;
			}
		}
		This.txtQueue.push(text);
	}

	ws5Log("ws5TickerLoader.prototype.LoadRSS - Parse [" + strURL + "], append [" + i + "] items");
}

///////////////////////////////////////////////////////////////////////////////
///Create text ticker queue. The queue is created base on below ideas:
///1. The RSS text will be appended to queue completely. so the queue size may
///   exceed the "tkMaxStringSize" limitation.
///2. Generate text queue by going through ticker media items respectively.
///3. When use as call back, must use "this" as parameter.
ws5TickerLoader.prototype.CreateTextQueue = function(paramThis)
{
	//If there is parameter, then use parameter as "this"; otherwise just use "this"
	var This = arguments.length == 0?this:paramThis;

	if(This.bNewContent == true)
	{
		ws5Log("ws5TickerLoader::CreateTextQueue - Ticker text queue is new, need not to reload");
		return;
	}

	//Get schedule ticker media item array
	var artk = This.item.content;
	for(var i = This.nLastTk; i < artk.length;)
	{
		var tkItem = artk[i];
		if(artk[i].rsspath.length != 0)
		{
			var strPath = artk[i].rsspath;
			var bDetail = artk[i].rssdetail;
			This.LoadRSS(strPath, bDetail);
		}
		else if(artk[i].tktext.length != 0)
		{
			This.txtQueue.push(artk[i].tktext);
		}
		else
		{
			ws5Log("ws5TickerLoader::CreateTextQueue - Invalid ticker item detected, neither RSS nor text, just delete it from ticker item queue.");
			artk.splice(i, 1);
			continue;
		}

		//If the ticker text has reached limitation, then just stop
		if(This.txtQueue.length >= window.tkMaxStringSize)
		{
			//Record next need to parse ticker item
			This.nLastTk = i + 1;
			//If the index is exceed or equal ticker item account, then just rewind to 0.
			if(This.nLastTk >= artk.length)
			{
				This.nLastTk = 0;
			}

			//Mark new content is ready
			This.bNewContent = true;
			return;
		}

		//If after go through all ticker media item, the buffer is still not full, then just rewind to go
		//through all ticker media item again. Use "-1" is because "for" loop has ++ operation, so it really
		//begins at 0.
		if(i++ == artk.length)
		{
			i = 0;
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
///Export the ticker text array, if new text queue is ready, then use the new
///text queue; otherwise just reuse the last queue.
///PUBLIC
ws5TickerLoader.prototype.GetTextQueue = function()
{
	var This = this;

	//When get queue, if new content is ready, then save new content and return
	//it and reset loading queue.
	if(This.bNewContent == true)
	{
		This.txtLastQueue = this.txtQueue;
		This.txtQueue = new Array();
		This.bNewContent = false;
		//Reload the text queue asynchronously in case "Draw" is blocked
		window.setTimeout(This.CreateTextQueue, 0, This);
	}

	//Return a copy of text ticker queue
	var arRet = This.txtLastQueue.concat();
	return arRet;
}

///////////////////////////////////////////////////////////////////////////////
///Get Ticker font color
///PUBLIC
ws5TickerLoader.prototype.GetFontColor = function()
{
	return this.item.tkcolor;
}

///////////////////////////////////////////////////////////////////////////////
///Get Ticker background color
///PUBLIC
ws5TickerLoader.prototype.GetBkColor = function()
{
	return this.item.tkbkcolor;
}

///////////////////////////////////////////////////////////////////////////////
///Get Ticker background transparent alpha float value
///PUBLIC
ws5TickerLoader.prototype.GetAlpha = function()
{
	return this.item.tkbkalpha;
}

///////////////////////////////////////////////////////////////////////////////
///Get Ticker font face name and size
///PUBLIC
ws5TickerLoader.prototype.GetFontFaceSize = function()
{
	var strRet = this.item.tksize + ' ' + this.item.tkface;
	return strRet;
}

///////////////////////////////////////////////////////////////////////////////
///Get Ticker background color
///PUBLIC
ws5TickerLoader.prototype.GetFontWeight = function()
{
	return this.item.tkweight;
}

///////////////////////////////////////////////////////////////////////////////
///Get ticker rectangle without unit
///PUBLIC
ws5TickerLoader.prototype.GetRect = function()
{
	//this is because the value has "px" units, we must remove it
	var left = parseInt(this.item.left, 10);
	var top = parseInt(this.item.top, 10);
	var width = parseInt(this.item.width, 10);
	var height = parseInt(this.item.height, 10);

	var r = new ws5Rect(left, top, width, height);
	return r;
}