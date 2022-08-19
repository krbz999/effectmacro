import { API } from "./scripts/main.mjs";
import { registerMacroConfig } from "./scripts/macroConfig.mjs";
import { registerCombatTriggers } from "./scripts/triggers/combat.mjs";
import { registerEffectTriggers } from "./scripts/triggers/effect.mjs";

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
    console.log(`ZHELL | Initializing Effect Macro`);

	registerMacroConfig();
	registerCombatTriggers();
	registerEffectTriggers();
});

