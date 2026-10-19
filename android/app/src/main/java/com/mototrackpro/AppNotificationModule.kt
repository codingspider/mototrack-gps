package com.mototrackpro

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.common.LifecycleState

/**
 * Puts an alert in the phone's notification drawer from JavaScript. Android draws a push by itself only when the
 * app is closed or in the background; for a push that arrives while the app is open, or a data-only push, the app
 * draws it with this module. The notification uses the alert channel (tone: res/raw/mototrack_alert.wav) and
 * opens the app when it is tapped.
 *
 *   NativeModules.AppNotification.show(title, body)
 *   NativeModules.AppNotification.consumeOpenedFromAlert() -> true once after the app was opened from one of them
 *   NativeModules.AppNotification.showCallAlert(caller, detail, message) -> rings like a phone call (see CallAlert);
 *     message = the recorded message to play when answered (res/raw file name, e.g. "geofence_in_alert_message")
 *   NativeModules.AppNotification.canUseFullScreen() -> false when the user switched off full-screen alerts
 *   NativeModules.AppNotification.openFullScreenSettings() -> the system page where they are switched on
 */
class AppNotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "AppNotification"

  @ReactMethod
  fun show(title: String, body: String) {
    val context = reactApplicationContext
    val manager = NotificationManagerCompat.from(context)
    // Android 13+ without the notification permission: nothing can be shown
    if (!manager.areNotificationsEnabled()) {
      return
    }

    // Tapping it brings the app to the front (or starts it) and marks the intent so JavaScript can open Alerts
    val openApp = Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra(EXTRA_FROM_ALERT, true)
    }
    val notificationId = (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
    val pending = PendingIntent.getActivity(
      context,
      notificationId,
      openApp,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val notification = NotificationCompat.Builder(context, MainApplication.ALERT_CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_notification)
      .setColor(context.getColor(R.color.notification_accent))
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setAutoCancel(true)
      .setContentIntent(pending)
      .build()
    manager.notify(notificationId, notification)
  }

  /** Ring like an incoming call. When the app is on screen the call screen opens at once, as a real call would. */
  @ReactMethod
  fun showCallAlert(caller: String, detail: String, message: String?) {
    val context = reactApplicationContext
    val recording = if (message.isNullOrBlank()) CallAlert.DEFAULT_MESSAGE else message
    CallAlert.show(context, caller, detail, recording)
    val activity = context.currentActivity
    if (activity != null && context.lifecycleState == LifecycleState.RESUMED) {
      activity.startActivity(CallAlert.screenIntent(context, caller, detail, false, recording))
    }
  }

  @ReactMethod
  fun canUseFullScreen(promise: Promise) {
    promise.resolve(CallAlert.canUseFullScreen(reactApplicationContext))
  }

  /** Android 14+: the "Full screen notifications" switch of this app. Older versions: the app's notification page. */
  @ReactMethod
  fun openFullScreenSettings() {
    val context = reactApplicationContext
    val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
    } else {
      Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
    }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(intent)
    } catch (error: Exception) {
      // No such settings page on this phone
    }
  }

  /** True once when the app was opened by tapping one of our notifications; the mark is cleared when read. */
  @ReactMethod
  fun consumeOpenedFromAlert(promise: Promise) {
    val intent = reactApplicationContext.currentActivity?.intent
    val isFromAlert = intent?.getBooleanExtra(EXTRA_FROM_ALERT, false) ?: false
    if (isFromAlert) {
      intent?.removeExtra(EXTRA_FROM_ALERT)
    }
    promise.resolve(isFromAlert)
  }

  companion object {
    const val EXTRA_FROM_ALERT = "from_alert"
  }
}
