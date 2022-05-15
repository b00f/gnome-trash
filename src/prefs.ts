'use strict';

// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const ExtensionUtils = imports.misc.extensionUtils;

import * as log from 'log';
import * as Settings from 'settings';


const Gettext = imports.gettext;
const _ = Gettext.domain('gnome-trash').gettext;

export function init() {
    Gtk.init();
}

export function buildPrefsWidget() {
    let settings = ExtensionUtils.getSettings(Settings.SCHEMA_ID);

    let box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_start: 18,
        margin_end: 18,
        margin_top: 18,
        margin_bottom: 18,
    });

    let prefsFrame = new Gtk.Frame({
        label: _("Preferences"),
    });
    box.append(prefsFrame);

    let prefsGrid = new Gtk.Grid({
        column_spacing: 12,
        row_spacing: 12,
        row_homogeneous: false,
        column_homogeneous: true,
        margin_start: 18,
        margin_end: 18,
        margin_top: 18,
        margin_bottom: 18,
    });

    let row = 0
    let addRowAndBindSetting = function (grid: any, widget: any, name: string, desc: string) {

        let label = new Gtk.Label({
            label: desc,
            halign: Gtk.Align.START,
        });
        widget.set_tooltip_text(desc);

        grid.attach(label, 0, row, 1, 1);
        grid.attach(widget, 1, row, 1, 1);

        if (widget instanceof Gtk.Switch || widget instanceof Gtk.ComboBox) {
            widget.active = settings.get_boolean(name)
            settings.bind(
                name,
                widget,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );
        } else if (widget instanceof Gtk.SpinButton) {
            widget.value = settings.get_uint(name)
            settings.bind(
                name,
                widget,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );
        } else {
            log.error("Invalid prefs widget")
        }

        row++;
    };

    {
        let store = new Gtk.ListStore();
        store.set_column_types([GObject.TYPE_STRING]);
        let items = [
            _("File name"),
            _("Delete time"),
        ];
        for (let i of items) {
            store.set(store.append(), [0], [i]);
        }

        let widget = new Gtk.ComboBox({
            halign: Gtk.Align.END,
            model: store,
        });
        let renderer = new Gtk.CellRendererText();
        widget.pack_start(renderer, true);
        widget.add_attribute(renderer, "text", 0);

        addRowAndBindSetting(prefsGrid, widget, Settings.TRASH_SORT, _("Sort trash by"));
    }

    {
        let store = new Gtk.ListStore();
        store.set_column_types([GObject.TYPE_STRING]);
        let items = [
            _("Open the file"),
            _("Restore the file"),
            _("Delete the file"),
        ];
        for (let i of items) {
            store.set(store.append(), [0], [i]);
        }

        let widget = new Gtk.ComboBox({
            halign: Gtk.Align.END,
            model: store,
        });
        let renderer = new Gtk.CellRendererText();
        widget.pack_start(renderer, true);
        widget.add_attribute(renderer, "text", 0);

        addRowAndBindSetting(prefsGrid, widget, Settings.ACTIVATION, _("Activation behavior"));
    }

    {
        let widget = new Gtk.Switch({
            halign: Gtk.Align.END,
        });

        addRowAndBindSetting(prefsGrid, widget, Settings.HIDE_BUTTON, _("Hide button when trash is empty"));
    }

    prefsFrame.set_child(prefsGrid);

    return box;
}