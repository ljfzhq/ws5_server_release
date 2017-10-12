/*****************************************************************************
 * File:    ws5TransitionEffect.js
 *
 * Purpose: 这个实现各种转场效果。
  *
 * Author:	Cavan Joe
 *
 * Created:	2012-11-23 Cavan
 *
 * Updated: 2012-11-23 Cavan
 *
 * Home:	cavancn@gmail.com
 *
 * COPYRIGHT(C) 2012 Cavan Joe. ALL RIGHTS RESERVED.
 *****************************************************************************/
///////////////////////////////////////////////////////////////////////////////
///类ws5TransitionEffect的构造函数
///该视频区域的ID.
function ws5TransitionEffect()
{
}

///////////////////////////////////////////////////////////////////////////////
///开始转场
///@param[in] ws5Obj
///必须是ws5的一个对象，可以是ws5Desktop或者ws5RenderWindow
///@param[in] nType
///转场类型

//0  None	
//1  
//2
//3
//4  fadeIn
//5
//6
//7  dissolve
//8  slideDown
//9
//10  slideUp
//11  slide_right
//12  slide_left
//13  slide_right_bottom
//14  slide_right_top
//15  slide_left_top
//16  slide_left_bottom
//17  box_out
//18  box_in
//19  Split Vertical out
//20  Split Vertical in
//21  Split Horizontal out
//22  Split Horizontal in

//23  Vague Slider Down
//24  Vague Slider Up
//25  Vague Slider Right
//26  Vague Slider Left

//27  strips_right_down
//28  strips_right_up
//29  strips_left_down
//30  strips_left_up

//31  Circle Out
//32  Circle In
//33  diamond Out
//34  diamond In
//35  blinds_horizontal
//36  blinds_Vertical


