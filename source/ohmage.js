var oh = oh || {};
oh.utils = oh.utils || {};
oh.user = oh.user || {};

oh.utils.getRandomSubarray = function(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor(i * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

oh.utils.delayexec = function(){
	var timer;
	function exec(call, delay){
		if(timer) {
			dashboard.message("clear " + timer);			
			clearTimeout(timer);
		}
		timer = setTimeout(function(){
			timer = null;
			call();
		}, delay);
		dashboard.message("added " + timer)		
	};
	return exec;
}

oh.utils.parsedate = function(datestring){
	if(!datestring) {
		return null;
	}
	var a = datestring.split(/[^0-9]/);
	return new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5]);
}

oh.utils.get = function(item){
	return function(d){
		if(d[item] && d[item] != "NOT_DISPLAYED"){
			return d[item];
		}
		//NA support in dc.js piechart is really bad.
		return "NA"
	}
}

oh.utils.getnum = function(item){
	return function(d){
		if(d[item] && d[item] != "NOT_DISPLAYED"){
			return parseFloat(d[item]) || null;
		}
	}
}

oh.utils.getdate = function(item){
	return function(d){
		if(d[item] && d[item] != "NOT_DISPLAYED"){
			return d3.time.day(oh.utils.parsedate(d[item]));
		}
	}
}

oh.utils.bin = function(binwidth){
	return function(x){
		return Math.floor(x/binwidth) * binwidth;
	}
}

oh.utils.gethour = function(item){
	return function(d){
		if(d[item] && d[item] != "NOT_DISPLAYED"){
			return oh.utils.parsedate(d[item]).getHours();
		}
	}
}

oh.utils.state = function(mycampaign, myresponse){
	if(!mycampaign){
		return window.location.hash.substring(1).split("/");
	} 
	if(!myresponse){
		window.location.hash = mycampaign;
		return;
	}
	window.location.hash = mycampaign + "/" + myresponse;
}

oh.utils.readconfig = function(next){
	$.ajax({
		url: "config.json",
		dataType: "json"
	})
	.success(function(data) {
		dashboard.config = data;
		if(next) next();
	})
	.fail(function(err) { 
		alert("error loading config.json"); 
		dashboard.message(err) 
	});
}

oh.start = function(){
	oh.utils.readconfig(oh.init);
}

oh.call = function(path, data, datafun){
	
	function processError(errors){
		if(errors[0].code && errors[0].code == "0200"){
			var pattern = /(is unknown)|(authentication token)|(not provided)/i;
			if(!errors[0].text.match(pattern)) {
				alert(errors[0].text);
			}
			if(!/login.html$/.test(window.location.pathname)){
				oh.sendtologin();
			}
		} else {
			alert(errors[0].text)
		}
	}	
	
	//input processing
	var data = data ? data : {};		
	
	//default parameter
	data.client = "dashboard"
		
	var myrequest = $.ajax({
		type: "POST",
		url : "/app" + path,
		data: data,
		dataType: "text",
		xhrFields: {
			withCredentials: true
		}
	}).done(function(rsptxt) {
		if(!rsptxt || rsptxt == ""){
			alert("Undefined error.")
			return false;
		}
		var response = jQuery.parseJSON(rsptxt);
		if(response.result == "success"){
			if(datafun) datafun(response)
		} else if(response.result == "failure") {
			processError(response.errors)
			return false;
		} else{
			alert("JSON response did not contain result attribute.")
		}
		
	}).error(function(){alert("Ohmage returned an undefined error.")});		
	
	return(myrequest)
}

oh.login = function(user, password, cb){
	var req = oh.call("/user/auth_token", { 
		user: user, 
		password: password
	}, function(response){
		if(!cb) return;
		cb()
	})
	return req;
}

oh.logout = function(cb){
	oh.call("/user/logout", {}, cb);
}

oh.sendtologin = function(){
	window.location = "../web/#login"
}

oh.sendtologin_old = function(){
	var next = "login.html"
	if(location.hash) {
		next = next + "?state=" +  location.hash.substring(1);
	}
	if(location.pathname){
		next = next + "?next=" + location.pathname;
	}
	window.location = next;
}

oh.campaign_read = function(cb){
	var req = oh.call("/campaign/read", {
		output_format : "short"
	}, function(res){
		if(!cb) return;
		var arg = (res.metadata && res.metadata.items) ? res.metadata.items : null;
		cb(arg)
	});
	return req;
};

oh.init = function(){
	if(!dashboard.config.data.ohmage || /github.com|jeroenooms.com/.test(window.location.hostname) || oh.utils.state()[0] == "demo"){
		$("#loadinganimation").show();
		oh.initdemo();
	} else {
		oh.showlist();
	}
}

