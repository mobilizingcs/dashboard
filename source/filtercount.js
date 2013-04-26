(function( $ ) {
	$.fn.filtercount = function(options){ 
		
		var titlediv = $("<div/>").addClass("title").addClass("dc-data-count").attr("id", "data-count");
		$("<span/>").addClass("filter-count").appendTo(titlediv);		
		titlediv.append(" selected out of ");
		$("<span/>").addClass("total-count").appendTo(titlediv);
		titlediv.append(" records | ")
		

		$("<a/>").addClass("reset").attr("href", "#").text("(reset all)").appendTo(titlediv).on("click", function(e){
			e.preventDefault();
			$("#wcpanel .reset").trigger("click")
			if(dashboard.map) dashboard.map.resetall();
			dc.filterAll(); 
			dc.renderAll();
			return false;			
		});		
		
		this.append(titlediv)
		
		//create record counter
		dc.dataCount("#data-count")
			.dimension(dashboard.data) // set dimension to all data
			.group(dashboard.groups.all); 
	   
		return this;
	}

})( jQuery );