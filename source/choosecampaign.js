$(document).ready(function() {
	oh.campaign_read(function(campaigns){
		
		$("#loadinganimation").hide();
		
		var allcampaigns = [];
		var nexturl = getURLParameter("next") || ".";
		//loop through all returned campaigns, creating a table with name,urn
                $.each(campaigns, function(i, o){
                      allcampaigns.push(i);
                      var mytr = $("<tr />").appendTo("#campaigntable tbody");
                      td(o.name).appendTo(mytr);
                      td(i).appendTo(mytr).hide();
                      var mybtn = $('<a class="btn btn-primary">Launch</a>').attr("href", nexturl+ "#"+i);
                      $("<td>").append(mybtn).appendTo(mytr);
                });
		//sort the table by Name
                $.bootstrapSortable();
		if(allcampaigns.length == 0){
			alert('No "' + filter + '" campaigns found for the current ohmage user.')
		}
	});

//show or hide urn on demand
$('#showUrn').click(function () {
    $("#urnHeader").toggle(this.checked);
    $('td[data-value^="urn"]').toggle(this.checked);
});

});


function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
function td(x){
                return($("<td>").text(x).attr("data-value", x || 0));
}