oh.showlist = function(){	
	oh.campaign_read(function(campaigns){
		var pattern = new RegExp(dashboard.config["name"], "i");
		var snackcampaigns = [];
		campaigns.forEach(function(o){
			if(pattern.test(o)){
				snackcampaigns.push(o);
				$("#campaignlist").append('<li><a target="_blank" href="#' + o + '">' + o + '</a></li>');
			}
		});
		
		if(dashboard.config.data.demo){
			$("#campaignlist").append('<li><a target="_blank" href="#demo">Demo campaign</a></li>');
		}
		
		if($.inArray(oh.utils.state()[0], snackcampaigns) > -1){
			//the hashtag matches a campaign
			dashboard.campaign_urn = oh.utils.state()[0];
			oh.snackread(dashboard.campaign_urn);				
		} else {
			//show a campaign picker menu
			$("#loadinganimation").hide();
			$("#choosecampaign").show();
			window.location.hash = "";
		};
		oh.keepactive();
	});
};

oh.initdemo = function(max){
	var myrequest = $.ajax({
		type: "GET",
		url : dashboard.config.sources[0].url
	});
	
	myrequest.error(function(){
		alert("Failed to download demo data.")
	});	

	myrequest.done(function(rsptxt) {
		dashboard.campaign_urn = "demo"
		oh.parsecsv(rsptxt, max)
	});	
}

oh.parsecsv = function(string, max){
	//dependency on d3!
	var rows = d3.csv.parse(string);
	
	//get head of data
	if(max) {
		rows = oh.utils.getRandomSubarray(rows, max);
	}

	//parse rows
	var records = [];
	rows.forEach(function(d, i) {
		//temp hack for the csv bug
		if(! d["Holiday:label"] && /Halloween|Christmas/i.test(d["Holiday:label"])) {
			console.log("skipping invalid record")
			console.log(d)
			return;
		}
			
		//don't skip ND/SKP records for now. NA support in crossfilter is really bad.
		if(d[dashboard.config.item_main] == "NOT_DISPLAYED") return;
		
		d.hash = murmurhash3_32_gc(JSON.stringify(d));
		records.push(d);
	});
	
	//load into gui
	loaddata(records)
}

oh.snackread = function(campaign_arg){

	var myrequest = $.ajax({
		type: "POST",
		url : "/app/survey_response/read",
		data: {
			campaign_urn : campaign_arg,
			client : "dashboard",
			user_list : "urn:ohmage:special:all",
			prompt_id_list : "urn:ohmage:special:all",
			output_format : "csv",
			sort_oder : "timestamp",
			column_list : "" + dashboard.config["columns"],
			suppress_metadata : "true"
		},
		dataType: "text",
		xhrFields: {
			withCredentials: true
		}
	});
	
	myrequest.error(function(){
		alert("Failed to download responses from Ohmage.")
	});
	
	myrequest.done(function(rsptxt) {
		if(!rsptxt || rsptxt == ""){
			alert("Undefined error.")
			return false;
		} else {
			oh.parsecsv(rsptxt)
		}
	});
}

oh.user.whoami = function(cb){
	var req = oh.call("/user/whoami", {}, function(res){
		if(!cb) return;
		cb(res.username)
	});
	return req;
}

//no more than 1 ping every 60 sec
oh.ping = _.debounce(oh.user.whoami, 60*1000, true);

//ping once every t sec
oh.keepalive = _.once(function(t){
	t = t || 60;
	setInterval(oh.ping, t*1000)
});

//or: keep alive only when active
oh.keepactive = _.once(function(t){
	$('html').click(function() {
		oh.ping();
	});
});


oh.getimageurl = function(record){	
	var photo = dashboard.config.photo.item;
	
	if(!record[photo] || record[photo] == "SKIPPED" || record[photo] == "NOT_DISPLAYED"){
		return "images/nophoto.jpg"
	} 		
	if(dashboard.campaign_urn == "demo"){
		var thumbtemplate = dashboard.config.photo.image || "data/demo/photos/{{ " + photo + " }}.jpg"
		return Mustache.render(thumbtemplate, record);
	} else { 
		return "/app/image/read?client=dashboard&id=" + record[photo];
	}
}	

oh.getcsvurl = function(){
	var mycampaign = oh.utils.state()[0];
	if(mycampaign == ""){
		oh.showlist();
	} else {
		var params = {
		    campaign_urn: mycampaign,
		    client: "dashboard",
		    user_list: "urn:ohmage:special:all",
		    prompt_id_list: "urn:ohmage:special:all",
		    output_format: "csv",
		    sort_oder: "timestamp",
		    column_list: "" + [
		        "urn:ohmage:context:timestamp",
		        "urn:ohmage:prompt:response",
		        "urn:ohmage:context:location:latitude",
		        "urn:ohmage:context:location:longitude"
		    ],
		    suppress_metadata: "true"
		}
		var url = "/app/survey_response/read?" + jQuery.param(params);
		return url;
	}
} 