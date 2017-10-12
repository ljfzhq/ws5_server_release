/*****************************************************************************
 * File:    ws5Common.js
 *
 * Purpose: ws5 general aux-apis are defined here.
 *          1. Screen information and manipulation APIs
 *          2. HTML RGB/RGBA/Hex color mutual conversion
 *
 * Author:	Cavan Joe
 *
 * Created:	2012-11-21 Cavan
 *
 * Updated: 2012-11-21 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///类ws5Rect定义了长方形左上角坐标以及宽高
function ws5Rect()
{
    if(arguments.length > 2)
    {
        this.x = arguments[0];
        this.y = arguments[1];
        this.cx = arguments[2];
        this.cy = arguments[3];
    }
    else
    {
        this.x = 0;
        this.y = 0;
        this.cx = 0;
        this.cy = 0;
    }
}

///////////////////////////////////////////////////////////////////////////////
///类ws5Screen定义了和显示器相关的方法
function ws5Screen()
{
    //网页可见区域宽
    this.clientWidth = document.documentElement.clientWidth;
    //网页可见区域高
    this.clientHeight = document.documentElement.clientHeight;
    //屏幕分辨率的高
    this.resolutionX = window.screen.width;
    //屏幕分辨率的宽
    this.resolutionY = window.screen.height;

	ws5Log("Screen Width=" + this.resolutionX + " Height=" + this.resolutionY);
	ws5Log("Client Width=" + this.clientWidth + " Height=" + this.clientHeight);
}

ws5Screen.prototype.getScreenRect = function()
{
    var rect = new ws5Rect(0, 0, this.resolutionX, this.resolutionY);
    return rect;
}

///////////////////////////////////////////////////////////////////////////////
///Return the client area width, height and this is what WS5 used, because it
///returns actual browser client area even span screen.
ws5Screen.prototype.getClientRect = function()
{
    var rect = new ws5Rect(0, 0, this.clientWidth, this.clientHeight);
    return rect;
}

///////////////////////////////////////////////////////////////////////////////
///进入全屏幕或者退出全屏幕模式
///@param[in] bFullScreen
/// true:进入全屏幕模式 false:退出全屏幕模式
ws5Screen.prototype.setFullScreen = function(bFullScreen)
{
	var arElement = document.getElementsByTagName('html');
	var element = arElement[0];

    if(bFullScreen == true)
    {
        if(element.requestFullScreen)
        {
            element.requestFullScreen();
        }else if(element.mozRequestFullScreen)
        {
            element.mozRequestFullScreen();
        }else if(element.webkitRequestFullScreen)
        {
            element.webkitRequestFullScreen();
        }
    }
    else
    {
        if(document.cancelFullScreen)
        {
            document.cancelFullScreen();
        }else if(document.mozCancelFullScreen)
        {
            document.mozCancelFullScreen();
        }else if(document.webkitCancelFullScreen)
        {
            document.webkitCancelFullScreen();
        }
    }
}

function ws5ToRGBA(val, alpha)
{
	var r, g, b;

	// 参数为RGB模式时不做进制转换，直接截取字符串即可
	if( /rgb/.test(val) )
	{
		var arr = val.match( /\d+/g );
		r = parseInt( arr[0] );
		g = parseInt( arr[1] );
		b = parseInt( arr[2] );
	}

	// 参数为十六进制时需要做进制转换
	else if( /#/.test(val) )
	{
		var len = val.length;
		// 非简写模式 #0066cc
		if( len === 7 )
		{
			r = parseInt( val.slice(1, 3), 16 );
			g = parseInt( val.slice(3, 5), 16 );
			b = parseInt( val.slice(5), 16 );
		}

		// 简写模式 #06c
		else if( len === 4 )
		{
			r = parseInt( val.charAt(1) + val.charAt(1), 16 );
			g = parseInt( val.charAt(2) + val.charAt(2), 16 );
			b = parseInt( val.charAt(3) + val.charAt(3), 16 );
		}
	}
	else
	{
		return val;
	}

	var strRet = "RGBA(" + r + "," + b + "," + b + "," + alpha + ")";

	return strRet;
}