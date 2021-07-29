// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as TrashItem from './trashItem';

const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;

export var MenuItem = GObject.registerClass(
  class MenuItem extends PopupMenu.PopupBaseMenuItem {
    protected _init(
      fileInfo: TrashItem.TrashItem,
      onActivate: (item: MenuItem) => void,
      onDelete: (item: MenuItem) => void,
      onRestore: (item: MenuItem) => void) {

      super._init()

      this.fileInfo = fileInfo;

      let icon = new St.Icon({
        gicon: fileInfo.icon,
        style_class: 'popup-menu-icon'
      });
      this.add_child(icon);

      let label = new St.Label({ text: fileInfo.display() });
      this.add_child(label);
      this.connect('activate', () => {
        onActivate(this);
      });

      // restore button
      let restoreIcon = new St.Icon({
        icon_name: "edit-undo-symbolic",
        style_class: "popup-menu-icon",
      });


      let restoreBtn = new St.Button({
        style_class: 'action-btn',
        child: restoreIcon
      });

      restoreBtn.set_x_align(Clutter.ActorAlign.END);
      restoreBtn.set_x_expand(true);
      restoreBtn.set_y_expand(true);

      this.actor.add_child(restoreBtn);
      restoreBtn.connect('button-press-event',
        () => {
          onRestore(this);
        }
      );

      // delete button
      let deleteIcon = new St.Icon({
        icon_name: "edit-delete-symbolic",
        style_class: 'popup-menu-icon'
      });

      let deleteBtn = new St.Button({
        style_class: 'action-btn',
        child: deleteIcon
      });

      deleteBtn.set_x_align(Clutter.ActorAlign.END);
      deleteBtn.set_x_expand(false);
      deleteBtn.set_y_expand(true);

      this.actor.add_child(deleteBtn);
      deleteBtn.connect('button-press-event',
        () => {
          onDelete(this);
        }
      );
    }

    public text(): string {
      return this.fileInfo.filename;
    }
  }
);