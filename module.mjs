const MODULE = "effectmacro";
const TRIGGERS = {
  agnostic: [
    {
      label: "EFFECTMACRO.EffectTriggers",
      triggers: [
        "onCreate",
        "onDelete",
        "onToggle",
        "onEnable",
        "onDisable"
      ]
    },
    {
      label: "EFFECTMACRO.CombatTriggers",
      triggers: [
        "onTurnStart",
        "onTurnEnd",
        "onEachTurn",
        "onRoundStart",
        "onRoundEnd",
        "onCombatStart",
        "onCombatEnd",
        "onCombatantDefeated"
      ]
    },
    {
      label: "EFFECTMACRO.OtherTriggers",
      triggers: [
        "never"
      ]
    }
  ],
  dnd5e: [
    "dnd5e.rollAttack",
    "dnd5e.rollDamage",
    "dnd5e.rollSavingThrow",
    "dnd5e.rollAbilityCheck",
    "dnd5e.rollSkillV2",
    "dnd5e.rollToolCheckV2",
    "dnd5e.shortRest",
    "dnd5e.longRest",
    "dnd5e.healActor",
    "dnd5e.damageActor"
  ]
};

/**
 * Call a specific type of script in an effect.
 * @param {ActiveEffect} effect   The triggering effect.
 * @param {string} [type]         The trigger of the script (default "never").
 * @param {object} [context]      Additional arguments to pass to the macro.
 */
async function callMacro(effect, type = "never", context = {}) {
  return _callMacro.call(effect, type, context);
}

/**
 * Internal method to call a specific type of script in an effect.
 * @this {ActiveEffect}
 * @param {string} [type]         The trigger of the script (default "never").
 * @param {object} [context]      Additional arguments to pass to the macro.
 */
async function _callMacro(type = "never", context = {}) {
  const script = this.getFlag(MODULE, `${type}.script`);
  if (!script) {
    ui.notifications.warn("EFFECTMACRO.NoSuchScript", {localize: true});
    return;
  }
  const variables = EffectMethods._getHelperVariables(this);
  const fn = new foundry.utils.AsyncFunction(...Object.keys(variables), `{${script}\n}`);
  try {
    await fn.call(context, ...Object.values(variables));
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Return whether an effect has a script of this type.
 * @this {ActiveEffect}
 * @param {string} [type]     The trigger to check for.
 * @returns {boolean}         Whether the effect has a script of this type.
 */
function hasMacro(type = "never") {
  return !!this.getFlag(MODULE, `${type}.script`);
}

/**
 * Remove a specific triggered script from this effect.
 * @this {ActiveEffect}
 * @param {string} [type]       The script to remove.
 * @returns {ActiveEffect}      The effect after being updated.
 */
async function removeMacro(type = "never") {
  const script = this.getFlag(MODULE, type);
  if (!script) return null;
  return this.unsetFlag(MODULE, type);
}

class EffectMethods {

  /**
   * Get helper variables for the script call.
   * @param {ActiveEffect} effect     The effect having a macro called.
   * @returns {object}                Object of helper variables.
   */
  static _getHelperVariables(effect) {
    let actor = effect.parent instanceof Actor ? effect.parent : effect.parent.parent ?? null;
    let character = game.user.character ?? null;
    let token = actor?.token?.object ?? actor?.getActiveTokens()[0] ?? null;
    let scene = token?.scene ?? game.scenes.active ?? null;
    let origin = effect.origin ? fromUuidSync(effect.origin) : null;
    let speaker = actor ? ChatMessage.implementation.getSpeaker({actor}) : {};
    let item = effect.parent instanceof Item ? effect.parent : null;
    return {token, character, actor, speaker, scene, origin, effect, item};
  }

  /**
   * Get whether you, the user, should run the scripts on this actor.
   * @param {Actor} actor     The actor who has the effects.
   * @returns {boolean}       Whether you are the proper user to execute the scripts.
   */
  static isExecutor(actor) {
    if (!actor) return false;

    // find a non-GM who is active and owner of the actor.
    let user = game.users.find(i => !i.isGM && i.active && actor.testUserPermission(i, "OWNER"));
    if (user) return user === game.user;

    // find a GM who is active.
    user = game.users.find(i => i.isGM && i.active);
    return user === game.user;
  }
}

const {HandlebarsApplicationMixin, DocumentSheetV2} = foundry.applications.api;

class EffectMacroConfig extends HandlebarsApplicationMixin(DocumentSheetV2) {
  constructor({type, ...options}) {
    super(options);
    this.#type = type;
  }

  /**
   * The macro type.
   * @type {string}
   */
  #type = null;

  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: false,
      closeOnSubmit: true
    },
    window: {
      icon: "fa-solid fa-code"
    },
    position: {
      width: 600,
      height: "auto"
    },
    actions: {}
  };

  /** @override */
  static PARTS = Object.freeze({
    main: {template: "modules/effectmacro/templates/macro-menu.hbs"}
  });

  /** @override */
  get title() {
    return game.i18n.format("EFFECTMACRO.MacroSheet", {name: this.document.name});
  }

  /** @override */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.uniqueId = `${this.constructor.name}-${options.document.uuid}-${options.type}`;
    return options;
  }

  /** @override */
  async _prepareContext(options) {
    const context = {};

    context.name = `flags.effectmacro.${this.#type}.script`;
    context.value = foundry.utils.getProperty(this.document, context.name) || "";

    const label = `EFFECTMACRO.${this.#type}`;
    context.field = new foundry.data.fields.JavaScriptField({
      label: `${game.i18n.localize("Command")}: ${game.i18n.localize(label)}`
    });
    return context;
  }
}

