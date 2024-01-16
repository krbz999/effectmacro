import {MODULE} from "../constants.mjs";
import {EffectMethods} from "../effectMethods.mjs";

export class CombatTriggers {
  /* Initialize module. */
  static init() {
    Hooks.on("preUpdateCombat", CombatTriggers.preUpdateCombat);
    Hooks.on("updateCombatant", CombatTriggers.updateCombatant);
    Hooks.on("updateCombat", CombatTriggers.updateCombat);
    Hooks.on("deleteCombat", CombatTriggers.deleteCombat);
  }

  /**
   * Execute all effects that affect an actor and contain this trigger.
   * This method is called on all clients, but filters out those not to execute it.
   * @param {Actor} actor     The actor with the effects.
   * @param {string} hook     The trigger name.
   */
  static async _executeAppliedEffects(actor, hook) {
    if (!EffectMethods.isExecutor(actor)) return;
    for (const e of actor.appliedEffects.filter(e => e.hasMacro(hook))) await e.callMacro(hook);
  }

  /**
   * Determine whether a combat was started and whether it moved forward in turns or rounds.
   * @param {Combat} combat     The combat updated.
   * @param {object} update     The update performed.
   * @param {object} options    The update options.
   * @returns {object<boolean:turnForward, boolean:roundForward, boolean:combatStarted>}
   */
  static _determineCombatState(combat, update, options) {
    let turnForward = true;
    let roundForward = true;
    let combatStarted = true;

    const cTurn = combat.current.turn;
    const pTurn = foundry.utils.getProperty(options, `${MODULE}.previousTR.T`);
    const cRound = combat.current.round;
    const pRound = foundry.utils.getProperty(options, `${MODULE}.previousTR.R`);

    // No change in turns or rounds, not started combat, or went backwards.
    if ((update.turn === undefined) && (update.round === undefined)) turnForward = false;
    if (!combat.started || !combat.isActive) turnForward = false;
    if ((cRound < pRound) || ((cTurn < pTurn) && (cRound === pRound))) turnForward = false;

    roundForward = turnForward && (cRound > pRound);
    combatStarted = combat.started && !foundry.utils.getProperty(options, `${MODULE}.started`);

    return {turnForward, roundForward, combatStarted};
  }

  /**
   * Save data on updated combats.
   * @param {Combat} combat     The combat updated.
   * @param {object} update     The update performed.
   * @param {object} options    The update options.
   */
  static preUpdateCombat(combat, update, options) {
    const previousId = combat.combatant?.id;
    const path = `${MODULE}.previousCombatant`;
    foundry.utils.setProperty(options, path, previousId);

    const prevPath = `${MODULE}.previousTR`;
    const prevTR = {T: combat.turn, R: combat.round};
    foundry.utils.setProperty(options, prevPath, prevTR);

    const startedPath = `${MODULE}.started`;
    const prevStarted = combat.started;
    foundry.utils.setProperty(options, startedPath, prevStarted);
  }

  /**
   * On combatant defeated.
   * @param {Combatant} combatant     The combatant updated.
   * @param {object} update           The update performed.
   */
  static async updateCombatant(combatant, update) {
    if (!update.defeated) return;
    const actor = combatant.actor;
    const hook = "onCombatantDefeated";
    return CombatTriggers._executeAppliedEffects(actor, hook);
  }

  /**
   * On turn start, turn end, each turn, combat start.
   * @param {Combat} combat     The combat updated.
   * @param {object} update     The update performed.
   * @param {object} options    The update options.
   */
  static async updateCombat(combat, update, options) {

    const {turnForward, roundForward, combatStarted} = CombatTriggers._determineCombatState(combat, update, options);
    const undefeated = combat.combatants.filter(c => !c.isDefeated);

    if (turnForward) {
      // Retrieve combatants.
      const previousId = foundry.utils.getProperty(options, `${MODULE}.previousCombatant`);
      const previousCombatant = !combatStarted ? combat.combatants.get(previousId) : null;

      // Execute turn start and turn end triggers.
      CombatTriggers._executeAppliedEffects(combat.combatant?.actor, "onTurnStart");
      CombatTriggers._executeAppliedEffects(previousCombatant?.actor, "onTurnEnd");

      // Execute all 'each turn' triggers.
      for (const c of undefeated) CombatTriggers._executeAppliedEffects(c.actor, "onEachTurn");
    }

    if (roundForward) {
      for (const c of undefeated) {
        if (!combatStarted) CombatTriggers._executeAppliedEffects(c.actor, "onRoundEnd")
        CombatTriggers._executeAppliedEffects(c.actor, "onRoundStart")
      }
    }

    // Determine whether we have started a combat.
    if (combatStarted) for (const c of undefeated) CombatTriggers._executeAppliedEffects(c.actor, "onCombatStart");
  }

  /**
   * On combat ending (being deleted).
   * @param {Combat} combat     The combat deleted.
   */
  static async deleteCombat(combat) {
    if (!combat.started || !combat.isActive) return;
    for (const c of combat.combatants) if (!c.isDefeated) CombatTriggers._executeAppliedEffects(c.actor, "onCombatEnd");
  }
}
