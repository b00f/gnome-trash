// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as ScrollMenu from 'scrollMenu';
import * as MenuItem from 'menuItem';
import * as log from 'log';

const ByteArray = imports.byteArray;
const { St, GObject, Meta, Shell, GLib } = imports.gi;
export class TrashMenu
  extends ScrollMenu.ScrollMenu {
  private _path: string;
  private _trash = new Array<MenuItem.TrashInfo>();

  constructor(path: string) {
    super();

    this._path = path;
  }

  public rebuildMenu() {
    super.removeAll();

    let trashPath = this._path + 'files/';
    let trashInfo = this._path + 'info/';
    try {
      let dir = Gio.file_new_for_path(trashInfo);
      if (!dir.query_exists(null)) {
        return;
      }
      let children = dir.enumerate_children('*.trashinfo', 0, null);
      let fileInfo = null;

      while ((fileInfo = children.next_file(null)) != null) {
        let [ok, info] = GLib.file_get_contents(fileInfo);
        if (!ok) {
          log.error(`unable to get contents of ${fileInfo}`);
          continue;
        }

        let lines = ByteArray.toString(info).split('\n');
        if (lines[0] != '[Trash Info]') {
          log.error(`unable to get contents of ${fileInfo}`);
        }

        let path = lines[1].split('=');
        let date = lines[2].split('=');

        let filename = trashPath + trashPath;

        let trashInfo = new MenuItem.TrashInfo(
          unescape(path[1]),
          filename,
          0,
          filename);

        this._trash.push(trashInfo);
      }
      children.close(null)
    } catch (err) {
      log.error(`an exception occurred ${err}`);
    }

    this._trash.forEach((info, _) => {
      let item = new MenuItem.MenuItem(info,
        this._onActivateItem.bind(this),
        this._onRemoveItem.bind(this),
        this._onPinItem.bind(this));

      super.addMenuItem(item);
    });
  }

  trashSize(): number {
    return this._trash.length;
  }
}