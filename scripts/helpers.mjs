import {MODULE, TRIGGERS, TRIGGERS_DND5E} from "./constants.mjs";
import {EffectMacroConfig} from "./macroConfig.mjs";

/**
 * Get whether you, the user, should run the scripts on this actor.
 * @param {Actor} actor     The actor who has the effects.
 * @returns {boolean}       Whether you are the proper user to execute the scripts.
 */
export function should_I_run_this(actor) {
  if (!actor) return false;

  // find a non-GM who is active and owner of the actor.
  let user = game.users.find(i => !i.isGM && i.active && actor.testUserPermission(i, "OWNER"));
  if (user) return user === game.user;

  // find a GM who is active.
  user = game.users.find(i => i.isGM && i.active);
  return user === game.user;
}

export function registerMacroConfig() {
  if (game.settings.get(MODULE, "restrictPermissions") && !game.user.isGM) return;
  // slap button onto effect config.
  Hooks.on("renderActiveEffectConfig", async (config, html, data) => {
    const appendWithin = html[0].querySelector("section[data-tab=details]");

    // set up config[MODULE] and the array for the template.
    const usedOptions = setUsedOptions(config).map(key => ({key, label: `EFFECTMACRO.${key}`}));
    const remainingOptions = getRemainingOptions(config).reduce((acc, key) => {
      const label = game.i18n.localize(`EFFECTMACRO.${key}`);
      return acc + `<option value="${key}">${label}</option>`;
    }, "");

    const div = document.createElement("DIV");
    const template = "modules/effectmacro/templates/effect-sheet.hbs";

    div.innerHTML = await renderTemplate(template, {remainingOptions, usedOptions});
    appendWithin.appendChild(div.firstElementChild);

    html[0].querySelector("[data-action='macro-add']").addEventListener("click", _onClickMacroAdd.bind(config));
    html[0].querySelectorAll("[data-action='macro-edit']").forEach(n => n.addEventListener("click", _onClickMacroEdit.bind(config)));
    html[0].querySelectorAll("[data-action='macro-delete']").forEach(n => n.addEventListener("click", _onClickMacroDelete.bind(config)));
    config.setPosition({height: "auto"});
  });
}

/**
 * Handle clicking the 'delete macro' buttons.
 * @param {PointerEvent} event      The initiating click event.
 * @returns {ActiveEffect}          The effect having a flag removed.
 */
async function _onClickMacroDelete(event) {
  const key = event.currentTarget.dataset.key;
  await this.submit({preventClose: true});
  return this.document.removeMacro(key);
}

/**
 * Handle clicking the 'edit macro' buttons.
 * @param {PointerEvent} event      The initiating click event.
 * @returns {EffectMacroConfig}     The rendered effect macro editor.
 */
function _onClickMacroEdit(event) {
  const key = event.currentTarget.dataset.key;
  const existingApp = Object.values(this.document.apps).find(app => {
    return app.id === _effectMacroConfigId(this.document, key);
  });
  if (existingApp) return existingApp.render(true);
  else return new EffectMacroConfig(this.document, {type: key}).render(true);
}

/**
 * Handle clicking the 'add macro' button.
 * @param {PointerEvent} event      The initiating click event.
 * @returns {EffectMacroConfig}     The rendered effect macro editor.
 */
function _onClickMacroAdd(event) {
  const key = event.currentTarget.closest(".form-fields").querySelector(".unused-option").value;
  const existingApp = Object.values(this.document.apps).find(app => {
    return app.id === _effectMacroConfigId(this.document, key);
  });
  if (existingApp) return existingApp.render(true);
  else return new EffectMacroConfig(this.document, {type: key}).render(true);
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
