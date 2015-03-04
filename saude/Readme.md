Build Release for Android
--------------------------

```
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cemigsaude.keystore CordovaApp-release-unsigned.apk mykey
jarsigner -verbose -verify -certs CordovaApp-release-unsigned.apk
zipalign -v 4 CordovaApp-release-unsigned.apk CemigSaude.apk
```