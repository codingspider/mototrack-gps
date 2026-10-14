package com.mototrackpro

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Downloads a file straight into the phone's Downloads folder with Android's own DownloadManager, so no browser opens.
 * The system shows its "downloading / download complete" notification and a tap on it opens the file.
 *
 *   NativeModules.AppDownload.downloadFile(url, fileName, title) -> download id
 *
 * The link must be reachable without a login (the certificate link carries its own token).
 */
class AppDownloadModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "AppDownload"

  @ReactMethod
  fun downloadFile(url: String, fileName: String, title: String, promise: Promise) {
    try {
      val request = DownloadManager.Request(Uri.parse(url))
        .setTitle(title)
        .setDescription(reactApplicationContext.getString(R.string.app_name))
        .setMimeType("application/pdf")
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setAllowedOverMetered(true)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
      val manager = reactApplicationContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      promise.resolve(manager.enqueue(request).toDouble())
    } catch (error: Exception) {
      promise.reject("download_failed", error.message, error)
    }
  }
}
