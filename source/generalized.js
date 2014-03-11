
	//find out what campaign we are using
	campaign = window.location.hash.substr(1);

        oh.campaign_read_xml(campaign, function(xml){
        campaign_xml = $.parseXML( xml )
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
	//change this, hack for snack to test
	configObject.item_main = "WhatSnack";
        $(campaign_xml).find("prompt").each(function(){
                id = $(this).find('id').text();
                promptType = $(this).find('promptType').text();
                displayLabel = $(this).find('displayLabel').text();
		configObject.modal.push({
				"item" : id,
				"title" : displayLabel
				}); 
                switch (promptType)
                {
                case "photo":
                 configObject.photo = {
                                        "item": id,
                                        "thumb" : "/app/image/read?client=dashboard&size=icon&id={{"+id+"}}",
                                        "image" : "/app/image/read?client=dashboard&id={{"+id+"}}"
                                      }
                 break;
                case "single_choice":
                 configObject.piecharts.push({
                                        "item": id+":label",
                                        "title": displayLabel
                                        });
                 break;
                case "text":
                 configObject.wordclouds.push({
                                        "item": id,
                                        "title": displayLabel
                                        });
                 break;
                case "number":
		 if ($(this).find('skippable').text() === "false" && $(this).find('condition').text().isEmpty){
                 configObject.barcharts.push({
                                        "item": id,
                                        "title": displayLabel
                                        });
                 break;
		 }
		 console.log("Sorry I dont support "+id+", with type: "+promptType);
		 break;
		default: 
		 console.log("Sorry I dont support "+id+", with type: "+promptType);

                }

        });
	dashboard.config = configObject;
	if(next) next();
        });
}
