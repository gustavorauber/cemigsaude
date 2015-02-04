
var domain = 'https://fb.cemig.com.br/saude';
var pageSize = 20;

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var getParameterByName = function(uri, name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(uri);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var createSpecialty = function( sp ) {
    return '<li class="table-view-cell">' +
                '<a class="navigate-right" href="list_physicians_by_distance.html?hash=' + sp.hash + '" data-transition="slide-in">' +
                    '<small>' + ((sp.specialty === "") ? "M&uacute;ltiplas Especialidades" : toTitleCase(sp.specialty)) + '</small>' +
                    '<span class="badge">' + sp.count + '</span>' +
                '</a>' +
            '</li>';
};

var loadSpecialties = function() {
    $.ajax({
        url: domain + "/api/list/",
        crossDomain: true,
        success: function( data ) {
            parent = $('#specialties');
            parent.empty();

            $.each(data, function ( index, val ) {
                li = createSpecialty(val);
                parent.append(li);
            });

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
var createPhysician = function ( p ) {
    distance = p.distance.toFixed(2) + ' km';
	if (p.distance > 10000) {
		distance = '&infin;';
	}

    return '<li class="table-view-cell">' +
                '<a class="navigate-right" href="view_physician.html?hash=' + p.id + '" data-transition="slide-in">' +
                    '<small>' + toTitleCase(p.name) + '</small>' +
                    '<span class="badge">' + distance + '</span>' +
                '</a>' +
            '</li>';
};

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
        	li = createPhysician(val);
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
