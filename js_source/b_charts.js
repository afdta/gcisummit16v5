
gci2016.dotPlot = function(cluster, plot_data){
	var thiz = this;
	var wrapper = d3.select(this).classed("c-fix",true);
	var error = false;
	var data = plot_data.data;

	var metrodat = d3.nest().key(function(d,i){return ("c"+d.V2)})
					 .object(data.vals.metros)[("c"+cluster)];

	var dat = gci2016.data_vars.map(function(D,I,A){
		var s = data.z.groups.map(function(d,i,a){
			return {cluster:d.V2, val:d[D.varid], var:D.varid, varname:D.name}
		}).filter(function(d,i,a){
			return d.val != null;
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

		return {dat:s, var:D.varid, varname:D.name, varnameshort:D.nameshort, varnameshort2:D.nameshort2, format:gci2016.format[D.format], metros:m};
	});

	var draw = {};
	draw.activated = false; //has the chart been activated yet?
	draw.activate = function(){draw.activated = true}; //function to call when scroll event fires
	draw.landscape = null;
	draw.numdraws = 0;
	
	//determine chart orientation, landscape or portait, and set up dom for it
	draw.orient = function(){
		try{
			var thisBox = thiz.getBoundingClientRect();
			var width = thisBox.right - thisBox.left;
			var lscape = width > 1020 ? true : false;
		}
		catch(e){
			var lscape = false;
			var width = 480;
		}
		finally{
			draw.width = width;
			draw.height = lscape ? 270 : 1000;
		}

		if(lscape !== draw.landscape){
			draw.landscape = lscape;
			draw.setup();
		}
	}

	var transitioning = {}; //lookup table indicating which variables have transitioned -- edge case: if a redraw occurs before transition finishes

	draw.setup = function(){
		wrapper.select("div").remove(); //remove anything there
		++draw.numdraws;

		var chartwrap = wrapper.append("div").classed("makesans",true).style("position","relative").style("width","100%");
		var svg = chartwrap.append("svg").style("height",draw.height+"px").style("width","100%");
		var main_group = svg.append("g");
		var anno_group = svg.append("g");
		var axis_label = svg.append("g");
		var sub_svg = svg.append("svg").style("width","48%").style("height","50%").attr('x',"52%").attr("y","0");

		var cols = gci2016.cols;

		var anno_dot = anno_group.append("circle").attr("stroke-width","2px");

		if(draw.landscape){
			var zrange = [-1.7,3.5];
			var x = d3.scaleBand().domain(gci2016.data_vars.map(function(d,i){return d.varid})).range([0,100])
					  .round(false).paddingOuter(0.4).align(0.5);
			var y = d3.scaleLinear().domain(zrange).range([draw.height, 0]);	

			var po = x.paddingOuter();
			var pi = x.paddingInner();
			var step = x.step();
			var halfstep = step/2;

			var category_container = chartwrap.append("div").classed("c-fix",true).style("width","100%");
			var label_container = chartwrap.append("div").classed("c-fix",true).style("width","100%");

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
					.classed("small-labels", true)
					.style("text-align","center")
					.style("margin","0px 4px")
					.style("word-break","normal");

			var cat_data = d3.nest().key(function(d,i){return d.cat})
				.rollup(function(d,i){
					return {name:d[0].cat, colspan:d.length};
				})
				.entries(gci2016.data_vars);

			var categories_update = category_container.selectAll("div").data(cat_data);
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
								return "none";
							})
							.append("p").text(function(d,i){return d.value.name})
							.style("text-align","center")
							.style("margin","0px 0px 0px 0px")
							.style("padding","3px 5px 2px 5px")
							.style("font-size","13px")
							.style("font-weight","bold");
			var categories = categories_enter.merge(categories_update);
			categories.style("float","left")
					.style("width", function(d,i){
						return (d.value.colspan*step)+"%";
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

			main_group.append("line").attr("x1",(halfstep*po)+"%").attr("x2",(100-(halfstep*po))+"%")
									.attr("y1",y(0)).attr("y2",y(0)).attr("stroke","#999999")
									.style("shape-rendering","crispEdges").attr("stroke-width","1px");
			
			axis_label.append("line").attr("x1",20)
									 .attr("x2",140)
									 .attr("y1",y(0)+15)
									 .attr("y2",y(0)+15)
									.attr("stroke","#aaaaaa")
									.attr("stroke-width","1px")
									.attr("fill","none")
									.style("shape-rendering","crispEdges");

			axis_label.append("path").attr("d", "M140,"+(y(0)+15)+" m0,-5 l10,5 l-10,5 z")
									.attr("stroke","#aaaaaa")
									.attr("stroke-width","1px")
									.attr("fill","#aaaaaa");

			axis_label.selectAll("text").data([1,2]).enter().append("text").classed("above-avg-label",true)
					  .text("Above average")
					  .attr("x", 20)
					  .attr("y", y(0))
					  .attr("dy",13)
					  .attr("dx",10)
					  .style("font-size","13px")
					 .attr("fill",function(d,i){return i==0 ? "#ffffff" : "#666666"})
					.attr("stroke",function(d,i){return i==0 ? "#ffffff" : "none"})
					.attr("stroke-width",function(d,i){return i==0 ? "3px" : "0px"});

			axis_label.attr("transform","rotate(-90 10 " + y(0) + ")");
					  

			var groups_update = main_group.selectAll("g").data(dat);
			var groups_enter = groups_update.enter().append("g").style("pointer-events","all");
			groups_enter.append("rect")
				.attr("x",function(d,i){
					return x(d.var)+"%";
				})
				.attr("y",0)
				.attr("height", draw.height)
				.attr("width", step+"%")
				.attr("fill", "none");
			var groups = groups_enter.merge(groups_update);


			var lines = groups.append("line")
							.attr("x1",function(d,i){return (x(d.var)+halfstep)+"%"})
							.attr("x2",function(d,i){return (x(d.var)+halfstep)+"%"})
							.attr("y1",0)
							.attr("y2",draw.height)
							.attr("stroke","#aaaaaa")
							.attr("stroke-dasharray","3,3");

			var dots = groups.selectAll("circle").data(function(d,i){return d.dat}).enter().append("circle")
						  .attr("cx",function(d,i){return (x(d.var)+halfstep)+"%"})
						  .attr("cy",function(d,i){return draw.activated ? y(d.val) : y(0)})
						  .attr("fill","#999999")
						  .attr("fill-opacity",0.4)
						  .attr("stroke","#999999")
						  .attr("r",5);

			draw.activate = function(){
				draw.activated = true;

				dots.transition().duration(700)
					.attr("cy",function(d,i){return y(d.val)})
					.on("start", function(d,i){
						//only record once for the highlighted cluster in the group
						if(d.cluster == cluster){
							transitioning[d.var] = true;
						}
					})
					.on("end", function(d,i){
						if(d.cluster == cluster){
							transitioning[d.var] = false;
						}

					});

			};	

		}
		else{
			var zrange = [-3.5,3.5];
			var x = d3.scaleLinear().domain(zrange).range([3, 97]);
			var y = d3.scaleBand().domain(gci2016.data_vars.map(function(d,i){return d.varid})).range([0,100]).round(false).paddingOuter(0.7).align(0.5);		

			var po = y.paddingOuter();
			var pi = y.paddingInner();
			var step = y.step();
			var halfstep = step/2;

			main_group.append("line").attr("y1","0%").attr("y2","100%")
									 .attr("x1",x(0)+"%").attr("x2",x(0)+"%")
									 .attr("stroke","#999999").style("shape-rendering","crispEdges").attr("stroke-width","1px");

			var groups_update = main_group.selectAll("g").data(dat);
			var groups_enter = groups_update.enter().append("g").style("pointer-events","all");
			groups_enter.append("rect")
				.attr("y",function(d,i){
					return y(d.var)+"%";
				})
				.attr("x",0)
				.attr("width", "100%")
				.attr("height", step+"%")
				.attr("fill", "none");
			var groups = groups_enter.merge(groups_update);


			var lines = groups.append("line")
							.attr("y1",function(d,i){return (y(d.var)+halfstep)+"%"})
							.attr("y2",function(d,i){return (y(d.var)+halfstep)+"%"})
							.attr("x1","3%")
							.attr("x2","97%")
							.attr("stroke","#aaaaaa")
							.attr("stroke-dasharray","2,4");

			var dots = groups.selectAll("circle").data(function(d,i){return d.dat}).enter().append("circle")
						  .attr("cy",function(d,i){return (y(d.var)+halfstep)+"%"})
						  .attr("cx",function(d,i){return draw.activated ? (x(d.val))+"%" : (x(0))+"%"})
						  .attr("fill","#999999")
						  .attr("fill-opacity",0.4)
						  .attr("stroke","#999999")
						  .attr("r",5);

			var labels = groups.selectAll("text").data(function(d,i){return [d,d]}).enter().append("text")
						  .attr("y",function(d,i){return (y(d.var)+halfstep)+"%"})
						  .attr("x",function(d,i){return x(0)+"%"})
						  .attr("fill", function(d,i){return i==0 ? "#ffffff" : "#333333"})
						  .text(function(d,i){return d.varnameshort})
						  .style("font-size","0.8em")
						  .attr("dy","-20px")
						  .attr("dx","0px")
						  .attr("text-anchor","middle")
						  .attr("stroke",function(d,i){return i==0 ? "#ffffff" : "none"})
						  .attr("stroke-width",function(d,i){return i==0 ? "4px" : "0px"})
						  ;

			sub_svg.append("line").attr("x1",0)
									 .attr("x2",140)
									 .attr("y1",15)
									 .attr("y2",15)
									.attr("stroke","#aaaaaa")
									.attr("stroke-width","1px")
									.attr("fill","none")
									.style("shape-rendering","crispEdges");

			sub_svg.append("path").attr("d", "M140,15 m0,-5 l10,5 l-10,5 z")
						.attr("stroke","#aaaaaa")
						.attr("stroke-width","1px")
						.attr("fill","#aaaaaa");


			sub_svg.selectAll("text").data([1,2]).enter().append("text").classed("above-avg-label",true)
					  .text("Above average")
					  .attr("x", 10)
					  .attr("y", 12)
					  .attr("dy",0)
					  .attr("dx",0)
					  .style("font-size","13px")
					 .attr("fill",function(d,i){return i==0 ? "#ffffff" : "#666666"})
					.attr("stroke",function(d,i){return i==0 ? "#ffffff" : "none"})
					.attr("stroke-width",function(d,i){return i==0 ? "3px" : "0px"});


			draw.activate = function(){
				draw.activated = true;

				dots.transition().duration(700)
					.attr("cx",function(d,i){return x(d.val)+"%"})
					.on("start", function(d,i){
						//only record once for the highlighted cluster in the group
						if(d.cluster == cluster){
							transitioning[d.var] = true;
						}
					})
					.on("end", function(d,i){
						if(d.cluster == cluster){
							transitioning[d.var] = false;
						}

					});

			};	

		} //end portrait layout

		var plotnote = chartwrap.selectAll("p.plot-footnote").data([1])

		plotnote.enter().append("p").classed("plot-footnote",true).merge(plotnote)
				.text("Note: The dots in the plot above depict the averages of the normalized metro area values (z-scores) for each global city type. The solid " 
						+ (draw.landscape ? "horizontal" : "vertical") + " axis line represents the average of the 123 metro areas.")
				.style("font-size","0.8em")
				.style("margin","3em 3% 0px 3%");

		var this_group = dots.filter(function(d,i){
				return d.cluster == cluster;
			}).raise()
			  .attr("fill-opacity",0.7)
			  .attr("fill", function(d,i){return cols[d.cluster]})
			  .attr("stroke",function(d,i){return d3.rgb(cols[d.cluster]).darker(0.6).toString()})
			  .attr("r",10);

		var tooltip = chartwrap.append("div")
				.style("position","absolute")
				.style("z-index","25")
				.style("display","none")
				.style("min-height","200px")
				.style("padding","15px")
				.style("border","1px solid #aaaaaa")
				.style("background-color","rgba(255,255,255,0.9)")
				.style("pointer-events","none")
				.style("max-width","300px");

		var tiptimer;

		var mouseleave = function(){
			clearTimeout(tiptimer);
			tiptimer = setTimeout(function(){
				anno_dot.attr("cx", 0).attr("cy",0).attr("r",0);
				tooltip.interrupt().style("display","none").transition();
			},250);			
		}

		var tiperror = false;
		var mouseenter = function(d,i){
			var thiz = d3.select(this);
			var fmt = d.format;

			tiperror = false;
			try{
				var circle = thiz.selectAll("circle")
							   .filter(function(d,i){
							   		return d.cluster == cluster;
							   	});

				var cx = circle.attr("cx");
				var cy = circle.attr("cy");
				var r = parseFloat(circle.attr("r"))*1.5;

				//highlight dot only eligible to be seen 
				if(transitioning.hasOwnProperty(d.var)){
					anno_dot.attr("cx", cx)
						.attr("cy",cy)
						.attr("r", !transitioning[d.var] ? r : "0")
						.attr("fill","none")
						.attr("stroke",cols[cluster]);
				}

				var ranking = gci2016.calc_rank(d.metros, function(d,i){return d.val});

					var title = tooltip.selectAll("p.tip-title")
									.data(["<b>"+d.varname+"</b>", gci2016.cluster_map[cluster].name]);
					title.enter().append("p").classed("tip-title",true)
								 .merge(title).html(function(d,i){return d})
								 .style("margin","0px 0px 5px 0px")
								 .style("font-size",function(d,i){return i==0 ? "1em" : "0.8em"});

					var tableWrap = tooltip.selectAll("div.table-wrap").data([d.metros]);

					var tableWrapEnter = tableWrap.enter()
												  .append("div")
												  .classed("table-wrap",true)
												  .style("padding","10px 0px")
						   						  .style("border-top","1px solid #aaaaaa")
						   						  .style("margin","5px 0px");

					var table = tableWrapEnter.append("table")
									  .style("border-collapse","collapse")
									  .style("table-layout","fixed")
									  .style("width","100%");
								table.append("tbody");


					var tableRows = tableWrapEnter.merge(tableWrap).select("tbody").selectAll("tr").data(function(d,i){

						return d;
					});

					var tableCells = tableRows.enter().append("tr").merge(tableRows).selectAll("td").data(function(d,i){
						return [ranking(d.val).rank+". " +d.name, fmt(d.val)];
					});


					tableCells.enter().append("td").merge(tableCells)
						.text(function(d,i){return d})
						.style("font-size","0.8em")
						.style("width",function(d,i){
							var w = ["70%", "30%"];
							return w[i];
						})
						.style("text-align", function(d,i,a){
							if(i==0){
								var ta = "left";
							}
							else if(i==1){
								var ta = "right";
							}
							else{
								var ta = "center";
							}
							return ta;
						})
						.style("padding-right", function(d,i){
							return i==1 ? "10px" : "0px";
						})
						.style("border-bottom-style","dotted");

			}
			catch(e){
				tiperror = true;
				mouseleave();
			}

		}

		//fn signature: gci2016.placetip(tip_node, container_node, xbuffer, fbr)
		var tipx = gci2016.placetip(tooltip.node(), thiz);
		
		var mouse = function(d,i){
			if(!tiperror){
				clearTimeout(tiptimer);
				var xy = d3.mouse(this.parentNode);

				var nxy = tipx(xy);

				tooltip.style("display","block").style("top", Math.round(nxy[1])+"px")
												.style("left", Math.round(nxy[0])+"px");
			}
		};

		groups.on("mouseenter", function(d,i){
			if(d.var !== "V12"){
				mouseenter.call(this, d, i);
				mouse.call(this, d, i);
			}
		});
		groups.on("mousemove", function(d,i){
			if(d.var !== "V12"){
				mouse.call(this, d, i);
			}
		});

		groups.on("mouseleave", mouseleave);	
	}


	draw.orient(); //kick off the drawing -- orient calls setup
	window.addEventListener("resize", draw.orient);


	//function to activate
	return function(){
		draw.activate();
	};
	
}

