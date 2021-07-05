const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;

export var ActionBar = GObject.registerClass(
  class ActionBar extends PopupMenu.PopupBaseMenuItem {
    protected _init() {
      super._init({
        activate: false,
        hover: false,
        style_class: 'gt-action-box',
      })

      let actionsBox = new St.BoxLayout({
        vertical: false,
        style_class: 'gt-action-box-layout',
      });

      this._openBtn = new PopupMenu.PopupBaseMenuItem();

      // Open trash button
      let openIcon = new St.Icon({
        icon_name: "folder-open-symbolic",
        style_class: 'popup-menu-icon'
      });

      let open_label = new St.Label({ text: _("Open Trash") });

      this._openBtn.add_child(openIcon);
      this._openBtn.add_child(open_label);
      actionsBox.add(this._openBtn);

      this._emptyBtn = new PopupMenu.PopupBaseMenuItem();

      // Open trash button
      let emptyIcon = new St.Icon({
        icon_name: "edit-delete-symbolic",
        style_class: 'popup-menu-icon',
      });

      let emptyLbl = new St.Label({ text: _("Empty Trash") });

      this._emptyBtn.add_child(emptyLbl);
      this._emptyBtn.add_child(emptyIcon);
      actionsBox.add(this._emptyBtn);

      this.actor.add(actionsBox);
    }

    onEmptyTrash(callback: () => void) {
      this._emptyBtn.connect('activate', () => {
        callback();
      });
    }

    onOpenTrash(callback: () => void) {
      this._openBtn.connect('activate', () => {
        callback();
      });
    }
  }
);
