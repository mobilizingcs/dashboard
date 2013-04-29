(function( $ ) {
	$.fn.filtermap = function(options) {
		
		//init map
		var mapid = this.attr("id");
		var mymap = new L.Map(mapid);
		
		//we hide the map on load
		mymap.whenReady(function(){
			$("#" + mapid).hide();
		});		

		//init
		var	center = options.center || [0,0];
		var zoom = options.zoom || 9;
		mymap.setView(center, zoom);
		
		//add tile layer(s)
		var cloudmaps = {};
		var defaultmap;		
		$(options.tilelayers).each(function(index, conf) {
			cloudmaps[conf.title] = tilelayer(conf);
			if(!defaultmap || conf["default"]){
				defaultmap = cloudmaps[conf.title];
			}			
		});
		
		//add to map (if exists)
		defaultmap && defaultmap.addTo(mymap);
		
		//markercluster layer
		var markerlayer = buildmarkerlayer(options).setmap(mymap);		

		//layer array
		var geolayers = [markerlayer];
		
		//layer controls
		var mapcontrol = new L.Control.Layers(cloudmaps,{}).setPosition("bottomright").addTo(mymap);
		var layercontrol = new L.Control.Layers({"Disable" : L.layerGroup(), "Markers" : markerlayer},{}).setPosition("topright").addTo(mymap);		

		//info box
		var infobox = makeinfo();
		mymap.addControl(infobox);
		markerlayer.setinfo(infobox);
		
		//geojsonlayers
		$(options.geojson).each(function(index, conf) {
			downloadgeojson(conf.url, function(data){
				var newlayer = buildgeojsonlayer(data).setinfo(infobox).setmap(mymap).setfilter(conf.item, options.item).colormap();
				newlayer.setcontrol(layercontrol, conf.title || urltail(conf.url));
				geolayers.push(newlayer);
			})
		});
		
		//trigger reset on layer switch event.
		mymap.on("baselayerchange", function(LayerEvent){
			if(LayerEvent.layer.options && LayerEvent.layer.options.tileSize){
				//this is just a tile layer;
				return;
			}
			dashboard.message("changing base layers...");
			infobox.update("")
			$(geolayers).each(function(index, layer){
				if(layer.reset) layer.reset();
			});

		});	
		
		$("<a>").addClass("refresh").addClass("hide").appendTo("#"+mapid).on("click", function(){
			dashboard.message("forcing map refresh")
			mymap.invalidateSize();
		})
		
		$("<a>").addClass("reset").addClass("hide").appendTo("#"+mapid).on("click", function(){
			//this is hacky
			dashboard.message("resetting map state")
			$("#" + mapid + " input[type=radio]:first").trigger("click");
			mymap.setView(center, zoom, true);
		})		

	    mymap.resetall = function(){
	    	$(geolayers).each(function(index, layer){
	    		layer.reset();
	    	});
	    }
		
		return mymap;
	}
	
	function buildmarkerlayer(options){
		
		var map;
		var markerblocker;
		var info;
		var getlat = oh.utils.getnum(options.item.lat);
		var getlng = oh.utils.getnum(options.item.lng);		
		var latdim = dashboard.data.dimension(getlat);
	    var lngdim = dashboard.data.dimension(getlng);	
		var markerlayer = new L.MarkerClusterGroup(options.clusteroptions || {});

		//for debugging
	    dashboard.dim["lat"] = latdim;
	    dashboard.dim["lng"] = lngdim;			
		
		function renderMarkers(){
			if(!map) return;
			map.removeLayer(markerlayer);
			markerlayer.clearLayers();
			
			//get new data
			var markerdata = dashboard.dim.main.top(Infinity);
			for (var i = 0; i < markerdata.length; i++) {
				var a = markerdata[i];
				if(!getlat(a)){
					dashboard.message("skipping record " + i + " (no valid latlng)")
					continue;
				}

				var marker = new L.Marker(new L.LatLng(getlat(a), getlng(a)), { title: a[dashboard.config["item_main"]] });
				markerlayer.addLayer(marker);
				marker.on("click", (function(){
					var k = a;
					return function(){dashboard.modal.showmodal(k)};
				})());
			}
			map.addLayer(markerlayer);
			return markerlayer;
		}	
		
		function geofilter(){
			if(!map.hasLayer(markerlayer)) {
				latdim.filter(null);
				lngdim.filter(null);
				//return;
			} else {
				var bounds = map.getBounds();
				var lat = [bounds.getNorthEast()["lat"], bounds.getSouthWest()["lat"]];
				var lng = [bounds.getNorthEast()["lng"], bounds.getSouthWest()["lng"]];
				
				//flip around if needed
				lat = lat[0] < lat[1] ? lat : [ lat[1] , lat[0] ];
				lng = lng[0] < lng[1] ? lng : [ lng[1] , lng[0] ];
				
				//filter
				latdim.filter(lat);
				lngdim.filter(lng);
			}
			
			function round(original){
				return original.toFixed(3)
			}
			
			info && info.update("<pre>" + round(bounds.getSouthWest()["lat"]) + " < lat < " + round(bounds.getNorthEast()["lat"]) + "\n" + round(bounds.getSouthWest()["lng"]) + " < lng < " + round(bounds.getNorthEast()["lng"]) + "</pre>");
			
			return markerlayer;
		}	
		
		function domarkers(){
			//debug
			var starttime = new Date().getTime();
			
			markerlayer.clearLayers();			
			latdim.filter(null);
			lngdim.filter(null);  			
			renderMarkers(Infinity);
			geofilter();
			
			//debug
			var enddtime = new Date().getTime();
			var delta = enddtime - starttime;			
			dashboard.message("updating markers took: " + delta + "ms.")				
		}		
		
		function setmap(newmap){
			map = newmap;
			map.on("moveend", function(){
				if(map.hasLayer(markerlayer)){
					geofilter();
					markerblocker = true;
					dc.redrawAll();	
				}
			});	
			
			dashboard.renderlet.register(function(){		
		    	if(map.hasLayer(markerlayer)){
		    		if(markerblocker) {
		    			markerblocker = false;
		    		}  else { 
		    			domarkers();
		    		}
		    	}
			}, 200);	
			return markerlayer
		}
		
		markerlayer.setinfo = function(newinfo){
			info = newinfo;
			return markerlayer;
		}
		
		//export
		markerlayer.setmap = setmap;
		
		//for map.on(layeradd)
		markerlayer.reset = function(){
			markerlayer.clearLayers();			
			latdim.filter(null);
			lngdim.filter(null);  			
		}
		
		return markerlayer;
	}
	
	function buildgeojsonlayer(geojsondata, getlat, getlng){

		//the layer objects
		var geojson;
		var info;
		var map;
		var geodim;
		var geogroup;
		var selected;
		
		function hoverin(e) {
			var layer = e.target;
			var infotemplate = "<div><h4>Neighborhood</h4> <b> {{ name }} </b></div>";

			layer.setStyle({
				weight: 3,
				color: '#666',
				dashArray: '0'
			});

			if (!L.Browser.ie && !L.Browser.opera) {
				layer.bringToFront();
			}

			info && info.update(Mustache.render(infotemplate, layer.feature.properties));
		}
		
		function hoverout(e) {
			e.target.setStyle({
				weight:2,
				color: "white",
				dashArray: '3'
			})
			info && info.update("<div><h4>Neighborhood</h4><i>Hover over map</i></div>");
		}

		function selectNeighborhood(e){
			//click becomes selected unless unclick.
			selected = (e && selected != e.target) ? e.target : null;
			if(geodim) geodim.filter(selected && selected.feature.properties.name);
			dc.redrawAll();
		}

		function onEachFeature(feature, layer) {
			layer.on({
				mouseover: hoverin,
				mouseout: hoverout,
				click: selectNeighborhood
			});
		}

		function getColor(properties) {
    	   return (properties.count > 0) ? '#CCCCCC' : '#F0F0FF';
		}

		function style(feature) {
			return {
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.85,
				fillColor: getColor(feature.properties)
			};
		}	
		
		function colormap(){
			//check if initialized
			if(!geogroup || !map) {
				return geojson;
			}
			
			//layer isn't active
			if(!map.hasLayer(geojson)){
				return geojson
			}
			
			var starttime = new Date().getTime();
			
			var allgroups = geogroup.all();
			var countobject = {};
			$.each(allgroups, function(index, neighborhood) {
				countobject[neighborhood.key] = neighborhood.value;
			});
			
			//color each individual polygon
			geojson.eachLayer(function(layer){
				layer.feature.properties.count = countobject[layer.feature.properties.name];
				geojson.resetStyle(layer)
			});
			
			selected && selected.setStyle({"fillColor": "steelblue"});
			
			//for debug
			var enddtime = new Date().getTime();
			var delta = enddtime - starttime;			
			dashboard.message("coloring maps took: " + delta + "ms.")			
			
			return geojson;
		}
		
		function classify(itemgeo, name){
			//dupe?
			var getlat = oh.utils.getnum(itemgeo.lat);
			var getlng = oh.utils.getnum(itemgeo.lng);	
			
			var markerdata = dashboard.dim.main.top(Infinity);
			
			var starttime = new Date().getTime();
			for (var i = 0; i < markerdata.length; i++) {
				var a = markerdata[i];

				//no gps data:
				if(!getlat(a)){
					continue;
				}
			
				//try to classify:
				var result = leafletPip.pointInLayer([getlng(a), getlat(a)], geojson, true);
				a[name] = result[0] ? result[0].feature.properties.name : "NA";
			}		
			var enddtime = new Date().getTime();
			var delta = enddtime - starttime;
			dashboard.message("classification of " + markerdata.length + "points took: " + delta + "ms.")
		}			
		
		geojson = L.geoJson(geojsondata, {
			style: style,
			onEachFeature: onEachFeature
		})
		
		geojson.setinfo = function(newinfo){
			info = newinfo;
			return geojson;
		}
		
		geojson.setmap = function(newmap){
			map = newmap;
			return geojson;
		}
		
		geojson.reset = function(){
			selectNeighborhood();
			return geojson;
		}
		
		geojson.setcontrol = function(newcontrol, name){
			newcontrol.addBaseLayer(geojson, name);
		}
		
		geojson.colormap = colormap;
		
		geojson.setfilter = function(newitem, itemgeo){
			if(newitem){
				//filter using column in the data
				var getgeo = oh.utils.get(newitem);
			} else {
				//	filter by auto classification
				var dimname = "jsonpip";
				classify(itemgeo, dimname)
				var getgeo = oh.utils.get(dimname);
			}
			geodim = dashboard.data.dimension(getgeo);
			geogroup = geodim.group();
			dashboard.renderlet.register(colormap, 100);		
			return geojson;
		}
		
		return geojson;

	}
	
	function downloadgeojson(url, cb){
		var jqxhr = $.getJSON(url, cb).fail(function() { alert("failed to download geojson file: " + url); });		
	}
	
	function tilelayer(conf){
		var mapoptions = conf || {};
		var url = conf.url || 'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png';
		mapoptions.attribution = mapoptions.attribution || false;
		mapoptions.maxZoom = mapoptions.maxZoom || 18;
		var mylayer = new L.TileLayer(url, mapoptions);
		return mylayer;
	}
	
	function urltail(mystring){
		var x = mystring.split("/");
		return x[x.length-1];		
	}

	
	function makeinfo(){
		// control that shows state info on hover
		var info = L.control();

		info.onAdd = function () {
			this._div = L.DomUtil.create('div', 'info');
			this._div.id = "infobox"
			this.update();
			return this._div;
		};

		info.update = function (infotext) {
			this._div.innerHTML = infotext || "<div><h4>Load Data</h4><i>Select Data Layer</i></div>";
		};

		return info;
	}
	
})( jQuery );