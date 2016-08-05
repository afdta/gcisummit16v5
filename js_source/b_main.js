//global namespace for interactive
gci2016 = {};

//closure containing interactive logic
(function(){

	//containers for local variables and dom references
	var scope = gci2016;
	var dom = scope.dom = {};

	//directory containing data assets
	scope.repo = "./data/";
	//edit this: scope.repo = "directory/on/wordpress";

	dom.wrap = d3.select("#gci2016wrap");
	dom.fixedframewrap = d3.select("#gci2016fixedframewrap");
	dom.fixedframe = d3.select("#gci2016fixedframe");
	dom.mapwrap = d3.select("#gci2016mapwrap");

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