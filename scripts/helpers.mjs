import { MODULE, TRIGGERS, TRIGGERS_DND5E } from "./constants.mjs";
import { EffectMacroConfig } from "./macroConfig.mjs";

// return true or false if you, the user, should run the scripts on this actor.
export function should_I_run_this(actor) {
  if (!actor) return false;
  let user;
  const { OWNER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;

  // find a non-GM who is active and owner of the actor.
  user = game.users.find(i => {
    const a = !i.isGM;
    const b = i.active;
    const c = actor.testUserPermission(i, OWNER);
    return a && b && c;
  });
  if (user) return user === game.user;

  // find a GM who is active.
  user = game.users.find(i => {
    const a = i.isGM;
    const b = i.active;
    return a && b;
  });
  return user === game.user;
}

export function registerMacroConfig() {
  if (game.settings.get(MODULE, "restrictPermissions") && !game.user.isGM) return;
  // slap button onto effect config.
  Hooks.on("renderActiveEffectConfig", async (config, html, data) => {
    const appendWithin = html[0].querySelector("section[data-tab=details]");

    // set up config[MODULE] and the array for the template.
    const usedOptions = setUsedOptions(config).map(key => {
      const label = `EFFECTMACRO.${key}`;
      return { key, label };
    });
    const remainingOptions = getRemainingOptions(config).reduce((acc, key) => {
      const label = game.i18n.localize(`EFFECTMACRO.${key}`);
      return acc + `<option value="${key}">${label}</option>`;
    }, "");

    const hr = document.createElement("HR");
    const div = document.createElement("DIV");
    const template = "modules/effectmacro/templates/effect-sheet.hbs";

    div.innerHTML = await renderTemplate(template, { remainingOptions, usedOptions });
    appendWithin.appendChild(hr);
    appendWithin.appendChild(div.firstChild);

    html[0].addEventListener("click", async (event) => {
      const unusedButton = event.target.closest("[data-action='macro-add']");
      const usedButton = event.target.closest("[data-action='macro-edit']");
      const deleteButton = event.target.closest("[data-action='macro-delete']");
      let key;
      if (unusedButton) {
        key = html[0].querySelector(".unused-option").value;
      } else if (usedButton) {
        key = usedButton.dataset.key;
      } else if (deleteButton) {
        key = deleteButton.dataset.key;
        await config.submit({ preventClose: true });
        return config.document.removeMacro(key);
      } else return;

      const [_, emConfig] = Object.entries(config.document.apps).find(([appId, app]) => {
        return app.id === _effectMacroConfigId(config.document, key);
      }) ?? [];
      if (emConfig) emConfig.render(true);
      else new EffectMacroConfig(config.document, { type: key }).render(true);
    });
    config.setPosition({ height: "auto" });
  });
}

function getRemainingOptions(config) {
  return _getTriggers().filter(key => {
    return !config[MODULE].includes(key);
  });
}

function setUsedOptions(config) {
  const current = new Set(config[MODULE] ?? []);
  for (const key of _getTriggers()) {
    if (!config.object.hasMacro(key)) {
      current.delete(key);
    } else current.add(key);
  }

  config[MODULE] = Array.from(current);
  return config[MODULE];
}

function _getTriggers() {
  if (game.system.id === "dnd5e") {
    return TRIGGERS.concat(TRIGGERS_DND5E);
  }
  return TRIGGERS;
}

export function _effectMacroConfigId(object, type) {
  return `${MODULE}-${type}-${object.uuid.replaceAll(".", "-")}`;
}
