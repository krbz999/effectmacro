import {MODULE} from "../constants.mjs";
import {EffectMethods} from "../effectMethods.mjs";

export class EffectTriggers {
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

  static preUpdate(effect, update, context) {
    const legacy = CONFIG.ActiveEffect.legacyTransferral;
    if (legacy && (effect.parent instanceof Item)) return;
    const path = `${MODULE}.${effect.id}.wasOn`;
    foundry.utils.setProperty(context, path, effect.modifiesActor);
  }

  static async onCreateDelete(effect) {
    if (effect.modifiesActor && effect.hasMacro(this) && EffectMethods.isExecutor(effect.parent)) {
      return effect.callMacro(this);
    }
  }

  static preUpdateItem(item, _, context) {
    const effects = item.actor?.effects.filter(e => e.origin === item.uuid) ?? [];
    effects.forEach(e => foundry.utils.setProperty(context, `${MODULE}.${e.id}.wasOn`, e.modifiesActor));
  }

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
      if (toggled && effect.hasMacro("onToggle")) {
        await effect.callMacro("onToggle");
      }
    }
  }
}
