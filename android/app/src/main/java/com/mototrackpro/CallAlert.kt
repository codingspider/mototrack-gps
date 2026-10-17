package com.mototrackpro

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person

/**
 * The "incoming call" for serious alerts (power cut, geofence out). It is a call notification with a full-screen
 * intent: on a locked or sleeping phone Android opens CallAlertActivity at once; while the phone is in use it shows
 * a call card with Answer / Decline. It rings with the phone's ringtone again and again (FLAG_INSISTENT) until it is
 * answered, declined or RING_TIMEOUT_MS has passed.
 */
object CallAlert {
  const val CHANNEL_ID = "mototrack_call_alerts_v1"
  const val NOTIFICATION_ID = 7301
  const val RING_TIMEOUT_MS = 45_000L

  const val EXTRA_CALLER = "call_caller"
  const val EXTRA_DETAIL = "call_detail"
  const val EXTRA_ANSWER = "call_answer"

  private val VIBRATION = longArrayOf(0, 1000, 1000)

  /** The channel of the call alerts: phone ringtone, vibration, shown on the lock screen. Made once. */
  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) {
      return
    }
    val ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    val sound = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    val channel = NotificationChannel(CHANNEL_ID, "Call alerts", NotificationManager.IMPORTANCE_HIGH)
    channel.description = "Power cut and geofence out alerts that ring like a phone call"
    channel.setSound(ringtone, sound)
    channel.enableVibration(true)
    channel.vibrationPattern = VIBRATION
    channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    manager.createNotificationChannel(channel)
  }

  /** Intent that opens the call screen; `answer` = open it already answered (the Answer button). */
  fun screenIntent(context: Context, caller: String, detail: String, answer: Boolean): Intent =
    Intent(context, CallAlertActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra(EXTRA_CALLER, caller)
      putExtra(EXTRA_DETAIL, detail)
      putExtra(EXTRA_ANSWER, answer)
    }

  /** Start ringing. A new alert replaces a call that is still ringing (one call at a time). */
  fun show(context: Context, caller: String, detail: String) {
    ensureChannel(context)
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) {
      return
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val openScreen = PendingIntent.getActivity(context, 1, screenIntent(context, caller, detail, false), flags)
    val answer = PendingIntent.getActivity(context, 2, screenIntent(context, caller, detail, true), flags)
    val decline = PendingIntent.getBroadcast(context, 3, Intent(context, CallAlertDeclineReceiver::class.java), flags)
    val person = Person.Builder().setName(caller).setImportant(true).build()

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_notification)
      .setColor(context.getColor(R.color.notification_accent))
      .setContentTitle(caller)
      .setContentText(detail)
      .setStyle(NotificationCompat.CallStyle.forIncomingCall(person, decline, answer))
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setTimeoutAfter(RING_TIMEOUT_MS)
      .setContentIntent(openScreen)
      .setFullScreenIntent(openScreen, true)
      // Android 7 has no channels: sound and vibration go on the notification itself
      .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), AudioManager.STREAM_RING)
      .setVibrate(VIBRATION)
      .build()
    // Keep ringing until the call is answered, declined or times out, like a real call
    notification.flags = notification.flags or Notification.FLAG_INSISTENT

    try {
      manager.notify(NOTIFICATION_ID, notification)
    } catch (error: SecurityException) {
      // Notification permission was taken away: nothing can ring
    }
  }

  /** Stop ringing (answered, declined, or the call screen was closed). */
  fun cancel(context: Context) {
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }

  /**
   * Android 14+ lets the user switch off full-screen alerts for an app; then the call cannot open over the lock
   * screen and only the call card shows. Older versions always allow it.
   */
  fun canUseFullScreen(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return true
    }
    return context.getSystemService(NotificationManager::class.java).canUseFullScreenIntent()
  }
}
