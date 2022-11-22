import { MODULE } from "../constants.mjs";
import { should_I_run_this } from "../helpers.mjs";

export function registerCombatTriggers() {
  // helper hook to get previous combatant and previous turn/round.
  Hooks.on("preUpdateCombat", (combat, _, context) => {
    const previousId = combat.combatant?.id;
    const path = `${MODULE}.previousCombatant`;
    foundry.utils.setProperty(context, path, previousId);
    const prevPath = `${MODULE}.previousTR`;
    const prevTR = { T: combat.turn, R: combat.round };
    foundry.utils.setProperty(context, prevPath, prevTR);
  });

  // onTurnStart/End/Each
  Hooks.on("updateCombat", async (combat, changes, context) => {
    const cTurn = combat.current.turn;
    const pTurn = foundry.utils.getProperty(context, `${MODULE}.previousTR.T`);
    const cRound = combat.current.round;
    const pRound = foundry.utils.getProperty(context, `${MODULE}.previousTR.R`);

    // no change in turns nor rounds.
    if (changes.turn === undefined && changes.round === undefined) return;
    // combat not started.
    if (!combat.started) return;
    // not active combat.
    if (!combat.isActive) return;
    // we went back.
    if (cRound < pRound) return;
    // we went back.
    if (cTurn < pTurn && cRound === pRound) return;

    // retrieve combatants.
    const currentCombatant = combat.combatant;
    const previousId = context[MODULE].previousCombatant;
    const previousCombatant = combat.combatants.get(previousId);

    // find active effects with relevant triggers.
    const effectsStart = currentCombatant?.token.actor?.effects.filter(eff => {
      const hasMacro = eff.hasMacro("onTurnStart");
      const isOn = eff.modifiesActor;
      return hasMacro && isOn;
    }) ?? [];
    const effectsEnd = previousCombatant?.token.actor?.effects.filter(eff => {
      const hasMacro = eff.hasMacro("onTurnEnd");
      const isOn = eff.modifiesActor;
      return hasMacro && isOn;
    }) ?? [];

    // call all 'each turn' scripts.
    for (const combatant of combat.combatants) {
      if (!combatant?.token.actor) continue;
      if (!should_I_run_this(combatant.token.actor)) continue;
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
    if (currentCombatant) {
      const run = should_I_run_this(currentCombatant.token.actor);
      if (run) {
        for (const eff of effectsStart) {
          await eff.callMacro("onTurnStart");
        }
      }
    }
    if (previousCombatant) {
      const run = should_I_run_this(previousCombatant.token.actor);
      if (run) {
        for (const eff of effectsEnd) {
          await eff.callMacro("onTurnEnd");
        }
      }
    }
  });

  // onCombatStart
  Hooks.on("updateCombat", async (combat, _, context) => {
    const r = combat.current.round === 1;
    const t = combat.current.turn === 0;
    const p = foundry.utils.getProperty(context, `${MODULE}.previousTR.R`) === 0;
    const q = !foundry.utils.getProperty(context, `${MODULE}.previousTR.T`);
    if (!r || !t || !p || !q) return; // this is not combatStart.

    // all combatants that have 'onCombatStart' effects.
    const combatants = combat.combatants.reduce((acc, c) => {
      const effects = c.actor.effects.filter(eff => {
        const hasMacro = eff.hasMacro("onCombatStart");
        const isOn = eff.modifiesActor;
        return hasMacro && isOn;
      });
      if (effects.length) acc.push([c, effects]);
      return acc;
    }, []);

    // for each eligible combatant...
    for (const [combatant, effects] of combatants) {
      const run = should_I_run_this(combatant.token.actor);
      if (!run) continue;

      for (const eff of effects) {
        await eff.callMacro("onCombatStart");
      }
    }
  });

  // onCombatEnd
  Hooks.on("deleteCombat", async (combat) => {
    // must be a started combat.
    if (!combat.started) return;
    // must be an active combat that was ended.
    if (!combat.isActive) return;

    // all combatants that have 'onCombatEnd' effects.
    const combatants = combat.combatants.reduce((acc, c) => {
      const effects = c.actor.effects.filter(eff => {
        const hasMacro = eff.hasMacro("onCombatEnd");
        const isOn = eff.modifiesActor;
        return hasMacro && isOn;
      });
      if (effects.length) acc.push([c, effects]);
      return acc;
    }, []);

    // for each eligible combatant...
    for (const [combatant, effects] of combatants) {
      const run = should_I_run_this(combatant.token.actor);
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
    const effects = combatant.actor.effects.filter(eff => {
      const hasMacro = eff.hasMacro("onCombatantDefeated");
      const isOn = eff.modifiesActor;
      return hasMacro && isOn;
    });
    if (!effects.length) return;

    const run = should_I_run_this(combatant.token.actor);
    if (!run) return;

    for (const eff of effects) {
      await eff.callMacro("onCombatantDefeated");
    }
  });
}
