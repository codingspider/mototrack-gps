package com.mototrackpro

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import java.lang.ref.WeakReference
import java.util.Locale

/**
 * The full-screen "incoming call" of a call alert (see CallAlert). Nobody is really calling: Answer plays the recorded
 * message the alert asked for (res/raw/call_alert_message.mp3 for a power cut, geofence_in_alert_message.mp3 /
 * geofence_out_alert_message.mp3 for a geofence; the MotoTrack alert tone when the file is missing) on the alarm volume,
 * with a call timer, then the call ends by itself. Decline, or no answer within CallAlert.RING_TIMEOUT_MS, closes it.
 * Opens over the lock screen and turns the screen on. The layout is built in code (no XML) to keep it in one file.
 */
class CallAlertActivity : Activity() {

  private val handler = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var focusRequest: AudioFocusRequest? = null
  private var isAnswered = false
  private var answeredAtMs = 0L
  private var messageName = CallAlert.DEFAULT_MESSAGE

  private lateinit var brandText: TextView
  private lateinit var callerText: TextView
  private lateinit var detailText: TextView
  private lateinit var statusText: TextView
  private lateinit var ringingButtons: LinearLayout
  private lateinit var endButton: LinearLayout

  private val missedCall = Runnable {
    if (!isAnswered) {
      CallAlert.cancel(this)
      finish()
    }
  }

  private val timerTick = object : Runnable {
    override fun run() {
      val seconds = (System.currentTimeMillis() - answeredAtMs) / 1000
      statusText.text = String.format(Locale.US, "%02d:%02d", seconds / 60, seconds % 60)
      handler.postDelayed(this, 1000)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    showOverLockScreen()
    setContentView(buildLayout())
    openScreen = WeakReference(this)
    readIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    readIntent(intent)
  }

  /** Fill in the caller and, when the Answer button of the call card opened the screen, answer straight away. */
  private fun readIntent(intent: Intent) {
    val caller = intent.getStringExtra(CallAlert.EXTRA_CALLER) ?: "Calling Afia-MOTOTRACK GPS"
    callerText.text = caller // the vehicle's name (or plate) for a vehicle alert
    // "MotoTrack Alert" above the vehicle, so it is clear who is calling; not twice when the caller is that already
    brandText.visibility = if (caller.equals(BRAND, ignoreCase = true)) View.GONE else View.VISIBLE
    detailText.text = intent.getStringExtra(CallAlert.EXTRA_DETAIL) ?: ""
    // Not while a message is already playing: a new alert must not swap the recording half way
    if (!isAnswered) {
      messageName = intent.getStringExtra(CallAlert.EXTRA_MESSAGE)?.takeIf { it.isNotBlank() } ?: CallAlert.DEFAULT_MESSAGE
    }
    if (intent.getBooleanExtra(CallAlert.EXTRA_ANSWER, false)) {
      answer()
      return
    }
    if (!isAnswered) {
      handler.removeCallbacks(missedCall)
      handler.postDelayed(missedCall, CallAlert.RING_TIMEOUT_MS)
    }
  }

  private fun answer() {
    if (isAnswered) {
      return
    }
    isAnswered = true
    handler.removeCallbacks(missedCall)
    CallAlert.cancel(this) // stops the ringtone
    ringingButtons.visibility = View.GONE
    endButton.visibility = View.VISIBLE
    answeredAtMs = System.currentTimeMillis()
    handler.post(timerTick)
    playMessage()
  }

  private fun decline() {
    CallAlert.cancel(this)
    finish()
  }

  private fun endCall() {
    stopMessage()
    finish()
  }

  /**
   * The recorded message on the ALARM volume, on the speaker. Media volume is often down or at 0, which made the
   * message silent; the alarm volume is almost always up. The volume keys change the alarm volume while it plays.
   * The call ends 1.5 s after the message finishes, or at once if it cannot be played.
   */
  private fun playMessage() {
    // The asked-for message, then the power cut message, then the alert tone
    val askedId = resources.getIdentifier(messageName, "raw", packageName)
    val defaultId = resources.getIdentifier(CallAlert.DEFAULT_MESSAGE, "raw", packageName)
    val resourceId = when {
      askedId != 0 -> askedId
      defaultId != 0 -> defaultId
      else -> R.raw.mototrack_alert
    }
    Log.i(TAG, if (askedId != 0) "Playing $messageName" else "$messageName missing, playing a fallback")
    volumeControlStream = AudioManager.STREAM_ALARM
    val attributes = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
      .build()
    requestFocus(attributes)

    val audioManager = getSystemService(AudioManager::class.java)
    val volume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM)
    Log.i(TAG, "Alarm volume $volume of ${audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)}")

    try {
      val file = resources.openRawResourceFd(resourceId)
      player = MediaPlayer().apply {
        setAudioAttributes(attributes)
        setDataSource(file.fileDescriptor, file.startOffset, file.length)
        file.close()
        setVolume(1f, 1f)
        setOnErrorListener { _, what, extra ->
          Log.e(TAG, "Message player error what=$what extra=$extra")
          handler.postDelayed({ endCall() }, 1500)
          true
        }
        setOnCompletionListener {
          Log.i(TAG, "Message finished")
          handler.postDelayed({ endCall() }, 1500)
        }
        prepare()
        start()
      }
      Log.i(TAG, "Message started, ${player?.duration ?: 0} ms long")
    } catch (error: Exception) {
      // The message cannot be played: end the call instead of leaving a silent call open
      Log.e(TAG, "Message could not be played", error)
      handler.postDelayed({ endCall() }, 1500)
    }
  }

