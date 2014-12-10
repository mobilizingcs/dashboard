$(document).ready(function() {
//don't generate a list *only* if we are at /publicdashboard. this is a bit quirky.
if ( /\/publicdashboard/i.test(window.location.pathname) ){
        var publicCampaigns = {
                        "snack" : {
                                "urn" : "urn:public:snack",
                                "name" : "Snack",
                                "count" : 1709
                        },      
                        "media" : {
                                "urn" : "urn:public:media",
                                "name" : "Media",
                                "count" : 1025
                        },
                        "nutrition" : {
                                "urn" : "urn:public:nutrition",
                                "name" : "Nutrition",
                                "count" : 1443
                        },
                        "trash" : {
                                "urn" : "urn:public:trash",
                                "name" : "Trash",
                                "count" : 2667
                        }
        }

        $("#filter").hide();
	$("#filterReset").hide();
        var nexturl = getURLParameter("next") || ".";
        $.each(publicCampaigns, function(i,v){
                var mytr = $("<tr class='searchable'/>").appendTo("#campaigntable tbody");
                td(v.name).appendTo(mytr);
		td(v.urn).appendTo(mytr).hide();
                td(v.count).appendTo(mytr);
                td(v.count).appendTo(mytr);
                var mybtn = $('<a class="btn btn-primary">Launch</a>').attr("href", nexturl+ "#" + v.urn);
                $("<td>").append(mybtn).appendTo(mytr);
        });
        $("#loadinganimation").hide();
} else {
        oh.campaign_read(function(campaigns){
        $("#campaigntable").hide();

	//if filter url param exists, automatically filter the options, this hacks in a redirect support for the original non-general links
	var filterParam = getURLParameter("filter");
	if (filterParam === null || filterParam === "."){
	  $("#filter").val("");
	} else {
          $("#filter").val(filterParam);
	}

                var allcampaigns = [];
                var nexturl = getURLParameter("next") || ".";
                //loop through all returned campaigns, creating a table with name,urn
                $.each(campaigns, function(i, o){
                      allcampaigns.push(i);
                      var mytr = $("<tr class='searchable'/>").appendTo("#campaigntable tbody");
                      td(o.name).appendTo(mytr);
                      td(i).appendTo(mytr).hide();
                      var mybtn = $('<a class="btn btn-primary">Launch</a>').attr("href", nexturl+ "#"+i);
                      oh.survey_response_read_meta(i, function(meta){

                      if ( meta['data'].length ) {
                        count = {};
                        for (var i = 0; i < meta['data'].length; i++){
                           count[meta['data'][i]["privacy_state"]] = meta['data'][i]["count"];
                        }
                        if (count['shared'] != null && count['private'] != null){
                          total=count['private']+count['shared'];
                          s_total=count['shared'];
                        } else if (count['private'] != null && count['shared'] == null) {
                          total=count['private'];
                          s_total=0;
                        } else {
                          total=count['shared'];
                          s_total=count['shared'];
                        }
                        td(s_total).appendTo(mytr);
                        td(total).appendTo(mytr);
                        $("<td>").append(mybtn).appendTo(mytr);
                      } else {
                        td(0).appendTo(mytr);
                        td(0).appendTo(mytr);
                        $("<td>").append(mybtn).appendTo(mytr);
                      }
                      });
                });
                //sort the table by Name
                $.bootstrapSortable();
		filterMe.call( $("#filter") );
                if(allcampaigns.length == 0){
                        alert('No "' + filter + '" campaigns found for the current ohmage user.')
                }
                $("#loadinganimation").hide();
                $("#campaigntable").show();             
        });
}
//element change items

//show or hide urn on demand
$('#showUrn').click(function () {
    $("#urnHeader").toggle(this.checked);
    $('td[data-value^="urn"]').toggle(this.checked);
});

//filter the list
$("#filter").keyup(filterMe);

//clear the filter input
$('#filterReset').click(function () {
    $('#filter').val("");
    filterMe.call( $("#filter") );
});

function filterMe(){
        var filter = $(this).val().split(" "), count = 0, regex = '';
        for (var i=0; i < filter.length; i++){
          regex = regex+"(?=.*"+filter[i]+")"
        }
        $("tr[class='searchable']").each(function(){
            if ($(this).text().search(new RegExp(regex, "i")) < 0) {
                $(this).fadeOut();
            } else {
                $(this).show();
                count++;

            }
        });
        var numberItems = count;
        if (numberItems === 0) {
                $("#noItems").show();
		$("#noItems p").show();
        } else {
                $("#noItems").hide();
		$("#noItems p").hide();
        }
};

});


function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
function td(x){
                return($("<td>").text(x).attr("data-value", x || 0));
}
