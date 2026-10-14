// Decides when the app must be updated. The Play Store answer comes from the native AppUpdate module
// (android/app/src/main/java/com/mototrackpro/AppUpdateModule.kt).

/**
 * Update priority (0 to 5) from which the update is forced. Play gives every release priority 0 unless the
 * release is created with the Play Developer API, so 0 means "force every update". Raise it (for example to 4)
 * to force only the updates that were marked important.
 */
export const FORCE_FROM_PRIORITY = 0;

/**
 * @param {{ isAvailable: boolean, priority: number }|null} info What AppUpdate.getUpdateInfo() answered
 * @returns {boolean} true when the customer has to update before using the app
 */
export function isUpdateRequired(info) {
  if (!info || info.isAvailable !== true) {
    return false;
  }
  return Number(info.priority) >= FORCE_FROM_PRIORITY;
}