class EffectConfigHandler {
  /* Inject the html elements into the macro config. */
  static registerMacroConfig() {
    Hooks.on("renderActiveEffectConfig", async (config, html, data) => {
      if (game.settings.get(MODULE, "restrictPermissions") && !game.user.isGM) return;

      const used = [];
      const unused = [];

      for (const obj of TRIGGERS.agnostic) {
        const [triggers, yay] = obj.triggers.partition(key => hasMacro.call(config.document, key));
        if (triggers.length) unused.push({label: obj.label, triggers: triggers});
        used.push(...yay.map(k => ({key: k, label: `EFFECTMACRO.${k}`})));
      }

      const [sys, yay] = (TRIGGERS[game.system.id] ?? []).partition(key => hasMacro.call(config.document, key));
      if (sys.length) unused.push({label: "EFFECTMACRO.SystemTriggers", triggers: sys});
      used.push(...yay.map(k => ({key: k, label: `EFFECTMACRO.${k}`})));

      unused.forEach(u => u.triggers = u.triggers.map(t => ({key: t, label: `EFFECTMACRO.${t}`})));

      const div = document.createElement("DIV");
      const template = "modules/effectmacro/templates/effect-sheet.hbs";
      div.innerHTML = await renderTemplate(template, {used, unused});

      div.querySelectorAll("[data-action]").forEach(n => {
        switch (n.dataset.action) {
          case "macro-add": n.addEventListener("click", EffectConfigHandler._onClickMacroAdd.bind(config)); break;
          case "macro-edit": n.addEventListener("click", EffectConfigHandler._onClickMacroEdit.bind(config)); break;
          case "macro-delete": n.addEventListener("click", EffectConfigHandler._onClickMacroDelete.bind(config)); break;
        }
      });
      html[0].querySelector("section[data-tab='details']").appendChild(div.firstElementChild);
      config.setPosition({height: "auto"});
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
        icon: "fa-solid fa-code"
      },
      rejectClose: false,
      modal: true
    });
    if (!confirm) return;

