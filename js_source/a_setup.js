//global namespace for interactive
gci2016 = {};

//directory containing app assets -- need to change to "directory/on/wordpress";
gci2016.repo = "./";

//hold dom references/methods
gci2016.dom = {};
gci2016.dom.wrap = d3.select("#gci2016wrap");
gci2016.dom.fixedframewrap = d3.select("#gci2016fixedframewrap");
gci2016.dom.fixedframe = d3.select("#gci2016fixedframe");
gci2016.dom.mapwrap = d3.select("#gci2016mapwrap");

//colors for each cluster 1-7 
gci2016.cols = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f'];

//get/record wrapper width, in pixels -- fallback is 950px
gci2016.dom.getwidth = function(maxwidth){
	try{
		var box = gci2016.dom.wrap.node().getBoundingClientRect();
		var w = box.right - box.left;
	}
	catch(e){
		var w = 950;
	}

	//override if user passes a maxwidth
	if(!!maxwidth && w > maxwidth){w = maxwidth}
	
	gci2016.dom.width = w; //record width
	
	return w;
}

//register arbitrary scroll events
gci2016.scroll = {}
gci2016.scroll.count = 0;
gci2016.scroll.listeners = {};

gci2016.scroll.register = function(element, onview, onscroll){
	var getBox = function(){
		try{
			var box = element.getBoundingClientRect();
		}
		catch(e){
			var box = null;
		}
		return box;
	}

	var id = "event" + (++gci2016.scroll.count);
	
	gci2016.scroll.listeners[id] = {
		viewed:false,
		viewing:false,
		get_box:getBox,
		onview: onview,
		onscroll: onscroll
	}

	gci2016.scroll.activateListeners(); //in case one is in view from the outset

}

//activate must be called as a method of gci2016.scroll
gci2016.scroll.activate = function(id, window_height){
	if(this.listeners.hasOwnProperty(id)){
		var listener = this.listeners[id];

		var box = listener.get_box();

		if(box===null){
			listener.viewed = true;
			listener.viewing = false;
			listener.onview();
		}
		else{
			listener.viewing = box.top-window_height < 0 && box.top > 0;

			var top = box.top;
			var bottom = box.bottom;
			var middle = top + ((bottom-top)/2)

			var middleOffset = middle-window_height;

			if(!listener.viewed && middleOffset < 0 && middle > 100){
				listener.viewed = true;
				listener.onview();
				//delete this.listeners[id]; //remove to lower cost of scroll event
			}

			if(listener.viewing){listener.onscroll(top/window_height)}
		}
	}
	}

//what if innerHeight isn't supported? -- activate all?
gci2016.scroll.activateListeners = function(){
	//run in the next tick to allow redraws to happen
	setTimeout(function(){
		var h = window.innerHeight;
		for(var id in gci2016.scroll.listeners){
			gci2016.scroll.activate(id, h);
		}
	},0);
		
}