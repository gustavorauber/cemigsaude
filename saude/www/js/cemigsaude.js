
var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var loadSpecialties = function() {
    $.ajax({
        url: "https://fb.cemig.com.br/saude/api/list/",
        success: function( data ) {
            parent = $('#specialties');
            $.each(data, function ( index, val ) {
                dom = $('#specialty-clone').clone();
                li.removeAttr('id');

                if (val.specialty === "") {
                    dom.find('.specialty-title').html("M&uacute;ltiplas Especialidades");
                } else {
                    dom.find('.specialty-title').html(toTitleCase(val.specialty));
                }

                dom.find('.badge').html(val.count);
                dom.find('a').attr('hash', val.hash);

                parent.append(dom);
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

var pageChanged = function( data ) {
    alert(data);

    if (document.getElementById('page-specialties')) {
        loadSpecialties();
    }

};

window.addEventListener('push', pageChanged);
