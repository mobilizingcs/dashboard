(function( $ ) {
	$.fn.datechart = function(options){ 
		var target = this;
		var id = "#" + target.attr("id")		
		var item = options.item
		var dimname = item + "_date"
		var title = options.title || "Date"
		var chartid = "date-chart";
		
		//create dimension and group
    	dashboard.dim[dimname] = dashboard.data.dimension(oh.utils.getdate(item));
    	dashboard.groups[dimname] = dashboard.dim[dimname].group();  		
		
		var mydiv = $("<div/>").addClass("chart").attr("id", chartid);
		var titlediv = $("<div/>").addClass("title").appendTo(mydiv);
		$("<span/>").text(title).appendTo(titlediv);
		titlediv.append("&nbsp;");		
		$("<a/>").addClass("reset").attr("href", "#").attr("style", "display:none;").text("(reset)").appendTo(titlediv).on("click", function(e){
			e.preventDefault();
			mychart.filterAll();
			dc.redrawAll();
			return false;			
		});

		mydiv.appendTo(target);
		
		//calculate date range.
		//not sure if there is a way to get dimension value directly from dim object?
		var mindate = oh.utils.getdate(item)(dashboard.dim[dimname].bottom(1)[0]);
		var maxdate = oh.utils.getdate(item)(dashboard.dim[dimname].top(1)[0]);
		
		//round to whole days
		mindate = new Date(mindate.getFullYear(), mindate.getMonth(), mindate.getDate()-2);
		maxdate = new Date(maxdate.getFullYear(), maxdate.getMonth(), maxdate.getDate()+2);
		
		//calculate range
		var ndays = (maxdate - mindate) / (24*60*60*1000)
		if(ndays < 71){	
			//display at least two months
			maxdate = new Date(mindate.getFullYear(), mindate.getMonth(), mindate.getDate() + 72);
		}
		if(ndays > 180){	
			//display no more than 6 months
			mindate = new Date(maxdate.getFullYear(), maxdate.getMonth(), maxdate.getDate() - 181);
		}	
		
		//recalculate range
		var ndays = Math.round((maxdate - mindate) / (24*60*60*1000));
		
		//calculate right margin to create equally sized bars
		var remainder = (750 - 30) % ndays;
		if(remainder > 90) {
			var remainder = (750 - 30) % Math.floor(ndays/2);
		}		

		//construct chart
		var mychart = dc.barChart("#"+mydiv.attr("id"))
		   .width(750) 
		   .height(130) 
		   .transitionDuration(200) 
		   .margins({top: 10, right: remainder, bottom: 20, left: 30})
		   .dimension(dashboard.dim[dimname]) 
		   .group(dashboard.groups[dimname]) 
		   .centerBar(false)
		   .gap(1)
		   .elasticY(true)
		   //.yAxisPadding(1)
		   .x(d3.time.scale().domain([mindate, maxdate]).rangeRound([ndays]))
		   .round(d3.time.day.round)
		   .xUnits(d3.time.days)
		   .renderHorizontalGridLines(true)
		   .renderVerticalGridLines(true)		
		   
		//set renderlet (only done if not set yet)
		dashboard.renderlet.init(mychart.renderlet);
	   
		return target;
	}

})( jQuery );