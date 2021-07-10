// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as ScrollMenu from 'scrollMenu';
import * as MenuItem from 'menuItem';
import * as TrashItem from 'trashItem';
import * as Settings from 'settings';
import * as ConfirmDialog from 'confirmDialog';
import * as log from 'log';
import * as utils from 'utils';

const Main = imports.ui.main;
const { Gio } = imports.gi;

export class TrashMenu
  extends ScrollMenu.ScrollMenu {
  private _settings: Settings.ExtensionSettings;

  constructor(
    settings: Settings.ExtensionSettings,
    doOpenItem: (item: TrashItem.TrashItem) => void,
    doDeleteItem: (item: TrashItem.TrashItem) => void,
    doRestoreItem: (item: TrashItem.TrashItem) => void) {
    super();

    this._settings = settings;
    this._doOpenItem = doOpenItem;
    this._doDeleteItem = doDeleteItem;
    this._doRestoreItem = doRestoreItem;
  }

  public rebuildMenu(trash: Array<TrashItem.TrashItem>) {
    super.removeAll();

    trash.forEach((info, _) => {
      let item = new MenuItem.MenuItem(info,
        this._onActivateItem.bind(this),
        this._onDeleteItem.bind(this),
        this._onRestoreItem.bind(this));

      super.addMenuItem(item);
    });
  }

  private _onActivateItem(item: TrashItem.TrashItem) {
    switch (this._settings.activation()) {
      case Settings.ACTIVATION_OPEN:
        this._doOpenItem(item)
        break;

      case Settings.ACTIVATION_DELETE:
        this._onDeleteItem(item)
        break;

      case Settings.ACTIVATION_RESTORE:
        this._onRestoreItem(item)
        break;

      default:
        log.error(`invalid activation ${this._settings.activation()}`);
    }
  }

  private _onDeleteItem(item: TrashItem.TrashItem) {
    let title = _("Delete item permanently");
    let message = _(`Are you sure you want to delete '${item.filename}'?`);
    let subMessage = _("This operation cannot be undone.");

    ConfirmDialog.openConfirmDialog(title, message, subMessage, (this._doDeleteItem(item)), _("Delete"));
  }

  private _onRestoreItem(item: TrashItem.TrashItem) {
    let title = _("Restore item?");
    let message = _(`Restore '${item.filename}' to: '${item.restorePath}'`);
    let sub_message = _(`Deleted at: ${item.deletedAt}`);

    ConfirmDialog.openConfirmDialog(title, message, sub_message, (this._doRestoreItem(item)), _("Restore"));
  }
}