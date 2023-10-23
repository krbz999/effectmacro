import {MODULE} from "../constants.mjs";
import {EffectMethods} from "../effectMethods.mjs";

export class EffectTriggers {
  /* Initialize module. */
  static init() {
    Hooks.on("createActiveEffect", EffectTriggers.onCreateDelete.bind("onCreate"));
    Hooks.on("deleteActiveEffect", EffectTriggers.onCreateDelete.bind("onDelete"));
    Hooks.on("preUpdateActiveEffect", EffectTriggers.preUpdate);
    Hooks.on("updateActiveEffect", EffectTriggers.onUpdate);
    // The below hooks are irrelevant to systems that do not use legacy transfer.
    if (CONFIG.ActiveEffect.legacyTransferral) {
      Hooks.on("preUpdateItem", EffectTriggers.preUpdateItem);
      Hooks.on("updateItem", EffectTriggers.updateItem);
    }
  }

  /**
   * Execute effect toggle triggers.
   * @param {ActiveEffect} effect     The effect updated.
   * @param {object} update           The update performed.
   * @param {object} context          The update options.
   */
  static async onUpdate(effect, update, context) {
    const legacy = CONFIG.ActiveEffect.legacyTransferral;
    if (legacy && (effect.parent instanceof Item)) return;

    const run = EffectMethods.isExecutor(effect.parent);
    if (!run) return false;

    const path = `${MODULE}.${effect.id}.wasOn`;
    const isOn = effect.modifiesActor;
    const wasOn = foundry.utils.getProperty(context, path);
    const toggledOff = wasOn && !isOn;
    const toggledOn = !wasOn && isOn;
    const toggled = toggledOff || toggledOn;

    if (toggledOff && effect.hasMacro("onDisable")) await effect.callMacro("onDisable");
    if (toggledOn && effect.hasMacro("onEnable")) await effect.callMacro("onEnable");
    if (toggled && effect.hasMacro("onToggle")) await effect.callMacro("onToggle");
  }

  /**
   * Save relevant data on effect update.
   * @param {ActiveEffect} effect     The effect updated.
   * @param {object} update           The update performed.
   * @param {object} context          The update options.
   */
  static preUpdate(effect, update, context) {
    const legacy = CONFIG.ActiveEffect.legacyTransferral;
    if (legacy && (effect.parent instanceof Item)) return;
    const path = `${MODULE}.${effect.id}.wasOn`;
    foundry.utils.setProperty(context, path, effect.modifiesActor);
  }

  /**
   * Execute effect creation / deletion triggers.
   * @param {ActiveEffect} effect     The effect created or deleted.
   */
  static async onCreateDelete(effect) {
    if (effect.modifiesActor && effect.hasMacro(this) && EffectMethods.isExecutor(effect.parent)) {
      return effect.callMacro(this);
    }
  }

  /**
   * When an item is updated, read whether its effects have started or stopped applying.
   * @param {Item} item           The item updated.
   * @param {object} update       The update performed.
   * @param {object} context      The update options.
   */
  static preUpdateItem(item, update, context) {
    const effects = item.actor?.effects.filter(e => e.origin === item.uuid) ?? [];
    effects.forEach(e => foundry.utils.setProperty(context, `${MODULE}.${e.id}.wasOn`, e.modifiesActor));
  }

  /**
   * Execute effect toggles if an item update results in an effect applying or not.
   * @param {Item} item           The item updated.
   * @param {object} update       The update performed.
   * @param {object} context      The update options.
   */
  static async updateItem(item, update, context) {
    const run = EffectMethods.isExecutor(item.actor);
    if (!run) return;

    const ids = Object.keys(context[MODULE] ?? {});
    if (!ids.length) return;
    const effects = ids.map(id => item.actor.effects.get(id));

    for (const effect of effects) {
      const isOn = effect.modifiesActor;
      const wasOn = foundry.utils.getProperty(context, `${MODULE}.${effect.id}.wasOn`);
      const toggledOff = wasOn && !isOn;
      const toggledOn = !wasOn && isOn;
      const toggled = toggledOff || toggledOn;

      if (toggledOff && effect.hasMacro("onDisable")) await effect.callMacro("onDisable");
      if (toggledOn && effect.hasMacro("onEnable")) await effect.callMacro("onEnable");
      if (toggled && effect.hasMacro("onToggle")) await effect.callMacro("onToggle");
    }
  }
}
