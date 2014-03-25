function initcharts(){
	
	//set dashboard.renderlet only once
	dashboard.renderlet = (function(){
		var funstack = [];

		//calls all functions on the stack		
		function call(){
			$.each(funstack, function(index, value){
				value();
			});
		}

		//register new function for the render event
		function register(newfun, delay){
			if(!delay){
				funstack.push(newfun);
			} else {
				funstack.push(_.debounce(newfun, delay));
			}
			dashboard.message("registered a new renderlet!")
		}
			
		//initiate only once
		var init = _.once(function(renderlet){
			renderlet(call);
			dashboard.message("renderlet initiated!")
		});
		
		//return object
		return {
			init: init,
			register: register			
		}
	})();
	
	//some constants
	dc.constants.EVENT_DELAY = 5;
	dashboard.charts = dashboard.charts || {}
	
	//create date-time chart
	//$("#bottompanel").datechart({title: "Response Date", item: "date"})
	
	$(dashboard.config.datecharts).each(function(index, conf) {
		$("#bottompanel").datechart(conf)
	})		
	
	$(dashboard.config.hourcharts).each(function(index, conf) {
		$("#bottompanel").hourchart(conf)
	})	
	

	//Create pie charts
	$("#piepanel").draggable({containment: "body", snap: "body", snapMode: "inner" }).resizable()
	$(dashboard.config.piecharts).each(function(index, conf) {
		$("#piepanel").piechart(conf);
	})
	
	//create bar charts
	//$("#histpanel").draggable({containment: "body", snap: "body", snapMode: "inner" });
	$(dashboard.config.barcharts).each(function(index, conf) {
		$("#histpanel").barchart(conf)
	})
	
	//init wordclouds
	$(dashboard.config.wordclouds).each(function(index, conf) {
		$("#wcpanel").wordcloud(conf)
	})		

	//create record counter
	$(dashboard.config.dropdowns).each(function(index, conf) {
		$("#dropdowndiv").dropdown(conf)
	});

	//create record counter
	$("#infodiv").filtercount();
	
	//assume only one map for now
	dashboard.map = $('#map').filtermap(dashboard.config.maps[0]);	
	
	//fix the radio buttons
	$(".leaflet-control-layers-base").addClass("radio")

	//init modal
	dashboard.modal = $("#responsemodal").responsemodal()

	//init thumbnail window
    dashboard.photopanel = $("#photopanel").photopanel(dashboard.config.photo);

	//prevent double clicking
	$("#buttonpanel button").on("dblclick", function(e){
		return false;
	});
	
	//initiate the buttons that hide/show charts	
	$(".widgetbutton").on("click", function(){
		var panel = $(this).attr("data-panel");
		this.state = !this.state;
		if(this.state){
			//perform some updates
			if(panel == "photopanel") {
				dashboard.photopanel.showme();
			}
			
			//avoids placing #histpanel off the screen. temp hack for #8 --SN
			if(panel == "histpanel") {
			  if ($('body').width() < 1100 ) {
 			    $('#histpanel').css({
    			     "left": "755px",
      			     "bottom": "140px" 
     			    });
  			  }
			}
			
			//reset and show both current panel and draggable subpanels
			$("#" + panel + ".ui-resizable").width("").height("")
			$("#" + panel + ".ui-draggable").css({ top: "", bottom: "", left: "", right: ""});
			
			//reset subpanels as well
			$("#" + panel + " .ui-resizable").width("").height("");
			$("#" + panel + " .ui-draggable").css({ top: "", bottom: "", left: "", right: ""});
			
			//show the panel
			$("#" + panel).show();
			
			//click refresh links in current panel
			$("#" + panel + " a.refresh").trigger("click");			
		} else {
			//hiding a panel resets filters
			$("#" + panel + " a.reset").trigger("click");
			$("#" + panel).hide();
		}
	});	
}
