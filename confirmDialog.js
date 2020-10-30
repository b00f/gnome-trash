const St = imports.gi.St;
const GObject = imports.gi.GObject;
const ModalDialog = imports.ui.modalDialog;
const CheckBox = imports.ui.checkBox;
const Clutter = imports.gi.Clutter;

const Gettext = imports.gettext.domain("gnome-trash");
const _ = Gettext.gettext;

const CONFIRM_ALWAYS_ASK = 0;
const CONFIRM_DONT_ASK = 1;
const CONFIRM_ASK = 2;


function openConfirmDialog(title, message, sub_message, ok_label, dont_ask, callback) {
  if (dont_ask.flag == CONFIRM_DONT_ASK) {
    callback();
  } else {
    new ConfirmDialog(title, message + "\n" + sub_message, ok_label, dont_ask, callback).open();
  }
}

const ConfirmDialog = GObject.registerClass(
  class ConfirmDialog extends ModalDialog.ModalDialog {

    _init(title, desc, ok_label, dont_ask, callback) {
      super._init();

      let main_box = new St.BoxLayout();
      main_box.vertical = false;
      main_box.style_class = 'gt-modal-dialog';

      this.contentLayout.add(main_box);
      this.contentLayout.x_fill = true;
      this.contentLayout.y_fill = true;

      let message_box = new St.BoxLayout();
      message_box.vertical = true;

      main_box.add(message_box);
      message_box.y_align = St.Align.START;

      let subject_label = new St.Label();
      subject_label.style = 'font-weight: 700';
      subject_label.text = title;

      message_box.add(subject_label);
      message_box.y_fill = true;
      message_box.y_align = St.Align.START;

      let desc_label = new St.Label();
      desc_label.style = 'padding-top: 10px; padding-bottom: 20px;';
      desc_label.text = desc;

      message_box.add(desc_label);
      message_box.y_fill = true;
      message_box.y_align = St.Align.START;

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
