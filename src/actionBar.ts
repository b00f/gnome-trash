const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;

export class ActionBar extends
  PopupMenu.PopupBaseMenuItem {

  static {
    GObject.registerClass(this);
  }

  constructor() {
    super({
      activate: false,
      hover: false,
      style_class: 'action-bar',
    })

    let actionsBox = new St.BoxLayout({
      vertical: false,
    });

    // Open trash button
    this._openBtn = new PopupMenu.PopupBaseMenuItem({
      style_class: 'action-bar-btn'
    });

    let openIcon = new St.Icon({
      icon_name: "folder-open-symbolic",
      style_class: 'popup-menu-icon'
    });

    let open_label = new St.Label({ text: _("Open Trash") });

    this._openBtn.add_child(openIcon);
    this._openBtn.add_child(open_label);
    this._openBtn._ornamentLabel.visible = false;
    actionsBox.add(this._openBtn);

    // Open trash button
    this._emptyBtn = new PopupMenu.PopupBaseMenuItem({
      style_class: 'action-bar-btn'
    });

    let emptyIcon = new St.Icon({
      icon_name: "edit-delete-symbolic",
      style_class: 'popup-menu-icon',
    });

    let emptyLbl = new St.Label({ text: _("Empty Trash") });

    this._emptyBtn.add_child(emptyLbl);
    this._emptyBtn.add_child(emptyIcon);
    this._emptyBtn._ornamentLabel.visible = false;
    actionsBox.add(this._emptyBtn);

    // Add 'Settings' menu item to open settings
    this._settingsBtn = new PopupMenu.PopupBaseMenuItem({
      style_class: 'action-bar-btn'
    });

    this.settingsIcon = new St.Icon({
      icon_name: "emblem-system-symbolic",
      style_class: 'popup-menu-icon',
    });
    this._settingsBtn.add_child(this.settingsIcon);
    this._settingsBtn._ornamentLabel.visible = false;
    actionsBox.add(this._settingsBtn);

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

  onOpenSettings(callback: () => void) {
    this._settingsBtn.connect('activate', (_obj: any) => {
      callback();
    });
  }
}
