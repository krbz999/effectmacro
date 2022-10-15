import { MODULE } from "./constants.mjs";

export class EffectMacroConfig extends MacroConfig {
  constructor(doc, options) {
    super(doc, options);
    this.type = options.type;
  }

  /* Override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/effectmacro/templates/macro-menu.hbs",
      classes: ["macro-sheet", "sheet"]
    });
  }

  get id() {
    return `effectmacro-menu-${this.type}-${this.object.id}`;
  }

  /* Override */
  async getData() {
    const data = await super.getData();
    data.img = this.object.icon;
    data.name = this.object.label;
    data.script = this.object.getFlag(MODULE, this.type)?.script ?? "";
    data.localeKey = `EFFECTMACRO.LABEL.${this.type}`;
    return data;
  }

  /* Override */
  _onEditImage(event) {
    const warning = "EFFECTMACRO.APPLYMACRO.EDIT_IMG_ERROR";
    const locale = game.i18n.localize(warning);
    ui.notifications.error(locale);
    return null;
  }

  /* Override */
  async _updateObject(event, formData) {
    await this.object.updateMacro(this.type, formData.command);
    return this.close();
  }
}
