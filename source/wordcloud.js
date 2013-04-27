(function( $ ) {
	$.fn.wordcloud = function(options) {

		var target = this;
		var id = "#" + target.attr("id")
		var variable = options.item;
		var title = options.title || "";
		var width = options.width || 350;
		var height = options.height || 240;
		var font = options.font || "Helvetica";
		var wcdelay = oh.utils.delayexec();
		var chartid = "wc-" + Math.random().toString(36).substring(7);
		var resizable = options.resizable || false;
		var maxwords = options.maxwords || 50;
		
		//create dimension
    	var mydim = dashboard.dim[variable] = dashboard.data.dimension(oh.utils.get(variable));		
		
		//construct piece of dom
		var mydiv = $("<div/>").addClass("wccontainer").addClass("well").css("height", height).appendTo(target);
		var titlediv = $("<div/>").addClass("title").appendTo(mydiv);
		titlediv.append("&nbsp;");
		$("<span/>").text(title).appendTo(titlediv);
		$("<a/>").addClass("refresh").addClass("hide").text("(refresh)").appendTo(titlediv).on("click", function(e){
			chartdiv.empty();
			_.delay(update, 300);		
		});		
		var filterinput = $("<input />").attr("type", "text").attr("placeholder", "filter").appendTo(mydiv).on('keyup', function(){
			filter(this.value);
			dc.redrawAll()
		});
		$("<a/>").addClass("reset").addClass("hide").appendTo(titlediv).on("click", function(){setvalue()})
		
		var chartdiv = $("<div/>").addClass("chart").attr("id", chartid).appendTo(mydiv);
		
		function setvalue(newval){
			filterinput.val(newval || "");
			filterinput.trigger("keyup");			
		}
		
		//constructs a new regex filter
		function filter(word){
			var filterfun = word ? function(val) {return new RegExp(word, "i").test(val)} : null
			mydim.filter(filterfun)
		}
		
		//cloud constructor
		function build(words){
			var fill = d3.scale.category20();
			var minval = words.slice(-1)[0]["size"];
			var maxval = words[0]["size"]
			var logscale = d3.scale.linear().range([18, 30]).domain([minval, maxval]);
		
			d3.layout.cloud().size([width, height])
			.words(words)
			.rotate(function(d) { return ~~(Math.random() * 3) * 45 - 45; })
			.font(font)
			.fontSize(function(d) { return logscale(d.size)})
			.on("end", function(words) {
				d3.select("#"+chartid).append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + (width/2) + "," + (height/2) + ")")
				.selectAll("text")
				.data(words)
				.enter()
				.append("a")
				.on("click", function(d){setvalue(d.text); return false;})				
				.append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", font)
				.style("fill", function(d, i) { return fill(i); })
				.attr("text-anchor", "middle")
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { return d.text; })

			})
			.start();	
		}
		
		function refresh(fade){
			if(fade && !(chartdiv.is(":empty"))){
				chartdiv.fadeOut(500, function(){update();});
			} else {
				update();
			}	
		}
		
		function update(){
			var starttime = new Date().getTime();
			chartdiv.empty();
			var alldata = dashboard.dim.main.top(9999);
			var textarray = alldata.map(function(d){
				return d[variable];
			})
			var wordcounts = wordmap(textarray.join(" "), maxwords);	
			var words = wordcounts.map(function(d){return {text : d.key, size : d.value}})
			build(words);	
			
			//for debug
			var enddtime = new Date().getTime();
			var delta = enddtime - starttime;			
			dashboard.message("updating wordcloud took: " + delta + "ms.")
			
			$(chartdiv).fadeIn(500)			
		}
		
		//register renderlet
		dashboard.renderlet.register(function(){
			if(chartdiv.is(":visible")){
				refresh();
			}					
		}, 500)
		
		dashboard.wordcloud = dashboard.wordcloud || [];
		dashboard.wordcloud.push(chartdiv)
		
		mydiv.draggable({containment: "body", snap: "body", snapMode: "inner" })
		if(resizable){
			mydiv.resizable({
				"start" : function(){
					chartdiv.empty();
				},
				"stop" : function(event, ui){
					width = ui.size.width;
					height = ui.size.height;
					update();
				}
			});	
		}
		return chartdiv;
	}
	
	//functions below are shared between all wordcloud instances	
	wordmap = (function(){ 
		//some statics
		var stopWords = /^(not_displayed|skipped|i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/
		var punctuation = /[!"&()*+,-\.\/:;<=>?\[\\\]^`\{|\}~]+/g
		var wordSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g
		var discard = /^(@|https?:)/
		var maxLength = 30
		//var maxwords = 100;

		//converts an object to key-value pairs
		function entries(map) {
			var entries = [];
			for (var key in map) entries.push({
				key: key,
				value: map[key]
			});
			return entries;
		}; 

		//actual parsing function
		return function(text, maxwords) {
			var tags = {};
			var cases = {};
			text.split(wordSeparators).forEach(function(word) {
				if (discard.test(word)) return;
				word = word.replace(punctuation, "");
				if (stopWords.test(word.toLowerCase())) return;
				word = word.substr(0, maxLength);
				cases[word.toLowerCase()] = word;
				tags[word = word.toLowerCase()] = (tags[word] || 0) + 1;
			});
			tags = entries(tags).sort(function(a, b) { return b.value - a.value; });
			tags.forEach(function(d) { d.key = cases[d.key]; });
			return tags.slice(0, maxwords);
		}
	})();	
	
	
})( jQuery );			
