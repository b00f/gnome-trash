// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import * as utils from 'utils';

export class TrashInfo {
  public icon: any;
  public filename: string;
  public trashPath: string;
  public restorePath: string;
  public deletedAt: number;

  constructor(icon: any, filename: string, trashPath: string, deletedAt: number, restorePath: string) {
    this.icon = icon;
    this.filename = filename;
    this.trashPath = trashPath;
    this.deletedAt = deletedAt;
    this.restorePath = restorePath;
  }

  display(): string {
    return utils.truncate(this.filename, 32);
  }
}