// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as ScrollMenu from 'scrollMenu';

export class TrashMenu
  extends ScrollMenu.ScrollMenu {

  constructor() {
    super()
  }

  public refresh() {
    this._rebuildMenu()
  }

  private _rebuildMenu() {
    let children = this._trashDir.enumerate_children('*', 0, null);
    let count = 0;
    let fileInfo = null;

    while ((fileInfo = children.next_file(null)) != null) {
      this._trashMenu.addMenuItem(new TrashItem.TrashItem(this, fileInfo));
      count++
    }
    children.close(null)
    return count;
  }
}