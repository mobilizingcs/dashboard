(function( $ ) {
	var colorschema = [ "#8DD3C7", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#CCEBC5", "#FFED6F" ];

	$.fn.piechart = function(options){ 
		//constructor parameters
		var target = this;
		var item = options.item;
		var title = options.title || "pie chart"
		var label = options.label || {};
		var chartid = "pie-" + Math.random().toString(36).substring(7);
		var na = options.na || undefined;
		
		//create dimension and group
    	dashboard.dim[item] = dashboard.data.dimension(oh.utils.get(item, na));
    	dashboard.groups[item] = dashboard.dim[item].group();  		
		
    	//create dom elements
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
		mydiv.appendTo(target)

		//create chart
		var mychart = dc.pieChart("#"+mydiv.attr("id"))
		   .width(180)
		   .height(180)
		   .radius(80)
		   .colors(colorschema)
		   .innerRadius(20)
		   .label(getlabel)
		   .dimension(dashboard.dim[item])
		   .group(dashboard.groups[item])
		   
		//set renderlet (only done if not set yet)
		dashboard.renderlet.init(mychart.renderlet);		   
		
		dashboard.piecharts = dashboard.piecharts || [];
		dashboard.piecharts.push(mychart)
		   
		//return
		return target;
		
		//closure function over 'label'
		function getlabel(d){
			return label[d.data.key] || d.data.key;		   
		}				
	}

})( jQuery );