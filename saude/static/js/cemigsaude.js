
var domain = 'http://127.0.0.1:8000';
var pageSize = 20;

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var getParameterByName = function(uri, name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(uri);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var loadSpecialties = function() {
    $.ajax({
        url: domain + "/api/list/",
        crossDomain: true,
        success: function( data ) {
            parent = $('#specialties');
            $.each(data, function ( index, val ) {
                li = $('#specialty-clone').clone();
                li.removeAttr('id');

                if (val.specialty === "") {
                    li.find('.specialty-title').html("M&uacute;ltiplas Especialidades");
                } else {
                    li.find('.specialty-title').html(toTitleCase(val.specialty));
                }

                li.find('.badge').html(val.count);
                href = li.find('a').attr('href');
                li.find('a').attr('hash', val.hash);
                li.find('a').attr('href', href + '?hash=' + val.hash);

                parent.append(li);
            });


            //$('#specialties').listview('refresh');

            window.latitude = -19.932696;
            window.longitude = -43.944035;

            //$('#specialties a').attr('href', function (e) {
                //return updateURLParams($(this));
            //});

            /*
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (pos) {
                    window.latitude = pos.coords.latitude;
                    window.longitude = pos.coords.longitude;

                    //$('#specialties a').attr('href', function (e) {
                	    //return updateURLParams($(this));
                    //});
                });
            }
            */
        },
        error: function(req, status, error) {
            alert('error: ' + error);
        }
    });
};

/****************************************
*
*
*    Physicians by Distance Methods
*
*
*****************************************/
var retrievePhysicians = function(e) {
    from_record = $('#physician-distance-ul > li').size();
    specialty = getParameterByName(window.location.href, 'hash');

    console.info(window.location.href);
    console.info(from_record + ' ' + specialty);

    if (specialty == undefined || specialty === "") {
        return;
    }

    postData = {
            lat: -19.932696,
            lon: -43.944035,
            specialty: specialty,
            from_record: from_record
    };

    $.ajax({ url: domain + "/get/distance/",
             data: postData, crossDomain: true,
             type: 'POST',
             success: function( data ) {
        console.info(data);
        parent = $('#physicians');
        $.each(data, function ( index, val ) {
        	li = $('#physician-clone').clone();
            li.removeAttr('id');

        	li.find('a').attr('hash', val.id);
        	li.find('.physician-name').html(toTitleCase(val.name));

        	distance = val.distance.toFixed(2) + ' km';
        	if (val.distance > 10000) {
        		distance = '&infin;';
        	}

        	li.find('.physician-distance').html(distance);

            console.info(li.html());
            parent.append(li);
        });


        if (data.length < pageSize) {
            console.info(data.length + ' ' + pageSize);
        	$('#distance-btn-more').hide();
        } else {
            $('#distance-btn-more').show();
        }
    }});
};

var pageChanged = function( data ) {
    console.info(data);

    if (document.getElementById('page-specialties')) {
        console.info('page-specialties');
        loadSpecialties();
        $('#specialties').off("touchstart", "**");
        $('#specialties').on("touchstart", "a", function() {
            console.info('touchstart registered');
            $('#specialty').val($(this).attr('hash'));
            console.info($(this).attr('hash'));
        });
    } else if (document.getElementById('page-physicians')) {
        console.info('page-physicians');
        $('#physician-distance-ul').empty();
        $('#distance-btn-more').show();
        retrievePhysicians();
    }
};

$( document ).ready(function() {

});

window.addEventListener('push', pageChanged);
