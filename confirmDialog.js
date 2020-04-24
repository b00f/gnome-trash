const St = imports.gi.St;
const GObject = imports.gi.GObject;
const ModalDialog = imports.ui.modalDialog;
const CheckBox = imports.ui.checkBox;
const Clutter = imports.gi.Clutter;


const CONFIRM_ALWAYS_ASK = 0;
const CONFIRM_DONT_ASK = 1;
const CONFIRM_ASK = 2;


function openConfirmDialog(title, message, ok_label, dont_ask, callback) {
  if (dont_ask.flag == ConfirmDialog.CONFIRM_DONT_ASK) {
    callback();
  } else {
    new ConfirmDialog(title, message, ok_label, dont_ask, callback).open();
  }
}

const ConfirmDialog = GObject.registerClass(
  class ConfirmDialog extends ModalDialog.ModalDialog {

    _init(title, message, ok_label, dont_ask, callback) {
      super._init();

      let main_box = new St.BoxLayout({
        vertical: false,
        style_class: 'gt-modal-dialog',
      });
      this.contentLayout.add(main_box, { x_fill: true, y_fill: true });

      let message_box = new St.BoxLayout({
        vertical: true
      });
      main_box.add(message_box, { y_align: St.Align.START });

      let subject_label = new St.Label({
        style: `font-weight: 700`,
        text: title
      });

      message_box.add(subject_label, { y_fill: true, y_align: St.Align.START });

      let desc_label = new St.Label({
        style: 'padding-top: 10px; padding-bottom: 20px;',
        text: _(message)
      });

      message_box.add(desc_label, { y_fill: true, y_align: St.Align.START });

      if (dont_ask.flag == CONFIRM_ASK) {
        try {
          this.dont_ask_checkbox = new CheckBox.CheckBox(_('Don\'t ask until next login.'));
          message_box.add_actor(this.dont_ask_checkbox);
        } catch (e) {
          // Do nothing.
        }
      }

      this.setButtons([
        {
          label: _("Cancel"),
          action: () => {
            this.close();
          },
          key: Clutter.Escape
        },
        {
          label: ok_label,
          action: () => {
            if (this.dont_ask_checkbox) {
              dont_ask.flag = (this.dont_ask_checkbox.checked) ? CONFIRM_DONT_ASK : CONFIRM_ASK;
            }
            this.close();
            callback();
          }
        }
      ]);
    }
  }
);