    await this.submit({preventClose: true});
    return removeMacro.call(this.document, key);
  }

  /**
   * Handle clicking the 'edit macro' buttons.
   * @param {PointerEvent} event                The initiating click event.
   * @returns {Promise<EffectMacroConfig>}      The rendered effect macro editor.
   */
  static _onClickMacroEdit(event) {
    const key = event.currentTarget.dataset.key;
    return new EffectMacroConfig({document: this.document, type: key}).render({force: true});
  }

  /**
   * Handle clicking the 'add macro' button.
   * @param {PointerEvent} event                The initiating click event.
   * @returns {Promise<EffectMacroConfig>}      The rendered effect macro editor.
   */
  static _onClickMacroAdd(event) {
    const key = event.currentTarget.closest(".form-fields").querySelector(".unused-option").value;
    return new EffectMacroConfig({document: this.document, type: key}).render({force: true});
  }
}

class CombatTriggers {
  /* Initialize the module. */
  static init() {
    Hooks.on("preUpdateCombat", CombatTriggers.preUpdateCombat);
    Hooks.on("updateCombatant", CombatTriggers.updateCombatant);
    Hooks.on("updateCombat", CombatTriggers.updateCombat);
    Hooks.on("deleteCombat", CombatTriggers.deleteCombat);
  }

  /**
   * Execute all effects that affect an actor and contain this trigger.
   * This method is called on all clients, but filters out those not to execute it.
   * @param {Actor} actor     The actor with the effects.
   * @param {string} hook     The trigger name.
   */
  static async _executeAppliedEffects(actor, hook) {
    if (!EffectMethods.isExecutor(actor)) return;
    for (const e of actor.appliedEffects.filter(e => hasMacro.call(e, hook))) await callMacro(e, hook);
  }

  /**
   * Determine whether a combat was started and whether it moved forward in turns or rounds.
   * @param {Combat} combat     The combat updated.
   * @param {object} update     The update performed.
   * @param {object} options    The update options.
   * @returns {object<boolean:turnForward, boolean:roundForward, boolean:combatStarted>}
   */
  static _determineCombatState(combat, update, options) {
    let turnForward = true;
    let roundForward = true;
    let combatStarted = true;

    const cTurn = combat.current.turn;
    const pTurn = foundry.utils.getProperty(options, `${MODULE}.previousTR.T`);
    const cRound = combat.current.round;
    const pRound = foundry.utils.getProperty(options, `${MODULE}.previousTR.R`);

    // No change in turns or rounds, not started combat, or went backwards.
    if ((update.turn === undefined) && (update.round === undefined)) turnForward = false;
    if (!combat.started || !combat.isActive) turnForward = false;
    if ((cRound < pRound) || ((cTurn < pTurn) && (cRound === pRound))) turnForward = false;

    roundForward = turnForward && (cRound > pRound);
    combatStarted = combat.started && !foundry.utils.getProperty(options, `${MODULE}.started`);

    return {turnForward, roundForward, combatStarted};
  }

  /**
   * Save data on updated combats.
   * @param {Combat} combat     The combat updated.
   * @param {object} update     The update performed.
   * @param {object} options    The update options.
   */
  static preUpdateCombat(combat, update, options) {
    const previousId = combat.combatant?.id;
    const path = `${MODULE}.previousCombatant`;
    foundry.utils.setProperty(options, path, previousId);

    const prevPath = `${MODULE}.previousTR`;
    const prevTR = {T: combat.turn, R: combat.round};
    foundry.utils.setProperty(options, prevPath, prevTR);

    const startedPath = `${MODULE}.started`;
    const prevStarted = combat.started;
    foundry.utils.setProperty(options, startedPath, prevStarted);
  }

  /**
   * On combatant defeated.
   * @param {Combatant} combatant     The combatant updated.
   * @param {object} update           The update performed.
   */
  static async updateCombatant(combatant, update) {
    if (!update.defeated) return;
    const actor = combatant.actor;
    const hook = "onCombatantDefeated";
    return CombatTriggers._executeAppliedEffects(actor, hook);
  }

