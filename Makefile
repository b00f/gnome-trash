# Basic Makefile

EXT_NAME = gnome-trash
UUID = $(EXT_NAME)@gnome-trash.b00f.gitlab.com
BUNDLE = $(UUID).shell-extension.zip
POT_FILE = ./po/$(EXT_NAME).pot

all: pack

pack:
	@gnome-extensions pack --force --extra-source=README.md --extra-source=LICENSE
	@echo extension packed!

install: pack
	@gnome-extensions install $(BUNDLE) --force
	@echo extension installed!

test: install
	# https://wiki.gnome.org/Projects/GnomeShell/Extensions/Writing#Extension_Creation
	@dbus-run-session -- gnome-shell --nested --wayland

update-transaltions:
	@xgettext -L Python --from-code=UTF-8 -k_ -kN_ -o $(POT_FILE) *.js --package-name "gnome-trash"
	@for f in ./po/*.po ; do \
		msgmerge $$f $(POT_FILE) -o $$f ;\
	done

