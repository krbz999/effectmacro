import { should_I_run_this } from "../helpers.mjs";

export function onEffectDeleted() {
  Hooks.on("deleteActiveEffect", (effect) => {
    if (!effect.modifiesActor) return;
    if (!effect.hasMacro("onDelete")) return;
    if (!should_I_run_this(effect.parent)) return;
    return effect.callMacro("onDelete");
  });
}