  /**
   * On turn start, turn end, each turn, combat start.
   * @param {Combat} combat     The combat updated.
   * @param {object} update     The update performed.
   * @param {object} options    The update options.
   */
  static async updateCombat(combat, update, options) {

    const {turnForward, roundForward, combatStarted} = CombatTriggers._determineCombatState(combat, update, options);
    const undefeated = combat.combatants.filter(c => !c.isDefeated);

    if (turnForward) {
      // Retrieve combatants.
      const previousId = foundry.utils.getProperty(options, `${MODULE}.previousCombatant`);
      const previousCombatant = !combatStarted ? combat.combatants.get(previousId) : null;

      // Execute turn start and turn end triggers.
      CombatTriggers._executeAppliedEffects(combat.combatant?.actor, "onTurnStart");
      CombatTriggers._executeAppliedEffects(previousCombatant?.actor, "onTurnEnd");

      // Execute all 'each turn' triggers.
      for (const c of undefeated) CombatTriggers._executeAppliedEffects(c.actor, "onEachTurn");
    }

    if (roundForward) {
      for (const c of undefeated) {
        if (!combatStarted) CombatTriggers._executeAppliedEffects(c.actor, "onRoundEnd");
        CombatTriggers._executeAppliedEffects(c.actor, "onRoundStart");
      }
    }

    // Determine whether we have started a combat.
    if (combatStarted) for (const c of undefeated) CombatTriggers._executeAppliedEffects(c.actor, "onCombatStart");
  }

  /**
   * On combat ending (being deleted).
   * @param {Combat} combat     The combat deleted.
   */
  static async deleteCombat(combat) {
    if (!combat.started || !combat.isActive) return;
    for (const c of combat.combatants) if (!c.isDefeated) CombatTriggers._executeAppliedEffects(c.actor, "onCombatEnd");
  }
}

class EffectTriggers {
  /**
   * Is legacy transfer of effects turned on?
   * @type {boolean}
   */
  static get isLegacy() {
    return CONFIG.ActiveEffect.legacyTransferral;
  }

  /* Initialize module. */
  static init() {
    Hooks.on("createActiveEffect", EffectTriggers.onCreateDelete.bind("onCreate"));
    Hooks.on("deleteActiveEffect", EffectTriggers.onCreateDelete.bind("onDelete"));
    Hooks.on("preUpdateActiveEffect", EffectTriggers.preUpdate);
    Hooks.on("updateActiveEffect", EffectTriggers.onUpdate);

    // Item triggers.
    Hooks.on("preUpdateItem", EffectTriggers.preUpdateItem);
    Hooks.on("updateItem", EffectTriggers.updateItem);
    Hooks.on("deleteItem", EffectTriggers.deleteItem);
    Hooks.on("createItem", EffectTriggers.createItem);
  }

  /**
   * Execute effect toggle triggers.
   * @param {ActiveEffect} effect     The effect updated.
   * @param {object} update           The update performed.
   * @param {object} context          The update options.
   */
  static async onUpdate(effect, update, context) {
    if (EffectTriggers.isLegacy && (effect.parent instanceof Item)) return;

    const run = EffectMethods.isExecutor(effect.parent);
    if (!run) return false;

    const path = `${MODULE}.${effect.id}.wasOn`;
    const isOn = effect.modifiesActor;
    const wasOn = foundry.utils.getProperty(context, path);
    const toggledOff = wasOn && !isOn;
    const toggledOn = !wasOn && isOn;
    const toggled = toggledOff || toggledOn;

    if (toggledOff && hasMacro.call(effect, "onDisable")) await callMacro(effect, "onDisable");
    if (toggledOn && hasMacro.call(effect, "onEnable")) await callMacro(effect, "onEnable");
    if (toggled && hasMacro.call(effect, "onToggle")) await callMacro(effect, "onToggle");
  }

