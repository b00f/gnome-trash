const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;

const Gettext = imports.gettext.domain("gnome-trash");
const _ = Gettext.gettext;

var SearchBox = GObject.registerClass(class SearchBox extends PopupMenu.PopupBaseMenuItem {
  _init() {
    super._init({
      reactive: false,
      can_focus: true,
    })

    // TODO: add 'x' clear button inside the search box
    // --------------------------------------------------
    // |                                              X |
    // --------------------------------------------------
    this.search_entry = new St.Entry({
      name: 'searchItem',
      style_class: 'gt-search-box',
      can_focus: true,
      hint_text: _('Type here to search...'),
      track_hover: true
    });

    this.actor.add(this.search_entry, { expand: true });

  }

  onTextChanged(callback) {
    this.search_entry.get_clutter_text().connect(
      'text-changed',
      callback
    );
  }

  getText() {
    return this.search_entry.get_text();
  }

  setText(text) {
    return this.search_entry.set_text(text);
  }
});