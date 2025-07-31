import { TRIGGERS } from '../../triggers.mjs'

export default function init() {
  DND5ETriggers.init();
}

export class DND5ETriggers {
  /**
   * Initialize the submodule.
   */
  static init() {
    if (game.system.id !== "dnd5e") return;

    // Inject our triggers into existing categories
    const effectTriggers = TRIGGERS.find(t => t.label === "EFFECTMACRO.EffectTriggers");
    const combatantTriggers = TRIGGERS.find(t => t.label === "EFFECTMACRO.CombatantTriggers");

    effectTriggers.options.push(
      "dnd5e.applyDamage",
      "dnd5e.shortRest",
      "dnd5e.longRest",
      "dnd5e.beginConcentrating",
      "dnd5e.endConcentration",
      "dnd5e.rollHitDie"
    );

    combatantTriggers.options.push(
      "dnd5e.rollAttack",
      "dnd5e.rollDamage",
      "dnd5e.rollInitiative"
    );

    // Add new section for roll-based triggers
    TRIGGERS.push({
      label: "EFFECTMACRO.RollTriggers",
      options: [
        "dnd5e.rollSavingThrow",
        "dnd5e.rollDeathSave",
        "dnd5e.rollAbilityCheck",
        "dnd5e.rollSkill",
        "dnd5e.rollToolCheck",
        "dnd5e.rollConcentration"
      ]
    });

    Hooks.on("dnd5e.rollAttack", DND5ETriggers._rollAttack);
    Hooks.on("dnd5e.rollDamage", DND5ETriggers._rollDamage);
    Hooks.on("dnd5e.rollSavingThrow", DND5ETriggers._rollSavingThrow);
    Hooks.on("dnd5e.rollDeathSave", DND5ETriggers._rollDeathSave);
    Hooks.on("dnd5e.rollAbilityCheck", DND5ETriggers._rollAbilityCheck);
    Hooks.on("dnd5e.rollSkill", DND5ETriggers._rollSkill);
    Hooks.on("dnd5e.rollToolCheck", DND5ETriggers._rollToolCheck);
    Hooks.on("dnd5e.rollInitiative", DND5ETriggers._rollInitiative);
    Hooks.on("dnd5e.rollConcentration", DND5ETriggers._rollConcentration);
    Hooks.on("dnd5e.rollHitDie", DND5ETriggers._rollHitDie);
    Hooks.on("dnd5e.restCompleted", DND5ETriggers._restCompleted);
    Hooks.on("dnd5e.applyDamage", DND5ETriggers._applyDamage);
    Hooks.on("dnd5e.beginConcentrating", DND5ETriggers._beginConcentrating);
    Hooks.on("dnd5e.endConcentration", DND5ETriggers._endConcentration);
  }

  /**
   * Utility method to filter and then call applicable effects with a trigger.
   */
  static async _filterAndCall(actor, hook, context) {
    if (!effectmacro.utils.isExecutor(actor)) return;
    for (const e of actor.appliedEffects.filter(e => effectmacro.utils.hasMacro(e, hook))) {
      await effectmacro.utils.callMacro(e, hook, context);
    }
  }

  /**
   * On attack roll.
   */
  static _rollAttack(rolls, data) {
    const actor = data.subject?.item?.actor;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollAttack", { rolls, data });
  }

  /**
   * On damage roll.
   */
  static _rollDamage(rolls, data) {
    const actor = data.subject?.item?.actor;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollDamage", { rolls, data });
  }

  /**
   * On saving throw.
   */
  static _rollSavingThrow(rolls, data) {
    const actor = data.subject;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollSavingThrow", { rolls, data });
  }

  /**
   * On death save.
   */
  static _rollDeathSave(rolls, data) {
    const actor = data.subject;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollDeathSave", { rolls, data });
  }

  /**
   * On ability check.
   */
  static _rollAbilityCheck(rolls, data) {
    const actor = data.subject;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollAbilityCheck", { rolls, data });
  }

  /**
   * On skill check.
   */
  static _rollSkill(rolls, data) {
    const actor = data.subject;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollSkill", { rolls, data });
  }

  /**
   * On tool check.
   */
  static _rollToolCheck(rolls, data) {
    const actor = data.subject;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollToolCheck", { rolls, data });
  }

  /**
   * On initiative roll.
   */
  static _rollInitiative(actor, combatants) {
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollInitiative", { combatants });
  }

  /**
   * On concentration roll.
   */
  static _rollConcentration(rolls, data) {
    const actor = data.subject;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollConcentration", { rolls, data });
  }

  /**
   * On hit die roll.
   */
  static _rollHitDie(rolls, data) {
    const actor = data.subject;
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.rollHitDie", { rolls, data });
  }

  /**
   * On rest completed.
   */
  static _restCompleted(actor, result, config) {
    const hook = config.type === "long" ? "dnd5e.longRest" : "dnd5e.shortRest";
    return DND5ETriggers._filterAndCall(actor, hook, { result, config });
  }

  /**
   * On damage applied (handles both damage and healing).
   */
  static _applyDamage(actor, amount, options) {
    return DND5ETriggers._filterAndCall(actor, "dnd5e.applyDamage", { amount, options });
  }

  /**
   * On begin concentrating.
   */
  static _beginConcentrating(actor, item, effect, activity) {
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.beginConcentrating", { item, effect, activity });
  }

  /**
   * On end concentration.
   */
  static _endConcentration(actor, effect) {
    if (!actor) return;
    return DND5ETriggers._filterAndCall(actor, "dnd5e.endConcentration", { effect });
  }
}