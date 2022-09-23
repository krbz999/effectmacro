import { should_I_run_this } from "../helpers.mjs";

export function onEffectDeleted(){
    Hooks.on("deleteActiveEffect", (effect) => {
        if ( effect.parent instanceof Item ) return;

        const run = should_I_run_this(effect.parent);
        if ( !run ) return;

        const isOn = effect.modifiesActor;
        if ( !isOn ) return;

        if ( effect.hasMacro("onDelete") ) effect.callMacro("onDelete");
    });
}
