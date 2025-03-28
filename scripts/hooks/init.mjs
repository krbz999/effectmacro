export default function() {
  game.settings.register(effectmacro.id, "restrictPermissions", {
    name: "EFFECTMACRO.SettingRestrictPermission",
    hint: "EFFECTMACRO.SettingRestrictPermissionHint",
    scope: "world",
    config: true,
    type: new foundry.data.fields.BooleanField(),
    requiresReload: true,
  });
}
