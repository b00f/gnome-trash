const GLib = imports.gi.GLib;
const ByteArray = imports.byteArray;

const Gettext = imports.gettext.domain("gnome-trash");
const _ = Gettext.gettext;

function log_methods(obj) {
  var result = [];
  for (var id in obj) {
    try {
      if (typeof (obj[id]) == "function") {
        result.push(id + ": " + obj[id].toString());
      }
    } catch (err) {
      result.push(id + ": inaccessible");
    }
  }

  log(result);
}

// https://stackoverflow.com/questions/9382167/serializing-object-that-contains-cyclic-object-value
function decycle(obj, stack = []) {
  if (!obj || typeof obj !== 'object')
    return obj;

  if (stack.includes(obj))
    return null;

  let s = stack.concat([obj]);

  return Array.isArray(obj)
    ? obj.map(x => decycle(x, s))
    : Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, decycle(v, s)]));
}

function log_object(obj) {
  let json = JSON.stringify(decycle(obj), null, 1);
  log(json);
}

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