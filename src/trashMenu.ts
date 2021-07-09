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
const { Gio} = imports.gi;

export class TrashMenu
  extends ScrollMenu.ScrollMenu {
  private _settings: Settings.ExtensionSettings;

  constructor(settings: Settings.ExtensionSettings) {
    super();

    this._settings = settings;
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
        this._onOpenItem(item)
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

  private _onOpenItem(item: TrashItem.TrashItem) {
    log.info(`try to open '${item.trashPath}'`);

    let file = Gio.file_new_for_path(item.trashPath);
    Gio.app_info_launch_default_for_uri(file.get_uri(), null);
    this.close();
  }

  private _onDeleteItem(item: TrashItem.TrashItem) {
    let title = _("Delete item permanently");
    let message = _(`Are you sure you want to delete '${item.filename}'?`);
    let subMessage = _("This operation cannot be undone.");

    ConfirmDialog.openConfirmDialog(title, message, subMessage, (this.deleteItem.bind(this, item)), _("Delete"));
  }


  _deleteItem(item: TrashItem.TrashItem) {
    log.info(`try to delete '${item.filename}'`);

    if (utils.spawnSync('rm', '-rf', item.trashPath)) {
      utils.spawnSync('rm', '-f', item.infoPath);
    }
  }

  private _onRestoreItem(item: TrashItem.TrashItem) {
    let title = _("Restore item?");
    let message = _(`Restore '${item.filename}' to: '${item.restorePath}'`);
    let sub_message = _(`Deleted at: ${item.deletedAt}`);

    ConfirmDialog.openConfirmDialog(title, message, sub_message, (this._restoreItem.bind(this, item)), _("Restore"));
  }

  private _restoreItem(item: TrashItem.TrashItem) {
    log.info(`try to restore '${item.filename}' to: '${item.restorePath}'`);

    let dst = Gio.file_new_for_path(item.restorePath);
    if (dst.query_exists(null)) {
      Main.notifyError(_("Operation failed"), _("Refusing to overwrite existing file."));
    } else {
      // Create parent directories if they are not exist
      let parent_dir = item.restorePath.substring(0, item.restorePath.lastIndexOf("/") + 1);
      utils.spawnSync("mkdir", "-p", parent_dir);

      if (utils.spawnSync("mv", item.trashPath, item.restorePath)) {
        utils.spawnSync("rm", item.infoPath);
      }
    }
  }

}