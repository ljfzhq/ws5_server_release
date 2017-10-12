/*****************************************************************************
 * File:    ws5IDManager.js
 *
 * Purpose: 确保系统产生唯一的id
  *
 * Author:	Cavan Joe
 *
 * Created:	2012-11-28 Cavan
 *
 * Updated: 2012-11-28 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///ws5IDManager的构造函数
function ws5IDManager()
{}

ws5IDManager.prototype.nDesktopID = 1;
ws5IDManager.prototype.nRenderWindowID = 1;

///////////////////////////////////////////////////////////////////////////////
///获取Desktop ID
ws5IDManager.prototype.GetDesktopID = function()
{
	var nRet = ws5IDManager.prototype.nDesktopID;
	ws5IDManager.prototype.nDesktopID = nRet + 1;

	return ("desktop" + nRet);
}

///////////////////////////////////////////////////////////////////////////////
///获取Render Window ID
ws5IDManager.prototype.GetRenderID = function()
{
	var nRet = ws5IDManager.prototype.nRenderWindowID;
	ws5IDManager.prototype.nRenderWindowID++;

	return ("render" + nRet);
}