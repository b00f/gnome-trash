// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as ScrollMenu from 'scrollMenu';
import * as MenuItem from 'menuItem';
import * as TrashItem from 'trashItem';
import * as log from 'log';

export class TrashMenu
  extends ScrollMenu.ScrollMenu {
    private _onActivateItem: (item: TrashItem.TrashItem) => void;
    private _onDeleteItem: (item: TrashItem.TrashItem) => void;
    private _onRestoreItem: (item: TrashItem.TrashItem) => void;

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
        this.onActivateItem.bind(this),
        this.onDeleteItem.bind(this),
        this.onRestoreItem.bind(this),);

      super.addMenuItem(item);
    });
  }

  private onActivateItem(item: typeof MenuItem.MenuItem) {
    this._onActivateItem(item.fileInfo)
  }

  private onDeleteItem(item: typeof MenuItem.MenuItem) {
    this._onDeleteItem(item.fileInfo)
  }

  private onRestoreItem(item: typeof MenuItem.MenuItem) {
    this._onRestoreItem(item.fileInfo)
  }
}