import { TRIGGERS } from "../triggers.mjs";

export default async function renderActiveEffectConfig(config, html, data) {
  if (game.settings.get(effectmacro.id, "restrictPermissions") && !game.user.isGM) return;

  const used = [];
  const options = [];

  for (const { label, options: opts } of TRIGGERS) {
    const group = label ? game.i18n.localize(label) : undefined;
    for (const w of opts) {
      const hasMacro = effectmacro.utils.hasMacro(config.document, w);
      const option = { group, value: w, label: game.i18n.localize(`EFFECTMACRO.${w}`) };
      if (hasMacro) used.push(option);
      else options.push(option);
    }
  }

  const div = document.createElement("DIV");
  const template = "modules/effectmacro/templates/effect-sheet.hbs";
  div.innerHTML = await foundry.applications.handlebars.renderTemplate(template, { used, options });

  div.querySelectorAll("[data-action]").forEach(n => {
    switch (n.dataset.action) {
      case "macro-add": n.addEventListener("click", _onClickMacroAdd.bind(config)); break;
      case "macro-edit": n.addEventListener("click", _onClickMacroEdit.bind(config)); break;
      case "macro-delete": n.addEventListener("click", _onClickMacroDelete.bind(config)); break;
    }
  });
  const tab = html.querySelector("section[data-tab='details']");
  tab.appendChild(div.firstElementChild);
}

/* -------------------------------------------------- */

/**
 * Handle clicking the 'delete macro' buttons.
 * @param {PointerEvent} event    The initiating click event.
 */
async function _onClickMacroDelete(event) {
  const key = event.currentTarget.dataset.key;

  const confirm = await foundry.applications.api.DialogV2.confirm({
    window: {
      title: "EFFECTMACRO.DeletePrompt",
      icon: "fa-solid fa-code",
    },
    rejectClose: false,
    modal: true,
  });
  if (!confirm) return;

  await this.submit({ preventClose: true });
  return effectmacro.utils.removeMacro(this.document, key);
}

/* -------------------------------------------------- */

/**
 * Handle clicking the 'edit macro' buttons.
 * @param {PointerEvent} event        The initiating click event.
 * @returns {Promise<MacroConfig>}    The rendered effect macro editor.
 */
function _onClickMacroEdit(event) {
  const key = event.currentTarget.dataset.key;
  return new effectmacro.applications.sheets.MacroConfig({ document: this.document, type: key }).render({ force: true });
}

/* -------------------------------------------------- */

/**
 * Handle clicking the 'add macro' button.
 * @param {PointerEvent} event        The initiating click event.
 * @returns {Promise<MacroConfig>}    The rendered effect macro editor.
 */
function _onClickMacroAdd(event) {
  const key = event.currentTarget.closest(".form-fields").querySelector(".unused-option").value;
  return new effectmacro.applications.sheets.MacroConfig({ document: this.document, type: key }).render({ force: true });
}
