
///Event Zone Render 构造函数
function ws5eventZoneRender(item)
{
	this.uid = Math.random().toString();
	this.uid = (new Date()).getTime()+'_'+ this.uid.substr(2);
	var src = '<div class="ws5eventZoneRender"></div>';
	var eventWidget = $(src);
	eventWidget.attr("autostart", "false");
	eventWidget.attr('id', this.uid);
	eventWidget.attr("loop", "true");
	eventWidget.attr("quality", "high");
	eventWidget.attr("width", item.width);
	eventWidget.attr("height", item.height);
	eventWidget.attr("src", item.path);
	eventWidget.addClass("eventZone"+item.eventZoneId);

	this.mediaCtrl = eventWidget;	
	this.item = $.extend({}, item);
	this.item.uid = this.uid;
	this.eventData = item.inlineData;
	var thisRender = this;
	
	this.parseMedia = function() {
		if (this.eventData.triggers.startEvents &&
				! (this.eventData.triggers.startEvents instanceof Array)) {
			this.eventData.triggers.startEvents = 
					this.eventData.triggers.startEvents.split(' ');
		}
	
		if (this.eventData.triggers.stopEvents &&
				! (this.eventData.triggers.stopEvents instanceof Array)) {
			this.eventData.triggers.stopEvents = 
					this.eventData.triggers.stopEvents.split(' ');
		}

		this.media = [];
		for (var idx=0; idx<this.eventData.media.length; idx++) {
			var mediaItem = $.extend({}, this.eventData.media[idx]);
			mediaItem.gid = this.gid;
			mediaItem.httppath = window.ws5CONTROLLER+mediaItem.path;
			this.media.push(mediaItem);
		}
		
		if (this.eventData.triggers.stopAfterLoop) {
			this.eventData.triggers.stopAfterLoop = 
				parseInt(this.eventData.triggers.stopAfterLoop);
		}
		else {
			this.eventData.triggers.stopAfterLoop = 0;
		}

		if (this.eventData.triggers.stopWhenIdle) {
			this.eventData.triggers.stopWhenIdle = 
				parseInt(this.eventData.triggers.stopWhenIdle);
		}
		else {
			this.eventData.triggers.stopWhenIdle = 0;
		}
		
		if (this.eventData.triggers.stopButtonTop) {
			this.eventData.triggers.stopButtonTop = parseInt(this.eventData.triggers.stopButtonTop);
		}
		if (this.eventData.triggers.stopButtonLeft) {
			this.eventData.triggers.stopButtonLeft = parseInt(this.eventData.triggers.stopButtonLeft);
		}
		if (this.eventData.triggers.startButtonTop) {
			this.eventData.triggers.startButtonTop = parseInt(this.eventData.triggers.startButtonTop);
		}
		if (this.eventData.triggers.startButtonLeft) {
			this.eventData.triggers.startButtonLeft = parseInt(this.eventData.triggers.startButtonLeft);
		}
		
		if (this.eventData.stopEvents 
				&& this.eventData.triggers.stopEvents.indexOf('*')>=0) {
			eventData.triggers.stopByAnyEvent = true;
		}
	}
	this.parseMedia();
	
	this.stopNetEvent = function() {
		if (this.netEventTimer) {
			clearTimeout(this.netEventTimer);
			delete this.netEventTimer;
		}
	}
	
	this.getNetEvent = function() {
		var eventZoneRender= this;
		$.ajax(
			{
				type:   "POST",
				url:    '/ws5/controller/getevent.js',
				//data:   jsonData,
				dataType: "json",
				success: function(resp)
				{
					if (eventZoneRender.netEventTimer) {
						clearTimeout(eventZoneRender.netEventTimer);
					}

					if (!eventZoneRender.stopping &&
							resp.status && resp.events && resp.events.length>0) {
						eventZoneRender.processEvents(resp.events);
					}
					else if (!resp.status) {
						ws5Log("event/get.js error " + resp.id+' - '+resp.msg);
					}
					
					eventZoneRender.netEventTimer = setTimeout(
						function() {
							eventZoneRender.getNetEvent();
						}
					, 1);
					//sleep(100);
					
					//ws5Log("event/get.js success.");
				},
				error: function(XmlHttpRequest, textStatus, errorThrow)
				{
					ws5Log("event/get.js fail - " + JSON.stringify(errorThrow));
				}
			}
		)
		//ajax end	
	}

	this.processEvents = function(events) {
		var start, stop;
		
		for (var idx=0; idx<events.length; idx++) {
			start = this.eventData.triggers.startEvents.indexOf(events[idx].name);
		}
		for (var idx=0; idx<events.length; idx++) {
			stop = this.eventData.triggers.stopEvents.indexOf(events[idx].name);
		}
		
		if (start>=0) {
			this.start();
		}
		else if (stop>=0) {
			this.stop();
		}
	}
	
	this.processKey = function(event, ui) {
		//console.log(new Date().getTime()+':processKey');
		var self = thisRender;
		var eventChar = String.fromCharCode(event.keyCode);
		self.startIdleCheck();
		if (self.eventData.triggers.startEvents.indexOf(eventChar)>=0) {
			self.start();
		}
		else if (self.eventData.triggers.stopEvents.indexOf(eventChar)>=0
					|| eventData.triggers.stopByAnyEvent) {
			self.stop();
		}
	}
	
	this.createOpenButton = function (item) {
		if (this.eventData.triggers.showStartButton) {
			var buttonStr = '<img></img>';
			var button = $(buttonStr);
			button.attr('src', this.eventData.triggers.startButtonLocalPath);
			button.css({
				"z-index":1000,
				position: 'absolute',
				top: this.eventData.triggers.startButtonTop+parseInt(item.top),
				left: this.eventData.triggers.startButtonLeft+parseInt(item.left),
				width:this.eventData.triggers.startButtonWidth,
				height: this.eventData.triggers.startButtonHeight
			});
			button.hide();
			this.startButton = button;
			$('body').append(this.startButton);
		}
	}
	this.delOpenButton = function() {
		this.startButton.remove();
	}
	this.createOpenButton(item);
	
	this.createCloseButton = function (item) {
		if (this.eventData.triggers.showStopButton) {
			var buttonStr = '<img></img>';
			var button = $(buttonStr);
			button.attr('src', this.eventData.triggers.stopButtonLocalPath);
			button.css({
				"z-index":1000,
				position: 'absolute',
				top: this.eventData.triggers.stopButtonTop+parseInt(item.top),
				left: this.eventData.triggers.stopButtonLeft+parseInt(item.left),
				width:this.eventData.triggers.stopButtonWidth,
				height: this.eventData.triggers.stopButtonHeight
			});
			button.hide();
			this.stopButton = button;
			$('body').append(this.stopButton);
		}
	}
	this.delCloseButton = function() {
		this.stopButton.remove();
	}
	this.createCloseButton(item);

	this.showOpenButton = function () {
		if (this.startButton) {
			var self = this;
			this.startButton.on('click', function(event, ui){
				self.start();
			});
			this.startButton.show();
		}
	}
	
	this.showCloseButton = function () {
		if (this.stopButton) {
			var self = this;
			this.stopButton.on('click', function(event, ui){
				self.stop();
			});
			this.stopButton.show();
		}
	}
	
	this.hideOpenButton = function() {
		if (this.startButton) {
			this.startButton.off('click');
			this.startButton.hide();
		}
	}
	
	this.hideCloseButton = function() {
		if (this.stopButton) {
			this.stopButton.off('click');
			this.stopButton.hide();
		}
	}
	
	this.onOpenClick = function() {
		this.start();
	}
	
	this.onCloseClick = function() {
		this.stop();
	}
	
	this.startIdleCheck = function() {
		var self = this;
		if (this.idleTimeout) {
			clearTimeout(this.idleTimeout);
			delete this.idleTimeout;
		}
		if (this.eventData.triggers.stopWhenIdle>0) {
			this.idleTimeout= setTimeout(function(){
				delete self.idleTimeout;
				self.stop();
			}, this.eventData.triggers.stopWhenIdle*1000);
		}
	}
	
	this.stopIdleCheck = function() {
		if (this.idleTimeout) {
			clearTimeout(this.idleTimeout);
			delete this.idleTimeout;
		}
	}

	this.stopLoop = function() {
		if (this.loopTimer) {
			clearTimeout(this.loopTimer);
			delete this.loopTimer;
		}
		var test = $('.'+this.uid);
		$('.'+this.uid).remove();
	}
	
	this.startLoop = function(startTime) {
		var self=this;
		if (!(this.eventData.triggers.stopAfterLoop>=1 
				&& this.eventData.triggers.stopAfterLoop<this.loopPlayed)) {
			if (this.loopTimer) {
				clearTimeout(this.loopTimer);
				delete this.loopTimer;
			}
			
			var newMedia=[];
			for (var idx=0; idx<this.media.length; idx++) {
				var mediaItem = $.extend({}, this.item, this.media[idx]);
				mediaItem.start =Number(this.media[idx].start)+startTime;
				mediaItem.left = mediaItem.leftPercent;
				mediaItem.top = mediaItem.topPercent;
				mediaItem.width = mediaItem.widthPercent;
				mediaItem.height = mediaItem.heightPercent;
				mediaItem.eventMedia = true;
				delete mediaItem.inlineData;
				newMedia.push(mediaItem);
				
				//console.log((new Date().getTime())+' startLoop'
				//	+ ' start='+mediaItem.start
				//	+ ' path='+mediaItem.path
				//);
			}
			

			// it's weird
			// without passing window.ws5NewMediaQueue, 
			// the insertMedia() did not get the sa,e queue, but an empty queue
			window.ws5MediaTool.insertMedia(newMedia, true, window.ws5NewMediaQueue);
			
			var timeout = this.item.dur-window.WS5PRELOAD>0? 
					this.item.dur-window.WS5PRELOAD
					: this.item.dur;
			var nextStart = startTime+this.item.dur;
					
			if (this.eventData.triggers.stopAfterLoop<=0 
					|| this.eventData.triggers.stopAfterLoop>1
					&& this.eventData.triggers.stopAfterLoop>this.loopPlayed) {
				this.loopTimer = setTimeout(function(){
					self.loopPlayed++;
					self.startLoop(nextStart);
				}, timeout);
			}
		}
	}
	
	this.onMouseMove = function(event) {
		thisRender.startIdleCheck();
	}
	
	this.start = function() {
		$('body').on('mousemove', this.onMouseMove);
		this.loopPlayed = 0;
		this.showCloseButton();
		this.hideOpenButton();
		this.startIdleCheck();
		this.startLoop(new Date().getTime());
	}
	
	this.stop = function() {
		$('body').off('mousemove', this.onMouseMove);
		this.stopLoop();
		window.ws5MediaTool.deleteMedia(this.gid);
		this.showOpenButton();
		this.hideCloseButton();
		this.stopIdleCheck();
	}
}
ws5eventZoneRender.prototype = new ws5RenderBase();


///////////////////////////////////////////////////////////////////////////////
///开始播放
ws5eventZoneRender.prototype.Play = function()
{
	console.log((new Date().getTime())+' event zone start');
	var self = this;
	self.stopping = false;
	$('body').on('keypress', 
		this.processKey
	);
	this.getNetEvent();
	this.showOpenButton();
}

///////////////////////////////////////////////////////////////////////////////
///暂停播放
/*ws5eventZoneRender.prototype.Stop = function()
{
}
*/

///////////////////////////////////////////////////////////////////////////////
///停止播放
ws5eventZoneRender.prototype.Pause = function()
{
	console.log((new Date().getTime())+' event zone stop');
	this.stopping = true;
	$('body').off('keypress', this.processKey);
	this.stop();
//	$('body').off('mousemove', this.onMouseMove);
	this.delOpenButton();
	this.delCloseButton();
	//this.stopIdleCheck();
	this.stopNetEvent();
}

