const GLib = imports.gi.GLib;
const ByteArray = imports.byteArray;



function spawn_async(...args) {
  try {
    let flags = GLib.SpawnFlags.SEARCH_PATH;
    GLib.spawn_async(null, args, null, flags, null);
  } catch (err) {
    Main.notifyError(_("Operation failed"), _("Cause: %s").format(err.message));

    throw err;
  }
}

function spawn_sync(...args) {
  try {
    let flags = GLib.SpawnFlags.SEARCH_PATH;
    let [_success, _out, err, _errno] = GLib.spawn_sync(null, args, null, flags, null);
    // Clear warning: Some code called array.toString() on a Uint8Array instance. Previously this would have interpreted ....
    let err_string = ByteArray.toString(err);
    if (err_string != "") {
      Main.notifyError(_("Operation failed"), _("Cause: %s").format(err_string));
      return false;
    }

    return true;
  } catch (e) {
    Main.notifyError(_("Operation failed"), _("Cause: %s").format(e.message));
  }
}