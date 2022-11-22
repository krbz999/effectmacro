import { API } from "./scripts/api.mjs";
import { registerMacroConfig } from "./scripts/helpers.mjs";
import { registerCombatTriggers } from "./scripts/triggers/combat.mjs";
import { onEffectToggled } from "./scripts/triggers/onToggle.mjs";
import { onEffectCreated } from "./scripts/triggers/onCreate.mjs";
import { onEffectDeleted } from "./scripts/triggers/onDelete.mjs";
import { dnd5eTriggers } from "./scripts/triggers/systems/dnd5e.mjs";

// set up prototype functions.
Hooks.once("setup", () => {
  ActiveEffect.prototype.callMacro = API.callMacro;
  ActiveEffect.prototype.removeMacro = API.removeMacro;
  ActiveEffect.prototype.createMacro = API.createMacro;
  ActiveEffect.prototype.updateMacro = API.updateMacro;
  ActiveEffect.prototype.hasMacro = API.hasMacro;
});

// init msg.
Hooks.once("init", () => {
  console.log("ZHELL | Initializing Effect Macro");

  registerMacroConfig();
  registerCombatTriggers();
  onEffectToggled();
  onEffectCreated();
  onEffectDeleted();
  if (game.system.id === "dnd5e") dnd5eTriggers();
});
