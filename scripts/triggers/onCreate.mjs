import { should_I_run_this } from "../helpers.mjs";

export function onEffectCreated() {
  Hooks.on("createActiveEffect", (effect) => {
    if (!effect.modifiesActor) return;
    if (!effect.hasMacro("onCreate")) return;
    if (!should_I_run_this(effect.parent)) return;
    return effect.callMacro("onCreate");
  });
}
