(function(){
	var scope = gci2016;
	var dom = scope.dom;

	var dotplots = d3.select("#dotplots").selectAll("div.dotplot").data([4,3,2,0,1,5,6])
					 .enter().append("div").classed("dotplot gcisection",true);

	//signature for map setup: function(container, map_width, register_resize, render_as_canvas)
	//notes set a max width : 
	var width_fn = function(){return gci2016.getdim(gci2016.dom.wrapn, 1600).width}
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

	var bigmap = gci2016.map.setup(gci2016.dom.mapwrap.node(), width_fn, true, true)
	bigmap.voro = true;

	d3.json(scope.repo + "data.json", function(error, dat){
		if(error){
			return null;
		}
		gci2016.data = dat;
		gci2016.rankFns = {};

		var vals = dat.data.vals.metros;

		var data_vars = [];
		for(var v in dat.meta.vars){
			if(dat.meta.vars.hasOwnProperty(v) && dat.meta.vars[v].cat !== "id"){
				data_vars.push(dat.meta.vars[v]);
				try{
					//build ranking functions that can rank against all metros or a particular cluster
					gci2016.rankFns[v] = gci2016.calc_rank(vals, function(d){return d[v]}, function(d){return d.V2});
				}
				catch(e){
					gci2016.rankFns[v] = function(v){return 0}
				}
			}
		}
		data_vars.sort(function(a,b){
			var ai = (a.varid.replace(/V| */,""));
			var bi = (b.varid.replace(/V| */,""));
			return ai-bi;
		});

		gci2016.data_vars = data_vars;

		gci2016.cluster_map = {};
		for(var c=0; c<dat.meta.clusters.length; c++){
			gci2016.cluster_map[dat.meta.clusters[c].cluster] = dat.meta.clusters[c];
		}

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
		var text = gci2016.data.meta.clusters;

		bigmap.draw("V4")
			  .addTitle("Remapping the 123 largest global cities")
			  .addLegend()
			  //.tooltip()
			  //.addSearch()
			  //.addTable();

		dotplots.each(function(d,i){
			var thiz = d3.select(this);

			var group = thiz.append("div").classed("c-fix cluster-group-description",true);

			var title = group.append("p").classed("cluster-title",true);
				title.insert("div").style("background-color", gci2016.cols[text[d].cluster]);
				title.insert("span").text(text[d].name).style("vertical-align","middle");
				
			var map = group.append("div").classed("small-map",true);
			var mapObject = gci2016.map.setup(map.node(), sm_width_fn, true, true).draw(4, text[d].cluster);

			var description = group.selectAll("p.reading").data([text[d].description]);
				description.enter().append("p").classed("reading",true)
											   .classed("zero-top-margin", function(d,i){return i==0})
											   .text(function(d,i){return d})
												;

			thiz.append("p").text("Competitiveness profile: "+text[d].name + " by the numbers").style("margin","20px 0% 0px 3%").style("font-weight","bold").style("font-size","1.2em");
			thiz.append("p").text("Economic characteristics and competitiveness factors by type of global city").style("margin","0.5em 0px 30px 3%");

			var plot = thiz.append("div");

			scope.scroll.register(plot.node(), scope.dotPlot.call(plot.node(), text[d].cluster, gci2016.data), function(c){});
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