  /**
   * Save relevant data on effect update.
   * @param {ActiveEffect} effect     The effect updated.
   * @param {object} update           The update performed.
   * @param {object} context          The update options.
   */
  static preUpdate(effect, update, context) {
    if (EffectTriggers.isLegacy && (effect.parent instanceof Item)) return;
    const path = `${MODULE}.${effect.id}.wasOn`;
    foundry.utils.setProperty(context, path, effect.modifiesActor);
  }

  /**
   * Execute effect creation / deletion triggers.
   * @this {string}
   * @param {ActiveEffect} effect     The effect created or deleted.
   */
  static async onCreateDelete(effect) {
    if (effect.modifiesActor && hasMacro.call(effect, this) && EffectMethods.isExecutor(effect.parent)) {
      return callMacro(effect, this);
    }
  }

  /**
   * When an item is updated, read whether its effects have started or stopped applying.
   * @param {Item} item           The item updated.
   * @param {object} update       The update performed.
   * @param {object} context      The update options.
   */
  static preUpdateItem(item, update, context) {
    if (!item.isEmbedded) return;
    const collection = EffectTriggers.isLegacy ? item.actor.effects.filter(e => e.origin === item.uuid) : item.effects;
    collection.forEach(e => foundry.utils.setProperty(context, `${MODULE}.${e.id}.wasOn`, e.modifiesActor));
  }

  /**
   * Execute effect toggles if an item update results in an effect changing whether it affects an actor.
   * @param {Item} item           The item updated.
   * @param {object} update       The update performed.
   * @param {object} context      The update options.
   */
  static async updateItem(item, update, context) {
    if (!item.isEmbedded) return;
    const run = EffectMethods.isExecutor(item.actor);
    if (!run) return;

    const ids = Object.keys(context[MODULE] ?? {});
    if (!ids.length) return;
    const collection = EffectTriggers.isLegacy ? item.actor.effects : item.effects;
    const effects = ids.map(id => collection.get(id));

    for (const effect of effects) {
      if (!effect) continue;
      const isOn = effect.modifiesActor;
      const wasOn = foundry.utils.getProperty(context, `${MODULE}.${effect.id}.wasOn`);
      const toggledOff = wasOn && !isOn;
      const toggledOn = !wasOn && isOn;
      const toggled = toggledOff || toggledOn;

      if (toggledOff && hasMacro.call(effect, "onDisable")) await callMacro(effect, "onDisable");
      if (toggledOn && hasMacro.call(effect, "onEnable")) await callMacro(effect, "onEnable");
      if (toggled && hasMacro.call(effect, "onToggle")) await callMacro(effect, "onToggle");
    }
  }

  /**
   * Execute effect deletion triggers when the parent item is deleted. This only applies to non-legacy transfer systems.
   * @param {Item} item     The item being deleted.
   * @param {object} options      Update options.
   */
  static async deleteItem(item, options) {
    if (!item.isEmbedded || EffectTriggers.isLegacy) return;
    const run = EffectMethods.isExecutor(item.actor);
    if (!run) return;

    const effects = item.effects.filter(e => e.modifiesActor && hasMacro.call(e, "onDelete"));
    for (const effect of effects) await callMacro(effect, "onDelete");
  }

  /**
   * Execute effect creation triggers when the parent item is created. This only applies to non-legacy transfer systems.
   * @param {Item} item           The item that was created.
   * @param {object} options      Update options.
   */
  static async createItem(item, options) {
    if (!item.isEmbedded || EffectTriggers.isLegacy) return;
    const run = EffectMethods.isExecutor(item.actor);
    if (!run) return;

    const effects = item.effects.filter(e => e.modifiesActor && hasMacro.call(e, "onCreate"));
    for (const effect of effects) await callMacro(effect, "onCreate");
  }
}

