# Basic Makefile

EXT_NAME = gnome-trash
UUID = $(EXT_NAME)
BASE_FILES = LICENSE extension.js metadata.json README.md stylesheet.css
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
	@echo done!

zip-file: build
	@cd ./build ; \
	zip -qr "$(UUID).zip" .
	@mv ./build/"$(UUID).zip" .
	@-rm -fR build
	@echo done!

build:
	@rm -fR ./build
	@mkdir -p build build/locale
	@cp $(BASE_FILES) build
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