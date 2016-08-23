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
		var height = 400;
		var zrange = [-2,4]

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

		var x = d3.scaleBand().domain(vars).range([0,100]).round(true).paddingOuter(1).align(0.5);
		var y = d3.scaleLinear().domain(zrange).range([height, 0]);

		var svg = wrapper.style("width","100%").style("height",height+"px").append("svg").style("height","100%").style("width","100%");

		svg.append("line").attr("x1","0%").attr("x2","100%").attr("y1",y(0)).attr("y2",y(0)).attr("stroke","#dddddd").style("shape-rendering","crispEdges").attr("stroke-width","2px");


		var dots = svg.selectAll("g").data(dat).enter().append("g")
					  .selectAll("circle").data(function(d,i){return d}).enter().append("circle")
					  .attr("cx",function(d,i){return x(d.var)+"%"})
					  .attr("cy",function(d,i){return y(d.val)})
					  .attr("fill","#cccccc")
					  .attr("r",5);

		var this_group = dots.filter(function(d,i){
			return d.id == id;
		}).raise().attr("fill","red");

		return function(){
			this_group.transition().attr("r",10);
		};


		///OLD BELOW	


		var vargroups = [vars.slice(0,4), vars.slice(4,8), vars.slice(8,9), vars.slice(9,12), vars.slice(12,14), vars.slice(14)];
		var slice_width = 100/vars.length;

		var plotgroups = wrapper.selectAll("div.plotgroup").data(vargroups).enter().append("div").classed("plotgroup c-fix",true)
			.style("width",function(d,i){
				return (d.length * slice_width)+"%";
			});

		var slices = plotgroups.selectAll("div").data(function(d,i){
			var w = Math.floor(100/d.length) + "%";
			return d.map(function(d,i,a){
				var vals = data.z.groups.map(function(e,i,a){
					return {id:e.id, val:e[d]};
				});
				return {l:d, w:w, vals:vals}
			});
		}).enter().append("div").classed("plotslice",true).style("width", function(d,i){return d.w}).style("height",height+"px");

		var zrange = [-2,4];
		
		var svg = slices.append("svg").style("width","100%").style("height","100%");



		var dots = svg.selectAll("circle").data(function(d,i){return d.vals}).enter().append("circle")
							.attr("cx","50%").attr("cy",function(d,i){return y(d.val)}).attr("r",4).attr("fill","#666666");

		var groupCircles = plotgroups.selectAll("circle").filter(function(d,i){
				return d.id.replace(/[a-z]*/,"") == id+"";
			}).raise().attr("fill","red");



		return function(){
			groupCircles.transition().duration(700).attr("r",8);
		}; 


//old
		zrange = [-2,9];
		zrange = [-2,4];

		var xpad = 25;

		
		
		
		var svg = wrapper.append("svg").style("height",height+"px").style("width",width+"px");

		var mg = svg.append("g").selectAll("g").data(data.z.metros).enter().append("g");
		var gg = svg.append("g").selectAll("g").data(data.z.groups).enter().append("g");
		
		/*var metdots = mg.selectAll("circle").data(function(d,i){
			var D = [];
			for(var p in d){
				if(d.hasOwnProperty(p) && !(p in {id:1, label_cluster:1, tot_emp2015:1, X2015_realgdp:1})){
					D.push({var:p, val:d[p]});
				}
			}
			return D;
		}).enter().append("circle").style("opacity",0.4);

		metdots.attr("cx", function(d,i){return x(d.val)}).attr("cy", function(d,i){return y(d.var)}).attr("r",2);*/

		var groupdots = gg.selectAll("circle").data(function(d,i){
			var D = [];
			for(var p in d){
				if(d.hasOwnProperty(p) && !(p in {id:1, label_cluster:1, tot_emp2015:1, X2015_realgdp:1})){
					D.push({var:p, val:d[p]});
				}
			}
			return D;
		}).enter().append("circle").style("opacity",0.4);

		groupdots.attr("cy", function(d,i){return y(d.val)}).attr("cx", function(d,i){return x(d.var)}).attr("r",2);

		var titles = svg.selectAll("text").data(vars).enter()
						.append("text").attr("y",y(0)).attr("x",function(d,i){return x(d)-5})
						.attr("text-anchor","middle")
						.text(function(d,i){return d}).style("font-size","13px");

		svg.append("line").attr("x1",x(0)).attr("x2",x(0)).attr("y1",0).attr("y2",height).attr("stroke","#dddddd");

		var activate = function(){
			svg.append("text").text(id).attr("x",100).attr("y",20).style("opacity",0).transition().duration(500).style("opacity",1);
			console.log("activate "+ id);

			gg.filter(function(d,i){
				return d.label_cluster+"" == id+"";
			}).transition().selectAll("circle").attr("fill","red").attr("r",8);
		}
		return activate;
	}

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