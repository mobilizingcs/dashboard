function dbinit() {
	var socket = io.connect();

	socket.on('error', function(err) {
		alert("Server error: " + JSON.stringify(err));
	})

	//we assume no further updates at this point.
	socket.on('update', function(data) {
		//manually cast dates
		data.results.forEach(function(d, i) {
		  d.date = d["context_location_timestamp"] ? new Date(d["context_location_timestamp"]) : null;
		});		
		
		//load into crossfilter
		loaddata(data.results);
	});

	var getdata = function(options) {
		socket.emit('getdata', options);
	}

	socket.on('hello', function() {
		getdata({
			stat : "selectAll",
			items : [ "neighborhood", "context_location_timestamp", "latlng",
					"prompt_id_WhatSnack", "prompt_id_WhoYouSnackWith",
					"prompt_id_SnackImage", "prompt_id_SnackCost",
					"prompt_id_SnackPeriod", "prompt_id_SnackLocation",
					"prompt_id_HealthyLevel", "prompt_id_WhySnack"],
			complete : true,
			query : {
				"survey_privacy_state" : "shared"
			}
		});
	});
}

/*
 * 
 * //to connect to external service: var socket =
 * io.connect('http://localhost:3000');
 * 
 * 
 * getdata({ stat : "select", items : "neighborhood", query : {
 * "survey_privacy_state" : "shared" } });
 * 
 * getdata({ stat : "selectAll", items : ["neighborhood", "prompt_id_WhySnack"],
 * count : false, query : { "survey_privacy_state" : "shared" } });
 * 
 * getdata({ stat : "bin", item : "neighborhood", query : {
 * "survey_privacy_state" : "shared" } });
 * 
 * getdata({ stat : "select", item : "prompt_id_SnackImage", limit: 20, page:
 * 10, query : { "survey_privacy_state" : "shared" } });
 * 
 * getdata({ stat : "binhist", binwidth : 0.05, item :
 * "context_location_longitude", query : { "survey_privacy_state" : "shared" }
 * });
 * 
 * getdata({ stat : "bindays", item : "context_location_timestamp", query : {
 * "survey_privacy_state" : "shared" } });
 * 
 * getdata({ stat : "bindates", item : "context_location_timestamp", query : {
 * "survey_privacy_state" : "shared" } });
 * 
 * getdata({ stat : "binhours", item : "context_location_timestamp", query : {
 * "survey_privacy_state" : "shared" } });
 * 
 * getdata({ stat : "binwords", limit: 20, item : "prompt_id_WhySnack", query : {
 * "survey_privacy_state" : "shared" } });
 */
