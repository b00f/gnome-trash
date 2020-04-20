const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const CheckBox = imports.ui.checkBox;
const Mainloop = imports.mainloop;
const ModalDialog = imports.ui.modalDialog;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;
const ByteArray = imports.byteArray;
const ExtensionUtils = imports.misc.extensionUtils;

const Gettext = imports.gettext.domain("gnome-trash");
const _ = Gettext.gettext;


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

const ScrollableMenu = class ScrollableMenu
  extends PopupMenu.PopupMenuSection {
  constructor() {
    super();

    // scroll_view
    this.scroll_view = new St.ScrollView({
      overlay_scrollbars: true,
      style_class: "gt-scroll-view"
    });
    this.scroll_view.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
    this.scroll_view_section = new PopupMenu.PopupMenuSection();
    this.scroll_view.add_actor(this.scroll_view_section.actor);
    this.actor.add_actor(this.scroll_view);
  }

  addMenuItem(item) {
    this.scroll_view_section.addMenuItem(item);
  }

  removeAll() {
    this.scroll_view_section.removeAll();
  }

  getAllItems() {
    return this.scroll_view_section._getMenuItems();
  }
};


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

      this.addSearchBox();
      this.addMenuItems();
      this.onTrashChange();
      this.setupWatch();

      this.ask_for_delete_item = { flag: CONFIRM_ASK };
      this.ask_for_restore_item = { flag: CONFIRM_ASK };

      log("gnome-trash initialized successfully");
    }

    addSearchBox() {
      // TODO: add 'x' clear button inside the search box
      // --------------------------------------------------
      // |                                              X |
      // --------------------------------------------------

      // Search box
      this.search_entry = new St.Entry({
        name: 'searchItem',
        style_class: 'gt-search-box',
        can_focus: true,
        hint_text: _('Type here to search...'),
        track_hover: true
      });

      this.search_entry.get_clutter_text().connect(
        'text-changed',
        this.onSearchItemChanged.bind(this)
      );

      // search item
      let item = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: true,
        style_class: 'gt-search-box-item',
      });

      item.actor.add(this.search_entry, { expand: true });
      this.menu.addMenuItem(item, { expand: true });

      // add separator
      let separator = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(separator);

      // Clear search when re-open the menu
      this.menu.connect('open-state-changed', function (self, open) {
        if (open) {
          let that = this;
          let t = Mainloop.timeout_add(50, function () {
            that.search_entry.set_text('');
            global.stage.set_key_focus(that.search_entry);
            Mainloop.source_remove(t);
          });
        }

      }.bind(this));
    }

    addMenuItems() {
      let menu_item = function (text, icon_name, callback) {
        let item = new PopupMenu.PopupBaseMenuItem();

        let icon = new St.Icon({
          icon_name: icon_name,
          style_class: 'popup-menu-icon'
        });
        item.add_child(icon);
        let label = new St.Label({ text: text });
        item.add_child(label);
        item.connect('activate', callback);
        return item;
      }

      this.trash_scrollable_menu = new ScrollableMenu();
      this.menu.addMenuItem(this.trash_scrollable_menu);

      let separator = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(separator);

      this.menu.addMenuItem(menu_item(_("Empty Trash"),
        "edit-delete-symbolic",
        this.onEmptyTrash.bind(this)));

      this.menu.addMenuItem(menu_item(_("Open Trash"),
        "folder-open-symbolic",
        this.onOpenTrash.bind(this)));
    }

    onSearchItemChanged() {
      let query = this.search_entry.get_text().toLowerCase();

      if (query === '') {
        this.trash_scrollable_menu.getAllItems().forEach(function (item) {
          item.actor.visible = true;
        });
      }
      else {
        this.trash_scrollable_menu.getAllItems().forEach(function (item) {
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
      let trash_item = function (that, file_info) {
        let item = new PopupMenu.PopupBaseMenuItem();


        let file_name = file_info.get_name();
        let display_name = file_info.get_display_name();
        let gicon = file_info.get_symbolic_icon();

        // It uses for searching items
        item.file_name = file_name;

        // truncate long names
        if (display_name.length > 32) {
          display_name = display_name.substr(0, 31) + '...';
        }
        let icon = new St.Icon({
          gicon: gicon,
          style_class: 'popup-menu-icon'
        });
        item.add_child(icon);

        let label = new St.Label({ text: display_name });
        item.add_child(label);
        item.connect('activate', () => {
          that.openTrashItem(file_name);
        });

        // restore button
        let icon_restore = new St.Icon({
          icon_name: "edit-undo-symbolic",
          style_class: 'popup-menu-icon'
        });

        let icon_restore_btn = new St.Button({
          style_class: 'ci-action-btn',
          child: icon_restore
        });

        icon_restore_btn.set_x_align(Clutter.ActorAlign.END);
        icon_restore_btn.set_x_expand(true);
        icon_restore_btn.set_y_expand(true);

        item.actor.add_child(icon_restore_btn);
        item.icon_restore_btn = icon_restore_btn;
        item.favoritePressId = icon_restore_btn.connect('button-press-event',
          () => {
            that.restoreItem(file_name);
          }
        );

        // delete button
        let icon_delete = new St.Icon({
          icon_name: "edit-delete-symbolic",
          style_class: 'popup-menu-icon'
        });

        let icon_delete_btn = new St.Button({
          style_class: 'ci-action-btn',
          child: icon_delete
        });

        icon_delete_btn.set_x_align(Clutter.ActorAlign.END);
        icon_delete_btn.set_x_expand(false);
        icon_delete_btn.set_y_expand(true);

        item.actor.add_child(icon_delete_btn);
        item.icon_delete_btn = icon_delete_btn;
        item.favoritePressId = icon_delete_btn.connect('button-press-event',
          () => {
            that.deleteItem(file_name);
          }
        );
        return item;
      }

      let children = this.trash_files_uri.enumerate_children('*', 0, null);
      let count = 0;
      let file_info = null;

      while ((file_info = children.next_file(null)) != null) {
        this.trash_scrollable_menu.addMenuItem(trash_item(this, file_info));
        count++
      }
      children.close(null)
      return count;
    }

    clearMenu() {
      this.trash_scrollable_menu.removeAll();
    }

    openTrashItem(file_name) {
      let file = this.trash_files_uri.get_child(file_name);
      Gio.app_info_launch_default_for_uri(file.get_uri(), null);
      this.menu.close();
    }

    onEmptyTrash() {
      const title = _("Empty Trash?");
      const message = _("Are you sure you want to delete all items from the trash?\n\
          This operation cannot be undone.");

      this.openConfirmDialog(title, message, _("Empty"), { flag: CONFIRM_ALWAYS_ASK }, this.doEmptyTrash.bind(this));
    }

    doEmptyTrash() {
      spawn_sync('gio', 'trash', '--empty');
    }

    onOpenTrash() {
      spawn_async('nautilus', 'trash:///');
    }

    restoreItem(file_name) {
      let info = this.parse_info_file(file_name);
      const title = _("Restore item?");
      let message = "";
      if (info.err) {
        message = "Error: " + info.err;
      } else {
        message = _("Restore '%s' to:").format(file_name) + "\n" + info.Path + "\n" + _("Deleted at: ") + info.DeletionDate;
      }
      this.openConfirmDialog(title, message, _("Restore"), this.ask_for_restore_item, (this.doRestoreItem.bind(this, file_name, info.Path)));
    }

    doRestoreItem(file_name, path) {
      log("Trying to restore " + file_name + " to " + path);
      let dst = Gio.file_new_for_path(path);
      if (dst.query_exists(null)) {
        Main.notifyError(_("Operation failed"), _("Refusing to overwrite existing file."));
      } else {
        // Create parent directories if they are not exist
        let parent_dir = path.substring(0, path.lastIndexOf("/") + 1);
        spawn_sync("mkdir", "-p", parent_dir);

        if (spawn_sync("mv", this.get_item_file_path(file_name), path)) {
          spawn_sync("rm", this.get_item_info_path(file_name));
        }
      }
    }

    deleteItem(file_name) {
      const title = _("Delete item permanently");
      let message = _("Are you sure you want to delete %s?\n\
      This operation cannot be undone.".format(file_name));

      this.openConfirmDialog(title, message, _("Delete"), this.ask_for_delete_item, (this.doDeleteItem.bind(this, file_name)));
    }

    doDeleteItem(filename) {
      if (spawn_sync('rm', '-rf', this.get_item_file_path(filename))) {
        spawn_sync('rm', '-f', this.get_item_info_path(filename));
      }
    }

    openConfirmDialog(title, message, ok_label, dont_ask, callback) {
      if (dont_ask.flag == CONFIRM_DONT_ASK) {
        callback();
      } else {
        new confirmDialog(title, message, ok_label, dont_ask, callback).open();
      }
    }

    get_item_file_path(file_name) {
      return this.trash_files + file_name;
    }

    get_item_info_path(info_file) {
      return this.trash_info + info_file + ".trashinfo";
    }

    parse_info_file(file_name) {
      let info_file = this.get_item_info_path(file_name);
      log("Trying to parse " + info_file);
      try {
        let [ok, info] = GLib.file_get_contents(info_file);
        if (!ok) {
          throw ("Unable to get contents of + " + info_file);
        }

        let lines = ByteArray.toString(info).split('\n');
        if (lines[0] != '[Trash Info]') {
          throw ("Invalid trash info at + " + info_file);
        }

        let path = lines[1].split('=');
        let date = lines[2].split('=');
        let out = {};
        out[path[0]] = unescape(path[1]);
        out[date[0]] = unescape(date[1]);

        return out;
      } catch (e) {
        return { 'err': "Unable o parse trash info: " + e };
      }
    }
  }
);

const CONFIRM_ALWAYS_ASK = 0;
const CONFIRM_DONT_ASK = 1;
const CONFIRM_ASK = 2;

const confirmDialog = GObject.registerClass(
  class confirmDialog extends ModalDialog.ModalDialog {

    _init(title, message, ok_label, dont_ask, callback) {
      super._init();

      let main_box = new St.BoxLayout({
        vertical: false
      });
      this.contentLayout.add(main_box, { x_fill: true, y_fill: true });

      let message_box = new St.BoxLayout({
        vertical: true
      });
      main_box.add(message_box, { y_align: St.Align.START });

      let subject_label = new St.Label({
        style: `font-weight: 700`,
        text: title
      });

      message_box.add(subject_label, { y_fill: true, y_align: St.Align.START });

      let desc_label = new St.Label({
        style: 'padding-top: 10px; padding-bottom: 20px;',
        text: _(message)
      });

      message_box.add(desc_label, { y_fill: true, y_align: St.Align.START });

      if (dont_ask.flag == CONFIRM_ASK) {
        try {
          this.dont_ask_checkbox = new CheckBox.CheckBox(_('Don\'t ask until next login.'));
          message_box.add_actor(this.dont_ask_checkbox);
        } catch (e) {
          // Do nothing.
        }
      }

      this.setButtons([
        {
          label: _("Cancel"),
          action: () => {
            this.close();
          },
          key: Clutter.Escape
        },
        {
          label: ok_label,
          action: () => {
            if (this.dont_ask_checkbox) {
              dont_ask.flag = (this.dont_ask_checkbox.checked) ? CONFIRM_DONT_ASK : CONFIRM_ASK;
            }
            this.close();
            callback();
          }
        }
      ]);
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
