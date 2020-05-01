const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ConfirmDialog = Me.imports.confirmDialog;
const Utils = Me.imports.utils;

const Gettext = imports.gettext.domain("gnome-trash");
const _ = Gettext.gettext;

var TrashItem = GObject.registerClass(
  class TrashItem extends PopupMenu.PopupBaseMenuItem {
    _init(parent, file_info) {
      super._init({
        style_class: 'gt-trash-item',
      })

      let file_name = file_info.get_name();
      let display_name = file_info.get_display_name();
      let gicon = file_info.get_symbolic_icon();

      // It uses for searching items
      this.file_name = file_name;

      // truncate long names
      if (display_name.length > 32) {
        display_name = display_name.substr(0, 31) + '...';
      }
      let icon = new St.Icon({
        gicon: gicon,
        style_class: 'popup-menu-icon'
      });
      this.add_child(icon);

      let label = new St.Label({ text: display_name });
      this.add_child(label);
      this.connect('activate', () => {
        that.openTrashItem(file_name);
      });

      // restore button
      let icon_restore = new St.Icon({
        icon_name: "edit-undo-symbolic",
        style_class: 'popup-menu-icon'
      });

      let restore_btn = new St.Button({
        style_class: 'gt-action-btn',
        child: icon_restore
      });

      restore_btn.set_x_align(Clutter.ActorAlign.END);
      restore_btn.set_x_expand(true);
      restore_btn.set_y_expand(true);

      this.actor.add_child(restore_btn);
      restore_btn.connect('button-press-event',
        () => {
          parent.onRestoreItem(file_name);
        }
      );

      // delete button
      let icon_delete = new St.Icon({
        icon_name: "edit-delete-symbolic",
        style_class: 'popup-menu-icon'
      });

      let delete_btn = new St.Button({
        style_class: 'gt-action-btn',
        child: icon_delete
      });

      delete_btn.set_x_align(Clutter.ActorAlign.END);
      delete_btn.set_x_expand(false);
      delete_btn.set_y_expand(true);

      this.actor.add_child(delete_btn);
      delete_btn.connect('button-press-event',
        () => {
          parent.onDeleteItem(file_name);
        }
      );
    }
  }
);