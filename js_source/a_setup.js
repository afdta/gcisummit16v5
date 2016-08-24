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

//get/record wrapper width, in pixels -- fallback is 950px
gci2016.dom.getwidth = function(){
	try{
		var box = gci2016.dom.wrap.node().getBoundingClientRect();
		var w = box.right - box.left;
	}
	catch(e){
		var w = 950;
	}
	
	gci2016.dom.width = w; //record width
	
	return w;
}

//register arbitrary scroll events
gci2016.scroll = {}
gci2016.scroll.count = 0;
gci2016.scroll.listeners = {};

gci2016.scroll.register = function(element, onview, onexit){
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
		activated:false,
		get_box:getBox,
		listener:onview
	}

	gci2016.scroll.activateListeners(); //in case one is in view from the outset

}

//activate must be called as a method of gci2016.scroll
gci2016.scroll.activate = function(id, window_height){
	if(this.listeners.hasOwnProperty(id)){
		var listener = this.listeners[id];
		if(listener.activated){
			//already activated -- no op
			return null;
		}
		else{
			var box = listener.get_box();
			if(box===null){
				return null;
			}
			else{
				var top = box.top;
				var bottom = box.bottom;
				var middle = top + ((bottom-top)/2)
				if(middle - window_height < -50 && box.bottom > 100){
					listener.activated = true;
					listener.listener();
					delete this.listeners[id]; //remove to lower cost of scroll event
				}
			}
		}
	}
	}

//what if innerHeight isn't supported? -- activate all?
gci2016.scroll.activateListeners = function(){
	var h = window.innerHeight;
	for(var id in gci2016.scroll.listeners){
		gci2016.scroll.activate(id, h);
	}		
}