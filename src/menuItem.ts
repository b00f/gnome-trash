// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as utils from 'utils';

const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;


export class TrashInfo {
  public path: string;
  public filename: string;
  public restorePath: string;
  public deletedAt: number;

  constructor(path: string, filename: string, deletedAt: number, restorePath: string) {
    this.path = path;
    this.filename = filename;
    this.deletedAt = deletedAt;
    this.restorePath = restorePath;
  }

  display(): string {
    return utils.truncate(this.filename, 32);
  }
}

export var MenuItem = GObject.registerClass(
  class MenuItem extends PopupMenu.PopupBaseMenuItem {
    protected _init(
      fileInfo: TrashInfo,
      onActivate: (item: MenuItem) => void,
      onRemove: (item: MenuItem) => void,
      onRestore: (item: MenuItem) => void) {

      super._init()

      this.fileInfo = fileInfo;

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

      // remove button
      let removeIcon = new St.Icon({
        icon_name: "edit-delete-symbolic",
        style_class: 'popup-menu-icon'
      });

      let removeBtn = new St.Button({
        style_class: 'action-btn',
        child: removeIcon
      });

      removeBtn.set_x_align(Clutter.ActorAlign.END);
      removeBtn.set_x_expand(false);
      removeBtn.set_y_expand(true);

      this.actor.add_child(removeBtn);
      removeBtn.connect('button-press-event',
        () => {
          onRemove(this);
        }
      );
    }

    text(): string {
      return this.fileInfo.text;
    }
  }
);