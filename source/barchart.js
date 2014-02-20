(function( $ ) {
	$.fn.barchart = function(options){ 
		var target = this;
		var id = "#" + target.attr("id")		
		var item = options.item;
		var title = options.title || item;
		var domain = options.domain || [];
		var chartid = "bar-" + Math.random().toString(36).substring(7);
		var na = options.na || undefined;
		
		//create dimension and group
    	dashboard.dim[item] = dashboard.data.dimension(oh.utils.getnum(item, na));
    	
		//calculate date range
		domain[0] = domain[0] || +dashboard.dim[item].bottom(1)[0][item];
		domain[1] = domain[1] || +dashboard.dim[item].top(1)[0][item];
		
		//calculate binwidth. We aim to get between 5 and 10 bins.
		var binwidth = options.binwidth || calcbin(domain);
		domain[0] = rounddown(domain[0], binwidth)
		domain[1] = roundup(domain[1], binwidth);
		
    	//special case of integers		
    	var centerbars = (binwidth == 1);
    	
    	if(centerbars){
    		domain[0] = domain[0] - 1;
    		domain[1] = domain[1] + 1;
    	}
		var x_units = (domain[1]-domain[0])/binwidth;	

		//group
    	dashboard.groups[item] = dashboard.dim[item].group(oh.utils.bin(binwidth));
		
    	//create com elements
		var mydiv = $("<div/>").addClass("chart").addClass("histcontainer").attr("id", chartid);
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
		
		//drag it
		mydiv.draggable({containment: "body", snap: "body", snapMode: "inner" })

		//calculate right margin to create equally sized bars
		var plotwidth = rounddown(295-30-25, x_units);
		var remainder = 295-30-25-plotwidth;
		
    	dashboard.message("Domain:" + domain)
    	dashboard.message("Binwidth:" + binwidth)
    	dashboard.message("x_units:" + x_units)		
		dashboard.message("plotwidth:" + plotwidth);
    	dashboard.message("remainder:" + remainder);
		
		// construct bar chart
		var mychart = dc.barChart("#"+mydiv.attr("id"))
		   .width(295)
		   .height(130)
		   //.yAxisPadding(1)
		   .gap(1+centerbars)
		   .margins({top: 10, right: 25 + remainder, bottom: 20, left: 30})
		   .dimension(dashboard.dim[item]) // set dimension
		   .group(dashboard.groups[item])	
		   .elasticY(true)
		   .centerBar(centerbars)
		   .xUnits(function(){return x_units})
		   .x(d3.scale.linear().domain(domain).rangeRound([0, plotwidth]))
		   .renderHorizontalGridLines(true)
		   .renderVerticalGridLines(true)
		 
		//xAxis doesn't chain
		//hides decimals for small integers
		mychart.xAxis().tickFormat(d3.format("d")).tickValues(seq(domain[0], domain[1], binwidth));

	   
		//set renderlet (only done if not set yet)
		dashboard.renderlet.init(mychart.renderlet);
		
		return target;
	}
	
	function seq(x,y, by){
		if(!by) by = 1;
		x = rounddown(x,by);
		y = roundup(y,by);
		out = [];
		for(var i = x; i <= y; i=i+by){
			out.push(i)
		}
		return out;
	}
	
	function roundup(x,y){
		return Math.ceil(x/y) * y;
	}
	
	function rounddown(x,y){
		return Math.floor(x/y) * y;
	}
	
	//function creates binwidth of 1,2,5,10,20,50,100,etc
	function calcbin(domain, maxbars){
		if(!maxbars) maxbars = 10;
		var k = [1,2,5];
		var bin = 1;
		while(true){
			for (i=0; i < k.length; i++){
				newbin = bin * k[i];
				if(Math.abs(rounddown(domain[0], newbin) - roundup(domain[1], newbin))/newbin < (maxbars+1)){
					return newbin;
				}
			}
			bin = bin*10;			
		}
	}

})( jQuery );