$(document).ready(function() {
	oh.campaign_read(function(campaigns){
		
		$("#loadinganimation").hide();
		
		var filter = getURLParameter("filter") || ".";
		var pattern = new RegExp(filter, "i");
		var allcampaigns = [];
		var nexturl = getURLParameter("next") || ".";

		campaigns.forEach(function(o){
			if(pattern.test(o)){
				allcampaigns.push(o);
				$("#campaignlist").append('<li><a target="_blank" href="' + nexturl + '#' + o + '">' + o + '</a></li>');
			}
		});
		
		if(allcampaigns.length == 0){
			alert('No "' + filter + '" campaigns found for the current ohmage user.')
		}
	});
});


function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}