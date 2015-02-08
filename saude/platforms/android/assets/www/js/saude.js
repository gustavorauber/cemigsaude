$.support.cors = true;
$.mobile.allowCrossDomainPages = true;

$.mobile.ff = $.mobile.ff || {};

// Configuration
$.mobile.ff.domain = 'https://fb.cemig.com.br/saude';
$.mobile.ff.pageSize = 20;

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function getParameterByName(uri, name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(uri);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

/****************************************
*
*
*        List Specialties Methods
*
*
*****************************************/
$(document).bind("pagecreate", "#list_specialties", function() {
    $('#specialties').off("click", "**");
    $('#specialties').on("click", "a", function() {
        $('#specialty').val($(this).attr('hash'));
    });
});

$(document).bind("pagecreate", "#list_specialties", function() {
    var updateURLParams = function (el) {
    	uri = $(el).attr('href');

	    var reLat = new RegExp("([?&])lat=.*?(&|$)", "i");
	    var reLon = new RegExp("([?&])lon=.*?(&|$)", "i");

	    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
	    if (uri.match(reLat)) {
	        uri = uri.replace(reLat, '$1lat=' + window.latitude + '$2');
	    } else {
	        uri = uri + separator + "lat=" + window.latitude;
	    }


	    if (uri.match(reLon)) {
            uri = uri.replace(reLon, '$1lon=' + window.longitude + '$2');
        } else {
            uri = uri + "&lon=" + window.longitude;
        }

	    return uri;
	};

    $.mobile.loading( 'show' , {theme: 'b', text: 'carregando...', textVisible: true});

    $.ajax({
        url: $.mobile.ff.domain + "/api/list/",
        success: function(data) {
            parent = $('#specialties');
            $.each(data, function ( index, val ) {
                dom = $('#specialty-clone').clone();
                dom.attr('id', '');

                if (val.specialty === "") {
                    dom.find('.specialty-title').html("M&uacute;ltiplas Especialidades");
                } else {
                    dom.find('.specialty-title').html(toTitleCase(val.specialty));
                }

                dom.find('.ui-li-count').html(val.count);
                dom.find('a').attr('hash', val.hash);

                parent.append(dom);
            });

            $('#specialties').listview('refresh');

            window.latitude = -19.932696;
            window.longitude = -43.944035;

            $('#specialties a').attr('href', function (e) {
                return updateURLParams($(this));
            });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (pos) {
                    window.latitude = pos.coords.latitude;
                    window.longitude = pos.coords.longitude;

                    $('#specialties a').attr('href', function (e) {
                	    return updateURLParams($(this));
                    });
                });
            }

            $.mobile.loading( 'hide' );
        },
        error: function(req, status, error) {
            $.mobile.loading( 'hide' );
            alert('error: ' + error);
        }
    });
});

/****************************************
*
*
*    Physicians by Distance Methods
*
*
*****************************************/
$.mobile.ff.retrievePhysicians = function(e) {
    from_record = $('#physician-distance-ul > li').size();
    specialty = $("#specialty").val();

    if (specialty == undefined || specialty === "") {
        return;
    }

    postData = {
            lat: -19.932696,
            lon: -43.944035,
            specialty: specialty,
            from_record: from_record
    };

    $.post( $.mobile.ff.domain + "/get/distance/", postData, function( data ) {
        $.each(data, function ( index, val ) {
        	li = $('#physician-li').clone();
            li.attr('id', '');
        	li.find('a').attr('hash', val.id);
        	li.find('.physician-name').html(toTitleCase(val.name));

        	distance = val.distance.toFixed(2) + ' km';
        	if (val.distance > 10000) {
        		distance = '&infin;';
        	}

        	li.find('.physician-distance').html(distance);

            $('#physician-distance-ul').append(li);
        });

        $('#physician-distance-ul').listview('refresh');

        if (data.length < $.mobile.ff.pageSize) {
        	$('#distance-btn-more').hide();
        }
    });
};

