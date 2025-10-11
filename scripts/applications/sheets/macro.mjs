const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class MacroConfig extends HandlebarsApplicationMixin(DocumentSheet) {
  /**
   * The macro type.
   * @type {string}
   */
  get type() {
    return this.options.type;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
    },
    window: {
      icon: "fa-solid fa-code",
      contentClasses: ["standard-form"],
      resizable: true,
    },
    position: {
      width: 600,
      height: 600,
    },
    type: null,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    main: {
      template: "modules/effectmacro/templates/macro-menu.hbs",
      templates: ["templates/generic/form-footer.hbs"],
      root: true,
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
    const appOptions = super._initializeApplicationOptions(options);
    appOptions.uniqueId = `${this.constructor.name}-${options.document.uuid}-${options.type}`;
    return appOptions;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = {};

    context.name = `flags.effectmacro.${this.type}.script`;
    context.value = foundry.utils.getProperty(this.document, context.name) || "";

    const label = `EFFECTMACRO.${this.type}`;
    context.field = new foundry.data.fields.JavaScriptField({
      label: `${game.i18n.localize("Command")}: ${game.i18n.localize(label)}`,
    });

    context.buttons = [{ type: "submit", label: "Save", icon: "fa-solid fa-save" }];

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _processSubmitData(event, form, submitData, options = {}) {
    if (this.document.sheet.rendered) await this.document.sheet.submit();
    return super._processSubmitData(event, form, submitData, options);
  }
}
