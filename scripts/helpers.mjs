import {MODULE, TRIGGERS} from "./constants.mjs";
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

/**
 * Inject the html elements into the macro config.
 */
export function registerMacroConfig() {
  if (game.settings.get(MODULE, "restrictPermissions") && !game.user.isGM) return;
  Hooks.on("renderActiveEffectConfig", async (config, html, data) => {
    const keys = TRIGGERS.agnostic.concat(TRIGGERS[game.system.id] ?? []);

    const templateData = keys.reduce((acc, key) => {
      const label = `EFFECTMACRO.${key}`;
      if (config.document.hasMacro(key)) acc.used.push({key, label});
      else acc.unused.push({key, label});
      return acc;
    }, {used: [], unused: []});
    const div = document.createElement("DIV");
    const template = "modules/effectmacro/templates/effect-sheet.hbs";
    div.innerHTML = await renderTemplate(template, templateData);
    div.querySelector("[data-action='macro-add']").addEventListener("click", _onClickMacroAdd.bind(config));
    div.querySelectorAll("[data-action='macro-edit']").forEach(n => n.addEventListener("click", _onClickMacroEdit.bind(config)));
    div.querySelectorAll("[data-action='macro-delete']").forEach(n => n.addEventListener("click", _onClickMacroDelete.bind(config)));
    html[0].querySelector("section[data-tab='details']").appendChild(div.firstElementChild);
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

export function _effectMacroConfigId(object, type) {
  return `${MODULE}-${type}-${object.uuid.replaceAll(".", "-")}`;
}
