// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as ScrollMenu from 'scrollMenu';
import * as MenuItem from 'menuItem';
import * as TrashItem from 'trashItem';
import * as log from 'log';

export class TrashMenu
  extends ScrollMenu.ScrollMenu {

  constructor(
    onActivateItem: (item: TrashItem.TrashItem) => void,
    onDeleteItem: (item: TrashItem.TrashItem) => void,
    onRestoreItem: (item: TrashItem.TrashItem) => void) {
    super();

    this._onActivateItem = onActivateItem;
    this._onDeleteItem = onDeleteItem;
    this._onRestoreItem = onRestoreItem;
  }

  public rebuildMenu(trash: Array<TrashItem.TrashItem>) {
    log.info(`rebuild menu`);

    super.removeAll();

    trash.forEach((info, _) => {
      let item = new MenuItem.MenuItem(info,
        this._onActivateItem,
        this._onDeleteItem,
        this._onRestoreItem);

      super.addMenuItem(item);
    });
  }

  private _onActivateItem(item: TrashItem.TrashItem) {
    this._onActivateItem(item)
  }
}