import {MODULE} from "../constants.mjs";
import {EffectMethods} from "../effectMethods.mjs";

export function onEffectToggled() {
  Hooks.on("preUpdateActiveEffect", (effect, update, context) => {
    if (effect.parent instanceof Item) return;
    const path = `${MODULE}.${effect.id}.wasOn`;
    foundry.utils.setProperty(context, path, effect.modifiesActor);
  });

  Hooks.on("updateActiveEffect", async (effect, update, context) => {
    if (effect.parent instanceof Item) return;

    const run = EffectMethods.isExecutor(effect.parent);
    if (!run) return false;

    const path = `${MODULE}.${effect.id}.wasOn`;
    const isOn = effect.modifiesActor;
    const wasOn = foundry.utils.getProperty(context, path);
    const toggledOff = wasOn && !isOn;
    const toggledOn = !wasOn && isOn;
    const toggled = toggledOff || toggledOn;

    if (!toggled) return;

    if (toggledOff && effect.hasMacro("onDisable")) {
      await effect.callMacro("onDisable");
    }
    if (toggledOn && effect.hasMacro("onEnable")) {
      await effect.callMacro("onEnable");
    }
    if (toggled && effect.hasMacro("onToggle")) {
      await effect.callMacro("onToggle");
    }
  });

  Hooks.on("preUpdateItem", (item, _, context) => {
    item.parent?.effects.filter(eff => {
      return eff.origin === item.uuid;
    }).forEach(e => {
      const path = `${MODULE}.${e.id}.wasOn`;
      foundry.utils.setProperty(context, path, e.modifiesActor);
    });
  });

  Hooks.on("updateItem", async (item, update, context) => {
    const run = EffectMethods.isExecutor(item.parent);
    if (!run) return;

    const ids = Object.keys(context[MODULE] ?? {});
    if (!ids.length) return;
    const effects = ids.map(id => item.parent.effects.get(id));

    for (const effect of effects) {
      const isOn = effect.modifiesActor;
      const path = `${MODULE}.${effect.id}.wasOn`;
      const wasOn = foundry.utils.getProperty(context, path);
      const toggledOff = wasOn && !isOn;
      const toggledOn = !wasOn && isOn;
      const toggled = toggledOff || toggledOn;
      if (!toggled) continue;

      if (toggledOff && effect.hasMacro("onDisable")) {
        await effect.callMacro("onDisable");
      }
      if (toggledOn && effect.hasMacro("onEnable")) {
        await effect.callMacro("onEnable");
      }
      if (toggled && effect.hasMacro("onToggle")) {
        await effect.callMacro("onToggle");
      }
    }
  });
}
