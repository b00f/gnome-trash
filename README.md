# Gnome Trash

A gnome shell extension to manage your **home trash**.

It allows you to manage the trash items and empty or open the Trash folder. It lists the files in the trash bin in the panel menu.

Note: This extension is only shows items under home trash folder(`~/.local/share/Trash`).

## Installation

To install the most recent official release: Visit Gnome Trash on the [Official GNOME Extensions](https://extensions.gnome.org/extension/4410/gnome-trash/) page.
### From source code

A `Makefile` is included. Then all you have to do is run the command below
```
git clone https://github.com/b00f/gnome-trash.git
cd gnome-trash
make install
```

If you are going to test your changes, run: `make test`.
It automatically installs the extension and restart the gnome-shell.

You can run `make test_wayland` to test this extension on [wayland](https://wayland.freedesktop.org/).

## How to contribute

If you are going to help me make this extension better, you are welcome!
To start, check the code; there are some `TODO` comments. You might be interested to work on them.

You can also [add new translation](https://wiki.gnome.org/Attic/GnomeShell/Extensions/Writing#Extension_Utils) by this command:
`msginit -i ./po/gnome-trash.pot -l <YOUR-LANG-ID>`.

