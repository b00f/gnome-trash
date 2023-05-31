# Gnome Trash

A gnome shell extension to manage the trash items in [Gnome](https://www.gnome.org/).

It allows you to manage the trash items and empty or open the Trash folder. It lists the files in the trash bin in the panel menu.

Note: This extension is only shows items under home trash folder(`~/.local/share/Trash`).

## Installation

To install the latest release, visit Gnome Trash on the [Official GNOME Extensions](https://extensions.gnome.org/extension/4410/gnome-trash/) page.

### From source code

Before compiling the code, make sure you have installed [TypeScript](https://www.typescriptlang.org/download).

A `Makefile` is included. To proceed, simply run the command below:

```bash
git clone https://github.com/b00f/gnome-trash.git
cd gnome-trash
make install
```

If you want to test your changes, run `make test`.
This command automatically installs the extension and restarts the gnome-shell.

You can run `make test_wayland` to test this extension on [wayland](https://wayland.freedesktop.org/).

## How to contribute

If you would like to help improve this extension, you are welcome!
To start, check the code; there are some `TODO` comments. You might be interested in working on them.

You can also [add a new translation](https://wiki.gnome.org/Attic/GnomeShell/Extensions/Writing#Extension_Utils) by using this command:
`msginit -i ./po/gnome-trash.pot -l <YOUR-LANG-ID>`.

