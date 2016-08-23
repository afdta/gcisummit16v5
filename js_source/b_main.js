//global namespace for interactive
gci2016 = {};

//closure containing interactive logic
(function(){

	//containers for local variables and dom references
	var scope = gci2016;
	var dom = scope.dom = {};
	dom.chartContainers = {};

	var dotplots = dom.chartContainers.dotplots = {};

	dotplots["group1"] = document.getElementById("group1_dotplot");
	dotplots["group2"] = document.getElementById("group2_dotplot");
	dotplots["group3"] = document.getElementById("group3_dotplot");
	dotplots["group4"] = document.getElementById("group4_dotplot");
	dotplots["group5"] = document.getElementById("group5_dotplot");
	dotplots["group6"] = document.getElementById("group6_dotplot");
	dotplots["group7"] = document.getElementById("group7_dotplot");

	//directory containing app assets -- need to change to "directory/on/wordpress";
	scope.repo = "./";

	dom.wrap = d3.select("#gci2016wrap");
	dom.fixedframewrap = d3.select("#gci2016fixedframewrap");
	dom.fixedframe = d3.select("#gci2016fixedframe");
	dom.mapwrap = d3.select("#gci2016mapwrap");


	d3.json(scope.repo + "data.json", function(error, dat){
		if(error){
			return null;
		}

		for(var e in dotplots){
			if(dotplots.hasOwnProperty(e)){
				scope.scroll.register(dotplots[e], dotPlot.call(dotplots[e], e.replace(/[a-z]*/, ""), dat))
			}
		}
	});

	//dotPlot is called with the enclosing dom container element as the this object
	function dotPlot(id, data){
		var box = this.getBoundingClientRect();
		var wrapper = d3.select(this).classed("c-fix",true);
		try{
			var width = Math.floor(box.right - box.left);
			if(width < 300){throw "badWidth"}
		}
		catch(e){
			var width = 320;
		}
		var height = 270;
		var zrange = [-1.7,3.5]

		//vars
		var vars = ["pop_2015", "X2015_nomgdp", "gdp_pc_real2015", "productivity2015", 
				"compound_growth_realgdp15", "compound_growth_real_gdp_pc15", "compound_growth_emp15", "compound_growth_pop15", 
				"fdi_pc_09.15", 
				"share_publications_top_10_10.13", "patents_pc_08.12", "venture_capital_pc06.15", 
				"passengers_pc_2014", "download_speed2015", 
				"share_tertiary_education2015"];

		var dat = vars.map(function(D,I,A){
			var s = data.z.groups.map(function(d,i,a){
				return {id:d.id.replace(/[a-z]*/,""), val:d[D], var:D}
			});
			return s;
		});

		var x = d3.scaleBand().domain(vars).range([0,100]).round(false).paddingOuter(1).align(0.5);
		var y = d3.scaleLinear().domain(zrange).range([height, 0]);

		var po = x.paddingOuter();
		var pi = x.paddingInner();
		var step = x.step();
		var halfstep = step/2;

		//console.log("po: "+po+" pi: "+pi+" step: "+step);
		var chartwrap = wrapper.append("div").classed("makesans",true);
		var svg = chartwrap.style("width","100%").append("svg").style("height",height+"px").style("width","100%");
		var label_container = chartwrap.append("div").classed("c-fix",true).style("width","100%");

		var labels = label_container.selectAll("div").data(vars).enter().append("div")
									.style("float","left")
									.style("margin",function(d,i){
										if(i===0){
											var m = "0px 0px 5px " + (po*step) + "%";
										}
										else if(i===vars.length-1){
											var m = "0px " + (po*step) + "% 5px 0px";
										}
										else{
											var m = "0px 0px";
										}
										return m;
									})
									.style("width",step+"%")
									.style("overflow","hidden");
		labels.append("p").text(function(d,i){return d})
				.style("word-break","break-all")
				.style("text-align","center")
				.style("font-size","13px")
				.style("margin","0px 4px");


		svg.append("line").attr("x1",(step*po)+"%").attr("x2",(100-(step*po))+"%").attr("y1",y(0)).attr("y2",y(0)).attr("stroke","#666666").style("shape-rendering","crispEdges").attr("stroke-width","1px");
		svg.append("text").attr("x",(po*step)+"%").attr("y",y(0)+3).text("Average")
				.style("font-size","11px")
				.attr("text-anchor","end")
				.attr("dx",-3)
				.attr("fill","#666666");

		var groups = svg.selectAll("g").data(dat).enter().append("g");

		var lines = groups.append("line")
						.attr("x1",function(d,i){return (x(d[0].var)+halfstep)+"%"})
						.attr("x2",function(d,i){return (x(d[0].var)+halfstep)+"%"})
						.attr("y1",0)
						.attr("y2",height)
						.attr("stroke","#aaaaaa")
						.attr("stroke-dasharray","3,3");

		var dots = groups.selectAll("circle").data(function(d,i){return d}).enter().append("circle")
					  .attr("cx",function(d,i){return (x(d.var)+halfstep)+"%"})
					  .attr("cy",function(d,i){return y(d.val)})
					  .attr("fill","#999999")
					  .attr("fill-opacity",0.4)
					  .attr("stroke","#999999")
					  .attr("r",5);

		var this_group = dots.filter(function(d,i){
			return d.id == id;
		}).raise().attr("fill","#ff0000").attr("stroke","#ff0000").attr("fill-opacity",0.6);

		return function(){
			this_group.transition().attr("r",10);
		};		
	}

	function ()

	//register arbitrary scroll events
	scope.scroll = {}
	scope.scroll.count = 0;
	scope.scroll.listeners = {};

	scope.scroll.register = function(element, onview, onexit){
		var getBox = function(){
			try{
				var box = element.getBoundingClientRect();
			}
			catch(e){
				var box = null;
			}
			return box;
		}

		var id = "event" + (++scope.scroll.count);
		
		scope.scroll.listeners[id] = {
			activated:false,
			get_box:getBox,
			listener:onview
		}

		activateListeners(); //in case one is in view from the outset

	}

	//activate must be called as a method of scope.scroll
	scope.scroll.activate = function(id, window_height){
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
	function activateListeners(){
		var h = window.innerHeight;
		for(var id in scope.scroll.listeners){
			scope.scroll.activate(id, h);
		}		
	}

	window.addEventListener("scroll", activateListeners);


	//////////////////////////////////////////////////////////////////////////
	return null;
	

	//check support for svg
	if(!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")){
		document.getElementById("gci2016wrap").innerHTML = '<p style="font-style:italic;text-align:center;margin:30px 0px 30px 0px;">This interactive feature requires a modern browser such as Chrome, Firefox, IE9+, or Safari.</p>';
		dom.svgsupport = false;
		return null;
	}

	//generate number formatting functions
	scope.format = (function(){
		var d3num = d3.format(",.0f");
		var d3share = d3.format(",.1%");
		var d3pctchg = d3.format("+,.1%");
		var o = {};

		//decorate the standard d3 formatting functions because they don't handle null values well
		o.share = function(v){return v===null ? "NA" : d3share(v)};
		o.pctchg = function(v){return v===null ? "NA" : d3pctchg(v)};
		o.num = function(v){return v===null ? "NA" : d3num(v)}
		return o;
	})();

	//coerce string to number
	function coerce2num(v){
		var n = +(v+"");
		return (v===null || v==="NA" || isNaN(n)) ? null : n;
	}

	//parser for data file import
	function parser(d){
		var row = {};
		return row;
	}

	//pull in data and do some setup
	d3.csv(scope.repo+"Data.csv", parser, function(dat){
		if(dat===null){
			return null; //no-op if there's an error retrieving data
		}
		else{

		}
	});

	//TESTING OUT V4

	function gen(n, pairs, max){
		var p = !!pairs;
		var m = !!max ? max : 500;
		var a = [];
		for(var i=0; i<n; i++){
			if(p){
				a.push([Math.round(Math.random()*m), Math.round(Math.random()*m)]);
			}
			else{
				a.push(Math.round(Math.random()*m));
			}
			
		}
		return a;
	}

	dom.svg.style("width","600px").style("height","600px");

	var us = dom.svg.append("g").selectAll("circle").data(gen(5, true));
	var es = us.enter().append("circle")
		   .attr("cx", function(d,i){return d[0]})
		   .attr("cy", function(d,i){return d[1]})
		   .attr("r", function(d,i){return Math.random()*12});
	
	console.log(us);
	console.log(es);

	var esj = JSON.stringify(es._groups);

	var ms = us.merge(es);

	var msj = JSON.stringify(ms._groups);

	setTimeout(function(){
		var us1 = dom.svg.select("g").selectAll("circle").data(gen(6, true));
		var es1 = us1.enter().append("circle");
		console.log(us1);
		console.log(es1);
		var ns1 = us1.merge(es1);
		console.log(ns1);
	}, 1000);

	

})(); //end of closure