// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();


import * as TrashMenu from 'trashMenu';
import * as SearchBox from 'searchBox';
import * as ActionBar from 'actionBar';
import * as log from 'log';

const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const { St, GObject, Meta, Shell, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

export const Panel = GObject.registerClass(
  class Panel extends PanelMenu.Button {
    private _trashPath: string = "";
    private _trashURI: string = "";
    private _trashInfo: string = "";
    // @ts-ignore
    private _trashMenu: TrashMenu.TrashMenu;

    protected _init() {
      super._init(0.0, _("Trash"));
      this.trashIcon = new St.Icon({
        icon_name: 'user-trash-full-symbolic',
        style_class: 'popup-menu-icon'
      })
      this.add_actor(this.trashIcon);

      let localTrash = GLib.get_home_dir() + '/.local/share/Trash/';
      this._trashPath = localTrash + 'files/';
      this._trashInfo = localTrash + 'info/';
      this._trashFile = Gio.file_new_for_path(this._trashPath);
      if (!this._trashFile.query_exists(null)) {
        Main.notifyError(_("Gnome-trash failed to start"), _("No trash folder is detected."));
        return;
      }

      this._setupMenu();
      this._onTrashChange();
      this._setupWatch();

      // this.ask_for_delete_item = { flag: ConfirmDialog.CONFIRM_ASK };
      // this.ask_for_restore_item = { flag: ConfirmDialog.CONFIRM_ASK };

      // Clear search when re-open the menu and set focus on search box
      this._openStateChangedID = this._trashMenu.connect('open-state-changed', (_widget: any, open: boolean) => {
        log.debug("open-state-changed event");
        if (open) {
          let t = Mainloop.timeout_add(50, () => {
            this._searchBox.setText('');

            // Don't invoke timer again
            Mainloop.source_remove(t);
            return false;
          });
        }
      });


      this._keyPressEventID = this._trashMenu.scrollView.connect('key-press-event', (_widget: any, _event: any, _data: any) => {
        log.debug("key-press event");

        global.stage.set_key_focus(this._searchBox.searchEntry);
      });

      this._actionBar.registerRemoveAll(() => {
        this._trashMenu.removeAll();
      });

      this._searchBox.onTextChanged(this._onSearch.bind(this));
    }

    private _setupMenu() {
      this.menu.box.style_class = 'popup-menu-content gnome-trash';

      this._searchBox = new SearchBox.SearchBox();
      this.menu.addMenuItem(this._searchBox);

      let separator1 = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(separator1);

      this._trashMenu = new TrashMenu.TrashMenu();
      this.menu.addMenuItem(this._trashMenu);

      let separator2 = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(separator2);

      this._actionBar = new ActionBar.ActionBar(this);
      this.menu.addMenuItem(this._actionBar);
    }

    private _onSearch() {
      let query = this._searchBox.getText().toLowerCase();
      this._historyMenu.filterItems(query);
    }

    private _setupWatch() {
      this.monitor = this._trashFile.monitor_directory(0, null);
      this.monitor.connect('changed', this.onTrashChange.bind(this));
    }

    private _onTrashChange() {
      this.clearMenu();
      if (this.listTrashItems() == 0) {
        this.visible = false;
      } else {
        this.show();
        this.visible = true;
      }
      this._onSearch();
    }

    listTrashItems() {
      let children = this._trashFile.enumerate_children('*', 0, null);
      let count = 0;
      let file_info = null;

      while ((file_info = children.next_file(null)) != null) {
        this._trashMenu.addMenuItem(new TrashItem.TrashItem(this, file_info));
        count++
      }
      children.close(null)
      return count;
    }

    clearMenu() {
      this._trashMenu.removeAll();
    }

    onEmptyTrash() {
      const title = _("Empty Trash?");
      const message = _("Are you sure you want to delete all items from the trash?");
      const sub_message = _("This operation cannot be undone.");

      ConfirmDialog.openConfirmDialog(title, message, sub_message, _("Empty"), { flag: ConfirmDialog.CONFIRM_ALWAYS_ASK }, this.doEmptyTrash.bind(this));
    }

    doEmptyTrash() {
      Utils.spawn_sync('gio', 'trash', '--empty');
    }

    onOpenTrash() {
      Utils.spawn_async('nautilus', 'trash:///');
    }

    openTrashItem(file_name) {
      let file = this._trashFile.get_child(file_name);
      Gio.app_info_launch_default_for_uri(file.get_uri(), null);
      this.menu.close();
    }

    onRestoreItem(file_name) {
      let info = this.parseTrashInfo(file_name);
      if (info.err) {
        Main.notifyError(_("Error"), info.err);
        return;
      }
      let title = _("Restore item?");
      let message = _("Restore '%s' to:").format(file_name) + "\n  " + info.Path;
      let sub_message = _("Deleted at: ") + info.DeletionDate;

      ConfirmDialog.openConfirmDialog(title, message, sub_message, _("Restore"), this.ask_for_restore_item, (this.restoreItem.bind(this, file_name, info.Path)));
    }

    restoreItem(file_name, path) {
      log("Trying to restore " + file_name + " to " + path);
      let dst = Gio.file_new_for_path(path);
      if (dst.query_exists(null)) {
        Main.notifyError(_("Operation failed"), _("Refusing to overwrite existing file."));
      } else {
        // Create parent directories if they are not exist
        let parent_dir = path.substring(0, path.lastIndexOf("/") + 1);
        Utils.spawn_sync("mkdir", "-p", parent_dir);

        if (Utils.spawn_sync("mv", this.getTrashItemFilePath(file_name), path)) {
          Utils.spawn_sync("rm", this.getTrashItemInfoPath(file_name));
        }
      }
    }

    onDeleteItem(file_name) {
      let title = _("Delete item permanently");
      let message = _("Are you sure you want to delete '%s'?").format(file_name);
      let sub_message = _("This operation cannot be undone.");

      ConfirmDialog.openConfirmDialog(title, message, sub_message, _("Delete"), this.ask_for_delete_item, (this.deleteItem.bind(this, file_name)));
    }

    deleteItem(filename) {
      if (Utils.spawn_sync('rm', '-rf', this.getTrashItemFilePath(filename))) {
        Utils.spawn_sync('rm', '-f', this.getTrashItemInfoPath(filename));
      }
    }

    getTrashItemFilePath(file_name) {
      return this._trashPath + file_name;
    }

    getTrashItemInfoPath(info_file) {
      return this._trashInfo + info_file + ".trashinfo";
    }

    parseTrashInfo(file_name) {
      let info_file = this.getTrashItemInfoPath(file_name);
      log("Trying to parse " + info_file);
      try {
        let [ok, info] = GLib.file_get_contents(info_file);
        if (!ok) {
          throw "Unable to get contents of %s".format(info_file);
        }

        let lines = ByteArray.toString(info).split('\n');
        if (lines[0] != '[Trash Info]') {
          throw "Invalid trash info at %s".format(info_file);
        }

        let path = lines[1].split('=');
        let date = lines[2].split('=');
        let out = {};
        out[path[0]] = unescape(path[1]);
        out[date[0]] = unescape(date[1]);

        return out;
      } catch (e) {
        return { 'err': e.toString() };
      }
    }
    private _toggle() {
      this.menu.toggle();
    }

    public destroy() {
      this._disconnectClipboardTimer();
      this._disconnectSelectionOwnerChanged();

      if (this._openStateChangedID) {
        this._trashMenu.disconnect(this._openStateChangedID);
        this._openStateChangedID = 0;
      }

      if (this._keyPressEventID) {
        this._trashMenu.scrollView.disconnect(this._keyPressEventID);
        this._keyPressEventID = 0;
      }

      super.destroy();
    }
  }
);
