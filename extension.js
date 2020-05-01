const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;
const ByteArray = imports.byteArray;
const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ActionBar = Me.imports.actionBar;
const ConfirmDialog = Me.imports.confirmDialog;
const ScrollMenu = Me.imports.scrollMenu;
const TrashItem = Me.imports.trashItem;
const SearchBox = Me.imports.searchBox;
const Utils = Me.imports.utils;


const Gettext = imports.gettext.domain("gnome-trash");
const _ = Gettext.gettext;


const gnomeTrashMenu = GObject.registerClass(
  class gnomeTrashMenu extends PanelMenu.Button {
    _init() {
      super._init(0.0, _("Trash"));
      this.trashIcon = new St.Icon({
        icon_name: 'user-trash-full-symbolic',
        style_class: 'popup-menu-icon'
      })
      this.add_actor(this.trashIcon);

      this.trash_path = GLib.get_home_dir() + '/.local/share/Trash/';
      this.trash_files = this.trash_path + 'files/';
      this.trash_info = this.trash_path + 'info/';
      this.trash_files_uri = Gio.file_new_for_path(this.trash_files);
      if (!this.trash_files_uri.query_exists(null)) {
        Main.notifyError(_("Gnome-trash failed to start"), _("No trash folder is detected."));
        return;
      }

      this.addMenuItems();
      this.onTrashChange();
      this.setupWatch();

      this.ask_for_delete_item = { flag: ConfirmDialog.CONFIRM_ASK };
      this.ask_for_restore_item = { flag: ConfirmDialog.CONFIRM_ASK };

      // Clear search when re-open the menu and set focus on search box
      this.menu.connect('open-state-changed', function (self, open) {
        if (open) {
          let that = this;
          let t = Mainloop.timeout_add(50, function () {
            that.search_box.setText('');
            global.stage.set_key_focus(that.search_box.search_entry);
            Mainloop.source_remove(t);
          });
        }
      }.bind(this));

      log("gnome-trash initialized successfully");
    }

    addMenuItems() {
      this.search_box = new SearchBox.SearchBox();
      this.menu.addMenuItem(this.search_box);

      let separator1 = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(separator1);

      this.trash_menu = new ScrollMenu.ScrollMenu();
      this.menu.addMenuItem(this.trash_menu);

      let separator2 = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(separator2);

      // Toolbar
      this.action_bar = new ActionBar.ActionBar(this);
      this.menu.addMenuItem(this.action_bar);

      this.search_box.onTextChanged(this.onSearchItemChanged.bind(this));
    }

    onSearchItemChanged() {
      let query = this.search_box.getText().toLowerCase();

      if (query === '') {
        this.trash_menu.getAllItems().forEach(function (item) {
          item.actor.visible = true;
        });
      }
      else {
        this.trash_menu.getAllItems().forEach(function (item) {
          let text = item.file_name.toLowerCase();
          let matched = text.indexOf(query) >= 0;
          item.actor.visible = matched
        });
      }
    }

    destroy() {
      super.destroy();
    }

    setupWatch() {
      this.monitor = this.trash_files_uri.monitor_directory(0, null);
      this.monitor.connect('changed', this.onTrashChange.bind(this));
    }

    onTrashChange() {
      this.clearMenu();
      if (this.listTrashItems() == 0) {
        this.visible = false;
      } else {
        this.show();
        this.visible = true;
      }
      this.onSearchItemChanged();
    }

    listTrashItems() {
      let children = this.trash_files_uri.enumerate_children('*', 0, null);
      let count = 0;
      let file_info = null;

      while ((file_info = children.next_file(null)) != null) {
        this.trash_menu.addMenuItem(new TrashItem.TrashItem(this, file_info));
        count++
      }
      children.close(null)
      return count;
    }

    clearMenu() {
      this.trash_menu.removeAll();
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
      let file = this.trash_files_uri.get_child(file_name);
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
      return this.trash_files + file_name;
    }

    getTrashItemInfoPath(info_file) {
      return this.trash_info + info_file + ".trashinfo";
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
  }
);


function init() {
  ExtensionUtils.initTranslations();
}

let _gnomeTrash;
function enable() {
  _gnomeTrash = new gnomeTrashMenu;
  Main.panel.addToStatusArea('gnome_trash_button', _gnomeTrash);
}

function disable() {
  _gnomeTrash.destroy();
}
