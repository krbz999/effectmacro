import { EffectMethods, callMacro, hasMacro } from "../../effectMethods.mjs";

export class SystemDND5E {
  /* Initialize the submodule. */
  static init() {
    if (game.system.id !== "dnd5e") return;
    Hooks.on("dnd5e.restCompleted", SystemDND5E.restCompleted.bind("dnd5e.restCompleted"));
    Hooks.on("dnd5e.rollAbilitySave", SystemDND5E.rollAbilitySave.bind("dnd5e.rollAbilitySave"));
    Hooks.on("dnd5e.rollAbilityTest", SystemDND5E.rollAbilityTest.bind("dnd5e.rollAbilityTest"));
    Hooks.on("dnd5e.rollAttack", SystemDND5E.rollAttack.bind("dnd5e.rollAttack"));
    Hooks.on("dnd5e.rollDamage", SystemDND5E.rollDamage.bind("dnd5e.rollDamage"));
    Hooks.on("dnd5e.rollDeathSave", SystemDND5E.rollDeathSave.bind("dnd5e.rollDeathSave"));
    Hooks.on("dnd5e.rollSkill", SystemDND5E.rollSkill.bind("dnd5e.rollSkill"));
    Hooks.on("dnd5e.rollToolCheck", SystemDND5E.rollToolCheck.bind("dnd5e.rollToolCheck"));
    Hooks.on("dnd5e.healActor", SystemDND5E.healActor.bind("dnd5e.healActor"));
    Hooks.on("dnd5e.damageActor", SystemDND5E.damageActor.bind("dnd5e.damageActor"));
  }

  /**
   * Utility method to filter and then call applicable effects with a trigger.
   * @param {Actor5e} actor       The actor with the effects.
   * @param {string} hook         The trigger.
   * @param {object} context      Parameters to pass the macro.
   */
  static async _filterAndCall(actor, hook, context) {
    if (!EffectMethods.isExecutor(actor)) return;
    for (const e of actor.appliedEffects.filter(e => hasMacro.call(e, hook))) {
      await callMacro(e, hook, context);
    }
  }

  static rollAttack(item, roll, ammoUpdate) {
    if (!item) return;
    return SystemDND5E._filterAndCall(item.actor, this, { item, roll, ammoUpdate });
  }

  static rollAbilitySave(actor, roll, abilityId) {
    return SystemDND5E._filterAndCall(actor, this, { roll, abilityId });
  }

  static rollDeathSave(actor, roll, updates) {
    return SystemDND5E._filterAndCall(actor, this, { roll, updates });
  }

  static rollAbilityTest(actor, roll, abilityId) {
    return SystemDND5E._filterAndCall(actor, this, { roll, abilityId });
  }

  static rollSkill(actor, roll, skillId) {
    return SystemDND5E._filterAndCall(actor, this, { roll, skillId });
  }

  static rollDamage(item, roll) {
    if (!item) return;
    return SystemDND5E._filterAndCall(item.actor, this, { item, roll });
  }

  static rollToolCheck(actor, roll, toolId) {
    return SystemDND5E._filterAndCall(actor, this, { roll, toolId });
  }

  static restCompleted(actor, data) {
    return SystemDND5E._filterAndCall(actor, data.longRest ? "dnd5e.longRest" : "dnd5e.shortRest", { data });
  }

  static healActor(actor, changes, update, userId) {
    return SystemDND5E._filterAndCall(actor, this, { changes, update, userId });
  }

  static damageActor(actor, changes, update, userId) {
    return SystemDND5E._filterAndCall(actor, this, { changes, update, userId });
  }
}
