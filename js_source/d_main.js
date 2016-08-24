(function(){
	var scope = gci2016;
	var dom = scope.dom;

	var sections = {};
	sections["group1"] = document.getElementById("group1_dotplot");
	sections["group2"] = document.getElementById("group2_dotplot");
	sections["group3"] = document.getElementById("group3_dotplot");
	sections["group4"] = document.getElementById("group4_dotplot");
	sections["group5"] = document.getElementById("group5_dotplot");
	sections["group6"] = document.getElementById("group6_dotplot");
	sections["group7"] = document.getElementById("group7_dotplot");


	d3.json(scope.repo + "data.json", function(error, dat){
		if(error){
			return null;
		}

		for(var e in sections){
			if(sections.hasOwnProperty(e)){
				scope.scroll.register(sections[e], scope.dotPlot.call(sections[e], e.replace(/[a-z]*/, ""), dat))
			}
		}

		gci2016.data = dat;

		gci2016.map.draw();
	});

	d3.json(gci2016.repo + "world.json", function(error, dat){
		if(error){
			return null;
		}

		gci2016.map.geojson = topojson.feature(dat, dat.objects.countries);

		console.log(gci2016.map.geojson);
		gci2016.map.draw();
	});	

	function scroll(){
		var bbox = dom.fixedframewrap.node().getBoundingClientRect();
		if(bbox.top <= 80){
			dom.fixedframe.style("position","fixed").style("top","80px").style("display","block");
			d3.select("#dummy-banner").style("display","block"); //remove for production
		}
		else{
			dom.fixedframe.style("position","relative").style("top","0px").style("display","none");
			d3.select("#dummy-banner").style("display","none"); //remove for production
		}
	}

	//window.addEventListener("resize", resizer);

	window.addEventListener("scroll", scope.scroll.activateListeners);
	window.addEventListener("scroll", scroll);

})();