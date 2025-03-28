import { TRIGGERS } from "../triggers.mjs";

export default async function renderActiveEffectConfig(config, html, data) {
  if (game.settings.get(effectmacro.id, "restrictPermissions") && !game.user.isGM) return;

  const used = [];
  const unused = [];

  for (const obj of TRIGGERS.agnostic) {
    const [triggers, yay] = obj.triggers.partition(key => effectmacro.utils.hasMacro(config.document, key));
    if (triggers.length) unused.push({ label: obj.label, triggers: triggers });
    used.push(...yay.map(k => ({ key: k, label: `EFFECTMACRO.${k}` })));
  }

  const [sys, yay] = (TRIGGERS[game.system.id] ?? []).partition(key => effectmacro.utils.hasMacro(config.document, key));
  if (sys.length) unused.push({ label: "EFFECTMACRO.SystemTriggers", triggers: sys });
  used.push(...yay.map(k => ({ key: k, label: `EFFECTMACRO.${k}` })));

  unused.forEach(u => u.triggers = u.triggers.map(t => ({ key: t, label: `EFFECTMACRO.${t}` })));

  const div = document.createElement("DIV");
  const template = "modules/effectmacro/templates/effect-sheet.hbs";
  div.innerHTML = await renderTemplate(template, { used, unused });

  div.querySelectorAll("[data-action]").forEach(n => {
    switch (n.dataset.action) {
      case "macro-add": n.addEventListener("click", _onClickMacroAdd.bind(config)); break;
      case "macro-edit": n.addEventListener("click", _onClickMacroEdit.bind(config)); break;
      case "macro-delete": n.addEventListener("click", _onClickMacroDelete.bind(config)); break;
    }
  });
  if (game.release.generation < 13) html = html[0];
  const tab = html.querySelector("section[data-tab='details']");
  tab.appendChild(div.firstElementChild);
  if (game.release.generation >= 13) tab.classList.add("scrollable");
  if (game.release.generation < 13) config.setPosition({ height: "auto" });
}

/* -------------------------------------------------- */

/**
 * Handle clicking the 'delete macro' buttons.
 * @param {PointerEvent} event      The initiating click event.
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
 * @param {PointerEvent} event                The initiating click event.
 * @returns {Promise<MacroConfig>}      The rendered effect macro editor.
 */
function _onClickMacroEdit(event) {
  const key = event.currentTarget.dataset.key;
  return new effectmacro.applications.sheets.MacroConfig({ document: this.document, type: key }).render({ force: true });
}

/* -------------------------------------------------- */

/**
 * Handle clicking the 'add macro' button.
 * @param {PointerEvent} event                The initiating click event.
 * @returns {Promise<MacroConfig>}      The rendered effect macro editor.
 */
function _onClickMacroAdd(event) {
  const key = event.currentTarget.closest(".form-fields").querySelector(".unused-option").value;
  return new effectmacro.applications.sheets.MacroConfig({ document: this.document, type: key }).render({ force: true });
}
