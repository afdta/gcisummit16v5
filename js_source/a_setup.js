//to do: add descending icons to table view, 
//review height sizing of table

//remove unused code, styles
//consider making tool tip wider

//global namespace for interactive
gci2016 = {};

//directory containing app assets -- need to change to "directory/on/wordpress";
gci2016.repo = "./";

//hold dom references/methods
gci2016.dom = {};
gci2016.dom.wrap = d3.select("#gci2016wrap");
gci2016.dom.wrapn = gci2016.dom.wrap.node();
gci2016.dom.fixedframewrap = d3.select("#gci2016fixedframewrap");
gci2016.dom.fixedframe = d3.select("#gci2016fixedframe");
gci2016.dom.mapwrap = d3.select("#gci2016mapwrap");

//colors for each cluster 1-7 
//gci2016.cols = ['#cccccc','#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f'];

gci2016.cols = ['#cccccc','#FFE151','#a6cee3','#b2df8a','#33a02c','#e31a1c','#036EB0','#fdbf6f'];

//factory china 1 (#FFE151)
//knowledge cap 2 (#a6cee3)
//emerging gateways 3 (#b2df8a)
//asian anchors 4 (#33a02c)
//global giants 5 (#e31a1c)
//am. middle 6 (#036EB0)
//intn'l middle 7 (#fdbf6f)

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

			if(listener.viewing && listener.onscroll){listener.onscroll(top/window_height)}
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

//get element width, height, in pixels
//in future, ensure this is run in next tick of event loop using setTimeout(0) and native promises, if supported
gci2016.getdim = function(el, maxwidth, maxheight){
	if(arguments.length > 0){
		var element = el;
	}
	else{
		var element = document.documentElement;
	}

	var floor = 50;
	var err = false;

	try{
		var box = element.getBoundingClientRect();
		var w = Math.floor(box.right - box.left);
		var h = Math.floor(box.bottom - box.top);
		if(w < floor || h < floor){throw "badWidth"}
	}
	catch(e){
		var box = {};
		var w = floor;
		var h = floor;
		err = true;
	}

	if(!!maxwidth && w > maxwidth){w = maxwidth}
	if(!!maxheight && h > maxheight){h = maxheight}

	var dim = {width:w, height:h, error:err, box:box};

	return dim;
}

//place tooltip relative to container; 
//xbuffer is how far left or right the tooltip is from the targetXY (mouse/touch position)
//fbr is the fixed banner height (or vertical distance at the top of the viewport that should be considered off limits)
gci2016.placetip = function(tip_node, container_node, xbuffer, fbr){
	
	//default to showing tooltip on right, don't flip orientations unless forced
	var tipRight = true;
	var pad = !!xbuffer ? xbuffer : 35;
	fbr = !!fbr ? fbr : 85;

	try{
		if(tip_node.style.width == ""){
			tip_node.style.width = "400px";
		};
	}
	catch(e){
		//no-op
	}

	var xy = function(target_xy){
		var tipdim = gci2016.getdim(tip_node);
		var contdim = gci2016.getdim(container_node);

		var mouseX = target_xy[0];
		var mouseY = target_xy[1];

		var errorX = false;

		try{
			var wdiff = contdim.width - tipdim.width;
			if(wdiff > 0 && wdiff < pad){
				pad = wdiff;
			}
			else if(wdiff < 0){
				pad = 0;
			}

			if(tipRight){
				if((mouseX + tipdim.width + pad) > contdim.width){
					tipRight = false;
					var newX = mouseX - tipdim.width - pad;
				}
				else{
					var newX = mouseX + pad;
				}
			}
			else{
				if((mouseX - tipdim.width - pad) < 0){
					tipRight = true;
					var newX = mouseX + pad;
				}
				else{
					var newX = mouseX - tipdim.width - pad;
				}
			}

			if((newX + tipdim.width) >= contdim.width || newX < 0){throw "tooWide"}
		}
		catch(e){
			var newX = 0;
			errorX = true;
		}

		//y pos
		try{
			if(errorX){throw "badX"}

			var viewport = {};
			viewport.w = Math.max(document.documentElement.clientWidth, (window.innerWidth || 0));
			viewport.h = Math.max(document.documentElement.clientHeight, (window.innerHeight || 0));

			var hdiff = viewport.h - tipdim.height - fbr;
			
			var quarterh = Math.round(tipdim.height/4);
			if(hdiff > quarterh){
				var ypad = quarterh;
			}
			else if(hdiff >= 0){
				var ypad = hdiff;
			}
			else{
				var ypad = 0;
			}

			//console.log("container top: " +  contdim.box.top + " | mouse-y: " + mouseY + " | tip height: " + tipdim.height + " | ypad: " +ypad);
			//remember: mouseY is relative to the top of container 

			//condition 1: tooltip is taller than viewport or it would extend into fbr

			if(tipdim.height+fbr >= viewport.h || contdim.box.top + mouseY - ypad <= fbr){
				var newY = fbr-contdim.box.top;
			}
			else if((contdim.box.top + mouseY + tipdim.height - ypad) > viewport.h){
				var newY = viewport.h - contdim.box.top - tipdim.height;
			}
			else{
				var newY = mouseY - ypad;
			}
		}
		catch(e){
			var newY = mouseY + 15;
		}

		return [newX, newY];
	}

	return xy;
}


