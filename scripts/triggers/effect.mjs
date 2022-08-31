import { CHECKS, EM } from "../main.mjs";

export function registerEffectTriggers(){
    // hooks to flag contexts.
    Hooks.on("preDeleteActiveEffect", (effect, context) => {
        if ( !!CHECKS.hasMacroOfType(effect, "onDelete") && CHECKS.isActive(effect) ) EM.primer(context, "onDelete");
    });
    Hooks.on("preCreateActiveEffect", (effect, effectData, context) => {
        if ( !!CHECKS.hasMacroOfType(effect, "onCreate") ) EM.primer(context, "onCreate");
    });
    Hooks.on("preUpdateActiveEffect", (effect, update, context) => {
        if ( !!CHECKS.hasMacroOfType(effect, "onToggle") && CHECKS.toggled(effect, update) ) EM.primer(context, "onToggle");
        else if ( !!CHECKS.hasMacroOfType(effect, "onEnable") && CHECKS.toggledOn(effect, update) ) EM.primer(context, "onEnable");
        else if ( !!CHECKS.hasMacroOfType(effect, "onDisable") && CHECKS.toggledOff(effect, update) ) EM.primer(context, "onDisable");
    });

    // hooks to execute scripts.
    Hooks.on("deleteActiveEffect", (effect, context) => {
        // is it flagged?
        const types = context.effectmacro;
        if ( !types ) return;
        
        // first player; if not you, then only for GM.
        const userId = CHECKS.firstPlayerOwner(effect.parent);
        
        // if you are the player owner, or if no player owner and if you are GM...
        if ( ( userId === game.user.id ) || ( !userId && game.user.isGM ) ) {
            if ( !!types && types.length > 0 ) EM.getScripts(effect, types);
        }
        else return;
    });
    Hooks.on("createActiveEffect", (effect, context) => {
        // is it flagged?
        const types = context.effectmacro;
        if ( !types ) return;
        
        // first player; if not you, then only for GM.
        const userId = CHECKS.firstPlayerOwner(effect.parent);
        
        // if you are the player owner, or if no player owner and if you are GM...
        if ( ( userId === game.user.id ) || ( !userId && game.user.isGM ) ) {
            if ( !!types && types.length > 0 ) EM.getScripts(effect, types);
        }
        else return;
    });
    Hooks.on("updateActiveEffect", (effect, _, context) => {
        // is it flagged?
        const types = context.effectmacro;
        if ( !types ) return;
        
        // first player; if not you, then only for GM.
        const userId = CHECKS.firstPlayerOwner(effect.parent);
        
        // if you are the player owner, or if no player owner and if you are GM...
        if ( ( userId === game.user.id ) || ( !userId && game.user.isGM ) ) {
            if ( !!types && types.length > 0 ) EM.getScripts(effect, types);
        }
        else return;
    });
}
