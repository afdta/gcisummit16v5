
//dotPlot is called with the enclosing dom container element as the this object
gci2016.dotPlot = function(cluster, data){
	var box = this.getBoundingClientRect();
	var wrapper = d3.select(this).classed("c-fix",true);
	try{
		var width = Math.floor(box.right - box.left);
		if(width < 300){throw "badWidth"}
	}
	catch(e){
		var width = 320;
	}
	var height = 270;
	var zrange = [-1.7,3.5]

	//vars
	var vars = ["pop_2015", "X2015_nomgdp", "gdp_pc_real2015", "productivity2015", 
			"compound_growth_realgdp15", "compound_growth_real_gdp_pc15", "compound_growth_emp15", "compound_growth_pop15", 
			"fdi_pc_09.15", 
			"share_publications_top_10_10.13", "patents_pc_08.12", "venture_capital_pc06.15", 
			"passengers_pc_2014", "download_speed2015", 
			"share_tertiary_education2015"];

	var dat = vars.map(function(D,I,A){
		var s = data.z.groups.map(function(d,i,a){
			return {cluster:d.cluster, val:d[D], var:D}
		});
		return s;
	});

	var x = d3.scaleBand().domain(vars).range([0,100]).round(false).paddingOuter(1).align(0.5);
	var y = d3.scaleLinear().domain(zrange).range([height, 0]);

	var po = x.paddingOuter();
	var pi = x.paddingInner();
	var step = x.step();
	var halfstep = step/2;

	//console.log("po: "+po+" pi: "+pi+" step: "+step);
	var chartwrap = wrapper.append("div").classed("makesans",true);
	var svg = chartwrap.style("width","100%").append("svg").style("height",height+"px").style("width","100%");
	var label_container = chartwrap.append("div").classed("c-fix",true).style("width","100%");

	var labels = label_container.selectAll("div").data(vars).enter().append("div")
								.style("float","left")
								.style("margin",function(d,i){
									if(i===0){
										var m = "0px 0px 5px " + (po*step) + "%";
									}
									else if(i===vars.length-1){
										var m = "0px " + (po*step) + "% 5px 0px";
									}
									else{
										var m = "0px 0px";
									}
									return m;
								})
								.style("width",step+"%")
								.style("overflow","hidden");
	labels.append("p").text(function(d,i){return d})
			.style("word-break","break-all")
			.style("text-align","center")
			.style("font-size","13px")
			.style("margin","0px 4px");


	svg.append("line").attr("x1",(step*po)+"%").attr("x2",(100-(step*po))+"%").attr("y1",y(0)).attr("y2",y(0)).attr("stroke","#666666").style("shape-rendering","crispEdges").attr("stroke-width","1px");
	svg.append("text").attr("x",(po*step)+"%").attr("y",y(0)+3).text("Average")
			.style("font-size","11px")
			.attr("text-anchor","end")
			.attr("dx",-3)
			.attr("fill","#666666");

	var groups = svg.selectAll("g").data(dat).enter().append("g");

	var lines = groups.append("line")
					.attr("x1",function(d,i){return (x(d[0].var)+halfstep)+"%"})
					.attr("x2",function(d,i){return (x(d[0].var)+halfstep)+"%"})
					.attr("y1",0)
					.attr("y2",height)
					.attr("stroke","#aaaaaa")
					.attr("stroke-dasharray","3,3");

	var dots = groups.selectAll("circle").data(function(d,i){return d}).enter().append("circle")
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
	  .attr("fill", function(d,i){return cols[d.cluster-1]})
	  .attr("stroke",function(d,i){return d3.rgb(cols[d.cluster-1]).darker()})
	  .attr("r",10);

	return function(){
		//this_group.transition().transition().duration(1000).attr("r",10);
		dots.transition().duration(700)
			.attr("cy",function(d,i){return y(d.val)})
			//.attr("r",function(d,i){return d.cluster==cluster ? 10 : 5});
	};		
}