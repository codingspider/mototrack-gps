package com.mototrackpro

import android.app.Activity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability

/**
 * Google Play "in-app update" (immediate flow) for JavaScript: asks Play if a newer version of this app is
 * published and, when it is, opens Play's full screen update. Only works for a build installed from Google Play;
 * a debug build or an APK installed by hand always answers "no update".
 *
 *   NativeModules.AppUpdate.getUpdateInfo()          -> { isAvailable, priority, versionCode }
 *   NativeModules.AppUpdate.startImmediateUpdate()   -> 'success' | 'cancelled' | 'failed'
 */
class AppUpdateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "AppUpdate"

  /** An update that was already started (and not finished) counts as available too, so it can be resumed. */
  private fun isOpen(info: AppUpdateInfo): Boolean {
    val availability = info.updateAvailability()
    if (availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
      return true
    }
    return availability == UpdateAvailability.UPDATE_AVAILABLE && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
  }

  @ReactMethod
  fun getUpdateInfo(promise: Promise) {
    val manager = AppUpdateManagerFactory.create(reactApplicationContext)
    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        val result = Arguments.createMap()
        result.putBoolean("isAvailable", isOpen(info))
        result.putInt("priority", info.updatePriority())
        result.putInt("versionCode", info.availableVersionCode())
        promise.resolve(result)
      }
      .addOnFailureListener {
        // Not installed from Play, no Play Store on the phone, offline...: the app must keep working
        val result = Arguments.createMap()
        result.putBoolean("isAvailable", false)
        result.putInt("priority", 0)
        result.putInt("versionCode", 0)
        promise.resolve(result)
      }
  }

  @ReactMethod
  fun startImmediateUpdate(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve("failed")
      return
    }
    val manager = AppUpdateManagerFactory.create(reactApplicationContext)
    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        if (!isOpen(info)) {
          promise.resolve("failed")
          return@addOnSuccessListener
        }
        val options = AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
        manager.startUpdateFlow(info, activity, options)
          .addOnSuccessListener { code ->
            // RESULT_OK: Play installs the update and restarts the app on its own
            promise.resolve(if (code == Activity.RESULT_OK) "success" else "cancelled")
          }
          .addOnFailureListener { promise.resolve("failed") }
      }
      .addOnFailureListener { promise.resolve("failed") }
  }
}
