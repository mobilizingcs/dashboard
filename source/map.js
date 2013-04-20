(function( $ ) {
	$.fn.filtermap = function(options) {
		
		//map id
		var mapid = this.attr("id");
		
		//some models
		var markerdelay = oh.utils.delayexec();
		var markerblocker; 
		
		//this static variable controls if filters are activated when hovering over an neighborhood.
		var filterOnHover = false;
		
		//NOTE
		//currently, NA values for lat/long are turned into null, which the filter interprets as [0,0], which is in africa
		
		//create dimensions
		var getlat = oh.utils.getnum(options.item.lat);
		var getlng = oh.utils.getnum(options.item.lng);
		var latdim = dashboard.data.dimension(getlat);
	    var lngdim = dashboard.data.dimension(getlng);

	    //create geo group
		var getgeo = oh.utils.get(options.item.geo);	    
	    var geodim = dashboard.data.dimension(getgeo);
	    var geogroup = geodim.group()
	    
	    //for completeness
	    dashboard.dim["lat"] = latdim;
	    dashboard.dim["lng"] = lngdim;
	    dashboard.dim["geo"] = geodim;
	    dashboard.groups["geo"] = geogroup;
	    
		querystate = {
			
			hovered : null,
			selected : null,
				
			reset : function(){
				//should not happen, but just in case.
				if(this.hovered){
					this.hover(this.hovered);
				}
				
				//reset
				if(this.selected){
					this.select(this.selected);
				} else {
					this.runFilter();
				}			
			},
			hover : function(neighborhood){
				this.hovered = neighborhood.hover ? neighborhood : null;
				if(filterOnHover){
					this.runFilter()
				} else {
					neighborhoods.colormap()					
				}
			},
			select : function(neighborhood){
				//unselect previously selected
				if(this.selected){
					this.selected.selected = false;
					this.selected = null;
					this.hovered = null;
				};
				
				//switch clicked state:
				if(neighborhood.selected){
					this.selected = neighborhood;
					this.runFilter();
				} else {
					this.runFilter();
				}
			},
			runFilter : function(){		
				if(this.selected){
					//if we are hovering, that one will be used for filtering				
					geodim.filter(this.selected.feature.properties.name);
					dc.redrawAll();
				} else if(this.hovered) {
					//to enable hover filtering:
					geodim.filter(this.hovered.feature.properties.name);
					dc.redrawAll();
				} else {
					geodim.filterAll();
					dc.redrawAll();
				}
			}
		};
		
		//init layers
		var cloudmaps = {};
		var defaultmap;
		$(options.tilelayers).each(function(index, conf) {
			var mapoptions = conf.mapoptions || {};
			mapoptions.attribution = mapoptions.attribution || false;
			mapoptions.maxZoom = mapoptions.attribution || 18;
			cloudmaps[conf.title] = new L.TileLayer(conf.url, mapoptions);
			if(conf["default"]){
				defaultmap = cloudmaps[conf.title];
			}			
		});
		
		cloudmaps["Disable"] = L.marker([0,0])
		
		//initiate the map
		var mymap = new L.Map(mapid, {
			center: options.center || [0,0],
			layers: defaultmap,
			zoom: options.zoom || 9
		});
		
		//hack for the overly sensitive dragger
		mymap.on("dragstart", function(){
			if(!querystate.hovered) return;
			var s = mymap.getCenter()
			var handler = function(){
				var delta = s.distanceTo(mymap.getCenter());
				var total = mymap.getBounds().getSouthWest().distanceTo(mymap.getBounds().getNorthEast());
				var drag = Math.abs(delta / total) * 100
				if(drag < 0.5) {
					querystate.hovered.selected = !querystate.hovered.selected;
					querystate.select(querystate.hovered);
				}
				this.removeEventListener("dragend", handler);
			};
			this.on("dragend", handler);
		});	
		

		//helper function to generate layers from geojson data
		var LAData = function(jsondata){
			
			//a table with all the neighbordhoods for this layer
			var allhoods = {};				

			//create geojson layer
			var datalayer = new L.GeoJSON(jsondata, {
				style: function(feature){
					return(
						{
							
							"color" : "#999",
							"weight" : 1.5,
							"opacity" : 0.5,
							"fillColor" : "#F0F0FF",
							"fillOpacity" : 0.8
						}
					);				
				},
				onEachFeature: function(feature, layer) {
					
					//neighborhood object
					var neighborhood = {feature:feature, layer:layer, count:0, selected:false, hover:false};
					allhoods[feature.properties.name] = neighborhood;
					
					//click event
					layer.on("click", function(e) {
						//select or unselect
						neighborhood.selected = !neighborhood.selected;
						querystate.select(neighborhood);
					});	
					
					//mouse-in event
					layer.on("mouseover", function(e) {
						info.update(feature.properties);
						neighborhood.hover = true;
						querystate.hover(neighborhood);
					});
					
					//mouse-out event
					layer.on("mouseout", function(e) {
						info.update();
						neighborhood.hover = false;
						querystate.hover(neighborhood);
						
					});					
					
				}
			});
			
			//update polygon colors
			var colormap = function(){
				//if(!mymap.hasLayer(LAData)) return;
				dashboard.message("updating neighborhood colors")
				updateCounters();
				for(name in allhoods){
					if(allhoods[name].selected){
						//selected or hover polygons				
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 1, "fillColor": "#00477F"});
					} else if(allhoods[name].hover){ 
						//hover color
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 1, "fillColor": "steelblue"});
					} else if(allhoods[name].count > 0){
						//polygons with data
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 1, "fillColor": "#CCCCCC"});
					} else {
						//inactive polygons
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 0.8, "fillColor": "#F0F0FF"});
					};
				};			
			}
			
			//recalculate counts
			var updateCounters = function(){
				//reset counters
				for(name in allhoods){
					allhoods[name].count = 0;
				};	
				
				//new counter
				var areacounts = geogroup.all();
				for(var i = 0; i < areacounts.length; i++){
					var name = areacounts[i].key;
					if(!name || !allhoods[name]) continue;
					allhoods[name].count = areacounts[i].value;
				};
			}		
			
			datalayer.colormap = colormap;

			return(datalayer);
		}
		
		

		
		//grouped markers layer
		var markerlayer = new L.MarkerClusterGroup(options.clusteroptions || {});
		
		var renderMarkers = function(n){
			dashboard.message("updating markers.")
			//clear current layers
			//if(!mymap.hasLayer(markerlayer)) return;
			mymap.removeLayer(markerlayer);
			markerlayer.clearLayers();
			
			//get new data
			var markerdata = dashboard.dim.main.top(n);
			for (var i = 0; i < markerdata.length; i++) {
				var a = markerdata[i];
				if(!getlat(a)){
					dashboard.message("skipping record " + i + " (no valid latlng)")
					continue;
				}
				//dashboard.message("marker " + i + ": " + getlat(a) + ", " + getlng(a));
				var marker = new L.Marker(new L.LatLng(getlat(a), getlng(a)), { title: a[dashboard.config["item_main"]] });
				markerlayer.addLayer(marker);
				marker.on("click", (function(){
					var k = a;
					return function(){dashboard.modal.showmodal(k)};
				})());
			}
			
			//add to map
			mymap.addLayer(markerlayer);
			//markerlayer.clearLayers();
		}
		
		//this function sets a filter on the current viewport
		//or removes the filter if the marker layer is gone
		function geofilter(){
			if(!mymap.hasLayer(markerlayer)) {
				latdim.filter(null);
				lngdim.filter(null);
				//return;
			} else {
				var bounds = mymap.getBounds();
				var lat = [bounds.getNorthEast()["lat"], bounds.getSouthWest()["lat"]];
				var lng = [bounds.getNorthEast()["lng"], bounds.getSouthWest()["lng"]];
				
				//flip around if needed
				lat = lat[0] < lat[1] ? lat : [ lat[1] , lat[0] ];
				lng = lng[0] < lng[1] ? lng : [ lng[1] , lng[0] ];
				
				//filter
				latdim.filter(lat);
				lngdim.filter(lng);
			}
		}	
		
		//filter by viewport
		mymap.on("moveend", function(){
			if(mymap.hasLayer(markerlayer)){
				geofilter();
				//this is a hack to prevent the markers from being re-rendered.
				markerblocker = true;
				dc.redrawAll();
				//var redrawdelay = oh.utils.delayexec();
				//redrawdelay(dc.redrawAll, 200);				
			}
		});	
		
		//create the layers with LA areas and add to map
		neighborhoods = LAData(la_county);
		//classify(neighborhoods);
		
		//classify points
		function classify(polygons){
			var markerdata = dashboard.dim.main.top(Infinity);
			for (var i = 0; i < markerdata.length; i++) {
				var a = markerdata[i];
				if(!getlat(a)){
					continue;
				}
				var result = leafletPip.pointInLayer([getlat(a), getlng(a)], polygons);
				a.neighborhood = result[0];
			}			
		}

		//add the area layer selector thingies		
		var interactlayers = {
			"Markers" : markerlayer,
			"Neighbordhoods" : neighborhoods,
			"Disable" : L.marker([0,0])
		}
		
		var mapcontrol = new L.Control.Layers(cloudmaps,{}).setPosition("bottomright");	
		mymap.addControl(mapcontrol).on("baselayerchange", function(event){
			//reset map location
			if(event.layer == neighborhoods){
				mymap.setView([34.0522222, -118.2427778], 9);
			}
			geofilter();
			querystate.reset();		
		});	
		
		var layercontrol = new L.Control.Layers(interactlayers,{}).setPosition("topright");	 
		mymap.addControl(layercontrol);		
		
		//disable neighborhoods if not present in data
		//note that null is also a group
		if(geogroup.size() < 2){
			layercontrol.removeLayer(neighborhoods);
		}

		//add the state hover custom box
		var info = L.control();

		info.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'hoverinfo'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};
		
		// method that we will use to update the control based on feature properties passed
		info.update = function (props) {
			if(props){
			    this._div.innerHTML = '<h4>Neighborhood</h4>' +  '<b>' + props.name + '</b>';
			    $(this._div).show();				
			} else {
				$(this._div).hide()
			}
		};

		info.addTo(mymap);		
		
		function domarkers(){
			latdim.filter(null);
			lngdim.filter(null);  			
			renderMarkers(10000);
			geofilter();
		}
		
		//register neighborhoods updates
		dashboard.renderlet.register(function(){
			if(mymap.hasLayer(neighborhoods)){
				neighborhoods.colormap()
			} 
		});		
		
		//register marker updates
		dashboard.renderlet.register(function(){		
	    	if(mymap.hasLayer(markerlayer)){
	    		if(markerblocker) {
	    			//don't re-render markers (in case of zoom)
	    			markerblocker = false;
	    		}  else { 
	    			markerlayer.clearLayers();
	    			markerdelay(domarkers, 100)
	    		}
	    	}
		});		

		//very hacky. resets the data layer

		mymap.resetall = function(){
			$("#" + mapid).find(".leaflet-top.leaflet-right").find('input:radio:last').click()
		}
		
		mymap.attributionControl.setPrefix(false).addAttribution('Design by <a href="http://jeroenooms.github.com">Jeroen Ooms</a>');
		
		//chain it
		return mymap;
	}
})( jQuery );