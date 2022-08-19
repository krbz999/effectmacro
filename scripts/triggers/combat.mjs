import { CHECKS } from "../main.mjs";



export function registerCombatTriggers(){
    // onTurnStart/End is special and weird and has to do it all on its own, but we love him all the same.
    Hooks.on("updateCombat", async (combat, changes) => {
        // no change in turns nor rounds.
        if(changes.turn === undefined && changes.round === undefined) return;
        
        // combat not started.
        if(!combat.started) return;
        
        // not active combat.
        if(!combat.isActive) return;
        
        // we went back.
        if(combat.current.round < combat.previous.round) return;
        
        // we went back.
        if(combat.current.turn < combat.previous.turn && combat.current.round === combat.previous.round) return;
        
        // current and previous combatant ids.
        const currentId = combat.current.combatantId;
        const previousId = combat.previous.combatantId;
        
        // current and previous combatants:
        const currentCombatant = combat.combatants.get(currentId);
        const previousCombatant = combat.combatants.get(previousId);
        
        // current and previous ACTORS in combat.
        const actorCurrent = currentCombatant.token.actor;
        const actorPrevious = previousCombatant?.token.actor;
        
        // find active effects with onTurn triggers.
        const effectsStart = actorCurrent.effects.filter(eff => {
            return !!CHECKS.hasMacroOfType(eff, "onTurnStart") && CHECKS.isActive(eff);
        });
        const effectsEnd = actorPrevious?.effects.filter(eff => {
            return !!CHECKS.hasMacroOfType(eff, "onTurnEnd") && CHECKS.isActive(eff);
        }) ?? [];
        
        // get active player who is owner of combatant.
        const playerCurrent = currentCombatant.players.filter(i => i.active)[0];
        const playerPrevious = previousCombatant?.players.filter(i => i.active)[0];
        
        // are you the player owner of current combatant? if not, are you gm?
        if(!!currentCombatant){
            if(game.user === playerCurrent) for(let eff of effectsStart) await eff.callMacro("onTurnStart");
            else if(!playerCurrent && game.user.isGM) for(let eff of effectsStart) await eff.callMacro("onTurnStart");
        }
        
        // are you the player owner of previous combatant? if not, are you gm?
        if(!!previousCombatant){
            if(game.user === playerPrevious) for(let eff of effectsEnd) await eff.callMacro("onTurnEnd");
            else if(!playerPrevious && game.user.isGM) for(let eff of effectsEnd) await eff.callMacro("onTurnEnd");
        }
    });

    // onCombatStart
    Hooks.on("updateCombat", async (combat, update) => {
        // current must be round1, turn0.
        if(combat.current.round !== 1 || combat.current.turn !== 0) return;
        // previous turn must be round0, turn null.
        if(combat.previous.round !== 0 || combat.previous.turn !== null) return;
        // must be active combat now.
        if(!combat.isActive) return;
        // must be a started combat.
        if(!combat.started) return;
        
        // all combatants that have 'onCombatStart' effects.
        const combatants = combat.combatants.reduce((acc, c) => {
            const effects = c.actor.effects.filter(e => {
                if(!CHECKS.hasMacroOfType(e, "onCombatStart")) return false;
                if(!CHECKS.isActive(e)) return false;
                return true;
            });
            if(effects.length) acc.push([c, effects]);
            return acc;
        }, []);
        
        // for each eligible combatant...
        for(let [combatant, effects] of combatants){
            // get active player who is owner of combatant.
            const owner = combatant.players.filter(i => i.active)[0];
            // if there is an active player, and that's you, you call this.
            if(owner === game.user) for(let eff of effects) await eff.callMacro("onCombatStart");
            // else the gm calls it.
            else if(!owner && game.user.isGM) for(let eff of effects) await eff.callMacro("onCombatStart");
        }
    });

    // onCombatEnd
    Hooks.on("deleteCombat", async (combat) => {
        // must be a started combat.
        if(!combat.started) return;
        // must be an active combat that was ended.
        if(!combat.isActive) return;
        
        // all combatants that have 'onCombatEnd' effects.
        const combatants = combat.combatants.reduce((acc, c) => {
            const effects = c.actor.effects.filter(e => {
                if(!CHECKS.hasMacroOfType(e, "onCombatEnd")) return false;
                if(!CHECKS.isActive(e)) return false;
                return true;
            });
            if(effects.length) acc.push([c, effects]);
            return acc;
        }, []);
        
        // for each eligible combatant...
        for(let [combatant, effects] of combatants){
            // get active player who is owner of combatant.
            const owner = combatant.players.filter(i => i.active)[0];
            // if there is an active player, and that's you, you call this.
            if(owner === game.user) for(let eff of effects) await eff.callMacro("onCombatEnd");
            // else the gm calls it.
            else if(!owner && game.user.isGM) for(let eff of effects) await eff.callMacro("onCombatEnd");
        }
    });

    // onCombatantDefeated
    Hooks.on("updateCombatant", async (combatant, update) => {
        // must be combatant marked defeated.
        if(!update.defeated) return;
        
        // find effects that are "onCombatantDefeated".
        const effects = combatant.actor.effects.filter(eff => {
            return !!CHECKS.hasMacroOfType(eff, "onCombatantDefeated") && CHECKS.isActive(eff);
        });
        if(!effects.length) return;
        
        // get first active player who is owner of combatant.
        const owner = combatant.players.filter(i => i.active)[0];
        
        // if there is an active player, and that's you, you call this.
        if(owner === game.user) for(let eff of effects) await eff.callMacro("onCombatantDefeated");
        // else the gm calls it.
        else if(!owner && game.user.isGM) for(let eff of effects) await eff.callMacro("onCombatantDefeated");
    });
}
