const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const CheckBox = imports.ui.checkBox;
const ModalDialog = imports.ui.modalDialog;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;

const Gettext = imports.gettext.domain("gnome-trash");
const _ = Gettext.gettext;


const ScrollableMenu = class ScrollableMenu extends PopupMenu.PopupMenuSection {
  constructor() {
    super();
    let scroll_view = new St.ScrollView({
      x_fill: true,
      y_fill: false,
      y_align: St.Align.START,
      overlay_scrollbars: true,
      style_class: 'vfade applications-scrollbox'
    });
    scroll_view.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
    scroll_view.style = `height: 500px; width: 360px`;
    this.innerMenu = new PopupMenu.PopupMenuSection();
    scroll_view.add_actor(this.innerMenu.actor);
    this.actor.add_actor(scroll_view);
  }

  addMenuItem(item) {
    this.innerMenu.addMenuItem(item);
  }

  removeAll() {
    this.innerMenu.removeAll();
  }
};


const trashMenuItem = GObject.registerClass(
  class TrashMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(text, icon_name, gicon, callback) {

      let enabled = (callback != null)
      super._init({
        activate: enabled,
        reactive: enabled,
        can_focus: enabled
      });
      let icon_cfg = { style_class: 'popup-menu-icon' };
      if (icon_name != null) {
        icon_cfg.icon_name = icon_name;
      } else if (gicon != null) {
        icon_cfg.gicon = gicon;
      }
      // truncate long file_names
      if (text.length > 32) {
        text = text.substr(0, 31) + '...';
      }

      let icon = new St.Icon(icon_cfg);
      this.add_child(icon);
      let label = new St.Label({ text: text });
      this.add_child(label);
      if (callback) {
        this.connect('activate', callback);
      }
    }

    destroy() {
      super.destroy();
    }
  }
);


