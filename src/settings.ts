const ExtensionUtils = imports.misc.extensionUtils;

const GETTEXT_DOMAIN = 'gnome-trash';
const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
export const _ = Gettext.gettext;

interface Settings extends GObject.Object {
    get_boolean(key: string): boolean;
    set_boolean(key: string, value: boolean): void;

    get_uint(key: string): number;
    set_uint(key: string, value: number): void;

    get_string(key: string): string;
    set_string(key: string, value: string): void;

    bind(key: string, object: GObject.Object, property: string, flags: any): void
}

export const SCHEMA_ID = 'org.gnome.shell.extensions.gnome-trash';

export const TRASH_SORT = "trash-sort";
export const ACTIVATION = "activation";
export const HIDE_BUTTON = "hide-button";


export const TRASH_SORT_FILE_NAME = 0;
export const TRASH_SORT_DELETE_TIME = 1;

export const ACTIVATION_OPEN = 0;
export const ACTIVATION_RESTORE = 1;
export const ACTIVATION_DELETE = 2;

export class ExtensionSettings {
    private _settings: Settings = ExtensionUtils.getSettings(SCHEMA_ID);

    onChanged(callback: () => void) {
        this._settings.connect('changed',
            callback); //get notified on every schema change
    }

    trashSort(): number {
        return this._settings.get_uint(TRASH_SORT);
    }

    activation(): number {
        return this._settings.get_uint(ACTIVATION);
    }

    hideButton(): boolean {
        return this._settings.get_boolean(HIDE_BUTTON);
    }
}