# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# --- MotoTrack ---
# Our own native modules and screens (AppNotification, AppUpdate, AppDownload, the call alert). React Native calls them
# by name from JavaScript, and they are small, so keep them whole rather than risk R8 renaming something JS needs.
-keep class com.mototrackpro.** { *; }

# React Native native modules: methods called from JavaScript by name
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep line numbers in crash reports (mapping.txt turns the short names back into real ones)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
