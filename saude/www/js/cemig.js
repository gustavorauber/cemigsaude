
var domain = 'https://fb.cemig.com.br/saude';
var pageSize = 20;

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var getParameterByName = function(uri, name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(uri);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var centerMap = function (map) {
    var latlng = new plugin.google.maps.LatLng(window.latitude,
                                                    window.longitude);
    map.setCenter(latlng);
};

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

    if (specialty == undefined || specialty === "") {
        return;
    }

    if (window.latitude == undefined || window.longitude == undefined) {
        window.latitude = -19.932696;
        window.longitude = -43.944035;
    }

    postData = {
            lat: window.latitude,
            lon: window.longitude,
            specialty: specialty,
            from_record: from_record
    };

    $.ajax({ url: domain + "/get/distance/",
             data: postData, crossDomain: true,
             type: 'POST',
             success: function( data ) {
                parent = $('#physicians');
                $.each(data, function ( index, val ) {
                	li = createPhysician(val);
                    parent.append(li);
                });

                if (data.length < pageSize) {
                	$('#distance-btn-more-container').hide();
                } else {
                    $('#distance-btn-more-container').show();
                }
             }
    });
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
        if (physician.register == undefined || physician.register === "") {
            $('#physician-register-container').hide();
        } else {
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

            controlParent = $('#physician-addresses-header-container').children().last();

            window.map = plugin.google.maps.Map.getMap(document.getElementById('physician-map'), {
                'controls': { 'myLocationButton': true }
            });

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
                    if (ad.geocode.status == "OK" && ad.geocode.results.length > 0) {
                        lat = ad.geocode.results[0].geometry.location.lat;
                        lng = ad.geocode.results[0].geometry.location.lng;

                        var latlng = new plugin.google.maps.LatLng(lat, lng);
                        window.map.addMarker({'position': latlng,
                            'title': toTitleCase(ad.street)
                        }, function( marker ) {

                            marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, function() {
                            });
                        });

                        address = '<a class="geo-link push-right" href="geo:' + lat + ',' + lng + ';u=35;q=' + lat + ',' + lng + '" data-lat="' + lat + '" data-lng="' + lng + '" data-ignore="push">' + address + '</a>';

                    }
                } catch (err) {
                    console.error(err);
                }

                phones = '';

                if (ad.phones != undefined && ad.phones.length > 0) {
                    phones = '<li class="table-view-cell table-view-divider">Telefone</li>';

                    if (typeof ad.phones === "string") {
                        phones += '<li class="table-view-cell"><a class="push-right" href="tel:' + ad.phones + '" data-ignore="push">' + ad.phones + '</a></li>';
                    } else {
                        for (p=0, size=ad.phones.length; p < size; p++) {
                            phones += '<li class="table-view-cell"><a class="push-right" href="tel:' + ad.phones[p] + '" data-ignore="push">' + ad.phones[p] + '</a></li>';
                        }
                    }
                }

                info =  '<div id="address' + i + '" class="control-content' + ((i == 0) ? " active" : "") + '">' +
                            '<ul class="table-view" id="physician-specialties">' +
                                phones +
                                '<li class="table-view-cell table-view-divider">Endere&ccedil;o</li>' +
                                '<li class="table-view-cell">' + address + '</li>' +
                            '</ul>' +
                        '</div>';

                $('#physician-addresses').append(info);
            }

            $('#physician-addresses-container').show();

            window.map.setZoom(16);
        }

        $('#physician-addresses-header-container').off('touchend', '**');
        $('#physician-addresses-header-container').on('touchend', 'a', function() {
            target = $(this).attr('href');
            link = $(target).find('a.geo-link');
            if (link != undefined) {
                var latlng = new plugin.google.maps.LatLng(parseFloat(link.attr('data-lat')), parseFloat(link.attr('data-lng')));
                window.map.setCenter(latlng);
            }
        });

        $('#physician-addresses-header-container').find('a').first().trigger('touchend');
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
    window.latitude = location.latLng.lat;
    window.longitude = location.latLng.lng;

    // alert('[success]' + window.latitude + ' ' + window.longitude);

    var latlng = new plugin.google.maps.LatLng(window.latitude,
                                                    window.longitude);
    window.map.setCenter(latlng);
    window.map.setZoom(15);
};

var positionError = function (msg) {
    window.latitude = -19.932696;
    window.longitude = -43.944035;

    // alert('[error]' + window.latitude + ' ' + window.longitude);

    var latlng = new plugin.google.maps.LatLng(window.latitude,
                                                    window.longitude);
    window.map.setCenter(latlng);
    window.map.setZoom(15);
};

