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

var ActionBar = GObject.registerClass(
  class ActionBar extends PopupMenu.PopupBaseMenuItem {
    _init(parent) {
      super._init({
        activate: false,
        hover: false,
        style_class: 'gt-action-box',
      })

      this.actionsBox = new St.BoxLayout({
        vertical: false,
        style_class: 'gt-action-box-layout',
      });

      let open_btn = new PopupMenu.PopupBaseMenuItem();

      // Open trash button
      let open_icon = new St.Icon({
        icon_name: "folder-open-symbolic",
        style_class: 'popup-menu-icon'
      });

      let open_label = new St.Label({ text: _("Open Trash") });

      open_btn.add_child(open_icon);
      open_btn.add_child(open_label);
      open_btn.connect('activate', () => {
        parent.onOpenTrash();
      });
      this.actionsBox.add(open_btn, { expand: true });

      let empty_btn = new PopupMenu.PopupBaseMenuItem();

      // Open trash button
      let empty_icon = new St.Icon({
        icon_name: "edit-delete-symbolic",
        style_class: 'popup-menu-icon',
      });

      let empty_label = new St.Label({ text: _("Empty Trash") });

      empty_btn.add_child(empty_label);
      empty_btn.add_child(empty_icon);
      empty_btn.connect('activate', () => {
        parent.onEmptyTrash();
      });
      this.actionsBox.add(empty_btn, { expand: true });

      this.actor.add(this.actionsBox);
    }
  }
);