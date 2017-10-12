/*****************************************************************************
 * File:    ws5Media.js
 *
 * Purpose: Talk to controller for the new schedule information; Parse the
 *          string and put it into global media queue; re-order the media
 *          queue.
 *
 * Author:	Cavan Joe
 *
 * Created:	2012-11-23 Cavan
 *
 * Updated: 2013-01-16 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2013 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///Constructor
function ws5Media()
{
	//The string buffer to save controller returned schedule information
	this.strSchedule = {};
}

///////////////////////////////////////////////////////////////////////////////
ws5Media.prototype.Destroy = function()
{
	this.strSchedule = {};
}

///////////////////////////////////////////////////////////////////////////////
///Talk to controller.
///1. Heartbeat report
///2. Heartbeat response and analyze
ws5Media.prototype.ReportHeartBeat = function(bforce)
{
	ws5Log("ws5Media::ReportHeartBeat Begin to report heartbeat now");
	var media = window.ws5MediaTool;

	var strRequestData = {"restart": bforce};

	var desktop = window.ws5Preload.GetRenderingDesktop();
	if(desktop != null)
	{
		var arMedia = desktop.GetRenderingMedia().slice(0); //return a copy of array instead of array itself

		strRequestData.playlist = desktop.GetItem().path;
		strRequestData.media = [];
		for(var i = 0; i < arMedia.length; ++i)
		{
			var item = {};
			item.type = arMedia[i].GetItem().type;
			item.path = arMedia[i].GetItem().localPath;
			item.mediaId = arMedia[i].GetItem().mediaId;
			strRequestData.media.push(item);
		}
	}

	var strURL = window.ws5CONTROLLER + "/ws5/controller/client/heartbeat.js";
	$.ajax(
		{
			type:   "POST",
			url:    strURL,
			data:   strRequestData,
			dataType: "json",
			success: function(strResponseData)
			{
				ws5Log("ws5Media::ReportHeartBeat success - " + JSON.stringify(strResponseData));
				window.WS5HEARTBEAT = strResponseData.interval;
				
				if(strResponseData.registered == false)
				{
					window.ws5MainFrame.ShowWelcomePage(true);
				}
				else
				{
					window.ws5MainFrame.ShowWelcomePage(false);
					//HB tell a new schedule is available then just get it
					if(strResponseData.reload == true)
					{
						media.GetSchedule();
					}
				}
				//set timer for next net process.
				window.setTimeout(media.ReportHeartBeat, window.WS5HEARTBEAT, "false");
			},
			error: function(XmlHttpRequest, textStatus, errorThrow)
			{
				ws5Log("ws5Media::ReportHeartBeat fail - " + JSON.stringify(errorThrow));
				//set timer for next net process.
				window.setTimeout(media.ReportHeartBeat, window.WS5HEARTBEAT, "false");
			}
		}
	)
}

///////////////////////////////////////////////////////////////////////////////
///Retrieve schedule where heartbeat tell there is a new one
ws5Media.prototype.GetSchedule = function()
{
	ws5Log("ws5Media::GetSchedule Begin to get new schedule now")
	var media = window.ws5MediaTool;
	var strURL = window.ws5CONTROLLER + "/ws5/controller/client/getschedule.js";

	$.ajax(
		{
			type:   "POST",
			url:    strURL,
			data:   "Get Schedule",
			dataType: "json",
			success: function(strResponseData)
			{
				console.log(strResponseData.data);
				ws5Log(JSON.stringify(strResponseData, "", 5));
				ws5Log("ws5Media::GetSchedule::serialno = " + strResponseData.serialno);
				if(strResponseData.status == true)
				{
					media.strSchedule = strResponseData.data;
					window.ws5MainFrame.Process();
				}
			},
			error: function(XmlHttpRequest, textStatus, errorThrow)
			{
				ws5Log("ws5Media::GetSchedule fail - " + JSON.stringify(errorThrow));
			}
		}
	)
}


///////////////////////////////////////////////////////////////////////////////
///if there is no data, then trigger download, return.
///if there is data, then parse it and
///adjust each media/command item format - add "otype" and
///append the item to global media/command queue and
///sort the global media/command queue.
ws5Media.prototype.Process = function()
{
	//Retrieve this context
	var This = window.ws5MediaTool;
	var mq = window.ws5NewMediaQueue;

	//When JSON buffer is empty, then just skip
	if(jQuery.isEmptyObject(This.strSchedule) == true)
	{
		return;
	}

	//Parse the JSON string from the controller
	var Parser = JSON.parse(JSON.stringify(This.strSchedule));
	This.strSchedule = {};

	//Get operation command code array and sort it ascending
	if(Parser.op)
	{
		var arOP = Parser.op;
		//Deal with operation code array
		//add "otype" property to each item to indicate it is command.
		for(var i = 0; i < arOP.length; ++i)
		{
			var opItem = arOP[i];
			opItem.otype = "cmd";
			mq.push(opItem);
		}
	}

	//Get media array
	if(Parser.media)
	{
		This.insertMedia(Parser.media, false);

/*				
		//Convert percentage coordinates to pixel
		var screen = window.ws5ScreenTool;
		var rc = screen.getClientRect();

		//Get current system time
		var tmNow = new Date().getTime();

		//Get media array
		var arMedia = Parser.media;
		for(var i = 0; i < arMedia.length; ++i)
		{
			var mediaItem = arMedia[i];
			if(mediaItem.start + mediaItem.dur <= tmNow)
			{
				continue;
			}
			mediaItem.otype = "media";
			mediaItem.leftPercent = mediaItem.left;
			mediaItem.topPercent = mediaItem.top;
			mediaItem.widthPercent = mediaItem.width;
			mediaItem.heightPercent = mediaItem.height;
			
			mediaItem.left = Math.round(rc.cx * parseFloat(mediaItem.left)) + "px";
			mediaItem.top = Math.round(rc.cy * parseFloat(mediaItem.top)) + "px";
			mediaItem.width = Math.round(rc.cx * parseFloat(mediaItem.width)) + "px";
			mediaItem.height = Math.round(rc.cy * parseFloat(mediaItem.height)) + "px";
			mediaItem.localPath = mediaItem.path;
			mediaItem.path = mediaItem.httppath;
			mq.push(mediaItem);
		}
*/		
	}

	//mq.sort(This.Sort);
}

