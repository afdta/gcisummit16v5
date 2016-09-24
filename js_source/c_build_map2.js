gci2016.map = {};
gci2016.map.geojson = null;

//refine the indicator selection process -- what if no valid indicator is passed?
//done -- with first round of edits. implement in d_main for debugging

//create a map in the given container
//map_width is a function or a constant that determines the width of the map -- it is called with the map wrapper as the thisobject
gci2016.map.setup = function(container, map_width, register_resize, render_as_canvas){
	var scope = {};

	scope.aspect = 0.48;
	scope.width = 950;
	scope.height = scope.aspect*scope.width;

	//append another div as the wrapper so that the sizing is immune to padding of container
	scope.outerWrap =  d3.select(container).append("div").style("position","relative").style("padding","0px");
	scope.wrapMenu = scope.outerWrap.append("div").style("position","relative").style("padding","0px 3%").classed("c-fix",true);
	scope.wrap = scope.outerWrap.append("div").style("position","relative").style("padding","0px");
	scope.canvas = scope.wrap.append("canvas").style("position","absolute").style("top","0px").style("left","0px");
	scope.context = scope.canvas.node().getContext("2d");
	scope.svgwrap = scope.wrap.append("div").style("position","relative").style("z-index","10").style("margin","0px").style("padding","0px");
	scope.svg = scope.svgwrap.append("svg");
	scope.layers = {};
	scope.layers.bottom = scope.svg.append("g");
	scope.layers.borders = scope.svg.append("g");
	scope.layers.voro = scope.svg.append("g");
	scope.layers.cities = scope.svg.append("g");
	scope.layers.top = scope.svg.append("g");
	scope.projection = d3.geoNaturalEarth();
	scope.path = d3.geoPath().projection(scope.projection);
	scope.scale = 175; //base scale value, itself scaled in the size method below
	scope.filtered = false;

	scope.indicator = null; //indicator used to scale circle radii
	scope.radius = 5; //defaults to a constant, but can also be a function

	scope.voro = false; //should the dots be rendered in vornoi polygons

	scope.titleBox = scope.wrapMenu.append("div")
					.style("margin","0px 0px 0px 0px")
					.style("border-top","0px solid #dddddd")
					.style("padding","0px");


	//set map dimensions and redraw (if map has been initialized)
	scope.size = function(){
		try{var width = scope.width = (typeof map_width == "function" ? map_width.call(scope.wrap.node()) : map_width);}
		catch(e){var width = scope.width = 780;}
		
		var height = scope.height = Math.round(scope.aspect*width);

		scope.projection.translate([width/2, height/2]).scale(scope.scale*(width/1100));
		scope.svg.style("height",height+"px").style("width",width+"px");
		scope.canvas.attr("height",height).attr("width",width); //canvas will redraw when resetting these attributes
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
			context.strokeStyle="#efefef";
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
				scope.data = gci2016.data.data.vals.metros.map(function(d,i,a){
					return {id:d.id, metro:d.V1, country:d.V19, cluster:d.V2, cname:d.V3, lonlat:[d.V20, d.V21], vals:d}
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

			//if a valid (non-constant) indicator exists... sort the map data by it to prevent occlusions
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

			//voronoi diagram
			if(scope.voro){
				var voro = d3.voronoi()
							 .x(function(d,i){return d.xy[0]})
							 .y(function(d,i){return d.xy[1]})
							 .size([scope.width, scope.height])
							 .polygons(scope.data);

				var voropoly = {};
				voropoly.u = scope.layers.voro.selectAll("path.city").data(voro);
				voropoly.e = voropoly.u.enter().append("path").classed("city",true);
				voropoly.u.exit().remove();
				voropoly.eu = voropoly.e.merge(voropoly.u);
				voropoly.eu.attr("d",function(d,i,a){return "M" + d.join("L") + "Z"})
						   .attr("stroke","none")
						   .attr("fill","none")
						   .attr("stroke-width",0)
						   .style("pointer-events","all");
				scope.voropolys = voropoly.eu;
			}
			 

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
		if(scope.drawHighlights){scope.drawHighlights();}
		if(scope.resizeTable){scope.resizeTable();}
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

	scope.tooltip = function(textfn){
		var tip = scope.wrap.append("div").style("position","absolute")
										  .style("top","0px")
										  .style("left","0px")
										  .style("visibility","hidden")
										  .style("min-width","100px")
										  .style("min-height","100px")
										  .style("max-width","90%")
										  .style("background-color","#ffffff")
										  .style("border","1px solid #aaaaaa")
										  .style("padding","15px")
										  .style("z-index","0")
										  //.style("pointer-events","none")
										  .classed("makesans",true);

		var tipp = gci2016.placetip(tip.node(), scope.wrap.node());

		if(scope.cities){
			var tiptimer;

			var hdot1 = scope.layers.top.append("circle").attr("stroke-width","0").style("pointer-events","none");
			var hdot2 = scope.layers.top.append("circle").attr("stroke-width","2").attr("fill","none").style("pointer-events","none");

			scope.drawHighlights = function(attr){
				if(!!attr){
					hdot1.attr("fill",attr.fill)
						 .attr("r",attr.r)
						 .attr("cx",attr.cx)
						 .attr("cy",attr.cy)
						 .style("display","inline");

					hdot2.attr("r",(+attr.r)+3)
						 .attr("stroke","#333333")
						 .attr("cx",attr.cx)
						 .attr("cy",attr.cy)
						 .style("display","inline");
				}
				else{
					hdot1.style("display","none");
					hdot2.style("display","none");
				}
			}

			scope.mouseleave = function(){
				tiptimer = setTimeout(function(){
					tip.style("visibility","hidden")
					   .style("z-index","0")
					   .style("left","0px");
					scope.drawHighlights();
				}, 250);				
			}

			function mouse(xy){
				try{
					if(scope.view == "Table"){throw "tableview"}
					clearTimeout(tiptimer);
					var xyn = tipp(xy);
					tip.style("visibility","visible")
					   .style("z-index","101")
					   .style("top",Math.round(xyn[1])+"px")
					   .style("left",Math.round(xyn[0])+"px");
				}
				catch(e){
					scope.mouseleave();
				}
			}

			function mouseenter(d, i){
					var thiz = d3.select(this);
					var attr = {fill:thiz.attr("fill"), r:thiz.attr("r"), cx:thiz.attr("cx"), cy:thiz.attr("cy"), stroke:thiz.attr("stroke")};
					scope.drawHighlights(attr);
console.log(this);
					//get ranking functions
					//gci2016.calc_rank = function(array, accessor, ascending){

					var dat = gci2016.data_vars.map(function(D,I,A){
						var rnkit = gci2016.rankFns[D.varid];
						var val = d.vals[D.varid];
						var valf = gci2016.format.fn(val, D.format);
						var clusterRank = rnkit(val, d.cluster)

						var row = [D.nameshort2, 
								   valf, 
								   (rnkit(val).rank + (I==0 ? "/123" : "")), 
								   (clusterRank.rank + (I==0 ? "/"+clusterRank.outof : ""))
								   ];
						row.number = I+1
						return row;
					});

					var title = tip.selectAll("p.tip-title")
									.data(["<b>"+d.metro+", "+d.country+"</b>", "Type: " + d.cname]);
					title.enter().append("p").classed("tip-title",true)
								 .merge(title).html(function(d,i){return d})
								 .style("margin","0px 0px 5px 0px")
								 .style("font-size",function(d,i){return i==0 ? "1.25em" : "0.8em"});

					//same basic code as from charts
					var firstRow = ["Metric", "Value", "Overall", "Within type"];
					firstRow.number = 0;
					var rows = [firstRow].concat(dat);

					var tableWrap = tip.selectAll("div.table-wrap").data([rows]);

					var tableWrapEnter = tableWrap.enter()
												  .append("div")
												  .classed("table-wrap",true)
												  .style("padding","5px 0px")
						   						  .style("border-top","1px solid #aaaaaa");

					var table = tableWrapEnter.append("table")
									  .style("border-collapse","collapse")
									  .style("table-layout","fixed");
								//header
								table.append("thead").append("tr").selectAll("td").data(["","","Ranks"]).enter()
													              .append("td")
													              .attr("colspan", function(d,i){return i==2 ? "2" : "1"})
													              .text(function(d,i){return d})
													              .style("font-size","0.8em")
													              .style("border","0px dotted #aaaaaa")
													              .style("border-width", function(d,i){
													              	return i==2 ? "0px 0px 1px 0px" : "0px";
													              })
													              .style("text-align","center")
													              .style("font-weight","normal");
								table.append("tbody");


					var tableRows = tableWrapEnter.merge(tableWrap).select("tbody").selectAll("tr").data(function(d,i){

						return d;
					});

					var tableCells = tableRows.enter().append("tr").merge(tableRows).selectAll("td").data(function(d,i){

						return d;
					});

					tableCells.enter().append("td").merge(tableCells)
						.text(function(d,i){return d})
						.style("font-size","0.8em")
						.style("width",function(d,i){
							var w = ["56%", "20%", "12%", "12%"];
							return w[i];
						})
						.style("text-align", function(d,i,a){
							if(i==0){
								var ta = "left";
							}
							else if(i==1 || i==2 || i==3){
								var ta = "right";
							}
							else{
								var ta = "center";
							}
							return ta;
						})
						.style("padding-right", function(d,i){
							return i==1 ? "10px" : "initial";
						});

					var note = tip.selectAll("p.table-note").data([1]);
					note.enter().append("p").classed("table-note",true).merge(note)
						.text("A rank of 1 indicates the largest value in the group of metro areas being compared.")
						.style("font-size","0.8em")
						.style("font-style","italic");
			}

			//programmatic mouseenter based on metro ID
			scope.disable_mouseover = false;
			scope.pro_mouseenter = function(metro_id){
				try{
					var dot = scope.cities.filter(function(d,i){
						return d.id == metro_id;
					});
					var xy = [+dot.attr("cx"), +dot.attr("cy")];
					mouseenter.call(dot.node(), dot.datum());
					mouse(xy);
				}
				catch(e){
					//no-op
				}

			}



			/*scope.cities.on("mousemove", function(d,i){
				var xy = d3.mouse(scope.wrap.node());
				mouse(xy);
			});*/

			scope.cities.on("mouseenter", function(d,i){
				if(!scope.disable_mouseover){
					mouseenter.call(this, d, i);
					//var xy = d3.mouse(scope.wrap.node());
					var dot = d3.select(this);
					var xy = [+dot.attr("cx"), +dot.attr("cy")];
					mouse(xy);
				} else{
					scope.disable_mouseover = false;
				}
			});

			scope.cities.on("mouseleave", scope.mouseleave);

			if(scope.voropolys){
				scope.voropolys.on("mouseenter", function(d,i){

					if(!scope.disable_mouseover){
						var id = d.data.id;
						scope.pro_mouseenter(id);
					} else{
						scope.disable_mouseover = false;
					}

				});
				scope.voropolys.on("mouseleave", scope.mouseleave);
			}

		}
		return scope;
	}

	scope.addTitle = function(title){
		scope.wrapMenu.style("padding","1em 1% 0em 1%").style("margin","6em 2% 0em 2%")
					.style("border-top","1px solid #dddddd");

		scope.titleBox.classed("c-fix",true).append("div").style("float","left")
			.append("p").html(title)
			.style("font-weight","bold")
			.style("font-size","1.25em")
			.style("margin","0px 0px 10px 0px")
			.style("text-align","left");

		return scope;
	}

	scope.addLegend = function(){
		try{
			/*scope.wrapMenu.append("p").style("display","inline-block")
							.text("Types: ")
							.style("height","16px")
							.style("line-height","16px")
							.style("margin","5px 5px 0px 0px");*/

			var legend = scope.wrapMenu.append("div")
						 .style("display","inline-block")
						 .style("margin-top","0.5em")
						 .selectAll("div").data(gci2016.data.meta.clusters)
						 .enter().append("div")
						 .style("display","inline-block")
						 .style("margin","5px 10px 10px 0px")
						 .classed("c-fix",true)
						 .selectAll("div")
						 .style("height","16px")
						 .data(function(d,i){
						 	return [d.cluster, d.name];
						 })
						 .enter().append("div")
						 .style("float","left")
						 .style("margin","0px 5px 0px 0px")
						 .style("width",function(d,i){return i==0 ? "16px" : "auto"})
						 .style("height","16px")
						 .style("border-radius","8px")
						 .style("background-color", function(d,i){
						 	return i==0 ? gci2016.cols[d] : "transparent";
						 })
						 .append("p")
						 .style("font-size","0.8em")
						 .style("margin","3px 0px 0px 0px")
						 .style("line-height","1em")
						 .text(function(d,i){return i==0 ? "" : d})
						 ;
		}
		catch(e){
			try{
				legend.remove();
			}
			catch(e){
				//no-op
			}
		}

		return scope;
	}

	scope.addSearch = function(){

		var search = scope.wrapMenu.append("div").style("text-align","center")
					.append("div").style("display","inline-block")
					.style("border-bottom","1px solid #aaaaaa")
					.style("margin","10px 10px 1px 10px")
					.style("padding","0px")
					.style("position","relative")
					.style("width","40%")
					.style("min-width","320px");
		var search_icon = search.append("svg")
								.style("float","left")
								.style("width","20px")
								.style("height","20px");
			search_icon.append("circle").attr("cx","10px")
										.attr("cy","10px")
										.attr("r","6px")
										.attr("fill","none")
										.attr("stroke","#666666")
										.attr("stroke-width","1");
			search_icon.append("path").attr("d","M14,14 l6,6").attr("stroke","#666666");
		var search_input = search.append("input").attr("type","text")
						.style("font-size","1em")
						.style("line-height","1em")
						.style("color","#333333")
						.style("border","none")
						.style("outline","none")
						.style("background-color","transparent")
						.style("height","1em")
						.style("padding","4px 5px")
						.style("float","left")
						.attr("placeholder","metro area search")
						.style("width","calc(100% - 40px)");

		var options = search.append("div")
							.style("position","absolute")
							.style("width","100%")
							.style("overflow","auto")
							.style("top","100%")
							.style("top","calc(100% + 1px")
							.style("display","none")
							.style("background-color","rgba(250,250,250,0.65)")
							.style("padding","5px 0px 5px 0px")
							.style("z-index","100")
							.style("border","0px solid #aaaaaa")
							.style("border-width","0px 0px 0px 0px")
							.classed("disable-highlight makesans",true);
		var options_inner = options.append("div");

		var search_data = scope.data.map(function(d,i,a){
			return {name:d.metro + ", " + d.country, code:d.id, search:(d.metro + " " + d.country).toLowerCase()}
		});

			var focused = false;
			var ODAT = [];
			var OP;
			var OPINDEX = -1;

			function traverse(up){
				if(arguments.length==0 || !up){
					var next = 1;
				}
				else{
					var next = -1;
				}
				if(OPINDEX + next >= 0 && OPINDEX + next < ODAT.length){
					OPINDEX = OPINDEX + next;
				}
				else if(OPINDEX >= ODAT.length){
					OPINDEX = ODAT.length-1;
				}
				else if(OPINDEX < 0){
					OPINDEX = 0;
				}

				try{
					OP.style("background-color",function(d,i){
						return i===OPINDEX ? "#dddddd" : "transparent";
					});
				}
				catch(e){

				}
			}

			function select(){
				try{
					scope.disable_mouseover = true;
					var c = ODAT[OPINDEX].d.code;
					scope.pro_mouseenter(c);
				}
				catch(e){
					//no-op
				}
			}

			search_input.on("focus", focus);
			search_input.on("mousedown", focus);


			function focus(d,i){
				focused = true;
				options.style("display", ODAT.length>0 ? "block" : "none");
				try{
					OPINDEX = -1;
					OP.style("background-color","transparent");
					scope.mouseleave();
				}
				catch(e){
					//no-op
				}
			};

			search_input.on("input", function(d,i){
				try{
					scope.mouseleave();
				}
				catch(e){
					
				}

				var input = this.value.toLowerCase();
				var regex1 = new RegExp("^"+input);
				var regex15 = new RegExp(" +"+input);
				var regex2 = new RegExp(input);
				var O = search_data.map(function(d,i,a){
					if(d.search.search(regex1) > -1){
						var r = {d:d, sort:0}
					}
					else if(d.search.search(regex15) > -1){
						var r = {d:d, sort:0.5}
					}
					else if(d.search.search(regex2) > -1){
						var r = {d:d, sort:1}
					}
					else{
						var r = {d:d, sort:2}
					}
					return r;
				});
				O.sort(function(a,b){
					var diff = a.sort - b.sort;
					var alphadiff = a.d.search < b.d.search ? -1 : 1;
					return diff !== 0 ? diff : alphadiff;
				});
				ODAT = O.filter(function(d,i){return d.sort<2 && i<15});

				var op_u = options_inner.selectAll("div").data(ODAT);
				var op_e = op_u.enter().append("div").style("padding","3px")
													 .style("margin","3px 6px")
													 .style("cursor","pointer")
													 .style("border-bottom","1px dotted #aaaaaa");
						   op_e.append("p").style("margin","0px").style("text-align","left")
						   				   .style("font-size","0.8em");
				op_u.exit().remove();

				OP = op_e.merge(op_u);
				OP.select("p").text(function(d,i){return d.d.name});
				OP.on("mousedown", function(d,i){
					scope.disable_mouseover = true;
					try{
						scope.pro_mouseenter(d.d.code);
					}
					catch(e){
						//no-op
					}
					//search_input.node().value = "";
					options.style("display","none");
				});
				OP.on("mouseenter", function(d,i){
					OPINDEX = i;
					OP.style("background-color",function(dd,ii){
						return i===ii ? "#dddddd" : "transparent";
					});
				})

				var warning = options.selectAll("p.warning20").data(ODAT.length==15 ? [1] : []);
				warning.enter().append("p").classed("warning20",true).text("Results limited to 15")
					.style("font-size","0.8em").style("color","#666666")
					.style("margin","10px").style("text-align","left").style("font-style","italic");
				warning.exit().remove();

				options.style("display", ODAT.length>0 ? "block" : "none");
				options.on("mouseleave", function(d,i){
					OP.style("background-color","transparent");
				})
			});

			search_input.on("blur", function(d,i){
				focused = false;
				OPINDEX = -1;
				//this.value = "";
				options.style("display","none");
			});

		search_input.on("keydown", function(d,i){
			var keycode = d3.event.keyCode;
			if(keycode=='38'){
				traverse(true);
			}
			else if(keycode=='40'){
				traverse();
			}
			else if(keycode=="13"){
				select();
				options.style("display","none");
			}

		});


		return scope;
	}


	scope.addTable = function(){
		if(scope.data){

			var wrap = scope.tableWrap = scope.outerWrap.append("div")
								   .style("height","auto")
								   .style("width","100%")
								   .style("position","absolute")
								   .style("display","block")
								   .style("top","0px")
								   .style("left","0px")
								   .style("background-color","rgba(250,250,250,1)")
								   .style("z-index","15")
								   .style("overflow-y","hidden")
								   .style("overflow-x","hidden")
								   ;

			var data_vars = gci2016.data.meta.vars;
			var data_org = [
				{cat:"Economic characteristics", vars:["V4", "V5", "V6"]},
				{cat:"Economic growth", vars:["V7", "V8", "V9"]},
				{cat:"Tradable clusters", vars:["V10", "V11", "V12"]},
				{cat:"Innovation", vars:["V13", "V14", "V15"]},
				{cat:"Talent", vars:["V16"]},
				{cat:"Connectivity", vars:["V17","V18"]}
			];

			var cat_data = data_org.map(function(d,i,a){
				var r = {cat:d.cat};
				
				var row0 = d.vars.map(function(d,i,a){
					return {
							valf: data_vars[d].nameshort2, 
							val: data_vars[d].name,
							var: d,
							format: data_vars[d].format
					}
				});

				var meta = [
					{valf: "Metro area", val:"Metropolitan area", var:"V1", format:"id"},
					{valf: "Global city type", val:"Type", var:"V3", format:"id"}
				]

				row0 = meta.concat(row0);

				var data_rows = gci2016.data.data.vals.metros.map(function(d,i,a){
					return row0.map(function(v){
						var val = v.var !== "V1" ? d[v.var] : d.V1 + ", " + d.V19;
						return {val: val, valf: gci2016.format.fn(val, v.format)};
					});
				});

				r.rows = [row0].concat(data_rows);

				return r;
			});

			
			var tableButtonWrap = wrap.append("div").classed("c-fix",true)
					.style("padding","0px 1%").style("margin","0% 2%")
					.style("border-top","1px solid #dddddd").style("padding-top","1em");
			
			var close = tableButtonWrap.append("div")
							.style("width", "25px")
							.style("height", "25px")
							.style("float","right")
							.style("margin","0px 0px 35px 25px")
							.style("cursor","pointer");

			
			var closesvg = close.append("svg");				
						closesvg.append("rect")
							.attr("width","25px")
							.attr("height","25px")
							.attr("fill","none")
							.attr("stroke","#333333");
						closesvg.append("path")
							.attr("d", "M5,5 l15,15 M5,20 l15,-15")
							.attr("stroke","#333333")
							.attr("stroke-width","2")
							.attr("stroke-linecap","round");


			var tableButtonsU = tableButtonWrap.selectAll("div.table-button").data(cat_data);
			var tableButtonsE = tableButtonsU.enter().append("div").classed("table-button",true);
								tableButtonsE.append("p");
			var tableButtons = tableButtonsE.merge(tableButtonsU)
											.style("float","left")
											.style("padding","5px 10px")
											.style("border",function(d,i){return i==0 ? "1px solid #aaaaaa" : "1px solid #dddddd"})
											.style("background-color",function(d,i){return i==0 ? "#dddddd" : "transparent"})
											.style("margin","0px 8px 5px 0px")
											.style("cursor","pointer")
											.classed("disable-highlight",true);
											
			var tableButtonsP = tableButtons.select("p")
											.text(function(d,i){return d.cat})
											.style("margin","0px")
											.style("font-size", "13px")
											.style("line-height", "13px");

			var redrawTable = function(data){
				var numvars = data.rows[0].length;

				if(numvars == 5){
					var tdwidths = [25, 20, 19, 19, 17];
				}
				else if(numvars == 4){
					var tdwidths = [25, 25, 25, 25];
				}
				else if(numvars == 3){
					var tdwidths = [35, 50, 25];
				}


				var table_wraps = wrap.selectAll("div.table-wrapper").data([data]);
					table_wraps.exit().remove();

				var table_sections = table_wraps.enter().append("div").classed("table-wrapper",true)
											.style("padding","0px 3%")
											.merge(table_wraps)
											.selectAll("div")
											.data(function(d,i){
												return [[d.rows[0]], d.rows.slice(1)];
											});
				var table_sections_enter = table_sections.enter()
					.append("div")
					.style("overflow-y", function(d,i){return i==1 ? "auto" : "hidden"})
					.style("border-bottom","1px solid #aaaaaa")
					
					table_sections_enter.append("table")
						.style("width","100%")
						.style("table-layout","fixed")
						.style("border-collapse","collapse");

				var two_table_sections = table_sections_enter.merge(table_sections);
				var two_tables = two_table_sections.select("table");

				var table_rows_u = two_tables
					.selectAll("tr").data(function(d,i){
						return d;
					});
					table_rows_u.exit().remove();

				var table_rows = table_rows_u.enter().append("tr").merge(table_rows_u);

				var table_cells_update = table_rows.selectAll("td").data(function(d,i){
												return d;
											});
					table_cells_update.exit().remove();

				var table_cells = table_cells_update.enter().append("td")
										.merge(table_cells_update)
										.text(function(d,i){return d.valf})
										.style("border-bottom",function(d,i){
											return d.hasOwnProperty("format") ? "none" : "1px dotted #aaaaaa"
										})
										.style("width", function(d,i){
											return tdwidths[i]+"%";
										})
										.style("text-align", function(d,i){
											return i>1 ? "right" : "left";
										})
										.style("padding","2px 6px 1px 3px")
										;

				//references to tables
				var t1 = two_tables.filter(function(d,i){return i==0}); 
				var t2 = two_tables.filter(function(d,i){return i==1});
				var t2rows = t2.selectAll("tr");

				var sort = {i:0, asc:false};
				var sortfn = function(i){
					if(i==sort.i){
						sort.asc = !sort.asc;
					}
					else if(i<2){
						sort.i = i;
						sort.asc = true;
					}
					else{
						sort.i = i;
						sort.asc = false;
					}

					return function(a,b){
						var va = a[i].val;
						var vb = b[i].val;

						if(va==vb){
							var c = a[0].val < b[0].val ? -1 : 1; //use name as tiebreak
						}
						else if(va==null){
							var c = 1;
						}
						else if(vb==null){
							var c = -1;
						}
						else if(va < vb){
							var c = sort.asc ? -1 : 1;
						}
						else{
							var c = sort.asc ? 1 : -1;
						}
						return c;
					}
				}

				t2rows.sort(sortfn(0));
				
				try{
					two_table_sections.each(function(d,i){
						if(i==1){
							this.scrollTop = 0;
						}
					});
				}
				catch(e){
					//no-op
				}

				var header_cells = t1.selectAll("td")
									.style("font-weight","bold")
									.style("cursor","pointer")
									.classed("disable-highlight",true)
									.on("mousedown",function(d,i){
										var s = sortfn(i);
										t2rows.sort(s);
									});

				scope.resizeTable = function(){
					setTimeout(function(){
						try{
							var box = scope.outerWrap.node().getBoundingClientRect();
							
							
							
							
							var t1box = t1.node().getBoundingClientRect();
							
							//row 1 of second table
							var r1 = t2.selectAll("tr").node();
							var r1box = r1.getBoundingClientRect();
							var r1width = Math.round(r1box.right - r1box.left);

							two_tables.filter(function(d,i){return i==0}).style("width", r1width + "px");


							var boxh = Math.round(box.bottom - box.top);
							var h = boxh - (t1box.bottom-box.top);
							var w = box.right - box.left;
							if(w > 900){
								var fs = "1em";
							}
							else if(w > 500){
								var fs = "0.8em";
							}
							else{
								var fs = "0.65em";
							}

							table_cells.style("font-size", fs);
							//console.log(scope.outerWrap.node());
							//console.log(t2.node())
							if(h < 250){throw "badH"}
							
							two_table_sections.style("height",function(d,i){return i==1 ? h+"px" : "auto"});
						}
						catch(e){
							two_table_sections.style("height","auto");
						}

					},0);
				}

				scope.resizeTable();
			}

			var selectedTable = 0;
			var drawTable = function(index){
				selectedTable = index;
				tableButtons.style("border",function(d,i){return i==index ? "1px solid #aaaaaa" : "1px solid #dddddd"})
							.style("background-color",function(d,i){return i==index ? "#dddddd" : "transparent"})
				redrawTable(cat_data[selectedTable]);
			}

			drawTable(selectedTable);

			tableButtons.on("mousedown",function(d,i){
				selectedTable = i;
				drawTable(i);
			})	

			scope.view = "Map"; //map is default
			scope.hideTable = function(d,i){
				wrap.interrupt().transition().style("opacity",0).on("end", function(d,i){
					wrap.style("display","none");
				});
				scope.view = "Map";
			};

			scope.showTable = function(d,i){
				wrap.interrupt().style("display","block")
					.transition().style("opacity",1);
				scope.view = "Table";
				scope.resizeTable();
				try{
					scope.mouseleave();
				}
				catch(e){
					//no-op
				}
			}


			var toggle_buttons = scope.titleBox.append("div").style("float","right")
											   .append("div").style("display","inline-block")
											   .classed("disable-highlight c-fix",true)
											   .style("padding","0px")
											   .style("margin","0em")
											   .style("border","1px solid #aaaaaa")
											   .style("border-width","0px 0px 0px 0px")


			var buttons = toggle_buttons.selectAll("div").data(["View data as: ","Map","Table"])
									.enter().append("div").style("cursor",function(d,i){return i==0 ? "default" : "pointer"})
									.style("padding",function(d,i){return i==0 ? "1px 6px 1px 0px" : "1px 6px"})
									.style("float","left")
									.style("border",function(d,i){return i==0 ? "none" : "1px solid #aaaaaa"})
									.style("margin",function(d,i){return i==0 ? "0px" : "0px 3px"});
									
			var buttonText = buttons.append("p").text(function(d,i){return d})
							   		.style("margin","3px 0px")
							   		.style("line-height","1em");


			//keep track of views
			var selected = null;
			var toggleView = function(d,i){
				if(i>0 && selected !== d){
					selected = d;

					buttons.style("background-color", function(d,i){
						return d===selected ? "#dddddd" : "transparent";
					}).style("border-color", function(d,i){
						return d===selected ? "#aaaaaa" : "#dddddd";
					});

					buttonText.style("font-weight", function(d,i){
						return d===selected ? "normal" : "normal";
					});

				}

				if(d=="Map"){
					scope.hideTable();
				}
				else if(d=="Table"){
					scope.showTable();
				}

			}

			buttons.on("mousedown", toggleView);
			toggleView("Map", 2);
			close.on("mousedown", function(){
				toggleView("Map", 2);
			});
		}
	}

	return scope;
}
