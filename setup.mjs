import {CombatTriggers} from "./scripts/triggers/combat.mjs";
import {SystemDND5E} from "./scripts/triggers/systems/dnd5e.mjs";
import {EffectMacro} from "./scripts/module.mjs";
import {EffectConfigHandler} from "./scripts/macroConfig.mjs";
import {EffectMethods} from "./scripts/effectMethods.mjs";
import {EffectTriggers} from "./scripts/triggers/effect.mjs";

Hooks.once("init", EffectMacro.init);
Hooks.once("init", EffectMethods._appendMethods);
Hooks.once("init", EffectTriggers.init);
Hooks.once("init", CombatTriggers.init);
Hooks.once("init", EffectConfigHandler.registerMacroConfig);
Hooks.once("init", SystemDND5E.init);
