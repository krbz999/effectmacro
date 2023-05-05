import {AppendedActiveEffectMethods} from "../effectMethods.mjs";

export function onEffectCreated() {
  Hooks.on("createActiveEffect", (effect) => {
    if (!effect.modifiesActor) return;
    if (!effect.hasMacro("onCreate")) return;
    if (!AppendedActiveEffectMethods.isExecutor(effect.parent)) return;
    return effect.callMacro("onCreate");
  });
}
