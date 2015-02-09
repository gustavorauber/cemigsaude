
var domain = 'https://fb.cemig.com.br/saude';
var pageSize = 20;

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var getParameterByName = function(uri, name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(uri);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

/****************************************
*
*
*    List Specialties Methods
*
*
*****************************************/

var createSpecialty = function( sp ) {
    return '<li class="table-view-cell">' +
                '<a href="list_physicians_by_distance.html?hash=' + sp.hash + '" data-transition="slide-in">' +
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

    return  '<li class="table-view-cell">' +
                '<a href="view_physician.html?hash=' + p.id + '" data-transition="slide-in">' +
                    '<small>' + toTitleCase(p.name) + '</small>' +
                    '<span class="badge">' + distance + '</span>' +
                '</a>' +
            '</li>';
};

var retrievePhysicians = function(e) {
    from_record = $('#physicians > li').size();
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
            console.info($('#distance-btn-more-container'));
        	$('#distance-btn-more-container').hide();
        } else {
            $('#distance-btn-more-container').show();
        }
    }});
};

/****************************************
*
*
*        Show Physician Methods
*
*
*****************************************/
var showPhysician = function(e) {
    id = getParameterByName(window.location.href, 'hash');

    if (id == undefined || id === "") {
        return;
    }

    $.getJSON(domain + '/api/physician/' + id, function (physician) {
        $('.title').html('<strong><small>' + toTitleCase(physician.name) + '</small></strong');

        // Especialidades
        if (physician.specialty == undefined || physician.specialty === "") {
            $('#physician-specialties-container').hide();
        } else {
            //$('#physician-specialties').empty();

            if (typeof physician.specialty === "string") {
                $('#physician-specialties').append("<li class='table-view-cell'>" + toTitleCase(physician.specialty) + "</li>");
            } else {
                for (i=0, size = physician.specialty.length; i < size; i++) {
                    $('#physician-specialties').append("<li class='table-view-cell'>" + toTitleCase(physician.specialty[i]) + "</li>");
                }
            }

            $('#physician-specialties-container').show();
        }

        // Registro
        console.info('register = "' + physician.register + '"');
        if (physician.register == undefined || physician.register === "") {
            console.info('hiding');
            $('#physician-register-container').hide();
        } else {
            //$('#physician-register').empty();
            $('#physician-register').append("<li class='table-view-cell'>" + physician.register + "</li>");
            $('#physician-register-container').show();
        }

        // Email
        if (physician.email == undefined || physician.email === "") {
            $('#physician-email-container').hide();
        } else {
            link = $('#physician-email a');
            link.attr('href', 'mailto:' + physician.email);
            link.html(physician.email);
            $('#physician-email-container').show();
        }

        // Addresses
        if (physician.addresses == undefined) {
            $('#physician-addresses-container').hide();
        } else {
            $('#physician-addresses-header').empty();
            $('#physician-addresses').empty();

            console.info(physician.addresses.length);
            controlParent = $('#physician-addresses-header-container').children().last();
            console.info('controlParent = ' + controlParent);
            console.info(controlParent);
            hasGeocode = false;

            window.map = plugin.google.maps.Map.getMap(document.getElementById('physician-map'));

            for (i = 0, size = physician.addresses.length; i < size; i++) {
                ad = physician.addresses[i];
                link =  '<a class="control-item' + ((i == 0) ? " active" : "") + '" href="#address' + i + '">' +
                            ad.neighborhood + ' / ' + toTitleCase(ad.city) +
                        '</a>';

                controlParent.append(link);

                if ((i + 1) % 2 == 0 && (i + 1) != size) {
                    $('#physician-addresses-header-container').append('<div class="segmented-control"></div>');
                    controlParent = $('#physician-addresses-header-container').children().last();
                }

                address = toTitleCase(ad.street) + '<br />' + ad.neighborhood + '<br />' + toTitleCase(ad.city);

                try {
                    console.info(ad);
                    if (ad.geocode.status == "OK" && ad.geocode.results.length > 0) {
                        lat = ad.geocode.results[0].geometry.location.lat;
                        lng = ad.geocode.results[0].geometry.location.lng;

                        if (i == 0) {
                            window.latitude = lat;
                            window.longitude = lng;
                            hasGeocode = true;
                        }

                        var latlng = new plugin.google.maps.LatLng(lat, lng);
                        window.map.addMarker({'position': latlng,
                            'title': toTitleCase(ad.street)
                        }, function( marker ) {

                            marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, function() {
                            });
                        });

                        address = '<a href="geo:' + lat + ',' + lng + ';u=35;q=' + lat + ',' + lng + '" data-ignore="push">' + address + '</a>';
                    }
                } catch (err) {
                    console.error(err);
                }

                phone = '';

                if (ad.phones != undefined && ad.phones.length > 0) {
                    if (typeof physician.specialty === "string") {
                        phone = ad.phones;
                    } else {
                        phone = ad.phones[0];
                    }
                }
                info =  '<div id="address' + i + '" class="control-content' + ((i == 0) ? " active" : "") + '">' +
                            '<ul class="table-view" id="physician-specialties">' +
                                '<li class="table-view-cell table-view-divider">Telefone</li>' +
                                '<li class="table-view-cell"><a href="tel:' + phone + '" data-ignore="push">' + phone + '</a></li>' +
                                '<li class="table-view-cell table-view-divider">Endere&ccedil;o</li>' +
                                '<li class="table-view-cell">' + address + '</li>' +
                            '</ul>' +
                        '</div>';


                $('#physician-addresses').append(info);
            }

            $('#physician-addresses-container').show();

            if (hasGeocode) {
                var latlng = new plugin.google.maps.LatLng(window.latitude, window.longitude);
                map.setCenter(latlng);
            }

            map.setZoom(16);
        }
    });
};

/****************************************
*
*
*    Map Search Methods
*
*
*****************************************/

var positionSuccess = function (location) {
    window.latitude = location.latlng.lat;
    window.longitude = location.latlng.lng;

    var latlng = new plugin.google.maps.LatLng(window.latitude,
                                                    window.longitude);
    map.setCenter(latlng);
    map.setZoom(15);
};

var positionError = function (msg) {
    window.latitude = -19.932696;
    window.longitude = -43.944035;

    var latlng = new plugin.google.maps.LatLng(window.latitude,
                                                    window.longitude);
    map.setCenter(latlng);
    map.setZoom(15);
};

var onMapInit = function(map) {
    map.getMyLocation(positionSuccess, positionError);
};

var initMap = function () {
    //alert('init map called');
    window.map = plugin.google.maps.Map.getMap(document.getElementById('search-map'));
    map.on(plugin.google.maps.event.MAP_READY, onMapInit);
};

var pageChanged = function( data ) {
    console.info(data);
    if (document.getElementById('page-map-search')) {
        alert('page-map-search');
        console.info('page-map-search');
        initMap();
    } else if (document.getElementById('page-specialties')) {
        console.info('page-specialties');
        count = $('#specialties > li').size();
        if (count == 0) { // check if it is already loaded
            loadSpecialties();
        }
    } else if (document.getElementById('page-physicians')) {
        console.info('page-physicians');
        count = $('#physicians > li').size();
        if (count == 0) { // check if it is already loaded
            retrievePhysicians();
        }
    } else if (document.getElementById('page-physician')) {
        console.info('page-physician');
        showPhysician();
    }
};

document.addEventListener("deviceready", function() {
    //initMap();
});


window.addEventListener('push', pageChanged);
