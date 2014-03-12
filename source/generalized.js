function general(next){
	//find out what campaign we are using
	campaign = window.location.hash.substr(1);

        oh.campaign_read_xml(campaign, function(xml){
        campaign_xml = xml;
        //initialize the config.json general file
        var configObject = {};
        configObject.title = "Dashboard";
        configObject.data = {};
        configObject.data.filter = "";
        configObject.data.url = "{{ oh.getcsvurl }}";
        configObject.datecharts = { "title": "Response Date", "item": "context:timestamp" };
        configObject.hourcharts = { "title": "Response Time", "item": "context:timestamp" };

        configObject.maps = [{
                        "item" : {
                                "lat" : "context:location:latitude",
                                "lng" : "context:location:longitude"
                        },
			"center" : [34.0522222, -118.2427778],
                        "zoom" : 9,
                        "clusteroptions" : {
                                "spiderfyOnMaxZoom": true,
                                "showCoverageOnHover": true,
                                "zoomToBoundsOnClick": true
                        },
                        "geojson" : [
                                {
                                        "title" : "neighborhoods",
                                        "url" : "lib/geojson/la_simplified.min.json"
                                }
                        ],
                        "tilelayers": [
                                {
                                        "title" : "Standard",
                                        "key" : "2d69a170ad5540f981628a272225958a",
                                        "styleId" : 1
                                },
                                {
                                        "title" : "Road",
                                        "key" : "2d69a170ad5540f981628a272225958a",
                                        "styleId" : 997
                                },
                                {
                                        "title" : "Minimal",
                                        "key" : "2d69a170ad5540f981628a272225958a",
                                        "styleId" : 22677,
                                        "default" : true
                                }
                        ]
                }]
        configObject.piecharts = [];
        configObject.wordclouds = [];
        configObject.barcharts = [];
	configObject.modal = [];
                //limit the number of piecharts, photocharts, wordclouds and numbers
                limitPie = 4;
                countPie = 0;
                limitPhoto = 1;
                countPhoto = 0;
                limitClouds = 2
                countClouds = 0;
                limitBar = 2;
                countBar = 0;
        $(campaign_xml).find("prompt").each(function(){
                id = $(this).find('id').text();
                promptType = $(this).find('promptType').text();
		if($(this).find('displayLabel').text().length > 20){
	          displayLabel = $(this).find('displayLabel').text().slice(0,20)+"...";
		}else{
		  displayLabel = $(this).find('displayLabel').text();
		}

		configObject.modal.push({
				"item" : id,
				"title" : displayLabel
				}); 
		//generate some items based on prompts
                switch (promptType)
                {
                case "photo":
		 if(countPhoto < limitPhoto){
                 configObject.photo = {
                                        "item": id,
                                        "thumb" : "/app/image/read?client=dashboard&size=icon&id={{"+id+"}}",
                                        "image" : "/app/image/read?client=dashboard&id={{"+id+"}}"
                                      }
		 countPhoto++;
		 }
                 break;
                case "single_choice":
		 if(countPie < limitPie){
                 configObject.piecharts.push({
                                        "item": id+":label",
                                        "title": displayLabel
                                        });
		 countPie++;
		 }
                 break;
                case "text":
		 if(countClouds < limitClouds){
                 configObject.wordclouds.push({
                                        "item": id,
                                        "title": displayLabel
                                        });
		   //make the first text prompt the item_main
		   if(countClouds === 0){
		    configObject.item_main = id;
		   }
		 countClouds++;
		 }
                 break;
		case"number":
		 if(countBar < limitBar){
		 if($(this).find("skippable").text()==="false" && $(this).find('condition').length === 0){
		 configObject.barcharts.push({
						"item":id,
						"title":displayLabel
						});
		 countBar++;
		 break;
		 }else{
        	  property = [];
        	  $(this).children('properties').children('property').each(function(){
                  property[$(this).children('key').text()] = $(this).children('label').text();
        	  });     
        	  binwidth = Math.ceil(eval((property["max"] - property["min"])/10))
        	  configObject.barcharts.push({item:id,title:displayLabel,"na":-1,"domain" : [-1, property["max"]], "binwidth" : binwidth});      
		 countBar++;
        	 break;
		 }
		 }
		 break;
		default:
		 console.log("Sorry I dont support "+id+", with type: "+promptType);
		}
        });
	dashboard.config = configObject;
	if(next) next();
        });
}