  /** Ask other apps (music, video) to be quiet while the message plays. */
  private fun requestFocus(attributes: AudioAttributes) {
    val audioManager = getSystemService(AudioManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
        .setAudioAttributes(attributes)
        .build()
      focusRequest = request
      audioManager.requestAudioFocus(request)
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
    }
  }

  private fun stopMessage() {
    player?.let {
      try {
        it.stop()
      } catch (error: IllegalStateException) {
        // already stopped
      }
      it.release()
    }
    player = null
    val audioManager = getSystemService(AudioManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
    } else {
      @Suppress("DEPRECATION")
      audioManager.abandonAudioFocus(null)
    }
    focusRequest = null
  }

  @Deprecated("Back works like the red button")
  override fun onBackPressed() {
    if (isAnswered) endCall() else decline()
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    stopMessage()
    if (!isAnswered) {
      CallAlert.cancel(this)
    }
    if (openScreen?.get() === this) {
      openScreen = null
    }
    super.onDestroy()
  }

  private fun showOverLockScreen() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  // ----- layout -----

  private fun dp(value: Int): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

  private fun text(sizeSp: Float, color: Int, isBold: Boolean = false): TextView = TextView(this).apply {
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
    setTextColor(color)
    gravity = Gravity.CENTER
    if (isBold) typeface = Typeface.DEFAULT_BOLD
  }

  /** A round colored button with a phone icon and a label under it; `isHangUp` = the level "end call" handset. */
  private fun roundButton(label: String, color: Int, isHangUp: Boolean, onPress: () -> Unit): LinearLayout {
    val circle = FrameLayout(this).apply {
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(color)
      }
      setOnClickListener { onPress() }
    }
    val icon = ImageView(this).apply {
      setImageResource(if (isHangUp) R.drawable.ic_call_end else R.drawable.ic_call_answer)
    }
    circle.addView(icon, FrameLayout.LayoutParams(dp(34), dp(34), Gravity.CENTER))
    return LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      addView(circle, LinearLayout.LayoutParams(dp(72), dp(72)))
      addView(
        text(14f, Color.WHITE).apply { this.text = label },
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
          .apply { topMargin = dp(10) },
      )
    }
  }

  private fun buildLayout(): View {
    val red = Color.parseColor("#E53935")
    val green = Color.parseColor("#2E7D32")
    val faded = Color.parseColor("#CCFFFFFF")

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(24), dp(72), dp(24), dp(56))
      background = GradientDrawable(
        GradientDrawable.Orientation.TOP_BOTTOM,
        intArrayOf(Color.parseColor("#2B1205"), Color.parseColor("#101014")),
      )
    }

    val avatar = ImageView(this).apply {
      setImageResource(R.mipmap.ic_launcher_round)
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.WHITE)
      }
      setPadding(dp(6), dp(6), dp(6), dp(6))
    }
    root.addView(avatar, LinearLayout.LayoutParams(dp(112), dp(112)))

    brandText = text(15f, faded).apply { this.text = BRAND }
    root.addView(brandText, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(20) })

    callerText = text(30f, Color.WHITE, isBold = true)
    root.addView(callerText, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(4) })

    detailText = text(17f, faded)
    root.addView(detailText, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(8) })

    statusText = text(15f, faded).apply { this.text = "Incoming call…" }
    root.addView(statusText, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(16) })

    // pushes the buttons to the bottom
    root.addView(View(this), LinearLayout.LayoutParams(0, 0, 1f))

    ringingButtons = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
      addView(roundButton("Decline", red, isHangUp = true) { decline() })
      addView(View(this@CallAlertActivity), LinearLayout.LayoutParams(dp(96), 1))
      addView(roundButton("Answer", green, isHangUp = false) { answer() })
    }
    root.addView(ringingButtons, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))

    endButton = roundButton("End call", red, isHangUp = true) { endCall() }.apply { visibility = View.GONE }
    root.addView(endButton, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT))

    return root
  }

  companion object {
    private const val TAG = "CallAlert"
    private const val BRAND = "MotoTrack Alert"

    /** The call screen that is open now, so the Decline button of the call card can close it. */
    private var openScreen: WeakReference<CallAlertActivity>? = null

    fun closeOpenScreen() {
      openScreen?.get()?.let { screen ->
        screen.runOnUiThread { screen.decline() }
      }
    }
  }
}
