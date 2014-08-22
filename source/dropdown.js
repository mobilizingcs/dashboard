(function( $ ) {
	$.fn.dropdown = function(options){ 
		var target = this;
		var id = "#" + target.attr("id")	
		var item = options.item;
		var dimname = item;
		var title = options.title || "Select"
		
		//create dimension and group
    	dashboard.dim[dimname] = dashboard.data.dimension(function(x) {return x[item]});
    	dashboard.groups[dimname] = dashboard.dim[dimname].group();

    	//shortcuts
    	var userdim = dashboard.dim[dimname];    	
    	var usergroup = dashboard.groups[dimname];

    	//create html select
    	var myselect = $("<select/>").addClass("input-medium").on("change", function(){
    		userdim.filter($(this).val() || null);
    		$(this).blur();
			dc.redrawAll();
    	});

    	//add the "all" option:
    	$("<option/>").text("All users").val("").appendTo(myselect)

    	//populate select
		$.each(usergroup.all(), function(i, val){
			$("<option/>").text(val.key).val(val.key).appendTo(myselect)
		});

		//insert HTML
		myselect.appendTo(target);

		//chain it
		return target;
	}

})( jQuery );