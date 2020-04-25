# Gnome Trash

A gnome shell extension to manage your **home trash**.

![Screenshot](https://gitlab.com/b00f/gnome-trash/-/raw/master/media/screenshot.png "Screenshot")

It allows you to manage the trash items and empty or open the Trash folder. It hides completely when the trash is empty, and lists the files in the trash bin in the panel menu.

## History

This repository is inspired by [here](https://gitlab.com/bertoldia/gnome-shell-trash-extension). The original repository has not been updated for a long time. Some merge requests (including mine) are waiting for approval for more than a year.

Note: This extension is only shows items under home trash folder(`~/.local/share/Trash`). There is an open [issue](https://gitlab.com/b00f/gnome-trash/-/issues/4) about supporting trash items on other partitions. Any help would be greatly appreciated.

## Install from source code

A `Makefile` is included. Then all you have to do is run the command below
```
git clone https://gitlab.com/b00f/gnome-trash.git
cd gnome-trash
make install
```

If you are going to test your changes, run: `make test`.
It automatically installs the extension and runs a nested gnome-shell.

## How to contribute

If you are going to help me make this extension better, you are welcome!
To start, check the code; there are some `TODO` comments. You might be interested to work on them.

You can also [add new translation](https://wiki.gnome.org/Projects/GnomeShell/Extensions/Writing#Extension_Translations) by this command:
`msginit -i ./po/gnome-trash.pot -l <YOUR-LANG-ID>`.


## Special Thanks

- Axel von Bertoldi: Original author
- Jonatan Zeidler <jonatan_zeidler@hotmail.de>: German translations
- Raphaël Rochet <raphael.rochet@gmail.com>: French translation
- Renato Cordeiro Ferreira <renato.cferreira@hotmail.com>: Brazilian Portuguese translation
- galen1423: <gnu.linux@zaclys.net> French translation
