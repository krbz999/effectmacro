import {EffectMethods} from "../effectMethods.mjs";

export function onEffectDeleted() {
  Hooks.on("deleteActiveEffect", (effect) => {
    if (!effect.modifiesActor) return;
    if (!effect.hasMacro("onDelete")) return;
    if (!EffectMethods.isExecutor(effect.parent)) return;
    return effect.callMacro("onDelete");
  });
}
