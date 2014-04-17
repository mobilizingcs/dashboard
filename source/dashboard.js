var dashboard = dashboard || {};

$(document).ready(function() {
	
	//initiates dashboard
	start();
	
	//helper functions	
	function start(){
		generalized(init);
	};
	
	//initiates dashboard
	function init(){
		//spinner
		$("#loadinganimation").show();


		//this function gets the csv path. 
		//Note that in the case of ohmage, it automatically checks login status.
		var csvpath = Mustache.render(dashboard.config.data.url, window);
		
		//unescape html escaped mustache output
		var csvpath = $('<textarea />').html(csvpath).val();
		
		//try to download data.
		var myrequest = $.ajax({
			type: "GET",
			url : csvpath 
		}).error(function(){
			alert("Failed to download data from:\n" + csvpath)
		}).done(function(rsptxt) {
			dashboard.campaign_urn = oh.utils.state()[0];
			loaddata(oh.utils.parsecsv(rsptxt));
			if(hasdata()) {
				initcharts();
				loadgui();
				inithelp();
			}
		});	
	}
	
	
	//loads data
	function loaddata(records){
		// init crossfilter
		dashboard.data = crossfilter(records);
		
	    //save dashboard.dim
	    dashboard.dim = {
	    	main: dashboard.data.dimension(oh.utils.get(dashboard.config["item_main"]))
	    };
	    
		//crossfilter groups
	    dashboard.groups = {
	    	all: dashboard.data.groupAll()
	    };
	}
	
	function hasdata(){
		if(dashboard.groups.all.value() == 0){
			alert("Campaign '" + dashboard.campaign_urn + '" has no responses (or no shared responses)! Please share data and then try again.')
			$("#loadinganimation").hide();
			return false;
		}	
		return true;
	}
	
	
	//initiates final gui stuff	
	function loadgui(){
	    //show an error if there is no data
	
		
		//after map has been initiated
		$("#buttonpanel").show();	
		$("#loadinganimation").hide();
		$(".hoverinfo").css({left : ($(window).width() - $(".hoverinfo").width()) /2, right: "" });
		
		//$("#photobutton").trigger("click");	
		$("#timeseriesbutton").trigger("click");
		$("#piechartbutton").trigger("click");
		//$("#mapbutton").trigger("click");
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

});
