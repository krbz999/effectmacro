import {MODULE} from "../constants.mjs";
import {should_I_run_this} from "../helpers.mjs";

export function registerCombatTriggers() {
  // helper hook to get previous combatant and previous turn/round.
  Hooks.on("preUpdateCombat", (combat, _, context) => {
    const previousId = combat.combatant?.id;
    const path = `${MODULE}.previousCombatant`;
    foundry.utils.setProperty(context, path, previousId);

    const prevPath = `${MODULE}.previousTR`;
    const prevTR = {T: combat.turn, R: combat.round};
    foundry.utils.setProperty(context, prevPath, prevTR);

    const startedPath = `${MODULE}.started`;
    const prevStarted = combat.started;
    foundry.utils.setProperty(context, startedPath, prevStarted);
  });

  // onTurnStart/End/Each
  Hooks.on("updateCombat", async (combat, changes, context) => {
    const cTurn = combat.current.turn;
    const pTurn = foundry.utils.getProperty(context, `${MODULE}.previousTR.T`);
    const cRound = combat.current.round;
    const pRound = foundry.utils.getProperty(context, `${MODULE}.previousTR.R`);

    // no change in turns nor rounds.
    if (changes.turn === undefined && changes.round === undefined) return;
    // combat not started or not active.
    if (!combat.started || !combat.isActive) return;
    // we went back.
    if (cRound < pRound || (cTurn < pTurn && cRound === pRound)) return;

    // retrieve combatants.
    const currentCombatant = combat.combatant;
    const previousId = foundry.utils.getProperty(context, `${MODULE}.previousCombatant`);
    const wasStarted = foundry.utils.getProperty(context, `${MODULE}.started`);
    const previousCombatant = wasStarted ? combat.combatants.get(previousId) : null;

    // find active effects with relevant triggers.
    const effectsStart = currentCombatant?.token?.actor?.effects.filter(eff => {
      const hasMacro = eff.hasMacro("onTurnStart");
      const isOn = eff.modifiesActor;
      return hasMacro && isOn;
    }) ?? [];
    const effectsEnd = previousCombatant?.token?.actor?.effects.filter(eff => {
      const hasMacro = eff.hasMacro("onTurnEnd");
      const isOn = eff.modifiesActor;
      return hasMacro && isOn;
    }) ?? [];

    // call all 'each turn' scripts.
    for (const combatant of combat.combatants) {
      if (combatant.isDefeated) continue;
      if (!should_I_run_this(combatant.token?.actor)) continue;
      const effects = combatant.token.actor.effects.filter(eff => {
        const hasMacro = eff.hasMacro("onEachTurn");
        const isOn = eff.modifiesActor;
        return hasMacro && isOn;
      });
      for (const eff of effects) {
        await eff.callMacro("onEachTurn");
      }
    }

    // call scripts.
    if (previousCombatant && !previousCombatant.isDefeated) {
      const run = should_I_run_this(previousCombatant.token?.actor);
      if (run) {
        for (const eff of effectsEnd) {
          await eff.callMacro("onTurnEnd");
        }
      }
    }
    if (currentCombatant && !currentCombatant.isDefeated) {
      const run = should_I_run_this(currentCombatant.token?.actor);
      if (run) {
        for (const eff of effectsStart) {
          await eff.callMacro("onTurnStart");
        }
      }
    }
  });

  // onCombatStart
  Hooks.on("updateCombat", async (combat, _, context) => {
    const was = foundry.utils.getProperty(context, `${MODULE}.started`);
    const is = combat.started;
    if (was || !is) return;

    // all combatants that have 'onCombatStart' effects.
    const combatants = combat.combatants.reduce((acc, c) => {
      if (c.isDefeated) return acc;
      const effects = c.actor?.effects.filter(eff => {
        const hasMacro = eff.hasMacro("onCombatStart");
        const isOn = eff.modifiesActor;
        return hasMacro && isOn;
      }) ?? [];
      if (effects.length) acc.push([c, effects]);
      return acc;
    }, []);

    // for each eligible combatant...
    for (const [combatant, effects] of combatants) {
      const run = should_I_run_this(combatant.token?.actor);
      if (!run) continue;

      for (const eff of effects) {
        await eff.callMacro("onCombatStart");
      }
    }
  });

  // onCombatEnd
  Hooks.on("deleteCombat", async (combat) => {
    // must be started or active combat that was ended.
    if (!combat.started || !combat.isActive) return;

    // all combatants that have 'onCombatEnd' effects.
    const combatants = combat.combatants.reduce((acc, c) => {
      if (c.isDefeated) return acc;
      const effects = c.token?.actor?.effects.filter(eff => {
        const hasMacro = eff.hasMacro("onCombatEnd");
        const isOn = eff.modifiesActor;
        return hasMacro && isOn;
      }) ?? [];
      if (effects.length) acc.push([c, effects]);
      return acc;
    }, []);

    // for each eligible combatant...
    for (const [combatant, effects] of combatants) {
      const run = should_I_run_this(combatant.token?.actor);
      if (!run) continue;

      for (const eff of effects) {
        await eff.callMacro("onCombatEnd");
      }
    }
  });

  // onCombatantDefeated
  Hooks.on("updateCombatant", async (combatant, update) => {
    // must be combatant marked defeated.
    if (!update.defeated) return;

    // find effects that are "onCombatantDefeated".
    const effects = combatant.token?.actor?.effects.filter(eff => {
      const hasMacro = eff.hasMacro("onCombatantDefeated");
      const isOn = eff.modifiesActor;
      return hasMacro && isOn;
    }) ?? [];
    if (!effects.length) return;

    const run = should_I_run_this(combatant.token?.actor);
    if (!run) return;

    for (const eff of effects) {
      await eff.callMacro("onCombatantDefeated");
    }
  });
}
