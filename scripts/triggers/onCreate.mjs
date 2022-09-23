import { should_I_run_this } from "../helpers.mjs";

export function onEffectCreated(){
    Hooks.on("createActiveEffect", (effect) => {
        const run = should_I_run_this(effect.parent);
        if ( !run ) return;

        const isOn = effect.modifiesActor;
        if ( !isOn ) return;

        if ( effect.hasMacro("onCreate") ) effect.callMacro("onCreate");
    });
}
