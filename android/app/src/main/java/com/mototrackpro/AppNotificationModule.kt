package com.mototrackpro

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Puts an alert in the phone's notification drawer from JavaScript. Android draws a push by itself only when the
 * app is closed or in the background; for a push that arrives while the app is open, or a data-only push, the app
 * draws it with this module. The notification uses the alert channel (tone: res/raw/mototrack_alert.wav) and
 * opens the app when it is tapped.
 *
 *   NativeModules.AppNotification.show(title, body)
 *   NativeModules.AppNotification.consumeOpenedFromAlert() -> true once after the app was opened from one of them
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
