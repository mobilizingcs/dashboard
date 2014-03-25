function generalized(next){
//find out what campaign we are using
campaign = window.location.hash.substr(1);
configObject={};

//test for known campaign types and loads config files
if ( /advertisement|:media/i.test(campaign) ){
        console.log("loading existing config: media");
        readConfig("media");
} else if ( /:trash$|trashintro|:demo_trash:/i.test(campaign) ) {
        console.log("loading existing config: trash");
        readConfig("trash");
} else if ( /:snack/i.test(campaign) ) {
        console.log("loading existing config: snack");
        readConfig("snack");
} else if ( /:litter/i.test(campaign) ) {
        console.log("loading existing config: litter");
        readConfig("litter");
} else if ( /:nutrition/i.test(campaign) ) {
        console.log("loading existing config: nutrition");
        readConfig("nutrition");
} else {
        console.log("I'm generating a config now...");
        generateConfig(campaign);
}

//function reads from existing config files, generates if failure occurs
function readConfig(campaignType){
        $.ajax({
                url: "config/"+campaignType+".json",
                dataType: "json"
        })      
        .success(function(data) {
                dashboard.config = data; 
                if(next) next(); 
        })      
        .fail(function(err) { 
                console.log("couldn't load config file! generating one, sorry!"); 
                generateConfig(campaign); 
        });     
};   


//function reads xml and generates a basic config for the dashboard
function generateConfig(campaign){
        oh.campaign_read_xml(campaign, function(xml){
        campaign_xml = xml;
        //initialize the config.json general file
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
		if($(this).find('displayLabel').text().length > 15){
	          displayLabel = $(this).find('displayLabel').text().slice(0,15)+"...";
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
		 
		  //a random if statement so we don't explode when min<0, and instead display some *wild* bar charts!
		  if (property["min"] < 0){
                  configObject.barcharts.push({item:id,title:displayLabel,"na":(eval(property["min"]-1)),"domain" : [(eval(property["min"]-1)), property["max"]], "binwidth" : binwidth});
		  } else {
                  configObject.barcharts.push({item:id,title:displayLabel,"na":-1,"domain" : [-1, property["max"]], "binwidth" : binwidth});
		  }
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
}
