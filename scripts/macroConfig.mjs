import {MODULE} from "./constants.mjs";
import {_effectMacroConfigId} from "./helpers.mjs";

export class EffectMacroConfig extends MacroConfig {
  constructor(doc, options) {
    super(doc, options);
    this.type = options.type;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/effectmacro/templates/macro-menu.hbs",
      classes: ["macro-sheet", "sheet", MODULE]
    });
  }

  /** @override */
  get id() {
    return _effectMacroConfigId(this.object, this.type);
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.img = this.object.icon;
    data.name = this.object.name;
    data.script = this.object.getFlag(MODULE, `${this.type}.script`) || "";
    data.localeKey = `EFFECTMACRO.${this.type}`;
    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    await this.object.sheet?.submit({preventClose: true});
    return this.object.updateMacro(this.type, formData.command);
  }

  /** @override */
  async close(options = {}) {
    Object.entries(this.object.apps).forEach(([appId, config]) => {
      if (config.id === this.id) delete this.object.apps[appId];
    });
    return super.close(options);
  }
}