const trashMenu = GObject.registerClass(
  class trashMenu extends PanelMenu.Button {
    _init() {

      super._init(0.0, _("Trash"));
      this.trashIcon = new St.Icon({
        icon_name: 'user-trash-full-symbolic',
        style_class: 'popup-menu-icon'
      })
      this.add_actor(this.trashIcon);

      this.trash_location = GLib.get_home_dir() + '/.local/share/Trash/files/';
      this.trash_path = 'file:///' + this.trash_location;
      this.trash_uri = Gio.file_new_for_uri(this.trash_path);

      this.addMenuItems();
      this.onTrashChange();
      this.setupWatch();

      this.ask_for_delete_item = { flag: CONFIRM_ASK };

      log("gnome-trash initialized successfully");
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

      this.item_list = new ScrollableMenu();
      this.menu.addMenuItem(this.item_list);

      let separator = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(separator);

      this.menu.addMenuItem(menu_item(_("Empty Trash"),
        "edit-delete-symbolic",
        this.onEmptyTrash.bind(this)));

      this.menu.addMenuItem(menu_item(_("Open Trash"),
        "folder-open-symbolic",
        this.onOpenTrash.bind(this)));
    }

    destroy() {
      super.destroy();
    }

    setupWatch() {
      this.monitor = this.trash_uri.monitor_directory(0, null);
      this.monitor.connect('changed', this.onTrashChange.bind(this));
    }

    onTrashChange() {
      this.clearMenu();
      if (this.listItems() == 0) {
        this.visible = false;
      } else {
        this.show();
        this.visible = true;
      }
    }

    listItems() {
      let trash_item = function (that, file_info) {
        let item = new PopupMenu.PopupBaseMenuItem();
        let file_name = file_info.get_name();
        let display_name = file_info.get_display_name();
        let gicon = file_info.get_symbolic_icon();

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

        /*
        // restore button
        let icon_restore = new St.Icon({
          icon_name: "undo-symbolic",
          style_class: 'system-status-icon'
        });

        let icon_restore_btn = new St.Button({
          style_class: 'ci-action-btn',
          x_fill: true,
          can_focus: true,
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
        */

        // delete button
        let icon_delete = new St.Icon({
          icon_name: "edit-delete-symbolic",
          style_class: 'system-status-icon'
        });

        let icon_delete_btn = new St.Button({
          style_class: 'ci-action-btn',
          x_fill: true,
          can_focus: true,
          child: icon_delete
        });

        icon_delete_btn.set_x_align(Clutter.ActorAlign.END);
        //icon_delete_btn.set_x_expand(false);
        icon_delete_btn.set_x_expand(true);
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

      let children = this.trash_uri.enumerate_children('*', 0, null);
      let count = 0;
      let file_info = null;

      while ((file_info = children.next_file(null)) != null) {
        this.item_list.addMenuItem(trash_item(this, file_info));
        count++
      }
      children.close(null)
      return count;
    }

    clearMenu() {
      this.item_list.removeAll();
    }

    openTrashItem(file_name) {
      let file = this.trash_uri.get_child(file_name);
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
      let argv = ['gio', 'trash', '--empty'];
      let flags = GLib.SpawnFlags.SEARCH_PATH;
      GLib.spawn_async(null, argv, null, flags, null);
    }

    onOpenTrash() {
      let argv = ['nautilus', 'trash://'];
      let flags = GLib.SpawnFlags.SEARCH_PATH;
      GLib.spawn_async(null, argv, null, flags, null);
    }

    restoreItem(file_name) {
      // TODO: Implement restore item from trash bin.

    }

    deleteItem(file_name) {
      const title = _("Delete item permanently");
      let message = _("Are you sure you want to delete '" + file_name + "'?\n\
      This operation cannot be undone.");

      this.openConfirmDialog(title, message, _("Delete"), this.ask_for_delete_item, (this.doDeleteItem.bind(this, file_name)));
    }

    doDeleteItem(filename) {
      log("trying to delete: " + filename);
      let argv = ['rm', '-rf', this.trash_location + filename];
      let flags = GLib.SpawnFlags.SEARCH_PATH;
      GLib.spawn_async(null, argv, null, flags, null);
    }

    openConfirmDialog(title, message, ok_label, dont_ask, callback) {
      if (dont_ask.flag == CONFIRM_DONT_ASK) {
        callback();
      } else {
        new confirmDialog(title, message, ok_label, dont_ask, callback).open();
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
        style_class: 'polkit-dialog-main-layout',
        vertical: false
      });
      this.contentLayout.add(main_box, { x_fill: true, y_fill: true });

      let message_box = new St.BoxLayout({
        style_class: 'polkit-dialog-message-layout',
        vertical: true
      });
      main_box.add(message_box, { y_align: St.Align.START });

      let subject_label = new St.Label({
        style_class: 'polkit-dialog-headline',
        style: `font-weight: 700`,
        text: title
      });

      message_box.add(subject_label, { y_fill: true, y_align: St.Align.START });

      let desc_label = new St.Label({
        style_class: 'polkit-dialog-description',
        style: 'padding-top: 10px; padding-bottom: 20px;',
        text: _(message)
      });

      message_box.add(desc_label, { y_fill: true, y_align: St.Align.START });

      if (dont_ask.flag == CONFIRM_ASK) {
        this.dont_ask_checkbox = new CheckBox.CheckBox(_('Don\'t ask until next restart?'));
        message_box.add(this.dont_ask_checkbox, { y_fill: true, y_align: St.Align.START });
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
              dont_ask.flag = (this.dont_ask_checkbox.actor.checked) ? CONFIRM_DONT_ASK : CONFIRM_ASK;
            }
            this.close();
            callback();
          }
        }
      ]);
    }
  }
);

function init(extensionMeta) {
  imports.gettext.bindtextdomain("gnome-trash", extensionMeta.path + "/locale");
}

let _indicator;

function enable() {
  _indicator = new trashMenu;
  Main.panel.addToStatusArea('trash_button', _indicator);
}

function disable() {
  _indicator.destroy();
}