ws5Media.prototype.deleteMedia = function(gid) {
	var mq = window.ws5NewMediaQueue;

	for(var i = 0; i < mq.length; )
	{
		if (mq[i].gid==gid) {
			mq.splice(i, 1);
		}
		else {
			i++;
		}
	}
}

ws5Media.prototype.insertMedia = function(arMedia, sort,mediaQueue) {
	//Get current system time
	var tmNow = new Date().getTime();
	var mq = mediaQueue || window.ws5NewMediaQueue;
	var screen = window.ws5ScreenTool;
	var rc = screen.getClientRect();

	for(var i = 0; i < arMedia.length; ++i)
	{
		var mediaItem = arMedia[i];
		if(mediaItem.start + mediaItem.dur <= tmNow)
		{
			continue;
		}
		mediaItem.otype = "media";
		mediaItem.leftPercent = mediaItem.left;
		mediaItem.topPercent = mediaItem.top;
		mediaItem.widthPercent = mediaItem.width;
		mediaItem.heightPercent = mediaItem.height;
		
		mediaItem.left = Math.round(rc.cx * parseFloat(mediaItem.left)) + "px";
		mediaItem.top = Math.round(rc.cy * parseFloat(mediaItem.top)) + "px";
		mediaItem.width = Math.round(rc.cx * parseFloat(mediaItem.width)) + "px";
		mediaItem.height = Math.round(rc.cy * parseFloat(mediaItem.height)) + "px";
		mediaItem.localPath = mediaItem.path;
		mediaItem.path = mediaItem.httppath;
		mq.push(mediaItem);
	}
	
	//console.log('ws5Media.prototype.insertMedia'
	//	+ ' q len='+ mq.length
	//);
	//if (sort) {
	//	mq.sort(window.ws5MediaTool.Sort);
	//}
	window.ws5MainFrame.Process();
	
}

///////////////////////////////////////////////////////////////////////////////
///User defined sort function
///make sure each item is ordered from most recent to coming days
///Make sure the same time command in front of same time media
ws5Media.prototype.Sort = function(a, b)
{
	//when start time is the same, need make sure operation command in front of any media item.
	if(a.start == b.start)
	{
		if(a.otype != b.otype)
		{
			if(a.otype == "cmd")
			{
				return -1;
			}
			//if b.otype == "cmd" then let b in front of a.
			else
			{
				return 1;
			}
		}

		return 0;
	}
	else if(a.start < b.start)
	{
		return -1;
	}
	else
		return 1;
}


