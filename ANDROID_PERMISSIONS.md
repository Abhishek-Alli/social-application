# Android Permissions for WebRTC Calls

## Required Permissions (AndroidManifest.xml)

For the chat calling feature to work on Android (especially in a WebView), you need these permissions:

```xml
<!-- Required for video calls -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Required for audio/video calls -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Recommended for better audio quality during calls -->
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Required for network connectivity -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Optional but recommended for network state detection -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Runtime Permissions (Android 6.0+)

For Android 6.0 (API level 23) and above, you also need to request runtime permissions:

```kotlin
// Example in Kotlin/Java
val permissions = arrayOf(
    Manifest.permission.CAMERA,
    Manifest.permission.RECORD_AUDIO
)

ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE)
```

## WebView Configuration

If you're embedding this in a WebView, you need to configure it properly:

```kotlin
webView.settings.apply {
    javaScriptEnabled = true
    mediaPlaybackRequiresUserGesture = false
    domStorageEnabled = true
}

// Important: Set WebChromeClient for permissions
webView.webChromeClient = object : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest) {
        activity?.runOnUiThread {
            request.grant(request.resources)
        }
    }
}
```

## HTTPS Requirement

⚠️ **Important**: WebRTC's `getUserMedia()` requires HTTPS in production (except for `localhost`). Make sure your app:
- Uses HTTPS when deployed
- Or uses `localhost`/`127.0.0.1` for development

## Summary

Your listed permissions are **correct and sufficient** for basic calling functionality:
- ✅ `CAMERA` - for video calls
- ✅ `RECORD_AUDIO` - for audio in all calls
- ✅ `MODIFY_AUDIO_SETTINGS` - for better audio control
- ✅ `INTERNET` - for network connectivity

**Additional recommendations:**
- Add `ACCESS_NETWORK_STATE` for better connection handling
- Implement runtime permission requests for Android 6.0+
- Configure WebView properly if embedding the app
- Ensure HTTPS is used in production


