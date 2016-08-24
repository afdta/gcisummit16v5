gci2016.map = {};
gci2016.map.geojson = null;
gci2016.map.aspect = 9/16;
gci2016.map.wrap = d3.select("#gci2016mapwrap");
gci2016.map.svg = gci2016.map.wrap.append("svg");
gci2016.map.layers = {};
gci2016.map.layers.borders = gci2016.map.svg.append("g");
gci2016.map.layers.cities = gci2016.map.svg.append("g");
gci2016.map.layers.top = gci2016.map.svg.append("g");
gci2016.map.projection = d3.geoNaturalEarth();
gci2016.map.path = d3.geoPath().projection(gci2016.map.projection);
gci2016.map.scale = 175; //base scale value, itself scaled in the size method below

//set map dimensions and redraw (if map has been initialized)
gci2016.map.size = function(){
	var width = gci2016.map.width = gci2016.dom.getwidth();
	var height = gci2016.map.height = gci2016.map.aspect*width;

	gci2016.map.projection.translate([width/2, height/2]).scale(gci2016.map.scale*(width/1000));
	gci2016.map.svg.style("height",height+"px").style("width",width+"px");
}

gci2016.map.drawcountries = function(){
	if(gci2016.map.geojson){
		var sphere = gci2016.map.layers.top.selectAll("path").data([{type:"Sphere"}]);
		var s = sphere.enter().append("path").merge(sphere);
		
		s.attr("d", gci2016.map.path).attr("fill","none").attr("stroke","#aaaaaa").attr("stroke-width","1px");

		var countries = gci2016.map.layers.borders.selectAll("path.country").data(gci2016.map.geojson.features);
		var c = countries.enter().append("path").classed("country",true).merge(countries);

		c.attr("fill","#ffffff").attr("stroke","#aaaaaa").attr("stroke-width","0.5px").attr("d", gci2016.map.path);
	}
}

gci2016.map.drawcities = function(){
	if(gci2016.data){

	}
}

//convenience method that also resizes the map to fit the current viewport
gci2016.map.draw = function(){
	gci2016.map.size();

	gci2016.map.drawcountries();
	gci2016.map.drawcities();
}

window.addEventListener("resize", gci2016.map.draw);