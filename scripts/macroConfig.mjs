import {MODULE, TRIGGERS} from "./constants.mjs";

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
    return `${MODULE}-${this.type}-${this.object.uuid.replaceAll(".", "-")}`;
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

export class EffectConfigHandler {
  /**
   * Inject the html elements into the macro config. Runs on 'ready' due to the setting.
   */
  static registerMacroConfig() {
    if (game.settings.get(MODULE, "restrictPermissions") && !game.user.isGM) return;
    Hooks.on("renderActiveEffectConfig", async (config, html, data) => {
      const keys = TRIGGERS.agnostic.concat(TRIGGERS[game.system.id] ?? []);

      const templateData = keys.reduce((acc, key) => {
        const label = `EFFECTMACRO.${key}`;
        if (config.document.hasMacro(key)) acc.used.push({key, label});
        else acc.unused.push({key, label});
        return acc;
      }, {used: [], unused: []});
      const div = document.createElement("DIV");
      const template = "modules/effectmacro/templates/effect-sheet.hbs";
      div.innerHTML = await renderTemplate(template, templateData);
      div.querySelectorAll("[data-action]").forEach(n => {
        const action = n.dataset.action;
        if (action === "macro-add") {
          n.addEventListener("click", EffectConfigHandler._onClickMacroAdd.bind(config));
        } else if (action === "macro-edit") {
          n.addEventListener("click", EffectConfigHandler._onClickMacroEdit.bind(config));
        } else if (action === "macro-delete") {
          n.addEventListener("click", EffectConfigHandler._onClickMacroDelete.bind(config));
        }
      });
      html[0].querySelector("section[data-tab='details']").appendChild(div.firstElementChild);
      config.setPosition({height: "auto"});
    });
  }

  /**
   * Handle clicking the 'delete macro' buttons.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {ActiveEffect}          The effect having a flag removed.
   */
  static async _onClickMacroDelete(event) {
    const key = event.currentTarget.dataset.key;
    await this.submit({preventClose: true});
    return this.document.removeMacro(key);
  }

  /**
   * Handle clicking the 'edit macro' buttons.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {EffectMacroConfig}     The rendered effect macro editor.
   */
  static _onClickMacroEdit(event) {
    const key = event.currentTarget.dataset.key;
    const existingApp = Object.values(this.document.apps).find(app => {
      return app.id === `${MODULE}-${key}-${this.document.uuid.replaceAll(".", "-")}`;
    });
    if (!existingApp) return new EffectMacroConfig(this.document, {type: key}).render(true);
  }

  /**
   * Handle clicking the 'add macro' button.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {EffectMacroConfig}     The rendered effect macro editor.
   */
  static _onClickMacroAdd(event) {
    const key = event.currentTarget.closest(".form-fields").querySelector(".unused-option").value;
    const existingApp = Object.values(this.document.apps).find(app => {
      return app.id === `${MODULE}-${key}-${this.document.uuid.replaceAll(".", "-")}`;
    });
    if (!existingApp) return new EffectMacroConfig(this.document, {type: key}).render(true);
  }
}
