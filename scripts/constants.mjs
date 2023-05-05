export const MODULE = "effectmacro";
export const TRIGGERS = {
  agnostic: [
    "onCreate",
    "onDelete",
    "onToggle",
    "onEnable",
    "onDisable",
    "onTurnStart",
    "onTurnEnd",
    "onEachTurn",
    "onCombatStart",
    "onCombatEnd",
    "onCombatantDefeated",
    "never"
  ],
  dnd5e: [
    "dnd5e.rollAttack",
    "dnd5e.rollDamage",
    "dnd5e.rollAbilitySave",
    "dnd5e.rollDeathSave",
    "dnd5e.rollAbilityTest",
    "dnd5e.rollSkill",
    "dnd5e.rollToolCheck",
    "dnd5e.shortRest",
    "dnd5e.longRest"
  ]
};
