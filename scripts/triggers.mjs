export const TRIGGERS = [
  {
    options: ["never"],
  },
  {
    label: "EFFECTMACRO.EffectTriggers",
    options: [
      "onCreate",
      "onDelete",
      "onToggle",
      "onEnable",
      "onDisable",
    ],
  },
  {
    label: "EFFECTMACRO.CombatantTriggers",
    options: [
      "onTurnStart",
      "onTurnEnd",
      "onCombatantDefeated",
    ],
  },
  {
    label: "EFFECTMACRO.CombatTriggers",
    options: [
      "onEachTurn",
      "onRoundStart",
      "onRoundEnd",
      "onCombatStart",
      "onCombatEnd",
    ],
  },
];