$(document).bind("pageshow", "#list-physicians-by-distance-page", function(data) {

});

/****************************************
*
*
*        Show Physician Methods
*
*
*****************************************/
$.mobile.ff.showPhysician = function(e) {
    id = $("#physician").val();

    if (id == undefined || id === "") {
        return;
    }

    $.getJSON($.mobile.ff.domain + '/api/physician/' + id, function (physician) {
        $('#physician-name').html(toTitleCase(physician.name));

        // Especialidades
        if (physician.specialty == undefined || physician.specialty === "") {
            $('#view-physician-specialty').hide();
        } else {
            $('#physician-specialties').empty();

            if (typeof physician.specialty === "string") {
                $('#physician-specialties').append("<li>" + toTitleCase(physician.specialty) + "</li>");
            } else {
                for (sp in physician.specialty) {
                    $('#physician-specialties').append("<li>" + toTitleCase(sp) + "</li>");
                }
            }

            $('#physician-specialties').listview('refresh');
            $('#view-physician-specialty').show();
        }

        // Registro
        if (physician.register == undefined || physician.register === "") {
            $('#view-physician-register').hide();
        } else {
            $('#physician-register').html(physician.register);
            $('#view-physician-register').show();
        }

        // Email
        if (physician.email == undefined || physician.email === "") {
            $('#view-physician-email').hide();
        } else {
            link = $('#physician-email a');
            link.attr('href', 'mailto:' + physician.email);
            link.html(physician.email);
            $('#view-physician-email').show();
        }

        // Addresses
        if (physician.addresses == undefined) {
            $('#view-physician-addresses').hide();
        } else {
            $('#physician-addresses-tab').empty();

            alert(physician.addresses.length);
            for (i = 0, size = physician.addresses.length; i < size; i++) {
                ad = physician.addresses[i];
                li = $('address-li').clone();
                li.attr('id', '');

                if (i == 0) {
                    li.attr('class', 'ui-btn-active');
                }

                link = li.find('a');
                link.attr('href', '#address-' + i)
                link.html(ad.neighborhood + ' / ' + toTitleCase(ad.city));

                $('#physician-addresses-tab').append(li);
            }

            $('#addresses-navbar').attr('data-role', 'navbar');
            $('#addresses-navbar').trigger('create');
            $("#addresses-tab" ).tabs();
            $('#view-physician-addresses').show();
        }

        $('#physician-page').trigger('create');
    });
};

// Global INIT
$(function() {
	//$( "[data-role='navbar']" ).navbar();
	$( "[data-role='header'], [data-role='footer']" ).toolbar();

    $('.ui-icon-bars').on('click', function(e) {
        $('.ui-page-active .menu').panel('open');
    });

    $('FORM').on('submit', function(e) {
        e.preventDefault();
    });

    $('#distance-btn-more').on('click', $.mobile.ff.retrievePhysicians);

    $('#physician-distance-ul').off("click", "**");
    $('#physician-distance-ul').on('click', 'a', function() {
        $('#physician').val($(this).attr('hash'));
    });
});

$( document ).ready(function() {
    $('body').on("swipeleft", function(e) {
        $('.ui-page-active .menu').panel('open');
    });
});

// Update the contents of the toolbars
$( document ).on( "pagecontainerchange", function() {
	var current = $( ".ui-page-active" ).jqmData( "title" );
	$( "[data-role='header'] h1" ).text( current );
});

$( document ).on( "pagecontainerbeforeshow", function(event, ui) {
    prevID = ui.prevPage.attr('id');
    toID = ui.toPage.attr('id');

    if (prevID === "list_specialties" && toID === "list-physicians-by-distance-page") {
        $('#physician-distance-ul').empty();
        $('#distance-btn-more').show();
        $.mobile.ff.retrievePhysicians();
    } else if (toID === "physician-page") {
        $.mobile.ff.showPhysician();
    }
});


$(document).bind("mobileinit", function(){
  $.mobile.defaultPageTransition="none";
});