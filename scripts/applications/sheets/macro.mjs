const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class MacroConfig extends HandlebarsApplicationMixin(DocumentSheet) {
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
      contentClasses: ["standard-form"],
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
    footer: {
      template: "templates/generic/form-footer.hbs",
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
