package com.mototrackpro

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentResolver
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(AppUpdatePackage()) // Google Play in-app update (forced update screen)
          add(AppNotificationPackage()) // alerts in the notification drawer
          add(AppDownloadPackage()) // downloads into the Downloads folder
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    createAlertChannel()
    CallAlert.ensureChannel(this) // call alerts ring with the phone ringtone
    loadReactNative(this)
  }

  /**
   * The channel pushes are shown in, with the MotoTrack alert tone (res/raw/mototrack_alert.wav).
   * Android 8+ keeps the sound on the channel, not on the message, and never lets an app change it after the
   * channel exists: to change the tone later, give the channel a new id (here and in AndroidManifest.xml) and
   * add the old id to OLD_ALERT_CHANNEL_IDS so phones drop the old channel.
   */
  private fun createAlertChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = getSystemService(NotificationManager::class.java)
    OLD_ALERT_CHANNEL_IDS.forEach { manager.deleteNotificationChannel(it) }
    val soundUri = Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://$packageName/raw/mototrack_alert")
    val sound = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_NOTIFICATION)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    val channel = NotificationChannel(ALERT_CHANNEL_ID, "MotoTrack alerts", NotificationManager.IMPORTANCE_HIGH)
    channel.description = "Overspeed, geofence, ignition and other vehicle alerts"
    channel.setSound(soundUri, sound)
    manager.createNotificationChannel(channel)
  }

  companion object {
    const val ALERT_CHANNEL_ID = "mototrack_alerts_v2"
    // Channels of earlier tones (a channel keeps its sound for ever, so a new tone needs a new id)
    private val OLD_ALERT_CHANNEL_IDS = listOf("mototrack_alerts")
  }
}
