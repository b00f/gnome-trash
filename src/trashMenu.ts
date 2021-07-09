// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as ScrollMenu from 'scrollMenu';
import * as MenuItem from 'menuItem';
import * as TrashInfo from 'trashInfo';

export class TrashMenu
  extends ScrollMenu.ScrollMenu {

  constructor() {
    super();
  }

  public rebuildMenu(trash: Array<TrashInfo.TrashInfo>) {
    super.removeAll();

    trash.forEach((info, _) => {
      let item = new MenuItem.MenuItem(info,
        this._onActivateItem.bind(this),
        this._onRemoveItem.bind(this),
        this._onRestoreItem.bind(this));

      super.addMenuItem(item);
    });
  }

  private _onActivateItem() {

  }

  private _onRemoveItem() {

  }

  private _onRestoreItem() {

  }
}