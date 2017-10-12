/*****************************************************************************
 * File:    ws5PreloadManager.js
 *
 * Purpose: ws5 Preload Manager to convert media to a live render and put to
 *          preload queue.
 *
 * Author:	Cavan Joe
 *
 * Created:	2012-01-16 Cavan
 *
 * Updated: 2013-01-16 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2013 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
function ws5PreloadManager()
{
	//The preloaded desktop window
	this.arDesktop = new Array();
	//Record the last created desktop window, all succeed media need to append
	//to the desktop
	this.lastDesktop = null;
	//The current rendering desktop, this desktop is not recorded into desktop
	//array
	this.renderingDesktop = null;
}

///////////////////////////////////////////////////////////////////////////////
ws5PreloadManager.prototype.Destroy = function()
{
	//Destroy desktop queue
	for(var i = 0; i < this.arDesktop.length; ++i)
	{
		var desktop = this.arDesktop.shift();
		desktop.Destroy();
	}

	if(this.renderingDesktop != null)
	{
		this.renderingDesktop.Destroy();
	}
}

///////////////////////////////////////////////////////////////////////////////
///Retrieve the rendering desktop, this is used by net module to report to
///server which media is rendering
ws5PreloadManager.prototype.GetRenderingDesktop = function()
{
	return this.renderingDesktop;
}

///////////////////////////////////////////////////////////////////////////////
///1. Deal with new received queue, so that start time is 0 command will
///   be processed in time.
///2. Merge the new received queue to normal queue
///@return
/// 0 means can go on next process
/// Not Zero means reset happen and need not go on
ws5PreloadManager.prototype.ProcessNewQueue = function()
{
	//Return value, default is 0
	var bReset = 0;
	//Get current system time
	var tmNow = new Date().getTime();
	//shortcut to the queue to be processed
	var mq = window.ws5NewMediaQueue;
	while(mq.length > 0)
	{
		var item = mq[0];
		if(item.start == 0)
		{
			if(item.code == "reset")
			{
				//Remove qualified item from media queue
				mq.shift();
				window.ws5MainFrame.Reset();
				bReset += 1;
			}
		}
		else
		{
			window.ws5MediaQueue = window.ws5MediaQueue.concat(window.ws5NewMediaQueue);
			window.ws5NewMediaQueue = new Array();
			break;
		}
	}

	window.ws5MediaQueue.sort(window.ws5MediaTool.Sort);
	return bReset;
}

///////////////////////////////////////////////////////////////////////////////
///1. Create those new desktop command for a invisible desktop, and put it into
///   arDesktop queue.
///2. Check media queue, pick up those need preload media and tell the last
///   desktop to preload it.
///3. Check arDesktop queue to see which desktop need to show, if find one,
///   then show the new one and destroy the old one.
///4. Trigger each live desktop in turn, so that each desktop can prepare their
///   own render.
ws5PreloadManager.prototype.ProcessNormalQueue = function()
{
	if (this.normalQtimeout) {
		clearTimeout(this.normalQtimeout);
		delete this.normalQtimeout;
	}

	var tmNow = new Date().getTime();

	var newInsert = false;
	var mq = window.ws5MediaQueue;
	//mq.sort(window.ws5MediaTool.Sort);
	while(mq.length > 0)
	{
		var item = mq[0];

		//start time is 0 means immediately, and those have to preload will be done
		if(item.start == 0 || item.start <= window.WS5PRELOAD + tmNow)
		{
			newInsert = true;
			//Remove qualified item from media queue
			mq.shift();

			if(item.otype == "cmd")
			{			
				if(item.code == "newDesktop")
				{
					var desktop = new ws5Desktop(item);

					this.arDesktop.push(desktop);
					this.lastDesktop = desktop;

					console.log((new Date().getTime())+" Create desktop[id=" + desktop.strID + "]");
				}
				else if(item.code == "other_exclude_reset_code")
				{
				}	
			}
			else if(item.otype == "media")
			{
				if (item.eventMedia && this.renderingDesktop) {
					//console.log((new Date().getTime())+' +2 render desktop, media='
					//	+ item.path
					//);
					this.renderingDesktop.AppendMediaItem(item);
				}
				else {
					try {
						this.lastDesktop.AppendMediaItem(item);
						//console.log((new Date().getTime())+' +2 last desktop, media='
						//	+ item.path
						//);
					} catch(e) {
						//console.log(e);
					}
				}
				ws5Log("Preload media[path=" + item.path + "]");
			}
		}
		else
		{
			//since the media queue has been ordered by time, so if the first one
			//does not meet the request, need not care succeed one
			console.log('ws5PreloadManager.prototype.ProcessNormalQueue'
				+ ' now='+ (window.WS5PRELOAD + tmNow)
				+' first='+item.start
				+' legth='+mq.length
			);
			
			break;
		}
	}

	//Show time reached desktop and hide destroy expired rendering desktop
	for(var i = 0; i < this.arDesktop.length; ++i)
	{
		var desktop = this.arDesktop[i];
		var item = desktop.GetItem();
		var tmDesktop = item.start;

		//start time is 0 or start time greater than now, then show it, then
		//hide and destroy the last one
		if(tmDesktop == 0 || tmDesktop <= tmNow)
		{
			//First remove the time reached desktop from preload array
			this.arDesktop.splice(i, 1);
			//Show the new desktop
			desktop.Process();
			desktop.Show(false);

			//If last desktop is validate, then destroy it.
			//Before destroy it, call "Process" another time so that render has a chance to
			//destroy itself.
			if(this.renderingDesktop != null)
			{
				ws5Log("Desktop[" + this.renderingDesktop.strID + "] destroy.");
				this.renderingDesktop.Process();
				this.renderingDesktop.Destroy();
			}

			this.renderingDesktop = desktop;
			//We found it, so we need not check others
			break;
		}
	}

	//console.log(new Date().getTime()+':ws5PreloadManager.prototype.ProcessNormalQueue');

	//Desktop timer control
	if(this.renderingDesktop)
	{
		this.renderingDesktop.Process();
	}

	for(var i = 0; i < this.arDesktop.length; ++i)
	{
		var desktop = this.arDesktop[i];
		desktop.Process();
	}		
}

///////////////////////////////////////////////////////////////////////////////
ws5PreloadManager.prototype.Process = function()
{
	//Deal with new received queue first if there is
	if(this.ProcessNewQueue() == 0)
	{
		//Deal with normal media/command queue
		this.ProcessNormalQueue();
	}

	this.wait4nextMedia(window.ws5MediaQueue);
}

ws5PreloadManager.prototype.wait4nextMedia = function(mq) {
	if (this.normalQtimeout) {
		clearTimeout(this.normalQtimeout);
		delete this.normalQtimeout;
	}
	
	mq.sort(window.ws5MediaTool.Sort);
	var sleep = mq.length>0? mq[0].start- ( new Date().getTime())-window.WS5PRELOAD
			: 1;
	var self = this;
		
	if (sleep <=0) {
		//console.log('wait4nextMedia 1');
		this.normalQtimeout = setTimeout(function(){
			window.ws5MainFrame.Process();
		}, 1);
	}
	else {
		this.normalQtimeout = setTimeout(function() {
			window.ws5MainFrame.Process();
		}, sleep);
	} 
}
