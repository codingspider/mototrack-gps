package com.mototrackpro

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** The Decline button of the call card: stop ringing and close the call screen if it is open. */
class CallAlertDeclineReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    CallAlert.cancel(context)
    CallAlertActivity.closeOpenScreen()
  }
}
