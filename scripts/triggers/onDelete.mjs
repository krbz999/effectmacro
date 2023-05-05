import {AppendedActiveEffectMethods} from "../effectMethods.mjs";

export function onEffectDeleted() {
  Hooks.on("deleteActiveEffect", (effect) => {
    if (!effect.modifiesActor) return;
    if (!effect.hasMacro("onDelete")) return;
    if (!AppendedActiveEffectMethods.isExecutor(effect.parent)) return;
    return effect.callMacro("onDelete");
  });
}