gci2016.calc_rank = function(array, accessor, clusterkey, ascending){
	var A = !!accessor ? accessor : function(d){return d};
	var D = !!ascending ? false : true;
	var Rall = array.map(function(d,i,a){
		return accessor(d);
	});
	var Rclusters = null;

	var sortfn = function(a,b){
		try{
			var d = a-b;
			if(d==null){throw "NaN"}
		}
		catch(e){
			var d = 0;
		}

		try{
			if(a==b){
				var r = 0;
			}
			else if(a==null){
				var r = 1;
			}
			else if(b==null){
				var r = -1;
			}
			else if(a<b){
				var r = D ? 1 : -1;
			}
			else if(a>b){
				var r = D ? -1 : 1;
			}
			else{
				var r = 0;
			}
		}
		catch(e){
			var r = 0;
		}

		return r;
	};

	Rall.sort(sortfn);

	if(!!clusterkey){
		var Rclusters = d3.nest().key(clusterkey)
							.rollup(function(a){
										return a.map(accessor).sort(sortfn);
									})
							.object(array);
	}

    var rankit = function(value, cluster){
    	//array to rank from
    	var R = !!cluster ? Rclusters[(cluster+"")] : Rall;

	    try{
	        var i = R.indexOf(value) + 1;
	        var rank = (i>0 && value!=null) ? i : "N/A";
	    }
	    catch(e){
	        if(!Array.prototype.indexOf){
	            var rank = "N/A";
	        }
	        else{
	            var rank = "N/A";
	        }
	    }
	    finally{
	        return {rank: rank, outof:R.length};
	    }
	}

	return rankit;
}


gci2016.format = {};
gci2016.format.rank = function(r){
    if(typeof r === "undefined" || r == null){
    	var rth = "N/A";
    }
    else{
        //keep int versions
        var num = r;
        var mod = r%100; //for ranks beyond 100
 
        //coerce to string
        var r = r + "";
        var f = +(r.substring(r.length-1)); //take last letter and coerce to an integer
         
        //typical suffixes
        var e = ["th","st","nd","rd","th","th","th","th","th","th"];
 
        var rth = (mod>10 && mod<20) ? r + "th" : (r + e[f]); //handles exceptions for X11th, X12th, X13th, X14th
    }
    return rth; 
 }

 //percent change
 gci2016.format.pct0 = d3.format("+,.0%");
 gci2016.format.pct1 = d3.format("+,.1%");

 //shares
 gci2016.format.sh0 = d3.format(",.0%");
 gci2016.format.sh1 = d3.format(",.1%");

 //numeric
 gci2016.format.num0 = d3.format(",.0f");
 gci2016.format.num1 = d3.format(",.1f");
 gci2016.format.num2 = d3.format(",.2f");
 gci2016.format.num3 = d3.format(",.3f");

 //USD
 gci2016.format.doll0 = function(v){return "$" + gci2016.format.num0(v)};
 gci2016.format.doll1 = function(v){return "$" + gci2016.format.num1(v)};
 gci2016.format.doll2 = function(v){return "$" + gci2016.format.num2(v)};

 //id
 gci2016.format.id = function(v){return v};

 gci2016.format.fn = function(v, fmt){
 	if(gci2016.format.hasOwnProperty(fmt)){
 		var fn = gci2016.format[fmt];
 	}
 	else{
 		var fn = gci2016.format.id;
 	}
 	return v==null ? "N/A" : fn(v);
 }