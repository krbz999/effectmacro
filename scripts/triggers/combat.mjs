export default function init() {
  Hooks.on("preUpdateCombat", preUpdateCombat);
  Hooks.on("updateCombatant", updateCombatant);
  Hooks.on("updateCombat", updateCombat);
  Hooks.on("deleteCombat", deleteCombat);
}

/* -------------------------------------------------- */

/**
 * Execute all effects that affect an actor and contain this trigger.
 * This method is called on all clients, but filters out those not to execute it.
 * @param {Actor} actor     The actor with the effects.
 * @param {string} hook     The trigger name.
 */
async function _executeAppliedEffects(actor, hook) {
  if (!effectmacro.utils.isExecutor(actor)) return;

  for (const e of actor.appliedEffects.filter(e => effectmacro.utils.hasMacro(e, hook)))
    await effectmacro.utils.callMacro(e, hook);
}

/* -------------------------------------------------- */

/**
 * Determine whether a combat was started and whether it moved forward in turns or rounds.
 * @param {Combat} combat     The combat updated.
 * @param {object} update     The update performed.
 * @param {object} options    The update options.
 * @returns {object<boolean:turnForward, boolean:roundForward, boolean:combatStarted>}
 */
function _determineCombatState(combat, update, options) {
  let turnForward = true;
  let roundForward = true;
  let combatStarted = true;

  const cTurn = combat.current.turn;
  const pTurn = foundry.utils.getProperty(options, `${effectmacro.id}.previousTR.T`);
  const cRound = combat.current.round;
  const pRound = foundry.utils.getProperty(options, `${effectmacro.id}.previousTR.R`);

  // No change in turns or rounds, not started combat, or went backwards.
  if ((update.turn === undefined) && (update.round === undefined)) turnForward = false;
  if (!combat.started || !combat.isActive) turnForward = false;
  if ((cRound < pRound) || ((cTurn < pTurn) && (cRound === pRound))) turnForward = false;

  roundForward = turnForward && (cRound > pRound);
  combatStarted = combat.started && !foundry.utils.getProperty(options, `${effectmacro.id}.started`);

  return { turnForward, roundForward, combatStarted };
}

/* -------------------------------------------------- */

/**
 * Save data on updated combats.
 * @param {Combat} combat     The combat updated.
 * @param {object} update     The update performed.
 * @param {object} options    The update options.
 */
function preUpdateCombat(combat, update, options) {
  const previousId = combat.combatant?.id;
  const path = `${effectmacro.id}.previousCombatant`;
  foundry.utils.setProperty(options, path, previousId);

  const prevPath = `${effectmacro.id}.previousTR`;
  const prevTR = { T: combat.turn, R: combat.round };
  foundry.utils.setProperty(options, prevPath, prevTR);

  const startedPath = `${effectmacro.id}.started`;
  const prevStarted = combat.started;
  foundry.utils.setProperty(options, startedPath, prevStarted);
}

/* -------------------------------------------------- */

/**
 * On combatant defeated.
 * @param {Combatant} combatant     The combatant updated.
 * @param {object} update           The update performed.
 */
async function updateCombatant(combatant, update) {
  if (!update.defeated) return;
  const actor = combatant.actor;
  const hook = "onCombatantDefeated";
  await _executeAppliedEffects(actor, hook);
}

/* -------------------------------------------------- */

/**
 * On turn start, turn end, each turn, combat start.
 * @param {Combat} combat     The combat updated.
 * @param {object} update     The update performed.
 * @param {object} options    The update options.
 */
async function updateCombat(combat, update, options) {
  const { turnForward, roundForward, combatStarted } = _determineCombatState(combat, update, options);
  const undefeated = combat.combatants.filter(c => !c.isDefeated);

  if (turnForward) {
    // Retrieve combatants.
    const previousId = foundry.utils.getProperty(options, `${effectmacro.id}.previousCombatant`);
    const previousCombatant = !combatStarted ? combat.combatants.get(previousId) : null;

    // Execute turn start and turn end triggers.
    await _executeAppliedEffects(combat.combatant?.actor, "onTurnStart");
    await _executeAppliedEffects(previousCombatant?.actor, "onTurnEnd");

    // Execute all 'each turn' triggers.
    for (const c of undefeated) await _executeAppliedEffects(c.actor, "onEachTurn");
  }

  if (roundForward) {
    for (const c of undefeated) {
      if (!combatStarted) await _executeAppliedEffects(c.actor, "onRoundEnd");
      await _executeAppliedEffects(c.actor, "onRoundStart");
    }
  }

  // Determine whether we have started a combat.
  if (combatStarted) for (const c of undefeated) await _executeAppliedEffects(c.actor, "onCombatStart");
}

/* -------------------------------------------------- */

/**
 * On combat ending (being deleted).
 * @param {Combat} combat     The combat deleted.
 */
async function deleteCombat(combat) {
  if (!combat.started || !combat.isActive) return;
  for (const c of combat.combatants) if (!c.isDefeated) await _executeAppliedEffects(c.actor, "onCombatEnd");
}
