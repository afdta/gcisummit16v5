
//dotPlot is called with the enclosing dom container element as the this object
gci2016.dotPlot = function(cluster, dat){
	var thiz = this;
	var wrapper = d3.select(this).classed("c-fix",true);
	var error = false;
	var data = dat.data;
	var zrange = [-1.7,3.5];

	try{
		var thisBox = this.getBoundingClientRect();
		var width = thisBox.right - thisBox.left;
		var landscape = width > 780 ? true : false;
	}
	catch(e){
		var landscape = false;
		var width = 480;
	}

	//var width = gci2016.getdim(thiz).width;
	var height = 270;

	var metrodat = d3.nest().key(function(d,i){return ("c"+d.V20)})
					 .object(data.vals.metros)[("c"+cluster)];

	var dat = gci2016.data_vars.map(function(D,I,A){
		var s = data.z.groups.map(function(d,i,a){
			return {cluster:d.V20, val:d[D.varid], var:D.varid, varname:D.name}
		});

		var m = metrodat.map(function(d,i,a){
			return {name:d.V1, val:d[D.varid]}
		})

		m.sort(function(a,b){
			if(a.val == null){
				var r = 1;
			}
			else if(b.val == null){
				var r = -1;
			}
			else{
				var r = a.val < b.val ? 1 : -1;
			}
			return r;
		});

		return {dat:s, var:D.varid, varname:D.name, metros:m};
	});

	var x = d3.scaleBand().domain(gci2016.data_vars.map(function(d,i){return d.varid})).range([0,100]).round(false).paddingOuter(0.2).align(0.5);
	var y = d3.scaleLinear().domain(zrange).range([height, 0]);

	var po = x.paddingOuter();
	var pi = x.paddingInner();
	var step = x.step();
	var halfstep = step/2;

	//console.log("po: "+po+" pi: "+pi+" step: "+step);
	var chartwrap = wrapper.append("div").classed("makesans",true).style("position","relative");
	
	var svg = chartwrap.style("width","100%").append("svg").style("height",height+"px").style("width","100%");
	var main_group = svg.append("g");
	var anno_group = svg.append("g");
	var anno_circle = null;

	var category_container = chartwrap.append("div").classed("c-fix",true).style("width","100%");
	var label_container = chartwrap.append("div").classed("c-fix",true).style("width","100%");

	var tooltip = chartwrap.append("div")
			.style("position","absolute")
			.style("z-index",25)
			.style("display","none")
			.style("min-height","200px")
			.style("padding","15px")
			.style("border","1px solid #aaaaaa")
			.style("background-color","rgba(255,255,255,0.9)")
			.style("pointer-events","none")
			.style("max-width","300px");

	var labels_update = label_container.selectAll("div").data(gci2016.data_vars);
	var labels_enter = labels_update.enter().append("div");
		labels_enter.append("p");


	var labels = labels_enter.merge(labels_update);
	labels.style("float","left")
		.style("margin",function(d,i){
			if(i===0){
				var m = "0px 0px 5px " + (po*step) + "%";
			}
			else if(i===gci2016.data_vars.length-1){
				var m = "0px " + (po*step) + "% 5px 0px";
			}
			else{
				var m = "0px 0px";
			}
			return m;
		})
		.style("width",step+"%")
		.style("overflow","hidden");
	labels.select("p")
			.text(function(d,i){return d.nameshort})
			.style("text-align","center")
			.style("font-size","13px")
			.style("margin","0px 4px")
			.style("word-break","nromal");

	var categories_update = category_container.selectAll("div").data([]);
	var categories_enter = categories_update.enter().append("div").style("height","100%");
	categories_enter.append("div").style("border","1px solid #aaaaaa")
					.style("border-width",function(d,i){
						return "0px 0px 1px 0px";

						if(i===0){var b="0px 1px 0px 1px"}
						else{var b="0px 1px 0px 0px"}
						return b;
					})
					.style("margin","0px 5px 0px 5px")
					.style("background",function(d,i){
						//return "linear-gradient(rgba(255,255,255,0), #e0e0e0)";
						//return !!d.col ? d.col : "none";
						return "none";
						return "#e9e9e9";
					})
					.append("p").text(function(d,i){return d.name})
					.style("text-align","center")
					.style("margin","0px 0px 0px 0px")
					.style("padding","2px 5px")
					.style("font-size","13px");
	var categories = categories_enter.merge(categories_update);
	categories.style("float","left")
			.style("width", function(d,i){
				return (d.colspan*step)+"%";
			})
			.style("margin",function(d,i){
				if(i===0){
					var m = "0px 0px 3px " + (po*step) + "%";
				}
				else if(i===gci2016.data_vars.length-1){
					var m = "0px " + (po*step) + "% 3px 0px";
				}
				else{
					var m = "0px 0px";
				}
				return m;
			});


	main_group.append("line").attr("x1",(step*po)+"%").attr("x2",(100-(step*po))+"%").attr("y1",y(0)).attr("y2",y(0)).attr("stroke","#666666").style("shape-rendering","crispEdges").attr("stroke-width","1px");
	main_group.append("text").attr("x",(po*step)+"%").attr("y",y(0)+3).text("AVG.")
			.style("font-size","11px")
			.attr("text-anchor","end")
			.attr("dx",-3)
			.attr("fill","#666666");

	var groups_update = main_group.selectAll("g").data(dat);
	var groups_enter = groups_update.enter().append("g").style("pointer-events","all");
	groups_enter.append("rect")
		.attr("x",function(d,i){
			return x(d.var)+"%";
		})
		.attr("y",0)
		.attr("height", height)
		.attr("width", step+"%")
		.attr("fill", "none");
	var groups = groups_enter.merge(groups_update);


	var lines = groups.append("line")
					.attr("x1",function(d,i){return (x(d.var)+halfstep)+"%"})
					.attr("x2",function(d,i){return (x(d.var)+halfstep)+"%"})
					.attr("y1",0)
					.attr("y2",height)
					.attr("stroke","#aaaaaa")
					.attr("stroke-dasharray","3,3");

	var dots = groups.selectAll("circle").data(function(d,i){return d.dat}).enter().append("circle")
				  .attr("cx",function(d,i){return (x(d.var)+halfstep)+"%"})
				  .attr("cy",function(d,i){return y(0)})
				  .attr("fill","#999999")
				  .attr("fill-opacity",0.4)
				  .attr("stroke","#999999")
				  .attr("r",5);

	var cols = gci2016.cols;
	var this_group = dots.filter(function(d,i){
		return d.cluster == cluster;
	}).raise()
	  .attr("fill-opacity",0.7)
	  .attr("fill", function(d,i){return cols[d.cluster]})
	  .attr("stroke",function(d,i){return d3.rgb(cols[d.cluster]).darker()})
	  .attr("r",10);

	var tiptimer;

	var mouseenter = function(d,i){
		var thiz = d3.select(this);

		var circle = thiz.selectAll("circle")
					   .filter(function(d,i){
					   		return d.cluster == cluster;
					   	});

		var cx = circle.attr("cx");
		var cy = circle.attr("cy");
		var r = parseFloat(circle.attr("r"))*1.5;

		if(anno_circle){
			anno_circle.attr("cx", cx).attr("cy",cy).attr("r",r).attr("fill","none").attr("stroke",cols[cluster]);
		}

		var rows = [{name:"<b>"+d.varname+"</b>", val:""}].concat(d.metros);

		var text = {};
		text.u = tooltip.selectAll("div.table-row").data(rows);
		text.e = text.u.enter().append("div").classed("table-row c-fix",true);
		text.eu = text.e.merge(text.u);
		text.eu.style("border",function(d,i){return i==0 ? "1px solid #aaaaaa" : "1px dotted #aaaaaa"})
			   .style("padding",function(d,i){return i==0 ? "0px 0px 3px 0px" : "0px"})
			   .style("border-width", "0px 0px 1px 0px");

		var cells = {};
		cells.u = text.eu.selectAll("p").data(function(d,i){return [d.val, d.name]});
		cells.e = cells.u.enter().append("p");
		cells.eu = cells.e.merge(cells.u).style("float",function(d,i){return i==0 ? "right" : "left"})
						.html(function(d,i){return d})
						.style("margin","5px 5px 2px 5px")
						.style("line-height","1em")
						.style("font-size","0.8em")

		//.node().getBoundingClientRect();
		//console.log(box);
	}

	//fn signature: gci2016.placetip(tip_node, container_node, xbuffer, fbr)
	var tipx = gci2016.placetip(tooltip.node(), thiz);
	

	var mouse = function(d,i){

		clearTimeout(tiptimer);
		var xy = d3.mouse(this.parentNode);

		var nxy = tipx(xy);

		//console.log(xy)
		//console.log(nxy)

		tooltip.style("display","block")
			   .style("top",(nxy[1])+"px").style("left",nxy[0]+"px");
	};

	groups.on("mouseenter", function(d,i){
		mouseenter.call(this, d, i);
		mouse.call(this, d, i);
	});
	groups.on("mousemove",mouse);

	groups.on("mouseleave", function(d,i){
		clearTimeout(tiptimer);
		tiptimer = setTimeout(function(){
			if(anno_circle){anno_circle.attr("cx", 0).attr("cy",0).attr("r",0)}
			tooltip.interrupt().style("display","none").transition();
		},250);
	});

	return function(){
		//this_group.transition().transition().duration(1000).attr("r",10);
		dots.transition().duration(700)
			.attr("cy",function(d,i){return y(d.val)})
			.on("end", function(d,i){
				if(d.cluster==cluster){
					anno_circle = anno_group.append("circle").attr("stroke-width",2);
				}
			});

	};		
}