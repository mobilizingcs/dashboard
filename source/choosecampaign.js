$(document).ready(function() {
        oh.campaign_read(function(campaigns){
        $("#campaigntable").hide();

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
                if(allcampaigns.length == 0){
                        alert('No "' + filter + '" campaigns found for the current ohmage user.')
                }
                if(allcampaigns.length > 10){
                        $("#filter").show();
                }
                $("#loadinganimation").hide();
                $("#campaigntable").show();             
        });

//show or hide urn on demand
$('#showUrn').click(function () {
    $("#urnHeader").toggle(this.checked);
    $('td[data-value^="urn"]').toggle(this.checked);
});

//filtering the list
    $("#filter").keyup(function(){
        var filter = $(this).val(), count = 0;
        $("tr[class='searchable']").each(function(){
            if ($(this).text().search(new RegExp(filter, "i")) < 0) {
                $(this).fadeOut();
            } else {
                $(this).show();
                count++;
            }
        });
        var numberItems = count;
        $("#filter-count").text("Matches: "+count);
    });

});


function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
function td(x){
                return($("<td>").text(x).attr("data-value", x || 0));
}
