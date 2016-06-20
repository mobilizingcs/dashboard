function generalized(next) {
    //find out what campaign we are using
    var campaign = oh.utils.state()[0]
    console.log(campaign);
    configObject = {};

    //test for known campaign types and loads config files
    if (campaign === "") {
        //check for empty campaign and redirect to pick one
        window.location = "/#campaigns/#dashboard";
    } else if (/:public:snack/i.test(campaign)) {
        console.log("loading public config: snackdemo");
        readConfig("snackdemo");
    } else if (/:public:media/i.test(campaign)) {
        console.log("loading public config: mediademo");
        readConfig("mediademo");
    } else if (/:public:nutrition/i.test(campaign)) {
        console.log("loading public config: nutritiondemo");
        readConfig("nutritiondemo");
    } else if (/:public:trash/i.test(campaign)) {
        console.log("loading public config: trashdemo");
        readConfig("trashdemo");
    } else if (/advertisement|:media/i.test(campaign)) {
        console.log("loading existing config: media");
        readConfig("media");
    } else if (/:trash$|trashintro|:demo_trash:/i.test(campaign)) {
        console.log("loading existing config: trash");
        readConfig("trash");
    } else if (/trash2$/i.test(campaign)) {
        console.log("loading existing config: trash2");
        readConfig("trash2");
    } else if (/:snackforstats/i.test(campaign)) {
        console.log("I'm generating a config now...");
        generateConfig(campaign);
    } else if (/:snack/i.test(campaign)) {
        console.log("loading existing config: snack");
        readConfig("snack");
    } else if (/:litter/i.test(campaign)) {
        console.log("loading existing config: litter");
        readConfig("litter");
    } else if (/:nutrition_v2/i.test(campaign)) {
        console.log("loading existing config: nutrition_v2");
        readConfig("nutrition_v2");
    } else if (/:nutrition/i.test(campaign)) {
        console.log("loading existing config: nutrition");
        readConfig("nutrition");
    } else if (/:freetime/i.test(campaign)) {
        console.log("loading existing config: freetime");
        readConfig("freetime");
    } else {
        console.log("I'm generating a config now...");
        generateConfig(campaign);
    }

    //function reads from existing config files, generates if failure occurs
    function readConfig(campaignType) {
        $.ajax({
                url: "config/" + campaignType + ".json",
                dataType: "json"
            })
            .success(function(data) {
                dashboard.config = data;
                if (next) next();
            })
            .fail(function(err) {
                console.log("couldn't load config file! generating one, sorry!");
                generateConfig(campaign);
            });
    };


    //function reads xml and generates a basic config for the dashboard
    function generateConfig(campaign) {
        oh.campaign_read_xml(campaign, function(xml) {
            campaign_xml = xml;
            //initialize the config.json general file
            configObject.title = "Dashboard";
            configObject.data = {};
            configObject.data.filter = "";
            configObject.data.url = "{{ oh.getcsvurl }}";
            configObject.datecharts = {
                "title": "Response Date",
                "item": "context:timestamp"
            };
            configObject.hourcharts = {
                "title": "Response Time",
                "item": "context:timestamp"
            };
            configObject.dropdowns = {
                "title": "User",
                "item": "user:id"
            };
            configObject.maps = [{
                "item": {
                    "lat": "context:location:latitude",
                    "lng": "context:location:longitude"
                },
                "center": [34.0522222, -118.2427778],
                "na": [33.9, -118.5],
                "zoom": 9,
                "clusteroptions": {
                    "spiderfyOnMaxZoom": true,
                    "showCoverageOnHover": true,
                    "zoomToBoundsOnClick": true
                },
                "geojson": [{
                    "title": "neighborhoods",
                    "url": "lib/geojson/la_simplified.min.json"
                }],
                "tilelayers": [{
                    "title": "Standard",
                    "key": "2d69a170ad5540f981628a272225958a",
                    "styleId": 1
                }, {
                    "title": "Road",
                    "key": "2d69a170ad5540f981628a272225958a",
                    "styleId": 997
                }, {
                    "title": "Minimal",
                    "key": "2d69a170ad5540f981628a272225958a",
                    "styleId": 22677,
                    "default": true
                }]
            }]
            configObject.piecharts = [];
            configObject.wordclouds = [];
            configObject.barcharts = [];
            configObject.modal = [];
            //limit the number of piecharts, photocharts, wordclouds and numbers
            var limitPie = 4;
            var countPie = 0;
            var limitPhoto = 1;
            var countPhoto = 0;
            var limitClouds = 2
            var countClouds = 0;
            var limitBar = 2;
            var countBar = 0;
            $(campaign_xml).find("prompt").each(function() {
                var id = $(this).find('id').text();
                promptType = $(this).find('promptType').text();
                if ($(this).find('displayLabel').text().length > 15) {
                    var displayLabel = $(this).find('displayLabel').text().slice(0, 15) + "...";
                } else {
                    var displayLabel = $(this).find('displayLabel').text();
                }

                configObject.modal.push({
                    "item": (promptType == "single_choice") ? id + ":label" : id,
                    "title": displayLabel
                });
                //generate some items based on prompts
                switch (promptType) {
                    case "photo":
                        if (countPhoto < limitPhoto) {
                            configObject.photo = {
                                "item": id,
                                "thumb": "/app/image/read?client=dashboard&size=icon&id={{" + id + "}}",
                                "image": "/app/image/read?client=dashboard&id={{" + id + "}}"
                            }
                            countPhoto++;
                        }
                        break;
                    case "single_choice":
                        if (countPie < limitPie) {
                            configObject.piecharts.push({
                                "item": id + ":label",
                                "title": displayLabel
                            });
                            countPie++;
                        }
                        break;
                    case "text":
                        if (countClouds < limitClouds) {
                            configObject.wordclouds.push({
                                "item": id,
                                "title": displayLabel
                            });
                            //make the first text prompt the item_main
                            if (countClouds === 0) {
                                configObject.item_main = id;
                            }
                            countClouds++;
                        }
                        break;
                    case "number":
                        if (countBar < limitBar) {
                            if ($(this).find("skippable").text() === "false" && $(this).find('condition').length === 0) {
                                configObject.barcharts.push({
                                    "item": id,
                                    "title": displayLabel
                                });
                                countBar++;
                                break;
                            } else {
                                var property = [];
                                $(this).children('properties').children('property').each(function() {
                                    property[$(this).children('key').text()] = $(this).children('label').text();
                                });
                                var binwidth = Math.ceil(eval((property["max"] - property["min"]) / 10))

                                //a random if statement so we don't explode when min<0, and instead display some *wild* bar charts!
                                if (property["min"] < 0) {
                                    configObject.barcharts.push({
                                        item: id,
                                        title: displayLabel,
                                        "na": (eval(property["min"] - 1)),
                                        "domain": [(eval(property["min"] - 1)), property["max"]],
                                        "binwidth": binwidth
                                    });
                                } else {
                                    configObject.barcharts.push({
                                        item: id,
                                        title: displayLabel,
                                        "na": -1,
                                        "domain": [-1, property["max"]],
                                        "binwidth": binwidth
                                    });
                                }
                                countBar++;
                                break;
                            }
                        }
                        break;
                    default:
                        console.log("Sorry I dont support " + id + ", with type: " + promptType);
                }
            });
            dashboard.config = configObject;
            if (next) next();
        });
    }
}
