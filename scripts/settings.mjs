import { MODULE } from "./constants.mjs";

export function registerSettings() {
  game.settings.register(MODULE, "restrictPermissions", {
    name: "EFFECTMACRO.SettingRestrictPermissionName",
    hint: "EFFECTMACRO.SettingRestrictPermissionHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });
}
