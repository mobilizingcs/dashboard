var loaddata = function(records){
	
	// load data
	dashboard.data = crossfilter(records);
	
    //save dashboard.dim
    dashboard.dim = {
    	main: dashboard.data.dimension(oh.utils.get(dashboard.config["item_main"]))
    };
    
	//crossfilter groups
    dashboard.groups = {
    	all: dashboard.data.groupAll()
    };
      
    //show an error if there is no data
	if(dashboard.groups.all.value() == 0){
		alert("Campaign '" + dashboard.campaign_urn + '" has no responses! Try again later (or press F5)')
		$("#loadinganimation").hide();
		return;
	}	    
    
	//init gui stuff
    initcharts();
	
	//after map has been initiated
	$("#buttonpanel").show();	
	$("#loadinganimation").hide();
	$(".hoverinfo").css({left : ($(window).width() - $(".hoverinfo").width()) /2, right: "" });
	
	//$("#photobutton").trigger("click");	
	$("#timeseriesbutton").trigger("click");
	$("#piechartbutton").trigger("click");
	dc.renderAll();
	
	//update dashboard title
	$("head title").text(dashboard.config.title)
	
	//if the url contains a image id, that will popup now
	if(oh.utils.state()[1]){
		//note: hash is converted to number
		var myhash = +oh.utils.state()[1]
		var alldata = dashboard.dim.main.top(9999);
		var allhashes = $.map(alldata, function(d){return d.hash});
		var i = $.inArray(myhash, allhashes);
		if(i > -1){
			//popup response
			dashboard.modal.showmodal(alldata[i])			
		} else {
			//set hash to only campaign
			oh.utils.state(oh.utils.state()[0])
		}
	}
}