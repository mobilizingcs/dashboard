var dashboard = dashboard || {};

$(document).ready(function() {

	function getURLParameter(name) {
	    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	}		
	
	$("#loginbutton").on("click", function(e){
		var next = getURLParameter("next") ? getURLParameter("next") : document.referrer;
		var state = getURLParameter("state") ? getURLParameter("state") : "";
	
		var user = $("#user").val();
		var password = $("#password").val();
		
		oh.login(user, password, function(){
			window.location = next + "#" + state;
		});
		return false;
	});
	
	$('input').placeholder();
	
	//logout from pre existing sessions.
	//oh.logout();
});