(function( $ ) {
	$.fn.photopanel = function(options) {
		var pages;
		var pagesize = 20;
		var currentpage = 0;		

		var panel = $(this)
			.draggable({containment: "body", snap: "body", snapMode: "inner" })		
			.addClass("well");

		function prevthumbs(){
			var pagecount = pages.length;
			currentpage = (pagecount + currentpage - 1) % pagecount;
			updatepictures();	
			return false;
		}
		

		function nextthumbs(){
			var pagecount = pages.length;
			currentpage = (pagecount + currentpage + 1) % pagecount;
			updatepictures();
			return false;
		}
		
		function fixanchors(){
			currentpage == 0 ? $("#prevthumbs").hide() : $("#prevthumbs").show();
			currentpage == pages.length -1 ? $("#nextthumbs").hide() : $("#nextthumbs").show();
		}
		
		function updatepictures(){
			dashboard.message("updating thumbnails.")
			if(pages.length == 0) return;			
			var newlist = $("<ul>", {class: "thumbnails"})
			var thispage = pages[currentpage];			
	 		for(var i = 0; i < thispage.length; i++) {
	 			//skip records with no images
	 			var d = thispage[i];
 				var li = $("<li>", {class : "span2"}).appendTo(newlist);
 				var a = $("<a>", {class: "thumbnail", href : "#" }).appendTo(li);
 				var img = $('<img>', {
 					alt: d[dashboard.config.item_main],
 					class : "img-rounded",
	 					src : getthumburl(d)
	 			})
	 			img.appendTo(a);
	 			a.on("click", (function(){
	 				var k = d;
	 				return function(){dashboard.modal.showmodal(k); return false;}
	 			})());
	 			img.on("error", imgerror);
	 		}
	 	
	 		function displaythumblist(){
				newlist.appendTo("#imagelist");
				$("#imagelist").fadeIn(300);	
				fixanchors();				
	 		}
	 		
	 		function imgerror(){
	 			$(this).attr("src", "images/photothumb.jpg");
	 		}
		 	
			if(!($("#imagelist").is(":empty"))){
				$("#imagelist").fadeOut(500, function(){
					$("#imagelist").empty();					
					displaythumblist();		
				});
			} else {
				displaythumblist();				
			}	 	

		 	//add error handler
	 	
		}
		
		function updatepages(){
			pages = [];
			currentpage = 0;
			var alldata = oh.utils.getRandomSubarray(dashboard.dim.main.top(9999));
			for(var i = 0; i < alldata.length; i++){
				var x = Math.floor(i/pagesize);
				var y = i % pagesize;
				pages[x] = pages[x] || [];
				pages[x][y] = alldata[i];
			}	
			updatepictures();
		}
		

		function getthumburl(record){
			//check for missing images
			var photoItem = options.item;
			
			if(!record[photoItem] || record[photoItem] == "SKIPPED" || record[photoItem] == "NOT_DISPLAYED"){
				return "images/photothumb.jpg";
			}
			if(dashboard.campaign_urn == "demo"){
				var thumbtemplate = options.thumb || "data/demo/thumbs/{{ " + photoItem + " }}.jpg";				
				return Mustache.render(thumbtemplate, record);
			} else {
	 			return "/app/image/read?client=dashboard&size=icon&id=" + record[photoItem];
			}
		}		
		

		
		$("#prevthumbs").on("click", prevthumbs)
		$("#nextthumbs").on("click", nextthumbs)
		
		//register renderlet
		dashboard.renderlet.register(function(){
	    	if(panel.is(":visible")){
	    		updatepages();
	    	}
		}, 500);
		
		panel.showme = function(){
			$("#imagelist").empty();
			_.delay(updatepages, 250);
		}
		return panel;
	}
})( jQuery );	





