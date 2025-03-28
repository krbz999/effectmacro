export default function setup() {
  if (game.system.id !== "dnd5e") return;
  Hooks.on("dnd5e.restCompleted", restCompleted.bind("dnd5e.restCompleted"));
  Hooks.on("dnd5e.rollAbilitySave", rollAbilitySave.bind("dnd5e.rollAbilitySave"));
  Hooks.on("dnd5e.rollAbilityTest", rollAbilityTest.bind("dnd5e.rollAbilityTest"));
  Hooks.on("dnd5e.rollAttack", rollAttack.bind("dnd5e.rollAttack"));
  Hooks.on("dnd5e.rollDamage", rollDamage.bind("dnd5e.rollDamage"));
  Hooks.on("dnd5e.rollDeathSave", rollDeathSave.bind("dnd5e.rollDeathSave"));
  Hooks.on("dnd5e.rollSkill", rollSkill.bind("dnd5e.rollSkill"));
  Hooks.on("dnd5e.rollToolCheck", rollToolCheck.bind("dnd5e.rollToolCheck"));
  Hooks.on("dnd5e.healActor", healActor.bind("dnd5e.healActor"));
  Hooks.on("dnd5e.damageActor", damageActor.bind("dnd5e.damageActor"));
}

/* -------------------------------------------------- */

/**
 * Utility method to filter and then call applicable effects with a trigger.
 * @param {Actor5e} actor       The actor with the effects.
 * @param {string} hook         The trigger.
 * @param {object} context      Parameters to pass the macro.
 */
async function _filterAndCall(actor, hook, context) {
  const u = effectmacro.utils;
  if (!u.isExecutor(actor)) return;
  for (const e of actor.appliedEffects.filter(e => u.hasMacro(e, hook))) {
    await u.callMacro(e, hook, context);
  }
}

/* -------------------------------------------------- */

function rollAttack(item, roll, ammoUpdate) {
  if (!item) return;
  return _filterAndCall(item.actor, this, { item, roll, ammoUpdate });
}

/* -------------------------------------------------- */

function rollAbilitySave(actor, roll, abilityId) {
  return _filterAndCall(actor, this, { roll, abilityId });
}

/* -------------------------------------------------- */

function rollDeathSave(actor, roll, updates) {
  return _filterAndCall(actor, this, { roll, updates });
}

/* -------------------------------------------------- */

function rollAbilityTest(actor, roll, abilityId) {
  return _filterAndCall(actor, this, { roll, abilityId });
}

/* -------------------------------------------------- */

function rollSkill(actor, roll, skillId) {
  return _filterAndCall(actor, this, { roll, skillId });
}

/* -------------------------------------------------- */

function rollDamage(item, roll) {
  if (!item) return;
  return _filterAndCall(item.actor, this, { item, roll });
}

/* -------------------------------------------------- */

function rollToolCheck(actor, roll, toolId) {
  return _filterAndCall(actor, this, { roll, toolId });
}

/* -------------------------------------------------- */

function restCompleted(actor, data) {
  return _filterAndCall(actor, data.longRest ? "dnd5e.longRest" : "dnd5e.shortRest", { data });
}

/* -------------------------------------------------- */

function healActor(actor, changes, update, userId) {
  return _filterAndCall(actor, this, { changes, update, userId });
}

/* -------------------------------------------------- */

function damageActor(actor, changes, update, userId) {
  return _filterAndCall(actor, this, { changes, update, userId });
}
