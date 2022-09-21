import { MODULE } from "../constants.mjs";
import { CHECKS } from "../main.mjs";

export function registerCombatTriggers(){
    // helper hook to get previous combatant.
    Hooks.on("preUpdateCombat", (combat, _, context) => {
        const previousId = combat.combatant?.id;
        foundry.utils.setProperty(context, `${MODULE}.previousCombatant`, previousId);
    });

    // onTurnStart/End
    Hooks.on("updateCombat", async (combat, changes, context) => {
        const cTurn = combat.current.turn;
        const pTurn = combat.previous.turn;
        const cRound = combat.current.round;
        const pRound = combat.previous.round;

        // no change in turns nor rounds.
        if ( changes.turn === undefined && changes.round === undefined ) return;
        // combat not started.
        if ( !combat.started ) return;
        // not active combat.
        if ( !combat.isActive ) return;
        // we went back.
        if ( cRound < pRound ) return;
        // we went back.
        if ( cTurn < pTurn && cRound === pRound ) return;
        
        // retrieve combatants.
        const currentCombatant = combat.combatant;
        const previousId = context[MODULE].previousCombatant;
        const previousCombatant = combat.combatants.get(previousId);
        
        // find active effects with onTurn triggers.
        const effectsStart = currentCombatant.token.actor.effects.filter(eff => {
            return CHECKS.hasMacroOfType(eff, "onTurnStart") && CHECKS.isActive(eff);
        });
        const effectsEnd = previousCombatant?.token.actor?.effects.filter(eff => {
            return CHECKS.hasMacroOfType(eff, "onTurnEnd") && CHECKS.isActive(eff);
        }) ?? [];
        
        // call scripts.
        if ( currentCombatant ) {
            if ( game.user === getFirstPlayerOwner(currentCombatant) ) {
                for ( const eff of effectsStart ) await eff.callMacro("onTurnStart");
            }
        }
        if ( previousCombatant ) {
            if ( game.user === getFirstPlayerOwner(previousCombatant) ) {
                for ( const eff of effectsEnd ) await eff.callMacro("onTurnEnd");
            }
        }
    });

    // onCombatStart
    Hooks.on("combatStart", async (combat) => {
        // all combatants that have 'onCombatStart' effects.
        const combatants = combat.combatants.reduce((acc, c) => {
            const effects = c.actor.effects.filter(e => {
                if ( !CHECKS.hasMacroOfType(e, "onCombatStart") ) return false;
                if ( !CHECKS.isActive(e) ) return false;
                return true;
            });
            if ( effects.length ) acc.push([c, effects]);
            return acc;
        }, []);
        
        // for each eligible combatant...
        for ( const [combatant, effects] of combatants ) {
            // compare against the user who should call these scripts.
            if ( game.user !== getFirstPlayerOwner(combatant) ) continue;
            for ( const eff of effects ) await eff.callMacro("onCombatStart");
        }
    });

    // onCombatEnd
    Hooks.on("deleteCombat", async (combat) => {
        // must be a started combat.
        if ( !combat.started ) return;
        // must be an active combat that was ended.
        if ( !combat.isActive ) return;
        
        // all combatants that have 'onCombatEnd' effects.
        const combatants = combat.combatants.reduce((acc, c) => {
            const effects = c.actor.effects.filter(e => {
                if ( !CHECKS.hasMacroOfType(e, "onCombatEnd") ) return false;
                if ( !CHECKS.isActive(e) ) return false;
                return true;
            });
            if ( effects.length ) acc.push([c, effects]);
            return acc;
        }, []);
        
        // for each eligible combatant...
        for ( const [combatant, effects] of combatants ) {
            // compare against the user who should call these scripts.
            if ( game.user !== getFirstPlayerOwner(combatant) ) continue;
            for ( const eff of effects ) await eff.callMacro("onCombatEnd");
        }
    });

    // onCombatantDefeated
    Hooks.on("updateCombatant", async (combatant, update) => {
        // must be combatant marked defeated.
        if ( !update.defeated ) return;
        
        // find effects that are "onCombatantDefeated".
        const effects = combatant.actor.effects.filter(eff => {
            return !!CHECKS.hasMacroOfType(eff, "onCombatantDefeated") && CHECKS.isActive(eff);
        });
        if ( !effects.length ) return;

        // compare against the user who should call these scripts.
        if ( game.user !== getFirstPlayerOwner(combatant) ) return;
        for ( const eff of effects ) await eff.callMacro("onCombatantDefeated");
    });
}

// helper function to get the first active player owner, otherwise returns the GM.
function getFirstPlayerOwner(combatant){
    const playerOwner = combatant.players.filter(i => i.active)[0];
    // if the combatant has an active player owner, use that.
    if ( playerOwner ) return playerOwner;

    // return the first active GM found.
    const masterOwner = game.users.filter(i => i.isGM && i.active)[0];
    return masterOwner;
}