///@param[in] nTime
///转场的时间
ws5TransitionEffect.prototype.DoTransition = function(ws5Obj, nType, nTime)
{
	//JQuery DIV element
	var wnd = ws5Obj.GetWindow();
	wnd.css("width",ws5Obj.mediaItem.width);
	wnd.css("height",ws5Obj.mediaItem.height);
	var nTime = 1500;
	//var nType = "tt";
	
	///Transition Effect 2 - None
	//var tr0Begin = function(){
		//wnd1.css("display","none");
		//wnd2.css("display","block");
	//}
	//var tr0Finished = function(){
		//wnd1.attr("te_runing","false");
	//}
	


    //通知元素开始要转场
    ws5Obj.BeginTransition(nType);
	//Random TE
	var GetRandomNum = function (Min,Max)
			{   
			var Range = Max - Min;   
			var Rand = Math.random();   
			return(Min + Math.round(Rand * Range));   
			}
	var trArr = ["4","7","8","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36"];
	//Random TE = 1
	 if(nType == "1")
	{ 
		nType = trArr[GetRandomNum(0,trArr.length-1)]
	}
	switch (nType){
		case "0":
			//None
			wnd.css("display","block");
			break;
		case "4":
			//fadeIn
			//wnd.fadeIn(nTime);
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","fade_in_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			break;
		case "7":
			//dissolve
			/*wnd.attr("te_runing","true");
			wnd.css("display","none");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))+1);
			ws5Obj.te_runing = true;
			wnd.fadeIn(nTime);*/
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))+1);
			wnd.css("-webkit-animation-name","dissolve_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			break;
		case "8":
			//slideDown
			/*wnd.attr("te_runing","true");
			wnd.css("display","none");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))+1);
			ws5Obj.te_runing = true;
			wnd.slideDown(nTime);*/
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","slider_down_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "10":
			//slideUp
			wnd.attr("te_runing","true");
			wnd.css("display","block");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))-1);
			ws5Obj.te_runing = true;
			var wndPrev = wnd.prev();
			//wndPrev.insertBefore(wnd);
			wndPrev.css("display","block");
			wndPrev.slideUp(nTime);
			break;
		case "11":
			//slide_right
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","slide_right_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "12":
			//slide_left
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","slide_left_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			break;
		case "13":
			//slide_right_bottom
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","slide_right_bottom_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "14":
			//slide_right_top
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","slide_right_top_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "15":
			//slide_left_top
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","slide_left_top_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			break;
		case "16":
			//slide_left_bottom
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","slide_left_bottom_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			break;
		case "17":
			//box_out
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","box_out_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "18":
			//box_in
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))-1);
			
			var wndPrev = wnd.prev();
			wndPrev.css("display","block");
			wndPrev.css("-webkit-animation-name","box_in_am");
			wndPrev.css("-webkit-animation-duration",(nTime/1000)+"s");
			wndPrev.css("-webkit-animation-fill-mode","forwards");
			wndPrev.css("-webkit-mask","center no-repeat");
			wndPrev.css("-webkit-mask-size","100% 100%");
			wndPrev.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "19":
			//Split Vertical out
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","split_vertical_out_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "20":
			//Split Vertical in
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))-1);
			
			var wndPrev = wnd.prev();
			wndPrev.css("display","block");
			wndPrev.css("-webkit-animation-name","split_vertical_in_am");
			wndPrev.css("-webkit-animation-duration",(nTime/1000)+"s");
			wndPrev.css("-webkit-animation-fill-mode","forwards");
			wndPrev.css("-webkit-mask","center no-repeat");
			wndPrev.css("-webkit-mask-size","100% 100%");
			wndPrev.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "21":
			//Split Horizontal out
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-animation-name","split_horizontal_out_am");
			wnd.css("-webkit-animation-duration",(nTime/1000)+"s");
			wnd.css("-webkit-animation-fill-mode","forwards");
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "22":
			//Split Horizontal in
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))-1);
			
			var wndPrev = wnd.prev();
			wndPrev.css("display","block");
			wndPrev.css("-webkit-animation-name","split_horizontal_in_am");
			wndPrev.css("-webkit-animation-duration",(nTime/1000)+"s");
			wndPrev.css("-webkit-animation-fill-mode","forwards");
			wndPrev.css("-webkit-mask","center no-repeat");
			wndPrev.css("-webkit-mask-size","100% 100%");
			wndPrev.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1)))");
			break;
		case "23":
			//Vague Slider Down
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			var vagueArea = 0.3;
			var vagueAreaP = (vagueArea*100)+"%";
			var am0_Y_start = -(wnd.height()*2) + "px";
			var am0_Y_end = -(wnd.height()*2) + "px";
			var am1_Y_start = -wnd.height()*(1+vagueArea) + "px";
			var am1_Y_end = 0 + "px";
			var am2_Y_start = -(wnd.height()*vagueArea)+"px";
			var am2_Y_end = (wnd.height())+"px";
			var _Hoffset = Math.ceil(wnd.height()*vagueArea)+"px";
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, left "+vagueAreaP+", from(rgba(0,0,0,1)), to(rgba(0,0,0,0)))");
			
			$.keyframe.define([{
				name: 'vague_slider_down_am',
				'0%': {
					'-webkit-mask-position': '100% '+ am0_Y_start +' , '+'100% '+ am1_Y_start +' , '+ '100% ' + am2_Y_start,
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					},
				'100%': {
					'-webkit-mask-position': '100% ' + am0_Y_end + ' , ' + '100% ' + am1_Y_end + ' , ' + '100% ' + am2_Y_end,
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					}
			}]);
			wnd.playKeyframe({
				name: 'vague_slider_down_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "24":
			//Vague Slider Up
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			var vagueArea = 0.3;
			var vagueAreaP = (vagueArea*100)+"%";
			var am0_Y_start = (wnd.height()*(2+vagueArea)) + "px";
			var am0_Y_end = (wnd.height()*vagueArea) + "px";
			var am1_Y_start = wnd.height()*(1+vagueArea) + "px";
			var am1_Y_end = 0 + "px";
			var am2_Y_start = wnd.height()+"px";
			var am2_Y_end = -(wnd.height()*vagueArea)+"px";
			var _Hoffset = Math.ceil(wnd.height()*vagueArea)+"px";
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, left "+vagueAreaP+", from(rgba(0,0,0,0)), to(rgba(0,0,0,1)))");
			
			$.keyframe.define([{
				name: 'vague_slider_up_am',
				'0%': {
					'-webkit-mask-position': '100% '+ am0_Y_start +' , '+'100% '+ am1_Y_start +' , '+ '100% ' + am2_Y_start,
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					},
				'100%': {
					'-webkit-mask-position': '100% ' + am0_Y_end + ' , ' + '100% ' + am1_Y_end + ' , ' + '100% ' + am2_Y_end,
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					}
			}]);
			wnd.playKeyframe({
				name: 'vague_slider_up_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "25":
			//Vague Slider Right
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			var vagueArea = 0.3;
			var vagueAreaP = (vagueArea*100)+"%";
			var am0_X_start = -wnd.width() + "px";
			var am0_X_end = -wnd.width() + "px";
			var am1_X_start = -wnd.width()*(1+vagueArea) + "px";
			var am1_X_end = 0+"px";
			var am2_X_start = -(wnd.width()*vagueArea)+"px";
			var am2_X_end = wnd.width()+"px";
			var _Hoffset = Math.ceil(wnd.height()*vagueArea)+"px";
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, "+ vagueAreaP +" top, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)))");
			
			$.keyframe.define([{
				name: 'vague_slider_up_am',
				'0%': {
					'-webkit-mask-position': am0_X_start + ' 100% , '+am1_X_start+' 100%  , '+ am2_X_start+ ' 100% ',
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					},
				'100%': {
					'-webkit-mask-position': am0_X_end + ' 100% , '+am1_X_end+' 100%  , '+ am2_X_end+ ' 100% ',
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					}
			}]);
			wnd.playKeyframe({
				name: 'vague_slider_up_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "26":
			//Vague Slider Left
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			var vagueArea = 0.3;
			var vagueAreaP = (vagueArea*100)+"%";
			var am0_X_start = wnd.width()*2 + "px";
			var am0_X_end = wnd.width()*(1-vagueArea) + "px";
			var am1_X_start = wnd.width()*(1+vagueArea) + "px";
			var am1_X_end = wnd.width()+"px";
			var am2_X_start = wnd.width()+"px";
			var am2_X_end = -wnd.width()*vagueArea+"px";
			var _Hoffset = Math.ceil(wnd.height()*vagueArea)+"px";
			wnd.css("-webkit-mask","center no-repeat");
			wnd.css("-webkit-mask-size","100% 100%");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,1))),-webkit-gradient(linear, left top, "+ vagueAreaP +" top, from(rgba(0,0,0,0)), to(rgba(0,0,0,1)))");
			
			$.keyframe.define([{
				name: 'vague_slider_up_am',
				'0%': {
					'-webkit-mask-position': am0_X_start + ' 100% , '+am1_X_start+' 100%  , '+ am2_X_start+ ' 100% ',
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					},
				'100%': {
					'-webkit-mask-position': am0_X_end + ' 100% , '+am1_X_end+' 100%  , '+ am2_X_end+ ' 100% ',
					'-webkit-mask-size': '100% 100% , 100% 100% , 100% 100%'
					}
			}]);
			wnd.playKeyframe({
				name: 'vague_slider_up_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "27":
			//strips_right_down
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			wnd.css("-webkit-mask-position","0% 0% , 0% 11% , 0% 21% , 0% 31% , 0% 41% , 0% 51% , 0% 61% , 0% 71% , 0% 81% , 0% 91%");
			wnd.css("-webkit-mask-size","10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11%");
			
			$.keyframe.define([{
				name: 'strips_right_down_am',
				'0%': {
					'-webkit-mask-position': '0% 0% , 0% 11% , 0% 22% , 0% 33% , 0% 44% , 0% 55% , 0% 66% , 0% 77% , 0% 88%  , 0% 99% ',
					'-webkit-mask-size': '0% 11% , -10% 11% , -20% 11% , -30% 11% , -40% 11% , -50% 11% , -60% 11% , -70% 11% , -80% 11% , -90% 11%'
					},
				'100%': {
					'-webkit-mask-position': '0% 0% , 0% 11% , 0% 22% , 0% 33% , 0% 44% , 0% 55% , 0% 66% , 0% 77% , 0% 88%  , 0% 99% ',
					'-webkit-mask-size': '190% 11% , 180% 11% , 170% 11% , 160% 11% , 150% 11% , 140% 11% , 130% 11% , 120% 11% , 110% 11% , 100% 11%'
					}
			}]);
			wnd.playKeyframe({
				name: 'strips_right_down_am',
				duration: nTime, 
				timingFunction: 'linear', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "28":
			//strips_right_up
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			wnd.css("-webkit-mask-position","0% 0% , 0% 11% , 0% 21% , 0% 31% , 0% 41% , 0% 51% , 0% 61% , 0% 71% , 0% 81% , 0% 91%");
			wnd.css("-webkit-mask-size","10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11%");
			
			$.keyframe.define([{
				name: 'strips_right_up_am',
				'0%': {
					'-webkit-mask-position': '0% 0% , 0% 11% , 0% 22% , 0% 33% , 0% 44% , 0% 55% , 0% 66% , 0% 77% , 0% 88%  , 0% 99% ',
					'-webkit-mask-size': '-90% 11% , -80% 11% , -70% 11% , -60% 11% , -50% 11% , -40% 11% , -30% 11% , -20% 11% , -10% 11% , 0% 11%'
					},
				'100%': {
					'-webkit-mask-position': '0% 0% , 0% 11% , 0% 22% , 0% 33% , 0% 44% , 0% 55% , 0% 66% , 0% 77% , 0% 88%  , 0% 99% ',
					'-webkit-mask-size': '100% 11% , 110% 11% , 120% 11% , 130% 11% , 140% 11% , 150% 11% , 160% 11% , 170% 11% , 180% 11% , 190% 11%'
					}
			}]);
			wnd.playKeyframe({
				name: 'strips_right_up_am',
				duration: nTime, 
				timingFunction: 'linear', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
			case "29":
			//strips_left_down
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			wnd.css("-webkit-mask-position","0% 0% , 0% 11% , 0% 21% , 0% 31% , 0% 41% , 0% 51% , 0% 61% , 0% 71% , 0% 81% , 0% 91%");
			wnd.css("-webkit-mask-size",'200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11%');
			
			$.keyframe.define([{
				name: 'strips_left_down_am',
				'0%': {
					'-webkit-mask-position': '-100% 0% , -110% 11% , -120% 22% , -130% 33% , -140% 44% , -150% 55% , -160% 66% , -170% 77% , -180% 88%  , -190% 99% ',
					'-webkit-mask-size': '200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11%'
					},
				'100%': {
					'-webkit-mask-position': '90% 0% , 80% 11% , 70% 22% , 60% 33% , 50% 44% , 40% 55% , 30% 66% , 20% 77% , 10% 88%  , 0% 99% ',
					'-webkit-mask-size': '200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11%'
					}
			}]);
			wnd.playKeyframe({
				name: 'strips_left_down_am',
				duration: nTime, 
				timingFunction: 'linear', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "30":
			//strips_left_up
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			wnd.css("-webkit-mask-position","0% 0% , 0% 11% , 0% 21% , 0% 31% , 0% 41% , 0% 51% , 0% 61% , 0% 71% , 0% 81% , 0% 91%");
			wnd.css("-webkit-mask-size",'200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11%');
			
			$.keyframe.define([{
				name: 'strips_left_up_am',
				'0%': {
					'-webkit-mask-position': '-190% 0% , -180% 11% , -170% 22% , -160% 33% , -150% 44% , -140% 55% , -130% 66% , -120% 77% , -110% 88%  , -100% 99% ',
					'-webkit-mask-size': '200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11%'
					},
				'100%': {
					'-webkit-mask-position': '0% 0% , 10% 11% , 20% 22% , 30% 33% , 40% 44% , 50% 55% , 60% 66% , 70% 77% , 80% 88% , 90% 99% ',
					'-webkit-mask-size': '200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11% , 200% 11%'
					}
			}]);
			wnd.playKeyframe({
				name: 'strips_left_up_am',
				duration: nTime, 
				timingFunction: 'linear', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "31":
			//Circle Out
			var circleEnd = Math.ceil(Math.sqrt(wnd.width()*wnd.width()+wnd.height()*wnd.height()));
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","url(img/circle001.svg)");
			wnd.css("-webkit-mask-position","50% 50%");
			wnd.css("-webkit-mask-size",'100% 100%');
			
			$.keyframe.define([{
				name: 'circle_out_am',
				'0%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': '0% 0%'
					},
				'100%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': circleEnd+'px '+circleEnd+'px'
					}
			}]);
			wnd.playKeyframe({
				name: 'circle_out_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "32":
			//Circle In
			var circleEnd2 = Math.ceil(Math.sqrt(wnd.width()*wnd.width()+wnd.height()*wnd.height()));
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))-1);
			var wndPrev = wnd.prev();
			wndPrev.css("display","block");
			wndPrev.css("-webkit-mask","no-repeat");
			wndPrev.css("-webkit-mask-image","url(img/circle001.svg)");
			wndPrev.css("-webkit-mask-position","50% 50%");
			wndPrev.css("-webkit-mask-size",'100% 100%');
			$.keyframe.define([{
				name: 'circle_in_am',
				'0%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': circleEnd2+'px '+circleEnd2+'px'
					},
				'100%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': '0% 0%'
					}
			}]);
			wndPrev.playKeyframe({
				name: 'circle_in_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "33":
			//diamond Out
			var diamondEnd = wnd.width()+wnd.height();
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","url(img/diamond001.svg)");
			wnd.css("-webkit-mask-position","50% 50%");
			wnd.css("-webkit-mask-size",'100% 100%');
			
			$.keyframe.define([{
				name: 'diamond_out_am',
				'0%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': '0% 0%'
					},
				'100%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': diamondEnd+'px '+diamondEnd+'px'
					}
			}]);
			wnd.playKeyframe({
				name: 'diamond_out_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "34":
			//diamond In
			var diamondEnd2 = wnd.width()+wnd.height();
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("z-index",Number($(wnd.parent()).css("z-index"))-1);
			var wndPrev = wnd.prev();
			wndPrev.css("display","block");
			wndPrev.css("-webkit-mask","no-repeat");
			wndPrev.css("-webkit-mask-image","url(img/diamond001.svg)");
			wndPrev.css("-webkit-mask-position","50% 50%");
			wndPrev.css("-webkit-mask-size",'100% 100%');
			$.keyframe.define([{
				name: 'circle_in_am',
				'0%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': diamondEnd2+'px '+diamondEnd2+'px'
					},
				'100%': {
					'-webkit-mask-position': '50% 50%',
					'-webkit-mask-size': '0% 0%'
					}
			}]);
			wndPrev.playKeyframe({
				name: 'circle_in_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "35":
			//blinds_horizontal
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			wnd.css("-webkit-mask-position","0% 0% , 0% 11% , 0% 21% , 0% 31% , 0% 41% , 0% 51% , 0% 61% , 0% 71% , 0% 81% , 0% 91%");
			wnd.css("-webkit-mask-size","10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11% , 10% 11%");
			
			$.keyframe.define([{
				name: 'blinds_horizontal_am',
				'0%': {
					'-webkit-mask-position': '0% 0% , 0% 11% , 0% 22% , 0% 33% , 0% 44% , 0% 55% , 0% 66% , 0% 77% , 0% 88%  , 0% 99% ',
					'-webkit-mask-size': '100% 0% , 100% 0% , 100% 0% , 100% 0% , 100% 0% , 100% 0% , 100% 0% , 100% 0% , 100% 0% , 100% 0%'
					},
				'100%': {
					'-webkit-mask-position': '0% 0% , 0% 11% , 0% 22% , 0% 33% , 0% 44% , 0% 55% , 0% 66% , 0% 77% , 0% 88%  , 0% 99% ',
					'-webkit-mask-size': '100% 11% , 100% 11% , 100% 11% , 100% 11% , 100% 11% , 100% 11% , 100% 11% , 100% 11% , 100% 11% , 100% 11%'
					}
			}]);
			wnd.playKeyframe({
				name: 'blinds_horizontal_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
		case "36":
			//blinds_Vertical
			wnd.attr("te_runing","true");
			ws5Obj.te_runing = true;
			wnd.css("display","block");
			wnd.css("-webkit-mask","no-repeat");
			wnd.css("-webkit-mask-image","-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1))),-webkit-gradient(linear, 0 0, 0 10, from(rgba(0,0,0,1)),to(rgba(0,0,0,1)))");
			wnd.css("-webkit-mask-position","0% 0% , 11% 0% , 21% 0% , 31% 0% , 41% 0% , 51% 0% , 61% 0% , 71% 0% , 81% 0% , 91% 0%");
			wnd.css("-webkit-mask-size",'0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100%');
			
			$.keyframe.define([{
				name: 'blinds_horizontal_am',
				'0%': {
					'-webkit-mask-position': '0% 0% , 10% 0% , 20% 0% , 30% 0% , 40% 0% , 50% 0% , 60% 0% , 70% 0% , 80% 0% , 90% 0%',
					'-webkit-mask-size': '0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100% , 0% 100%'
					},
				'100%': {
					'-webkit-mask-position': '0% 0% , 10% 0% , 20% 0% , 30% 0% , 40% 0% , 50% 0% , 60% 0% , 70% 0% , 80% 0% , 90% 0%',
					'-webkit-mask-size': '11% 100% , 11% 100% , 11% 100% , 11% 100% , 11% 100% , 11% 100% , 11% 100% , 11% 100% , 11% 100% , 11% 100%'
					}
			}]);
			wnd.playKeyframe({
				name: 'blinds_horizontal_am',
				duration: nTime, 
				timingFunction: 'ease', 
				delay: 0, 
				repeat: 1, 
				direction: 'normal', 
				fillMode: 'forwards', 
				complete: function(){}
			});
			break;
			
			
			
		default:
		wnd.css("display","block");
		}
   //wnd.show(nTime);
   //ws5Obj.EndTransition(nType);
   
}
