import {registerCombatTriggers} from "./scripts/triggers/combat.mjs";
import {onEffectToggled} from "./scripts/triggers/onToggle.mjs";
import {onEffectCreated} from "./scripts/triggers/onCreate.mjs";
import {onEffectDeleted} from "./scripts/triggers/onDelete.mjs";
import {dnd5eTriggers} from "./scripts/triggers/systems/dnd5e.mjs";
import {registerSettings} from "./scripts/settings.mjs";
import {EffectConfigHandler} from "./scripts/macroConfig.mjs";
import {EffectMethods} from "./scripts/effectMethods.mjs";

// set up prototype functions.
Hooks.once("setup", EffectMethods._appendMethods);

// init msg.
Hooks.once("init", () => {
  registerSettings();
  Hooks.once("ready", EffectConfigHandler.registerMacroConfig);
  registerCombatTriggers();
  onEffectToggled();
  onEffectCreated();
  onEffectDeleted();
  if (game.system.id === "dnd5e") dnd5eTriggers();
});
