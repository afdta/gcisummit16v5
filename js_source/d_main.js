(function(){
	var scope = gci2016;
	var dom = scope.dom;

	var dotplots = d3.selectAll("div.dotplot");

	//signature for map setup: function(container, map_width, register_resize, render_as_canvas)
	//notes set a max width : 
	var width_fn = function(){return gci2016.dom.getwidth(1600)}
	var sm_width_fn = function(){
		try{
			var box = this.getBoundingClientRect();
			var w = Math.floor(box.right - box.left);
		}
		catch(e){
			var w = 400;
		}
		return w;
	}

	var bigmap = gci2016.map.setup(gci2016.dom.mapwrap.node(), width_fn, true, true);

	d3.json(scope.repo + "data.json", function(error, dat){
		if(error){
			return null;
		}
		gci2016.data = dat;

		if(gci2016.map.geojson){initialDraw()}
	});

	d3.json(gci2016.repo + "world.json", function(error, dat){
		if(error){
			return null;
		}
		gci2016.map.geojson = topojson.feature(dat, dat.objects.countries);
		
		if(gci2016.data){initialDraw()}
	});

	function initialDraw(){

		var text = [
			{cluster:1, num:22, name:"Factory China", description:"Second and third-tier Chinese cities distinctly reliant on export-intensive manufacturing to power economic growth and global engagement."},
			{cluster:2, num:19, name:"Knowledge Capitals", description:"Mid-sized, highly productive knowledge creation centers in the United States and Europe with talented workforces and elite research universities."},
			{cluster:3, num:28, name:"Emerging Gateways", description:"Large business and transportation entry points for major national and regional emerging markets in Africa, Asia, Eastern Europe, and Latin America."},
			{cluster:4, num:5, name:"Asian Anchors", description:"Large, business and financial nodes anchoring inward investment into the Asia-Pacific plus Moscow. "},
			{cluster:5, num:6, name:"Global Giants", description:"Large, wealthy hubs with concentrations of corporate headquarters and serve as the command and control centers for the world’s largest advanced economies."},
			{cluster:6, num:16, name:"American Middleweights", description:"Mid-sized U.S. metro areas striving for a post-recession niche in the global economy."},
			{cluster:7, num:26, name:"International Middleweights", description:"Mid-sized cities in Australia, Canada, and Europe globally connected by people and investment flows, but where growth has lagged after the financial crisis."}
		]
		bigmap.draw("X2015_nomgdp");

		dotplots.each(function(d,i){
			var thiz = d3.select(this);

			var group = thiz.append("div").classed("c-fix cluster-group-description",true);

			var title = group.append("p").classed("cluster-title",true);
				title.insert("div").style("background-color", gci2016.cols[text[i].cluster]);
				title.insert("span").text(text[i].name).style("vertical-align","middle");
				
			var map = group.append("div").classed("right-col small-map",true);
			var mapObject = gci2016.map.setup(map.node(), sm_width_fn, true, true).draw(4, text[i].cluster);

			var dummytext = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In posuere laoreet sodales. Donec gravida vulputate dui, quis auctor arcu mollis et. Suspendisse mattis ultrices est, vel volutpat nisl feugiat vitae. Fusce laoreet malesuada dignissim. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Ut quis orci nec lacus lobortis consectetur sit amet eleifend quam. Donec luctus pellentesque diam, sit amet egestas lectus malesuada sit amet. Phasellus a eleifend tortor. Sed quis dictum elit.";
			var description = group.selectAll("p.reading").data([text[i].description, dummytext]);
				description.enter().append("p").classed("reading",true)
											   .classed("zero-top-margin", function(d,i){return i==0})
											   .text(function(d,i){return d})
												;

			thiz.append("p").text(text[i].name + " by the numbers").style("margin","20px 0px 0px 3%").style("font-weight","bold").style("font-size","1em");
			thiz.append("p").text("Average group performance on indicators that describe the position of metro areas in the global economy. [need language]").style("margin","0.5em 0px 30px 3%");

			var plot = thiz.append("div");

			scope.scroll.register(plot.node(), scope.dotPlot.call(plot.node(), text[i].cluster, gci2016.data), function(c){});
			scope.scroll.register(map.node(), mapObject.filter);
		});
	}	

	function scroll(){
		var bbox = dom.fixedframewrap.node().getBoundingClientRect();
		if(bbox.top <= 80){
			dom.fixedframe.style("position","fixed").style("top","80px").style("display","block");
			d3.select("#dummy-banner").style("display","block").style("top","0px").style("left","0px"); //remove for production
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