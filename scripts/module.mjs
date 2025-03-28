import { callMacro } from "./effectMethods.mjs";
import { EffectConfigHandler } from "./macroConfig.mjs";
import { CombatTriggers } from "./triggers/combat.mjs";
import { EffectTriggers } from "./triggers/effect.mjs";
import { SystemDND5E } from "./triggers/systems/dnd5e.mjs";

class EffectMacro {
  /**
   * Package id.
   * @type {string}
   */
  static MODULE = "effectmacro";

  /* -------------------------------------------------- */

  /**
   * Initialize module.
   */
  static init() {
    EffectMacro.registerSettings();

    game.modules.get(EffectMacro.MODULE).api = {
      callMacro: callMacro,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Register the module settings.
   */
  static registerSettings() {
    game.settings.register(EffectMacro.MODULE, "restrictPermissions", {
      name: "EFFECTMACRO.SettingRestrictPermission",
      hint: "EFFECTMACRO.SettingRestrictPermissionHint",
      scope: "world",
      config: true,
      type: new foundry.data.fields.BooleanField(),
      requiresReload: true,
    });
  }
}

Hooks.once("init", EffectMacro.init);
Hooks.once("init", EffectTriggers.init);
Hooks.once("init", CombatTriggers.init);
Hooks.once("init", EffectConfigHandler.registerMacroConfig);
Hooks.once("init", SystemDND5E.init);
