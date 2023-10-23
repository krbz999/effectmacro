export class EffectMacro {
  static MODULE = "effectmacro";

  /* Initialize module. */
  static init() {
    EffectMacro.registerSettings();
  }

  /**
   * Register the module settings.
   */
  static registerSettings() {
    game.settings.register(EffectMacro.MODULE, "restrictPermissions", {
      name: "EFFECTMACRO.SettingRestrictPermission",
      hint: "EFFECTMACRO.SettingRestrictPermissionHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      requiresReload: true
    });
  }
}
