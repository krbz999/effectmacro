import { MODULE, TRIGGERS } from "./constants.mjs";
import { hasMacro, removeMacro } from "./effectMethods.mjs";
const { HandlebarsApplicationMixin, DocumentSheetV2 } = foundry.applications.api;

export class EffectMacroConfig extends HandlebarsApplicationMixin(DocumentSheetV2) {
  constructor({ type, ...options }) {
    super(options);
    this.#type = type;
  }

  /* -------------------------------------------------- */

  /**
   * The macro type.
   * @type {string}
   */
  #type = null;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
    },
    window: {
      icon: "fa-solid fa-code",
    },
    position: {
      width: 600,
      height: "auto",
    },
    actions: {},
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    main: {
      template: "modules/effectmacro/templates/macro-menu.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return game.i18n.format("EFFECTMACRO.MacroSheet", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.uniqueId = `${this.constructor.name}-${options.document.uuid}-${options.type}`;
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {};

    context.name = `flags.effectmacro.${this.#type}.script`;
    context.value = foundry.utils.getProperty(this.document, context.name) || "";

    const label = `EFFECTMACRO.${this.#type}`;
    context.field = new foundry.data.fields.JavaScriptField({
      label: `${game.i18n.localize("Command")}: ${game.i18n.localize(label)}`,
    });

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _processSubmitData(event, form, submitData, options = {}) {
    if (this.document.sheet.rendered) await this.document.sheet.submit();
    return super._processSubmitData(event, form, submitData, options);
  }
}

export class EffectConfigHandler {
  /* Inject the html elements into the macro config. */
  static registerMacroConfig() {
    Hooks.on("renderActiveEffectConfig", async (config, html, data) => {
      if (game.settings.get(MODULE, "restrictPermissions") && !game.user.isGM) return;

      const used = [];
      const unused = [];

      for (const obj of TRIGGERS.agnostic) {
        const [triggers, yay] = obj.triggers.partition(key => hasMacro.call(config.document, key));
        if (triggers.length) unused.push({ label: obj.label, triggers: triggers });
        used.push(...yay.map(k => ({ key: k, label: `EFFECTMACRO.${k}` })));
      }

      const [sys, yay] = (TRIGGERS[game.system.id] ?? []).partition(key => hasMacro.call(config.document, key));
      if (sys.length) unused.push({ label: "EFFECTMACRO.SystemTriggers", triggers: sys });
      used.push(...yay.map(k => ({ key: k, label: `EFFECTMACRO.${k}` })));

      unused.forEach(u => u.triggers = u.triggers.map(t => ({ key: t, label: `EFFECTMACRO.${t}` })));

      const div = document.createElement("DIV");
      const template = "modules/effectmacro/templates/effect-sheet.hbs";
      div.innerHTML = await renderTemplate(template, { used, unused });

      div.querySelectorAll("[data-action]").forEach(n => {
        switch (n.dataset.action) {
          case "macro-add": n.addEventListener("click", EffectConfigHandler._onClickMacroAdd.bind(config)); break;
          case "macro-edit": n.addEventListener("click", EffectConfigHandler._onClickMacroEdit.bind(config)); break;
          case "macro-delete": n.addEventListener("click", EffectConfigHandler._onClickMacroDelete.bind(config)); break;
        }
      });
      if (game.release.generation < 13) html = html[0];
      const tab = html.querySelector("section[data-tab='details']");
      tab.appendChild(div.firstElementChild);
      if (game.release.generation >= 13) tab.classList.add("scrollable");
      if (game.release.generation < 13) config.setPosition({ height: "auto" });
    });
  }

  /**
   * Handle clicking the 'delete macro' buttons.
   * @param {PointerEvent} event      The initiating click event.
   */
  static async _onClickMacroDelete(event) {
    const key = event.currentTarget.dataset.key;

    const confirm = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: "EFFECTMACRO.DeletePrompt",
        icon: "fa-solid fa-code",
      },
      rejectClose: false,
      modal: true,
    });
    if (!confirm) return;

    await this.submit({ preventClose: true });
    return removeMacro.call(this.document, key);
  }

  /**
   * Handle clicking the 'edit macro' buttons.
   * @param {PointerEvent} event                The initiating click event.
   * @returns {Promise<EffectMacroConfig>}      The rendered effect macro editor.
   */
  static _onClickMacroEdit(event) {
    const key = event.currentTarget.dataset.key;
    return new EffectMacroConfig({ document: this.document, type: key }).render({ force: true });
  }

  /**
   * Handle clicking the 'add macro' button.
   * @param {PointerEvent} event                The initiating click event.
   * @returns {Promise<EffectMacroConfig>}      The rendered effect macro editor.
   */
  static _onClickMacroAdd(event) {
    const key = event.currentTarget.closest(".form-fields").querySelector(".unused-option").value;
    return new EffectMacroConfig({ document: this.document, type: key }).render({ force: true });
  }
}
