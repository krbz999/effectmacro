export class SystemDND5E {
  static init() {
    Hooks.on("dnd5e.restCompleted", SystemDND5E.restCompleted.bind("dnd5e.restCompleted"));
    Hooks.on("dnd5e.rollAbilitySave", SystemDND5E.rollAbilitySave.bind("dnd5e.rollAbilitySave"));
    Hooks.on("dnd5e.rollAbilityTest", SystemDND5E.rollAbilityTest.bind("dnd5e.rollAbilityTest"));
    Hooks.on("dnd5e.rollAttack", SystemDND5E.rollAttack.bind("dnd5e.rollAttack"));
    Hooks.on("dnd5e.rollDamage", SystemDND5E.rollDamage.bind("dnd5e.rollDamage"));
    Hooks.on("dnd5e.rollDeathSave", SystemDND5E.rollDeathSave.bind("dnd5e.rollDeathSave"));
    Hooks.on("dnd5e.rollSkill", SystemDND5E.rollSkill.bind("dnd5e.rollSkill"));
    Hooks.on("dnd5e.rollToolCheck", SystemDND5E.rollToolCheck.bind("dnd5e.rollToolCheck"));
  }

  static async _filterAndCall(actor, hook, context) {
    const effects = actor.effects.filter(e => e.hasMacro(hook) && e.modifiesActor);
    for (const e of effects) await e.callMacro(hook, context);
  }

  static rollAttack(item, roll, ammoUpdate) {
    return SystemDND5E._filterAndCall(item.actor, this, {item, roll, ammoUpdate});
  }

  static rollAbilitySave(actor, roll, abilityId) {
    return SystemDND5E._filterAndCall(actor, this, {roll, abilityId});
  }

  static rollDeathSave(actor, roll, updates) {
    return SystemDND5E._filterAndCall(actor, this, {roll, updates});
  }

  static rollAbilityTest(actor, roll, abilityId) {
    return SystemDND5E._filterAndCall(actor, this, {roll, abilityId});
  }

  static rollSkill(actor, roll, skillId) {
    return SystemDND5E._filterAndCall(actor, this, {roll, skillId});
  }

  static rollDamage(item, roll) {
    return SystemDND5E._filterAndCall(item.actor, this, {item, roll});
  }

  static rollToolCheck(actor, roll, toolId) {
    return SystemDND5E._filterAndCall(actor, this, {roll, toolId});
  }

  static restCompleted(actor, data) {
    return SystemDND5E._filterAndCall(actor, data.longRest ? "dnd5e.longRest" : "dnd5e.shortRest", {data});
  }
}
