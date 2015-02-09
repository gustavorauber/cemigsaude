
var domain = 'https://fb.cemig.com.br/saude';
var pageSize = 20;

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var getParameterByName = function(uri, name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(uri);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

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
    alert('init map called');
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
    } else if (document.getElementById('page-physicians')) {
        console.info('page-physicians');
    } else if (document.getElementById('page-physician')) {
        console.info('page-physician');
    }

    alert('pageChanged');
};

document.addEventListener("deviceready", function() {
    //initMap();
});


window.addEventListener('push', pageChanged);
