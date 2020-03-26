# Basic Makefile

EXT_NAME = gnome-trash
UUID = $(EXT_NAME)@gnome-trash.b00f.gitlab.com
BUNDLE = $(UUID).shell-extension.zip

all: pack

pack:
	@gnome-extensions pack --force
	@echo extension packed!

install: pack
	@gnome-extensions install $(BUNDLE) --force
	@echo extension installed!

test: install
	# https://wiki.gnome.org/Projects/GnomeShell/Extensions/Writing#Extension_Creation
	@dbus-run-session -- gnome-shell --nested --wayland

.PHONY: pack install test