var onMapInit = function(map) {
    map.getMyLocation(positionSuccess, positionError);
};

var initMap = function () {
    window.map = plugin.google.maps.Map.getMap(document.getElementById('search-map'),
    {
        'controls': { 'myLocationButton': true }
    });

    window.map.on(plugin.google.maps.event.MAP_READY, onMapInit);
};

var getDistanceFromLatLonInKm = function(lat1,lon1,lat2,lon2) {
	var deg2rad = 0.017453292519943295; // === Math.PI / 180
    var cos = Math.cos;
    lat1 *= deg2rad;
    lon1 *= deg2rad;
    lat2 *= deg2rad;
    lon2 *= deg2rad;
    var a = (
        (1 - cos(lat2 - lat1)) +
        (1 - cos(lon2 - lon1)) * cos(lat1) * cos(lat2)
    ) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // Diameter of the earth in km (2 * 6371)
};

var onMarkerClick = function(marker) {
};

var performSearch = function(e) {
    e.preventDefault();

    if (window.latitude == undefined || window.longitude == undefined) {
        window.latitude = -19.932696;
        window.longitude = -43.944035;
    }

    postData = {
        q: $('#in-search').val(),
    	d: $('#in-radius').val(),
    	lat: window.latitude,
    	lon: window.longitude
    };

    if (postData.q === "") {
        alert("Consulta vazia!");
        return false;
    }

    $('#in-search').blur();
    $('#in-radius').blur();
    $('#btn-search').blur();
    $('#search-map').focus();
    window.map.clear();

    $.post( domain + "/search", postData, function( data ) {
        var points = [];

        q_dist = $('#in-radius').val();

        $.each(data, function ( index, val ) {
            try {
                for (i=0; i < val.addresses.length; i++) {
                    address = val.addresses[i];
                    if ( address.geocode != undefined ) {
                        results = address.geocode.results;
                        if (results.length > 0) {
                            result = results[0];
                            l = result.geometry.location;

                            if (val.addresses.length == 1 || getDistanceFromLatLonInKm(window.latitude, window.longitude, l.lat, l.lng) < q_dist) {
                                position = new plugin.google.maps.LatLng(l.lat, l.lng);
                                points.push(position);
                                window.map.addMarker({'position': position,
                                   'title':  toTitleCase(val.name),
                                   'snippet': toTitleCase(address.street),
                                   'hash': val.hash
                                }, function( marker ) {
                                    marker.addEventListener(plugin.google.maps.event.INFO_CLICK, function() {
                                        window.PUSH({
                                            url        : 'view_physician.html?hash=' + marker.get('hash'),
                                            transition : 'slide-in'
                                        });
                                    });
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                alert(err);
            }
        });

        if (points.length > 0) {
            var latLngBounds = new plugin.google.maps.LatLngBounds(points);
        	window.map.animateCamera({'target': latLngBounds});
        } else {
            alert('Nenhum resultado encontrado');
        }
    });
};



/****************************************
*
*
*    General Methods
*
*
*****************************************/

var pageChanged = function( data ) {
    if (document.getElementById('page-map-search')) {
        initMap();
        $('#btn-search').on({click: performSearch, touchend: performSearch});
        $('#form-search').on({submit: performSearch});
        $('#in-search').keypress(function(e) {
            if (e.which == 13) {
            	performSearch(e);
            }
        });
        $('#in-radius').keypress(function(e) {
            if (e.which == 13) {
            	performSearch(e);
            }
        });
    } else if (document.getElementById('page-specialties')) {
        count = $('#specialties > li').size();
        if (count == 0) { // check if it is already loaded
            loadSpecialties();
        }
    } else if (document.getElementById('page-physicians')) {
        count = $('#physicians > li').size();
        if (count == 0) { // check if it is already loaded
            retrievePhysicians();
            $('#distance-btn-more').on('touchend', retrievePhysicians);
        }

    } else if (document.getElementById('page-physician')) {
        count = $('.control-content').size();
        if (count == 0) { // check if it is already loaded
            showPhysician();
        } else {
            window.map = plugin.google.maps.Map.getMap(document.getElementById('physician-map'),
            {
                'controls': { 'myLocationButton': true }
            });

            $('#physician-addresses-header-container').find('a').first().trigger('touchend');
        }
    }
};

document.addEventListener("deviceready", function() {
    navigator.geolocation.getCurrentPosition(function(position) {
        window.latitude = position.coords.latitude;
        window.longitude = position.coords.longitude;
    }, function (error) {
        console.info(error);
    });
});

window.addEventListener('push', pageChanged);