class SystemDND5E {
  /* Initialize the submodule. */
  static init() {
    if (game.system.id !== "dnd5e") return;
    Hooks.on("dnd5e.restCompleted", SystemDND5E.restCompleted.bind("dnd5e.restCompleted"));
    Hooks.on("dnd5e.rollSavingThrow", SystemDND5E.rollSavingThrow.bind("dnd5e.rollSavingThrow"));
    Hooks.on("dnd5e.rollAbilityCheck", SystemDND5E.rollAbilityCheck.bind("dnd5e.rollAbilityCheck"));
    Hooks.on("dnd5e.rollAttack", SystemDND5E.rollAttack.bind("dnd5e.rollAttack"));
    Hooks.on("dnd5e.rollDamage", SystemDND5E.rollDamage.bind("dnd5e.rollDamage"));
    Hooks.on("dnd5e.rollSkillV2", SystemDND5E.rollSkillV2.bind("dnd5e.rollSkillV2"));
    Hooks.on("dnd5e.rollToolCheckV2", SystemDND5E.rollToolCheckV2.bind("dnd5e.rollToolCheckV2"));
    Hooks.on("dnd5e.healActor", SystemDND5E.healActor.bind("dnd5e.healActor"));
    Hooks.on("dnd5e.damageActor", SystemDND5E.damageActor.bind("dnd5e.damageActor"));
  }

  /**
   * Utility method to filter and then call applicable effects with a trigger.
   * @param {Actor5e} actor       The actor with the effects.
   * @param {string} hook         The trigger.
   * @param {object} context      Parameters to pass the macro.
   */
  static async _filterAndCall(actor, hook, context) {
    if (!EffectMethods.isExecutor(actor)) return;
    for (const e of actor.appliedEffects.filter(e => hasMacro.call(e, hook))) {
      await callMacro(e, hook, context);
    }
  }

  static rollAttack(item, roll, ammoUpdate) {
    if (!item) return;
    return SystemDND5E._filterAndCall(item.actor, this, {item, roll, ammoUpdate});
  }
  

   static rollSavingThrow(roll, data) {
    return SystemDND5E._filterAndCall(data.subject, this, {roll, abilityId: data.ability});
  }

  static rollAbilityCheck(roll, data) {
    return SystemDND5E._filterAndCall(data.subject, this, {roll, abilityId: data.ability});
  }

  static rollSkillV2(roll, data) {
    return SystemDND5E._filterAndCall(data.subject, this, {roll, skillId: data.skill});
  }


  static rollDamage(item, roll) {
    if (!item) return;
    return SystemDND5E._filterAndCall(item.actor, this, {item, roll});
  }
  

  static rollToolCheckV2(roll, data) {
    return SystemDND5E._filterAndCall(data.subject, this, {roll, toolId: data.tool});
  }

  static restCompleted(actor, data) {
    return SystemDND5E._filterAndCall(actor, data.longRest ? "dnd5e.longRest" : "dnd5e.shortRest", {data});
  }

  static healActor(actor, changes, update, userId) {
    return SystemDND5E._filterAndCall(actor, this, {changes, update, userId});
  }

  static damageActor(actor, changes, update, userId) {
    return SystemDND5E._filterAndCall(actor, this, {changes, update, userId});
  }
}

class EffectMacro {
  static MODULE = "effectmacro";

  /* Initialize module. */
  static init() {
    EffectMacro.registerSettings();

    game.modules.get(EffectMacro.MODULE).api = {
      callMacro: callMacro
    };
  }

  /**
   * Register the module settings.
   */
  static registerSettings() {
    game.settings.register(EffectMacro.MODULE, "restrictPermissions", {
      name: "EFFECTMACRO.SettingRestrictPermission",
      hint: "EFFECTMACRO.SettingRestrictPermissionHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      requiresReload: true
    });
  }
}

Hooks.once("init", EffectMacro.init);
Hooks.once("init", EffectTriggers.init);
Hooks.once("init", CombatTriggers.init);
Hooks.once("init", EffectConfigHandler.registerMacroConfig);
Hooks.once("init", SystemDND5E.init);