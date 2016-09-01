gci2016.map = {};
gci2016.map.geojson = null;

//refine the indicator selection process -- what if no valid indicator is passed?
//done -- with first round of edits. implement in d_main for debugging

//create a map in the given container
//map_width is a function or a constant that determines the width of the map -- it is called with the map wrapper as the thisobject
gci2016.map.setup = function(container, map_width, register_resize, render_as_canvas){
	var scope = {};

	scope.aspect = 0.5;
	//append another div as the wrapper so that the sizing is immune to padding of container
	scope.wrap = d3.select(container).append("div").style("position","relative").style("padding","0px");
	scope.canvas = scope.wrap.append("canvas").style("position","absolute").style("top","0px").style("left","0px");
	scope.context = scope.canvas.node().getContext("2d");
	scope.svg = scope.wrap.append("svg").style("position","relative").style("top","0px").style("left","0px");
	scope.layers = {};
	scope.layers.bottom = scope.svg.append("g");
	scope.layers.borders = scope.svg.append("g");
	scope.layers.cities = scope.svg.append("g");
	scope.layers.top = scope.svg.append("g");
	scope.projection = d3.geoNaturalEarth();
	scope.path = d3.geoPath().projection(scope.projection);
	scope.scale = 175; //base scale value, itself scaled in the size method below
	scope.filtered = false;

	scope.indicator = null; //indicator used to scale circle radii
	scope.radius = 5; //defaults to a constant, but can also be a function

	//set map dimensions and redraw (if map has been initialized)
	scope.size = function(){
		try{var width = scope.width = (typeof map_width == "function" ? map_width.call(scope.wrap.node()) : map_width);}
		catch(e){var width = scope.width = 780;}
		
		var height = scope.height = Math.round(scope.aspect*width);

		scope.projection.translate([width/2, height/2]).scale(scope.scale*(width/1100));
		scope.svg.style("height",height+"px").style("width",width+"px");
		scope.canvas.attr("height",height+"px").attr("width",width+"px"); //canvas will redraw when resetting these attributes
	}

	scope.drawcountries = function(){
		if(!gci2016.map.geojson){
			return null;
		}

		if(!!render_as_canvas){
			var context = scope.context;

			//path will now render to canvas context
			scope.path.context(context);

			context.beginPath();
			scope.path({type:"Sphere"});
			context.fillStyle="#dddddd";
			context.strokeStyle="#aaaaaa";
			context.stroke();
			context.fill();
			
			var graticule = d3.geoGraticule();
			context.beginPath();
			scope.path(graticule());
			context.strokeStyle="#cccccc";
			context.stroke();

			context.strokeStyle="#aaaaaa";
			for(var f=0; f< gci2016.map.geojson.features.length; f++){
				context.beginPath();
				scope.path(gci2016.map.geojson.features[f]);
				//console.log(gci2016.map.geojson.features[f]);
				context.fillStyle="#ffffff";
				context.stroke();
				context.fill();
			}

			context.beginPath();
			scope.path({type:"Sphere"});
			context.strokeStyle="#aaaaaa";
			context.stroke();

			//reset to null context
			scope.path.context(null);
		}		
		else{
			var sphere = scope.layers.bottom.selectAll("path.sphere").data([{type:"Sphere"}]);
			var s = sphere.enter().append("path").classed("sphere",true).merge(sphere);
			s.attr("d", scope.path).attr("fill","#dddddd").attr("stroke","#aaaaaa").attr("stroke-width","1px");

			var graticule = d3.geoGraticule();
			var grat = scope.layers.bottom.selectAll("path.graticule").data([graticule()]);
			var g = grat.enter().append("path").classed("graticule",true).merge(grat);
			g.attr("d", scope.path).attr("fill","none")
				.attr("stroke","#ffffff").attr("stroke-width","1px").attr("stroke-dasharray","2,2");

			var countries = scope.layers.borders.selectAll("path.country").data(gci2016.map.geojson.features);
			var c = countries.enter().append("path").classed("country",true).merge(countries);
			c.attr("fill","#ffffff").attr("stroke","#aaaaaa").attr("stroke-width","0.5px").attr("d", scope.path);

			var sphere2 = scope.layers.top.selectAll("path.sphere").data([{type:"Sphere"}]);
			var s2 = sphere2.enter().append("path").classed("sphere",true).merge(sphere2);
			s2.attr("d", scope.path).attr("fill","none").attr("stroke","#aaaaaa").attr("stroke-width","1px");
		}
	}

	scope.drawcities = function(indicatorName, clusterNumber){
		var cols = gci2016.cols;
	 	
		if(gci2016.data){

			//build a mutable array of objects that hold original data (which should not be mutated)
			if(!scope.data){
				scope.data = gci2016.data.vals.metros.map(function(d,i,a){
					return {id:d.id, metro:d.metro, country:d.country, cluster:d.label_cluster, lonlat:[d.lon, d.lat], vals:d}
				});
			}

			var previousIndicator = scope.indicator;
			var indicator = !!indicatorName ? indicatorName : scope.indicator;

			var constantR = !isNaN(parseFloat(indicator)) && isFinite(indicator);
			
			//set the radius function and record a valid indicator
			try{
				if(constantR){
					scope.radius = indicator;
				}
				else{
					var range = d3.extent(scope.data, function(d){return d.vals[indicator]});
					if(range[0]==null || range[1]==null){throw "bad_range"};
					
					var scale = d3.scaleSqrt().domain(range).range([2,20]);
					scope.radius = function(d,i){return scale(d.vals[indicator])}

					if(!indicator){throw "no_indicator"}
				}
				scope.indicator = indicator;
			}
			catch(e){
				scope.indicator = previousIndicator;
				scope.radius = 5;
			}

			//if a valid (non-constant) indicator is exists... sort the map data by it to prevent occlusions
			if(scope.indicator && !constantR){
				scope.data.sort(function(a,b){
					try{
						var r = b.vals[scope.indicator] - a.vals[scope.indicator];
					} 
					catch(e){
						var r = 0;
					}
					return r;
				});
			}

			if(clusterNumber){
				scope.clusterNumber = clusterNumber;
				scope.data.sort(function(a,b){
					if(a.cluster == clusterNumber){
						var o = 1;
					}
					else if(b.cluster == clusterNumber){
						var o = -1;
					}
					else{
						var o = 0;
					}
					return o;
				});
			}

			//var nodes = [];
			//var links = [];

			//mutate each observation by updating projection xy
			for(var md=0; md<scope.data.length; md++){
				scope.data[md].xy = scope.projection(scope.data[md].lonlat);

				//add objects to the nodes array for force-layout based label placement -- not implemented
				//nodes.push({id:mapdata[md].id, metro:mapdata[md].metro, x:mapdata[md].xy[0], y:mapdata[md].xy[1], fx:mapdata[md].xy[0], fy:mapdata[md].xy[1], type:"anchor"});
				//nodes.push({id:mapdata[md].id, metro:mapdata[md].metro, x:mapdata[md].xy[0], y:mapdata[md].xy[1], ox:mapdata[md].xy[0], oy:mapdata[md].xy[1], type:"text"});
			}

			//for(var ln=0; ln<nodes.length; ln=ln+2){
			//	links.push({source:ln, target:ln+1});
			//}

			/*var sim = d3.forceSimulation(nodes).alphaDecay(0.5)
				.force("link", d3.forceLink(links).distance(25))
				//.force("repel", d3.forceManyBody().strength(-40).distanceMax(100))
				//.force("halo", d3.forceCollide(18))

			sim.on("end", function(){
				var labels = gci2016.map.layers.cities.selectAll("text.city").data(nodes);
				var l = labels.enter().append("text").classed("city",true).merge(labels);
				l.attr("x",function(d,i){return d.x})
				.attr("y",function(d,i){return d.y})
				.text(function(d,i){return d.type=="text" ? d.metro : ""});

				console.log(nodes);
			});*/

			var cities = scope.layers.cities.selectAll("circle.city").data(scope.data);
			cities.exit().remove();
			var c = scope.cities = cities.enter().append("circle").classed("city",true).merge(cities);
			c.attr("cx",function(d,i){return d.xy[0]})
			 .attr("cy",function(d,i){return d.xy[1]})
			 .attr("r",scope.radius)
			 .attr("fill-opacity",0.7);

			if(scope.filtered && scope.clusterNumber){
				c.attr("fill", function(d,i){return d.cluster == scope.clusterNumber ? cols[d.cluster] : "#bbbbbb"})
			 	 .attr("stroke",function(d,i){return d.cluster == scope.clusterNumber ? d3.rgb(cols[d.cluster]).darker() : "#ffffff"});				
			}
			else{
				c.attr("fill", function(d,i){return cols[d.cluster]})
			 	 .attr("stroke",function(d,i){return d3.rgb(cols[d.cluster]).darker()});	
			}


			 c.order();

		}
	}

	//convenience method that also resizes the map to fit the current viewport
	scope.draw = function(indicatorName, clusterNumber){
		scope.size();
		scope.drawcountries();
		scope.drawcities(indicatorName, clusterNumber);
		return scope;
	}

	scope.filter = function(){
		if(scope.cities && scope.clusterNumber){

			scope.cities.filter(function(d,i){
				return d.cluster != scope.clusterNumber;
			})
			.transition().duration(1000).attr("fill","#bbbbbb").attr("stroke","#ffffff");

			scope.filtered = true;
		}
	}

	if(!!register_resize){
		window.addEventListener("resize", function(){scope.draw()});
	}

	return scope;
}
