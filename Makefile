# Basic Makefile

EXT_NAME = gnome-trash
UUID = $(EXT_NAME)
BASE_MODULES = LICENSE extension.js metadata.json README.md stylesheet.css media/icon.png media/screenshot.png
MSGSRC = $(wildcard po/*.po)
INSTALLNAME = $(UUID)
INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions

all: extension build

extension: $(MSGSRC:.po=.mo)


./po/%.mo: ./po/%.po
	@msgfmt -c $< -o $@

install: build
	@rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	@mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	@cp -r ./build/* $(INSTALLBASE)/$(INSTALLNAME)/
	@rm -fR build
	@echo done

zip-file: install
	cd build ; \
	zip -qr "$(UUID)$(FILESUFFIX).zip" .
	-rm -fR build

build:
	@rm -fR ./build
	@mkdir -p build
	@cp $(BASE_MODULES) $(LOCALE) build
	@mkdir -p build/locale
	@for l in $(MSGSRC:.po=.mo) ; do \
		lf=build/locale/`basename $$l .mo`; \
		mkdir -p $$lf; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/$(EXT_NAME).mo; \
	done;

test: install
	# https://wiki.gnome.org/Projects/GnomeShell/Extensions/Writing#Extension_Creation
	@dbus-run-session -- gnome-shell --nested --wayland

.PHONY: build test