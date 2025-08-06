import { TRIGGERS } from '../../triggers.mjs';

export default function init() {
  if (game.system.id !== 'dnd5e') return;

  // Add D&D 5e system triggers
  TRIGGERS.push({
    label: 'EFFECTMACRO.SystemTriggers',
    options: [
      'dnd5e.rollAttack',
      'dnd5e.rollDamage',
      'dnd5e.rollSavingThrow',
      'dnd5e.rollDeathSave',
      'dnd5e.rollAbilityCheck',
      'dnd5e.rollSkill',
      'dnd5e.rollToolCheck',
      'dnd5e.rollInitiative',
      'dnd5e.rollConcentration',
      'dnd5e.rollHitDie',
      'dnd5e.shortRest',
      'dnd5e.longRest',
      'dnd5e.healActor',
      'dnd5e.damageActor',
      'dnd5e.beginConcentrating',
      'dnd5e.endConcentration'
    ]
  });

  Hooks.on('dnd5e.rollAttack', rollAttack);
  Hooks.on('dnd5e.rollDamage', rollDamage);
  Hooks.on('dnd5e.rollSavingThrow', rollSavingThrow);
  Hooks.on('dnd5e.rollDeathSave', rollDeathSave);
  Hooks.on('dnd5e.rollAbilityCheck', rollAbilityCheck);
  Hooks.on('dnd5e.rollSkill', rollSkill);
  Hooks.on('dnd5e.rollToolCheck', rollToolCheck);
  Hooks.on('dnd5e.rollInitiative', rollInitiative);
  Hooks.on('dnd5e.rollConcentration', rollConcentration);
  Hooks.on('dnd5e.rollHitDie', rollHitDie);
  Hooks.on('dnd5e.restCompleted', restCompleted);
  Hooks.on('dnd5e.healActor', healActor);
  Hooks.on('dnd5e.damageActor', damageActor);
  Hooks.on('dnd5e.beginConcentrating', beginConcentrating);
  Hooks.on('dnd5e.endConcentration', endConcentration);
}

/* -------------------------------------------------- */

/**
 * Execute all effects that affect an actor and contain this trigger.
 * This method is called on all clients, but filters out those not to execute it.
 * @param {Actor} actor     The actor with the effects.
 * @param {string} hook     The trigger name.
 * @param {object} context  Additional context to pass to the macro.
 */
async function _executeAppliedEffects(actor, hook, context = {}) {
  if (!effectmacro.utils.isExecutor(actor)) return;

  for (const e of actor.appliedEffects.filter(e => effectmacro.utils.hasMacro(e, hook)))
    await effectmacro.utils.callMacro(e, hook, context);
}

/* -------------------------------------------------- */

/**
 * On attack roll.
 * @param {Roll[]} rolls    The attack rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollAttack(rolls, data) {
  const actor = data.subject?.item?.actor;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollAttack', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On damage roll.
 * @param {Roll[]} rolls    The damage rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollDamage(rolls, data) {
  const actor = data.subject?.item?.actor;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollDamage', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On saving throw.
 * @param {Roll[]} rolls    The saving throw rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollSavingThrow(rolls, data) {
  const actor = data.subject;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollSavingThrow', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On death saving throw.
 * @param {Roll[]} rolls    The death saving throw rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollDeathSave(rolls, data) {
  const actor = data.subject;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollDeathSave', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On ability check.
 * @param {Roll[]} rolls    The ability check rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollAbilityCheck(rolls, data) {
  const actor = data.subject;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollAbilityCheck', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On skill check.
 * @param {Roll[]} rolls    The skill check rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollSkill(rolls, data) {
  const actor = data.subject;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollSkill', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On tool check.
 * @param {Roll[]} rolls    The tool check rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollToolCheck(rolls, data) {
  const actor = data.subject;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollToolCheck', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On initiative roll.
 * @param {Actor} actor         The actor rolling initiative.
 * @param {Combatant[]} combatants  The combatants being updated.
 */
async function rollInitiative(actor, combatants) {
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollInitiative', { combatants });
}

/* -------------------------------------------------- */

/**
 * On concentration saving throw.
 * @param {Roll[]} rolls    The concentration saving throw rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollConcentration(rolls, data) {
  const actor = data.subject;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollConcentration', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On hit die roll.
 * @param {Roll[]} rolls    The hit die rolls.
 * @param {object} data     Roll configuration data.
 */
async function rollHitDie(rolls, data) {
  const actor = data.subject;
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.rollHitDie', { rolls, data });
}

/* -------------------------------------------------- */

/**
 * On rest completed.
 * @param {Actor} actor     The actor completing the rest.
 * @param {object} result   The rest result data.
 * @param {object} config   The rest configuration.
 */
async function restCompleted(actor, result, config) {
  const hook = config.type === 'long' ? 'dnd5e.longRest' : 'dnd5e.shortRest';
  return _executeAppliedEffects(actor, hook, { result, config });
}

/* -------------------------------------------------- */

/**
 * On actor healed.
 * @param {Actor} actor         The actor being healed.
 * @param {number} amount       The amount healed.
 * @param {object} updates      The actor updates.
 */
async function healActor(actor, amount, updates) {
  return _executeAppliedEffects(actor, 'dnd5e.healActor', { amount, updates });
}

/* -------------------------------------------------- */

/**
 * On actor damaged.
 * @param {Actor} actor         The actor taking damage.
 * @param {number} amount       The amount of damage.
 * @param {object} updates      The actor updates.
 */
async function damageActor(actor, amount, updates) {
  return _executeAppliedEffects(actor, 'dnd5e.damageActor', { amount, updates });
}

/* -------------------------------------------------- */

/**
 * On concentration beginning.
 * @param {Actor} actor         The actor beginning concentration.
 * @param {Item} item           The item requiring concentration.
 * @param {ActiveEffect} effect The concentration effect.
 * @param {Activity} activity   The activity being performed.
 */
async function beginConcentrating(actor, item, effect, activity) {
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.beginConcentrating', { item, effect, activity });
}

/* -------------------------------------------------- */

/**
 * On concentration ending.
 * @param {Actor} actor         The actor ending concentration.
 * @param {ActiveEffect} effect The concentration effect ending.
 */
async function endConcentration(actor, effect) {
  if (!actor) return;
  return _executeAppliedEffects(actor, 'dnd5e.endConcentration', { effect });
}
