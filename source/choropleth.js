(function( $ ) {
	$.fn.filtermap = function(options) {
		
		//init map
		var mymap = new L.Map(this.attr("id"), {
			center: options.center || [0,0],
			zoom: options.zoom || 9
		});		
		
		//add tile layer(s)
		var cloudmaps = {"Blank" : L.layerGroup()};
		var defaultmap;		
		$(options.tilelayers).each(function(index, conf) {
			cloudmaps[conf.title] = tilelayer(conf);
			if(!defaultmap || conf["default"]){
				defaultmap = cloudmaps[conf.title];
			}			
		});
		
		//add to map (if exists)
		defaultmap && defaultmap.addTo(mymap);
		
		//switch layers
		var mapcontrol = new L.Control.Layers(cloudmaps,{}).setPosition("bottomright").addTo(mymap);
		var layercontrol = new L.Control.Layers({"none" : L.layerGroup()},{}).setPosition("bottomright").addTo(mymap);		

		//info box
		var infobox = makeinfo("<h4>Neighborhood</h4> <b> {{ name }} </b>").addTo(mymap);
		
		//geojsonlayers
		var geojsonlayers = [];
		$(options.geojson).each(function(index, conf) {
			downloadgeojson(conf.url, function(data){
				var newlayer = buildgeojsonlayer(data).setinfo(infobox).setmap(mymap).setfilter(conf.item, options.item).colormap();
				newlayer.setcontrol(layercontrol, urltail(conf.url));
				geojsonlayers.push(newlayer);
			})
		});		
		
		//construct lat/lng dimensions
		var getlat = oh.utils.getnum(options.item.lat);
		var getlng = oh.utils.getnum(options.item.lng);
		var latdim = dashboard.data.dimension(getlat);
	    var lngdim = dashboard.data.dimension(getlng);	
	    dashboard.dim["lat"] = latdim;
	    dashboard.dim["lng"] = lngdim;	    
		
	    mymap.resetall = function(){
	    	$(geojsonlayers).each(function(index, layer){
	    		layer.reset();
	    	});
	    }
		
		return mymap;
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

			layer.setStyle({
				weight: 3,
				color: '#666',
				dashArray: '0'
			});

			if (!L.Browser.ie && !L.Browser.opera) {
				layer.bringToFront();
			}

			info && info.update(layer.feature.properties);
		}
		
		function hoverout(e) {
			e.target.setStyle({
				weight:2,
				color: "white",
				dashArray: '3'
			})
			info && info.update();
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
			if(!geogroup) return;
			var allgroups = geogroup.all();
			var countobject = {};
			$.each(allgroups, function(index, neighborhood) {
				countobject[neighborhood.key] = neighborhood.value;
			});
			
			geojson.eachLayer(function(layer){
				layer.feature.properties.count = countobject[layer.feature.properties.name];
				geojson.resetStyle(layer)
			});
			
			selected && selected.setStyle({"fillColor": "steelblue"});
			return geojson;
		}
		
		function classify(itemgeo){
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
				a.jsonpip = result[0] ? result[0].feature.properties.name : "NA";
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
			geojson.addTo(map);
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
				classify(itemgeo)
				var getgeo = oh.utils.get("jsonpip");
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
		var mapoptions = conf.mapoptions || {};
		mapoptions.attribution = mapoptions.attribution || false;
		mapoptions.maxZoom = mapoptions.attribution || 18;
		var mylayer = new L.TileLayer(conf.url, mapoptions);
		return mylayer;
	}
	
	function urltail(mystring){
		var x = mystring.split("/");
		return x[x.length-1];		
	}

	
	function makeinfo(titletemplate){
		// control that shows state info on hover
		var info = L.control();

		info.onAdd = function () {
			this._div = L.DomUtil.create('div', 'info');
			this.update();
			return this._div;
		};

		info.update = function (props) {
			this._div.innerHTML = Mustache.render(titletemplate, props);
		};

		return info;
	}
	
})( jQuery );