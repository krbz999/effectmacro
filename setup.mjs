import {registerCombatTriggers} from "./scripts/triggers/combat.mjs";
import {SystemDND5E} from "./scripts/triggers/systems/dnd5e.mjs";
import {registerSettings} from "./scripts/settings.mjs";
import {EffectConfigHandler} from "./scripts/macroConfig.mjs";
import {EffectMethods} from "./scripts/effectMethods.mjs";
import {EffectTriggers} from "./scripts/triggers/effect.mjs";

// set up prototype functions.
Hooks.once("setup", EffectMethods._appendMethods);

// init msg.
Hooks.once("init", () => {
  registerSettings();
  Hooks.once("ready", EffectConfigHandler.registerMacroConfig);
  registerCombatTriggers();
  EffectTriggers.init();
  if (game.system.id === "dnd5e") SystemDND5E.init();
});
