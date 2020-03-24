const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
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
    let scrollView = new St.ScrollView({
      x_fill: true,
      y_fill: false,
      y_align: St.Align.START,
      overlay_scrollbars: true,
      style_class: 'vfade applications-scrollbox'
    });
    scrollView.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
    scrollView.style = `height: 500px; width: 360px`;
    this.innerMenu = new PopupMenu.PopupMenuSection();
    scrollView.add_actor(this.innerMenu.actor);
    this.actor.add_actor(scrollView);
  }

  addMenuItem(item) {
    this.innerMenu.addMenuItem(item);
  }

  removeAll() {
    this.innerMenu.removeAll();
  }
};


const TrashMenuItem = GObject.registerClass(
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

      this.icon = new St.Icon(icon_cfg);
      this.add_child(this.icon);
      this.label = new St.Label({ text: text });
      this.add_child(this.label);
      if (callback) {
        this.connect('activate', callback);
      }
    }

    destroy() {
      super.destroy();
    }
  }
);


const TrashMenu = GObject.registerClass(
  class TrashMenu extends PanelMenu.Button {
    _init() {

      super._init(0.0, _("Trash"));
      this.trashIcon = new St.Icon({
        icon_name: 'user-trash-full-symbolic',
        style_class: 'popup-menu-icon'
      })
      this.add_actor(this.trashIcon);

      this.trash_location = GLib.get_home_dir() + '/.local/share/Trash/files/';
      this.trash_path = 'file:///' + this.trash_location;
      this.trash_file = Gio.file_new_for_uri(this.trash_path);

      this._addMenuItems();
      this._onTrashChange();
      this._setupWatch();

      log("gnome-trash initialized successfully");
    }

    _addMenuItems() {
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

      this.filesList = new ScrollableMenu();
      this.menu.addMenuItem(this.filesList);

      this.separator = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(this.separator);

      this.menu.addMenuItem(menu_item(_("Empty Trash"),
        "edit-delete-symbolic",
        this._onEmptyTrash.bind(this)));

      this.menu.addMenuItem(menu_item(_("Open Trash"),
        "folder-open-symbolic",
        this._onOpenTrash.bind(this)));
    }

    destroy() {
      super.destroy();
    }

    _setupWatch() {
      this.monitor = this.trash_file.monitor_directory(0, null);
      this.monitor.connect('changed', this._onTrashChange.bind(this));
    }

    _onTrashChange() {
      this._clearMenu();
      if (this._listFilesInTrash() == 0) {
        this.visible = false;
      } else {
        this.show();
        this.visible = true;
      }
    }

    _listFilesInTrash() {
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
          that._openTrashItem(file_name);
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
            that._restoreTrashItem(file_name);
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
            that._deleteTrashItem(file_name);
          }
        );
        return item;
      }

      let children = this.trash_file.enumerate_children('*', 0, null);
      let count = 0;
      let file_info = null;

      while ((file_info = children.next_file(null)) != null) {
        this.filesList.addMenuItem(trash_item(this, file_info));
        count++
      }
      children.close(null)
      return count;
    }

    _clearMenu() {
      this.filesList.removeAll();
    }

    _openTrashItem(file_name) {
      let file = this.trash_file.get_child(file_name);
      Gio.app_info_launch_default_for_uri(file.get_uri(), null);
      this.menu.close();
    }

    _onEmptyTrash() {
      const title = _("Empty Trash?");
      const message = _("Are you sure you want to delete all items from the trash?\n\
          This operation cannot be undone.");

      new ConfirmDialog(title, message, _("Empty"), this._doEmptyTrash.bind(this)).open();
    }

    _doEmptyTrash() {
      let argv = ['gio', 'trash', '--empty'];
      let flags = GLib.SpawnFlags.SEARCH_PATH;
      GLib.spawn_async(null, argv, null, flags, null);
    }

    _onOpenTrash() {
      let argv = ['nautilus', 'trash://'];
      let flags = GLib.SpawnFlags.SEARCH_PATH;
      GLib.spawn_async(null, argv, null, flags, null);
    }

    _restoreTrashItem(file_name) {
      // TODO: Implement restore item from trash bin.

    }

    _deleteTrashItem(file_name) {
      const title = _("Delete item permanently");
      let message = _("Are you sure you want to delete '" + file_name + "'?\n\
      This operation cannot be undone.");

      new ConfirmDialog(title, message, _("Delete"), (this._doDeleteItem.bind(this, file_name))).open();
    }

    _doDeleteItem(filename) {
      log("trying to delete: " + filename);
      let argv = ['rm', '-rf', this.trash_location + filename];
      let flags = GLib.SpawnFlags.SEARCH_PATH;
      GLib.spawn_async(null, argv, null, flags, null);
    }
  }
);


const ConfirmDialog = GObject.registerClass(
  class ConfirmDialog extends ModalDialog.ModalDialog {
    _init(title, message, action, callback) {
      super._init({ styleClass: null });

      let mainContentBox = new St.BoxLayout({
        style_class: 'polkit-dialog-main-layout',
        vertical: false
      });
      this.contentLayout.add(mainContentBox, { x_fill: true, y_fill: true });

      let messageBox = new St.BoxLayout({
        style_class: 'polkit-dialog-message-layout',
        vertical: true
      });
      mainContentBox.add(messageBox, { y_align: St.Align.START });

      this._subjectLabel = new St.Label({
        style_class: 'polkit-dialog-headline',
        style: `font-weight: 700`,
        text: title
      });

      messageBox.add(this._subjectLabel, { y_fill: false, y_align: St.Align.START });

      this._descriptionLabel = new St.Label({
        style_class: 'polkit-dialog-description',
        text: Gettext.gettext(message)
      });

      messageBox.add(this._descriptionLabel, { y_fill: true, y_align: St.Align.START });

      this.setButtons([
        {
          label: _("Cancel"),
          action: () => {
            this.close();
          },
          key: Clutter.Escape
        },
        {
          label: action,
          action: () => {
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
  _indicator = new TrashMenu;
  Main.panel.addToStatusArea('trash_button', _indicator);
}

function disable() {
  _indicator.destroy();
}
