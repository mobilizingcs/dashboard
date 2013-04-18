(function( $ ) {
	$.fn.responsemodal = function(options){ 

		var target = this
		var itemcells = {};
		var titleitem = dashboard.config.item_main;
		
		$(dashboard.config.modal).each(function(i, value){
			var mytr = $("<tr />");
			$("<td />").text(value.title).appendTo(mytr);
			itemcells[value.item] = $("<td />").text(" - ").appendTo(mytr);
			$("#responsemodal tbody").append(mytr);
		})

		var currentd;
		
		function showmodal(d){
			//update global variable
			currentd = d;	
			
			//update table 
			$.each(itemcells, function( item, td ) {
				td.text(replaceit(d[item]));
			});
			
			//update title and image
			var modaltitle = d[titleitem] || "title unavailable"
			$("#responsemodal .modal-header h3").text(modaltitle.substring(0, 30))
			$("#resphoto").attr("src", "images/loading1.gif");
			$("#resphoto").attr("src", oh.getimageurl(d));
			
			//show
			$("#responsemodal").modal();
			oh.utils.state(dashboard.campaign_urn, d["hash"]);
		}
		
		function showfirst(){
			showmodal(dashboard.dim.main.top(1)[0]);		
		}		
		
		function shownext(){
			if(!currentd) {
				showfirst();
			} else {
				var alldata = dashboard.dim.main.top(9999) 
				var index = $.inArray(currentd, alldata)
				if(index < 0 || index == (alldata.length-1)) {
					//show first record
					return showmodal(alldata[0]);
				}
				//show next record
				showmodal(alldata[index+1]);			
			}
		}
		
		function showprev(){
			if(!currentd) {
				showfirst();
			} else {
				var alldata = dashboard.dim.main.top(9999) 
				var index = $.inArray(currentd, alldata)
				if(index < 0 || index == 0) {
					//show last record
					return showmodal(alldata[alldata.length-1]);
				}
				//show next previous record
				showmodal(alldata[index-1]);			
			}
		}
	
		
		$("#previtem").on("click", function(){showprev(); return false})
		$("#nextitem").on("click", function(){shownext(); return false})
		$("#responsemodal").on("hide", function(){
			oh.utils.state(dashboard.campaign_urn);
		})
		$("img#resphoto").on("error", function(){$(this).attr("src", "images/nophoto.jpg")});
		
		//export methods
		return {
			showmodal : showmodal,
			shownext : shownext,
			showprev : showprev
		};
	}
	
	function replaceit(x){
		if(!x || x == "" || x == "NOT_DISPLAYED" || x == "SKIPPED") return " - ";
		return x;
	}
})( jQuery );