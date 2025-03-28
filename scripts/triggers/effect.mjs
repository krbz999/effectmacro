
export default function init() {
  Hooks.on("createActiveEffect", onCreateDelete.bind("onCreate"));
  Hooks.on("deleteActiveEffect", onCreateDelete.bind("onDelete"));
  Hooks.on("preUpdateActiveEffect", preUpdate);
  Hooks.on("updateActiveEffect", onUpdate);

  // Item triggers.
  Hooks.on("preUpdateItem", preUpdateItem);
  Hooks.on("updateItem", updateItem);
  Hooks.on("deleteItem", deleteItem);
  Hooks.on("createItem", createItem);
}

/* -------------------------------------------------- */

/**
 * Execute effect toggle triggers.
 * @param {ActiveEffect} effect     The effect updated.
 * @param {object} update           The update performed.
 * @param {object} context          The update options.
 */
async function onUpdate(effect, update, context) {
  if (CONFIG.ActiveEffect.legacyTransferral && (effect.parent instanceof Item)) return;

  const run = effectmacro.utils.isExecutor(effect.parent);
  if (!run) return false;

  const path = `${effectmacro.id}.${effect.id}.wasOn`;
  const isOn = effect.modifiesActor;
  const wasOn = foundry.utils.getProperty(context, path);
  const toggledOff = wasOn && !isOn;
  const toggledOn = !wasOn && isOn;

  if (toggledOff && effectmacro.utils.hasMacro(effect, "onDisable"))
    await effectmacro.utils.callMacro(effect, "onDisable");

  if (toggledOn && effectmacro.utils.hasMacro(effect, "onEnable"))
    await effectmacro.utils.callMacro(effect, "onEnable");

  if ((toggledOff || toggledOn) && effectmacro.utils.hasMacro(effect, "onToggle"))
    await effectmacro.utils.callMacro(effect, "onToggle");
}

/* -------------------------------------------------- */

/**
 * Save relevant data on effect update.
 * @param {ActiveEffect} effect     The effect updated.
 * @param {object} update           The update performed.
 * @param {object} context          The update options.
 */
function preUpdate(effect, update, context) {
  if (CONFIG.ActiveEffect.legacyTransferral && (effect.parent instanceof Item)) return;
  const path = `${effectmacro.id}.${effect.id}.wasOn`;
  foundry.utils.setProperty(context, path, effect.modifiesActor);
}

/* -------------------------------------------------- */

/**
 * Execute effect creation / deletion triggers.
 * @this {string}
 * @param {ActiveEffect} effect     The effect created or deleted.
 */
async function onCreateDelete(effect) {
  const u = effectmacro.utils;
  if (effect.modifiesActor && u.hasMacro(effect, this) && u.isExecutor(effect.parent)) {
    return u.callMacro(effect, this);
  }
}

/* -------------------------------------------------- */

/**
 * When an item is updated, read whether its effects have started or stopped applying.
 * @param {Item} item           The item updated.
 * @param {object} update       The update performed.
 * @param {object} context      The update options.
 */
function preUpdateItem(item, update, context) {
  if (!item.isEmbedded) return;
  const collection = CONFIG.ActiveEffect.legacyTransferral
    ? item.actor.effects.filter(e => e.origin === item.uuid)
    : item.effects;
  collection.forEach(e => foundry.utils.setProperty(context, `${effectmacro.id}.${e.id}.wasOn`, e.modifiesActor));
}

/* -------------------------------------------------- */

/**
 * Execute effect toggles if an item update results in an effect changing whether it affects an actor.
 * @param {Item} item           The item updated.
 * @param {object} update       The update performed.
 * @param {object} context      The update options.
 */
async function updateItem(item, update, context) {
  if (!item.isEmbedded) return;
  const run = effectmacro.utils.isExecutor(item.actor);
  if (!run) return;

  const u = effectmacro.utils;

  const ids = Object.keys(context[effectmacro.id] ?? {});
  if (!ids.length) return;
  const collection = CONFIG.ActiveEffect.legacyTransferral ? item.actor.effects : item.effects;
  const effects = ids.map(id => collection.get(id));

  for (const effect of effects) {
    if (!effect) continue;
    const isOn = effect.modifiesActor;
    const wasOn = foundry.utils.getProperty(context, `${effectmacro.id}.${effect.id}.wasOn`);
    const toggledOff = wasOn && !isOn;
    const toggledOn = !wasOn && isOn;
    const toggled = toggledOff || toggledOn;

    if (toggledOff && u.hasMacro(effect, "onDisable"))
      await u.callMacro(effect, "onDisable");

    if (toggledOn && u.hasMacro(effect, "onEnable"))
      await u.callMacro(effect, "onEnable");

    if (toggled && u.hasMacro(effect, "onToggle"))
      await u.callMacro(effect, "onToggle");
  }
}

/* -------------------------------------------------- */

/**
 * Execute effect deletion triggers when the parent item is deleted. This only applies to non-legacy transfer systems.
 * @param {Item} item     The item being deleted.
 * @param {object} options      Update options.
 */
async function deleteItem(item, options) {
  if (!item.isEmbedded || CONFIG.ActiveEffect.legacyTransferral) return;
  const run = effectmacro.utils.isExecutor(item.actor);
  if (!run) return;

  const effects = item.effects.filter(e => e.modifiesActor && effectmacro.utils.hasMacro(e, "onDelete"));
  for (const effect of effects) await effectmacro.utils.callMacro(effect, "onDelete");
}

/* -------------------------------------------------- */

/**
 * Execute effect creation triggers when the parent item is created. This only applies to non-legacy transfer systems.
 * @param {Item} item           The item that was created.
 * @param {object} options      Update options.
 */
async function createItem(item, options) {
  if (!item.isEmbedded || CONFIG.ActiveEffect.legacyTransferral) return;
  const run = effectmacro.utils.isExecutor(item.actor);
  if (!run) return;

  const effects = item.effects.filter(e => e.modifiesActor && effectmacro.utils.hasMacro(e, "onCreate"));
  for (const effect of effects) await effectmacro.utils.callMacro(effect, "onCreate");
}
