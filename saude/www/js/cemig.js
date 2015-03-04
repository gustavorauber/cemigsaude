
var domain = 'https://fb.cemig.com.br/saude';
var pageSize = 20;

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var getParameterByName = function(uri, name) {
    var match = RegExp('[?&]' + name + '=([^&#]*)').exec(uri);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};

var getPhysicianSpecialty = function (val) {
    specialty = "";
    if (val.specialty != undefined && val.specialty !== "") {
        if (typeof val.specialty === "string") {
            specialty = val.specialty;
        } else {
            specialty = val.specialty[0] + ', ...';
        }
    }
    return specialty;
};

var handleAjaxError = function (req, status, error) {
    var state = navigator.connection.type;
    if (state === Connection.UNKNOWN || state === Connection.NONE) {
        navigator.notification.alert('Sem conex\xE3o de dados', null, 'Alerta', 'OK');
    } else {
        alert('Erro ao fazer a requisi\xE7\xE3o');
    }
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
                    '<small>' + ((sp.specialty === "") ? "M&uacute;ltiplas Especialidades" : sp.specialty) + '</small>' +
                    '<span class="badge">' + sp.count + '</span>' +
                '</a>' +
            '</li>';
};

var loadSpecialties = function() {
    $('#floatingCirclesG').show();
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
        },
        error: handleAjaxError,
        complete: function(jqXHR, textStatus) {
            $('#floatingCirclesG').hide();
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
// @TODO: getNearestLocation
var getPhysicianLocation = function ( p ) {
    for (i=0; i < p.addresses.length; i++) {
        address = p.addresses[i];
        if ( address.geocode != undefined ) {
            results = address.geocode.results;
            if (results.length > 0) {
                result = results[0];
                l = result.geometry.location;
                return l;
            }
        }
    }

    return undefined;
};

var createPhysician = function ( p ) {
    distance = p.distance.toFixed(2) + ' km';
	if (p.distance > 10000) {
		distance = '&infin;';
	}

    return  '<li class="table-view-cell">' +
                '<a href="view_physician.html?hash=' + p.id + '" data-transition="slide-in">' +
                    '<small>' + p.name + '</small>' +
                    '<span class="badge">' + distance + '</span>' +
                '</a>' +
            '</li>';
};

var createFavoritePhysician = function ( p ) {
    if (p.distance == undefined) {
        if (window.latitude != undefined) {
           l = getPhysicianLocation(p);
           if (l != undefined) {
                p.distance = getDistanceFromLatLonInKm(l.lat, l.lng,
                                            window.latitude, window.longitude);
           } else {
                 p.distance = 20000.00;
            }
        } else {
            p.distance = 20000.00;
        }
    }

    distance = p.distance.toFixed(2) + ' km';
	if (p.distance > 10000) {
		distance = '&infin;';
	}

    specialty = getPhysicianSpecialty(p);

    return  '<li class="table-view-cell">' +
                '<a href="view_physician.html?hash=' + p.id + '" data-transition="slide-in">' +
                    '<small>' + p.name + '</small>' +
                    '<p>' + specialty + '</p>' +
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

    $('#floatingCirclesG').show();
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
             },
             error: handleAjaxError,
             complete: function(jqXHR, textStatus) {
                $('#floatingCirclesG').hide();
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
var favoritePhysicianRequest = function(physician, user, like) {
    postData = {
        user: user,
        physician: physician,
        like: like
    };

    $('#floatingCirclesG').show();
    $.ajax({ url: domain + "/api/set/favorite/",
         data: postData, crossDomain: true,
         type: 'POST',
         success: function( data ) {
            id = getParameterByName(window.location.href, 'hash');

            if (physician === id) { // user might have navigated away
                if (like) {
                    $('#btn-physician-favorite').find('.icon').removeClass('icon-star');
                    $('#btn-physician-favorite').find('.icon').addClass('icon-star-filled');
                } else {
                    $('#btn-physician-favorite').find('.icon').removeClass('icon-star-filled');
                    $('#btn-physician-favorite').find('.icon').addClass('icon-star');
                }
            }
         },
         error: handleAjaxError,
         complete: function(jqXHR, textStatus) {
            $('#floatingCirclesG').hide();
         }
    });
};

var favoritePhysician = function(e) {
	e.preventDefault();

    id = getParameterByName(window.location.href, 'hash');

    if (id == undefined || id === "") {
        return;
    }

    like = $('#btn-physician-favorite').find('.icon').hasClass('icon-star');

    if (window.userID == undefined) {
        facebookConnectPlugin.login(['email'], function(data) {
            window.userID = data.authResponse.userID;
            window.localStorage.setItem("user", data.authResponse.userID);
            favoritePhysicianRequest(id, window.userID, like);
        });
    } else {
        favoritePhysicianRequest(id, window.userID, like);
    }

    return false;
};

var sharePhysician = function(e) {
    e.preventDefault();
    try {
        activeAddress = $('.control-content.active');
        if (activeAddress.length == 0) {
            activeAddress = $('.control-content').first();
        }

        phone = '';
        address = '';
        link = '';

        if (activeAddress.length > 0) {
            geoLink = activeAddress.find('.geo-link');
            address = geoLink.html().replace(/<br\s*[\/]?>/gi, "\n") + '\n';
            phone = activeAddress.find('.phone-link').first().html() + '\n';
            link = 'https://maps.google.com/maps?q=' + geoLink.attr('data-lat') + ',' + geoLink.attr('data-lng');
        }

        msg = window.physician.name + '\n'+
            getPhysicianSpecialty(window.physician) + '\n' +
            phone + address;
        subject = '[Cemig Saude] - ' + window.physician.name;

        window.plugins.socialsharing.share(msg, subject, null, link);
    } catch (err) {
        console.error(err);
    }

    return false;
};

var addPhysicianContact = function (e) {
    e.preventDefault();

    try {
        physician = window.physician;
        var options = new ContactFindOptions();
        options.filter = physician.name;
        var fields = ['displayName', 'nickname'];

        navigator.contacts.find(fields, function(results) {
            if (results.length > 0) {
                navigator.notification.alert('O contato j\xE1 existe na agenda', null, 'Alerta', 'OK');
                return false;
            }

            var contact = navigator.contacts.create();
            contact.displayName = physician.name;
            contact.nickname = contact.displayName;
            contact.note = 'Cemig Sa\xFAde';

            activeAddress = $('.control-content.active');
            if (activeAddress.length == 0) {
                activeAddress = $('.control-content').first();
            }
            if (activeAddress.length > 0) {
                var phoneNumbers = [];
                var addresses = [];

                // Phone
                phoneNumbers[0] = new ContactField('work', activeAddress.find('.phone-link').html(), true);
                contact.phoneNumbers = phoneNumbers;

                // Address
                address = activeAddress.find('.geo-link').html();
                parts = address.split("<br>");
                cityState = parts[2].split('-');
                addresses[0] = new ContactAddress();
                addresses[0].country = 'Brasil';
                addresses[0].type = 'work';

                if (parts.length >= 1) {
                    addresses[0].streetAddress = parts[0];
                }

                if (cityState.length >= 2) {
                    addresses[0].locality = cityState[0];
                    addresses[0].region = cityState[1];
                }

                addresses[0].formatted = address.replace(/<br\s*[\/]?>/gi, "\n");
                addresses[0].pref = false;

                contact.addresses = addresses;
            }

            var emails = [];
            if (physician.email != undefined && physician.email !== "") {
                emails[0] = new ContactField('work', physician.email, true);
            }
            contact.emails = emails;

            contact.save(function() {
                navigator.notification.alert('Contato gravado com sucesso!', null, 'Sucesso', 'OK');
            }, function (err) {
                navigator.notification.alert('Erro ao gravar contato', null, 'Erro', 'OK');
            });

        }, function (err) {
            navigator.notification.alert('Erro ao pesquisar contatos existentes', null, 'Erro', 'OK');
        }, options);

    } catch (err) {
        console.error(err);
    }

    return false;
};

var routeToPhysician = function(e) {
    e.preventDefault();
    try {
        activeAddress = $('.control-content.active');
        if (activeAddress.length == 0) {
            activeAddress = $('.control-content').first();
        }

        if (activeAddress.length > 0) {
            geoLink = activeAddress.find('.geo-link');
            plugin.google.maps.external.launchNavigation({
                from: window.latitude + ',' + window.longitude,
                to: geoLink.attr('data-lat') + ',' + geoLink.attr('data-lng')
            });
        }
    } catch (err) {
        console.error(err);
        //alert(err);
    }

    return false;
};

var showPhysician = function(e) {
    id = getParameterByName(window.location.href, 'hash');

    if (id == undefined || id === "") {
        return;
    }

    postData = {
        user: window.userID
    }

    $('#floatingCirclesG').show();

    $.ajax({ url: domain + '/api/physician/' + id,
        data: postData,
        crossDomain: true,
        type: 'POST',
        success: function( physician ) {
            window.physician = physician;

            $('.title').html('<strong><small>' + physician.name + '</small></strong');

            // Especialidades
            if (physician.specialty == undefined || physician.specialty === "") {
                $('#physician-specialties-container').hide();
            } else {
                if (typeof physician.specialty === "string") {
                    $('#physician-specialties').append("<li class='table-view-cell'>" + physician.specialty + "</li>");
                } else {
                    for (i=0, size = physician.specialty.length; i < size; i++) {
                        $('#physician-specialties').append("<li class='table-view-cell'>" + physician.specialty[i] + "</li>");
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

            try {
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
                                    'title':  physician.name,
                                    'snippet': toTitleCase(ad.street)
                                }, function( marker ) {

                                    if (size == 1) {
                                        marker.showInfoWindow();
                                    }
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
                                phones += '<li class="table-view-cell"><a class="phone-link push-right" href="tel:' + ad.phones + '" data-ignore="push">' + ad.phones + '</a></li>';
                            } else {
                                for (p=0, p_size=ad.phones.length; p < p_size; p++) {
                                    phones += '<li class="table-view-cell"><a class="phone-link push-right" href="tel:' + ad.phones[p] + '" data-ignore="push">' + ad.phones[p] + '</a></li>';
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
                }
            } catch (err) {
            	console.error(err);
            }

            if (physician.favorite != undefined && physician.favorite) {
                $('#btn-physician-favorite').find('.icon').removeClass('icon-star');
                $('#btn-physician-favorite').find('.icon').addClass('icon-star-filled');
            }

            $('#physician-addresses-container').show();

            window.map.setZoom(16);

            $('#physician-addresses-header-container').off('touchend', '**');
            $('#physician-addresses-header-container').on('touchend', 'a', function() {
                target = $(this).attr('href');
                link = $(target).find('a.geo-link');
                if (link != undefined) {
                    position = new plugin.google.maps.LatLng(parseFloat(link.attr('data-lat')), parseFloat(link.attr('data-lng')));
                    window.map.setCenter(position);
                }
            });

            $('#physician-addresses-header-container').find('a').first().trigger('touchend');
        },
        error: handleAjaxError,
        complete: function(jqXHR, textStatus) {
            $('#floatingCirclesG').hide();
        }
    });

    return false;
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

    //alert('[success]' + window.latitude + ' ' + window.longitude);

    var latlng = new plugin.google.maps.LatLng(window.latitude,
                                                    window.longitude);
    window.map.setCenter(latlng);
    window.map.setZoom(15);
};

var positionError = function (msg) {
    if (window.latitude == undefined) {
        window.latitude = -19.932696;
        window.longitude = -43.944035;
    }

    //alert('[error]' + window.latitude + ' ' + window.longitude + '\n' + msg);

    var latlng = new plugin.google.maps.LatLng(window.latitude,
                                                    window.longitude);
    window.map.setCenter(latlng);
    window.map.setZoom(15);
};

var onMapInit = function(map) {
    map.getMyLocation({timeout: 10000}, positionSuccess, positionError);
    //navigator.geolocation.getCurrentPosition(positionSuccess, positionError,
    //{timeout: 5000});
};

var initMap = function () {
    window.map = plugin.google.maps.Map.getMap(document.getElementById('search-map'),
    {
        'controls': { 'myLocationButton': true }
    });

    window.map.one(plugin.google.maps.event.MAP_READY, onMapInit);
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
        navigator.notification.alert('Consulta vazia!', null, 'Alerta', 'OK');
        return false;
    }

    $('#in-search').blur();
    $('#in-radius').blur();
    $('#btn-search').blur();
    $('#search-map').focus();
    window.map.clear();

    $('#floatingCirclesG').show();
    $.post( domain + "/search", postData, function( data ) {
        var points = [];

        q_dist = $('#in-radius').val();

        $.each(data, function ( index, val ) {
            try {
                specialty = getPhysicianSpecialty(val);

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
                                   'title':  val.name,
                                   'snippet': specialty + '\n' + toTitleCase(address.street),
                                   'hash': val.hash
                                }, function( marker ) {
                                    window.lastMarker = marker;
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
                console.error(err);
            }
        });

        $('#floatingCirclesG').hide();

        if (points.length > 0) {
            var latLngBounds = new plugin.google.maps.LatLngBounds(points);
        	window.map.animateCamera({'target': latLngBounds}, function() {
                if (points.length == 1 && window.lastMarker != undefined) {
                    window.lastMarker.showInfoWindow();
                }
            });
        } else {
            navigator.notification.alert('Nenhum resultado encontrado');
        }
    }).always(function() {
        $('#floatingCirclesG').hide();
    }).fail(handleAjaxError);
};

/****************************************
*
*
*    Favorite Physicians Methods
*
*
*****************************************/
var retrieveFavoritePhysicians = function(e) {
    if (window.userID == undefined) {
        navigator.notification.alert('Deve-se estar conectado ao Facebook');
        return false;
    }

    if (window.latitude == undefined || window.longitude == undefined) {
        window.latitude = -19.932696;
        window.longitude = -43.944035;
    }

    postData = {
        user: window.userID,
        lat: window.latitude,
        lon: window.longitude
    };

    $('#floatingCirclesG').show();
    $.ajax({ url: domain + "/api/get/favorites/",
         data: postData, crossDomain: true,
         type: 'POST',
         success: function( data ) {
            parent = $('#favorites');
            $.each(data, function ( index, val ) {
            	li = createFavoritePhysician(val);
                parent.append(li);
            });
         },
         error: handleAjaxError,
         complete: function(jqXHR, textStatus) {
            $('#floatingCirclesG').hide();
         }
    });
};

var loginFacebookAndRetrieveFavorites = function() {
    if (window.userID == undefined) {
        facebookConnectPlugin.login(['public_profile'], function (response) {
            window.userID = response.authResponse.userID;
            window.localStorage.setItem("user", response.authResponse.userID);
            retrieveFavoritePhysicians();
            return false;
        }, function (error) {
            navigator.notification.alert('Erro. Tente novamente.');
        });
    } else {
        retrieveFavoritePhysicians();
    }
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
        // Adjust map height
        h = $(window).height() - $('#form-search-container').height() - 88 - 35;
        $('#map-canvas-container').height(h);

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

            $('#btn-physician-favorite').on('touchend', favoritePhysician);
            $('#btn-physician-share').on('touchend', sharePhysician);
            $('#btn-physician-contact').on('touchend', addPhysicianContact);
            $('#btn-physician-route').on('touchend', routeToPhysician);
        } else {
            window.map = plugin.google.maps.Map.getMap(document.getElementById('physician-map'),
            {
                'controls': { 'myLocationButton': true }
            });

            $('#physician-addresses-header-container').find('a').first().trigger('touchend');
        }
    } else if (document.getElementById('page-favorites')) {
        count = $('#favorites > li').size();
        if (count == 0) { // check if it is already loaded
            loginFacebookAndRetrieveFavorites();
        }
    }
};

document.addEventListener("deviceready", function() {
    navigator.geolocation.getCurrentPosition(function(position) {
        window.latitude = position.coords.latitude;
        window.longitude = position.coords.longitude;
        //alert('[deviceready]' + window.latitude + ' ' + window.longitude);
    }, function (error) {
        if (window.latitude == undefined) {
            window.latitude = -19.932696;
            window.longitude = -43.944035;
        }
        console.info(error);
    }, {timeout: 7000});

    // Sets current user, if already registered
    user = window.localStorage.getItem('user');
    if (user != null && user != undefined) {
        // @TODO: check if FB access is still valid
        window.userID = user;
    }

    if (window.userID == undefined) {
        facebookConnectPlugin.getLoginStatus(function(data) {
            if ( data.authResponse.status === "connected" ) {
                window.userID = data.authResponse.userID;
                window.localStorage.setItem('user', data.authResponse.userID);
            }
        });
    }

    window.alert = navigator.notification.alert;
});

window.addEventListener('push', pageChanged);
