Build Release for Android
--------------------------

```
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cemigsaude.keystore CordovaApp-release-unsigned.apk mykey
jarsigner -verbose -verify -certs CordovaApp-release-unsigned.apk
zipalign -v 4 CordovaApp-release-unsigned.apk CemigSaude.apk
```

## Plugins Cordova em uso

* android.support.v4
* com.google.playservices
* com.phonegap.plugins.facebookconnect
* nl.x-services.plugins.socialsharing
* org.apache.cordova.contacts
* org.apache.cordova.device
* org.apache.cordova.device-motion
* org.apache.cordova.device-orientation
* org.apache.cordova.dialogs
* org.apache.cordova.geolocation
* org.apache.cordova.network-information
* plugin.google.maps
* plugin.http.request