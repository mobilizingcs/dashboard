(function( $ ) {
	$.fn.hourchart = function(options){ 
		var target = this;
		var id = "#" + target.attr("id")	
		var item = options.item
		var dimname = item + "_hour"
		var title = options.title || "Date"
		var chartid = "hour-chart";
		var na = options.na || undefined;
		
		//create dimension and group
    	dashboard.dim[dimname] = dashboard.data.dimension(oh.utils.gethour(item, na));
    	dashboard.groups[dimname] = dashboard.dim[dimname].group(Math.floor);  					
		
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

		//Hour barchart
		var mychart = dc.barChart("#"+mydiv.attr("id"))
			.width(295) // (optional) define chart width, :default = 200
			.height(130) // (optional) define chart height, :default = 200
			.transitionDuration(200) // (optional) define chart transition duration, :default = 500
			.margins({top: 10, right: 25, bottom: 20, left: 30})
			.dimension(dashboard.dim[dimname]) // set dimension
			.group(dashboard.groups[dimname]) // set group
			.elasticY(true)
			.centerBar(false)
			.gap(1)
			.round(dc.round.floor)
			//.yAxisPadding(1)
			.x(d3.scale.linear().domain([0, 24]).rangeRound([0, 10*24]))
			.renderHorizontalGridLines(true)
			.renderVerticalGridLines(true)
		
		//set renderlet (only done if not set yet)
		dashboard.renderlet.init(mychart.renderlet);

		return target;
	}

})( jQuery );