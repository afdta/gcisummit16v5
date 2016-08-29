gci2016.map = {};
gci2016.map.geojson = null;
gci2016.map.aspect = 0.5;
gci2016.map.wrap = d3.select("#gci2016mapwrap");
gci2016.map.canvas = gci2016.map.wrap.append("canvas").style("position","absolute");
gci2016.map.context = gci2016.map.canvas.node().getContext("2d");
gci2016.map.svg = gci2016.map.wrap.append("svg").style("position","relative");
gci2016.map.layers = {};
gci2016.map.layers.bottom = gci2016.map.svg.append("g");
gci2016.map.layers.borders = gci2016.map.svg.append("g");
gci2016.map.layers.cities = gci2016.map.svg.append("g");
gci2016.map.layers.top = gci2016.map.svg.append("g");
gci2016.map.projection = d3.geoNaturalEarth();
gci2016.map.path = d3.geoPath().projection(gci2016.map.projection);
gci2016.map.scale = 175; //base scale value, itself scaled in the size method below

gci2016.map.indicator = null; //indicator used to scale circle radii
gci2016.map.radius = 5; //defaults to a constant, but can also be a function

//set map dimensions and redraw (if map has been initialized)
gci2016.map.size = function(){
	var width = gci2016.map.width = gci2016.dom.getwidth(1600);
	var height = gci2016.map.height = gci2016.map.aspect*width;

	gci2016.map.projection.translate([width/2, height/2]).scale(gci2016.map.scale*(width/1100));
	gci2016.map.svg.style("height",height+"px").style("width",width+"px");

	gci2016.map.canvas.attr("height",height+"px").attr("width",width+"px");
	//gci2016.map.context = gci2016.map.canvas.node().getContext("2d");
}

gci2016.map.drawcountries = function(){
	var context = gci2016.map.context;

	if(gci2016.map.geojson){

		//canvas rendering
		gci2016.map.path.context(context);

		context.beginPath();
		gci2016.map.path({type:"Sphere"});
		context.fillStyle="#dddddd";
		context.strokeStyle="#aaaaaa";
		context.stroke();
		context.fill();
		
		var graticule = d3.geoGraticule();
		context.beginPath();
		gci2016.map.path(graticule());
		context.strokeStyle="#cccccc";
		context.stroke();

		context.strokeStyle="#aaaaaa";
		for(var f=0; f<gci2016.map.geojson.features.length; f++){
			context.beginPath();
			gci2016.map.path(gci2016.map.geojson.features[f]);
			//console.log(gci2016.map.geojson.features[f]);
			context.fillStyle="#ffffff";
			context.stroke();
			context.fill();
		}

		context.beginPath();
		gci2016.map.path({type:"Sphere"});
		context.strokeStyle="#aaaaaa";
		context.stroke();

		return null;

		//end canvas rendering

		var sphere = gci2016.map.layers.bottom.selectAll("path.sphere").data([{type:"Sphere"}]);
		var s = sphere.enter().append("path").classed("sphere",true).merge(sphere);
		s.attr("d", gci2016.map.path).attr("fill","#dddddd").attr("stroke","#aaaaaa").attr("stroke-width","1px");

		var graticule = d3.geoGraticule();
		var grat = gci2016.map.layers.bottom.selectAll("path.graticule").data([graticule()]);
		var g = grat.enter().append("path").classed("graticule",true).merge(grat);
		g.attr("d", gci2016.map.path).attr("fill","none")
			.attr("stroke","#ffffff").attr("stroke-width","1px").attr("stroke-dasharray","2,2");

		var countries = gci2016.map.layers.borders.selectAll("path.country").data(gci2016.map.geojson.features);
		var c = countries.enter().append("path").classed("country",true).merge(countries);
		c.attr("fill","#ffffff").attr("stroke","#aaaaaa").attr("stroke-width","0.5px").attr("d", gci2016.map.path);

		var sphere2 = gci2016.map.layers.top.selectAll("path.sphere").data([{type:"Sphere"}]);
		var s2 = sphere2.enter().append("path").classed("sphere",true).merge(sphere2);
		s2.attr("d", gci2016.map.path).attr("fill","none").attr("stroke","#aaaaaa").attr("stroke-width","1px");
	}
}

gci2016.map.drawcities = function(indicatorName, centerAtZero){

	gci2016.map.path.context(null);

	var cols = gci2016.cols;
 	
 	
	if(gci2016.map.data){
		var previousIndicator = gci2016.map.indicator;
		var indicator = !!indicatorName ? indicatorName : gci2016.map.indicator;
		
		try{
			var range = d3.extent(gci2016.map.data, function(d){return d.vals[indicator]});
			if(range[0]==null || range[1]==null){throw "bad_range"};
			
			var scale = d3.scaleSqrt().domain(range).range([2,20]);
			gci2016.map.radius = function(d,i){return scale(d.vals[indicator])}
		}
		catch(e){
			console.log(e);
			gci2016.map.indicator = previousIndicator;
			gci2016.map.radius = 5;
		}

		//if a valid indicator is passed -- sort the data
		if(gci2016.map.indicator){
			var mapdata = gci2016.map.data.slice(0);
			mapdata.sort(function(a,b){
				try{
					var r = b.vals[gci2016.map.indicator] - a.vals[gci2016.map.indicator];
				} 
				catch(e){
					var r = 0;
				}
				return r;
			});
		}
		else{
			var mapdata = gci2016.map.data;
		}

		var nodes = [];
		var links = [];

		//mutate each observation by updating projection xy
		for(var md=0; md<mapdata.length; md++){
			mapdata[md].xy = gci2016.map.projection(mapdata[md].lonlat);

			//add objects to the nodes array for force-layout based label placement -- not implemented
			nodes.push({id:mapdata[md].id, metro:mapdata[md].metro, x:mapdata[md].xy[0], y:mapdata[md].xy[1], fx:mapdata[md].xy[0], fy:mapdata[md].xy[1], type:"anchor"});
			nodes.push({id:mapdata[md].id, metro:mapdata[md].metro, x:mapdata[md].xy[0], y:mapdata[md].xy[1], ox:mapdata[md].xy[0], oy:mapdata[md].xy[1], type:"text"});
		}

		for(var ln=0; ln<nodes.length; ln=ln+2){
			links.push({source:ln, target:ln+1});
		}

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

		var cities = gci2016.map.layers.cities.selectAll("circle.city").data(mapdata);
		var c = cities.enter().append("circle").classed("city",true).merge(cities);
		c.attr("cx",function(d,i){return d.xy[0]})
		 .attr("cy",function(d,i){return d.xy[1]})
		 .attr("r",gci2016.map.radius)
		 .attr("fill-opacity",0.7)
		 .attr("fill", function(d,i){return cols[d.cluster-1]})
		 .attr("stroke",function(d,i){return d3.rgb(cols[d.cluster-1]).darker()});


	}
}

//convenience method that also resizes the map to fit the current viewport
gci2016.map.draw = function(){
	gci2016.map.size();

	gci2016.map.drawcountries();
	gci2016.map.drawcities();
}

window.addEventListener("resize", gci2016.map.draw);