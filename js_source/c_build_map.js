

function buildGCIMap(){
	//MAP VARIABLES
	var width = 950,
    height = 465,
    center = [(MAPWIDTH/2)-60,(MAPHEIGHT/2)],
    INITCENTER = [MAPWIDTH/2-15,(MAPHEIGHT/2+55)],
    ROTATE = [90,-15,0],
    INITSCALE = 158,
    SCALE = INITSCALE;


var mapWrap = d3.select("#mapWrap").style({"width":MAPWIDTH+"px","height":MAPHEIGHT+"px"});
var svg = d3.select("#mapSVG").attr({"width":MAPWIDTH,"height":MAPHEIGHT}).append("g");
}