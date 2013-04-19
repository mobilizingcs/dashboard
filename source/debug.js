dashboard.debug = false;
dashboard.message = function(x) {
	if(dashboard.debug && console && console.log){
		console.log(x)
	}
};