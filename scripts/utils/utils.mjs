/**
 * Call a specific type of script in an effect.
 * @param {foundry.documents.ActiveEffect} effect   The effect.
 * @param {string} [type="never"]                   The trigger of the script.
 * @param {object} [context={}]                     Additional arguments to pass to the macro.
 * @returns {Promise<*>}                            A promise that resolves once the macro has executed.
 */
export async function callMacro(effect, type = "never", context = {}) {
  return _callMacro(effect, type, context);
}

/* -------------------------------------------------- */

/**
 * Internal method to call a specific type of script in an effect.
 * @param {foundry.documents.ActiveEffect} effect   The effect.
 * @param {string} [type="never"]                   The trigger of the script.
 * @param {object} [context={}]                     Additional arguments to pass to the macro.
 * @returns {Promise<void|null>}
 */
async function _callMacro(effect, type = "never", context = {}) {
  const script = effect.getFlag(effectmacro.id, `${type}.script`);
  if (!script) {
    ui.notifications.warn("EFFECTMACRO.NoSuchScript", { localize: true });
    return;
  }
  const variables = getHelperVariables(effect);
  const fn = new foundry.utils.AsyncFunction(...Object.keys(variables), `{${script}\n}`);
  try {
    await fn.call(context, ...Object.values(variables));
  } catch (err) {
    console.error(err);
    return null;
  }
}

/* -------------------------------------------------- */

/**
 * Return whether an effect has a script of this type.
 * @param {foundry.documents.ActiveEffect} effect   The effect.
 * @param {string} [type="never"]                   The trigger to check for.
 * @returns {boolean}                               Whether the effect has a script of this type.
 */
export function hasMacro(effect, type = "never") {
  return !!effect.getFlag(effectmacro.id, `${type}.script`);
}

/* -------------------------------------------------- */

/**
 * Remove a specific triggered script from this effect.
 * @param {foundry.documents.ActiveEffect} effect   The effect.
 * @param {string} [type="never"]                   The script to remove.
 * @returns {Promise<ActiveEffect>}                 The effect after being updated.
 */
export async function removeMacro(effect, type = "never") {
  const script = effect.getFlag(effectmacro.id, type);
  if (!script) return null;
  return effect.unsetFlag(effectmacro.id, type);
}

/* -------------------------------------------------- */

/**
 * Create a script on the effect.
 * @param {foundry.documents.ActiveEffect} effect   The effect.
 * @param {string} [type="never"]                   The type of script to embed.
 * @param {string} script                           The macro command to embed.
 * @returns {Promise<ActiveEffect>}                 A promise that resolves to the updated effect.
 */
export async function createMacro(effect, type = "never", script) {
  if (!script) {
    ui.notifications.warn("EFFECTMACRO.NoScriptProvided", { localize: true });
    return;
  }
  if (effect.sheet.rendered) await effect.sheet.submit();

  if (script instanceof Function) {
    return effect.setFlag(effectmacro.id, `${type}.script`, `(
        ${script.toString()}
      )()`);
  } else {
    return effect.setFlag(effectmacro.id, `${type}.script`, script.toString());
  }
}

/* -------------------------------------------------- */

/**
 * Update a script on the effect.
 * @param {foundry.documents.ActiveEffect} effect   The effect.
 * @param {string} [type="never"]                   The type of script to update.
 * @param {string} script                           The new macro command to embed.
 * @returns {Promise<ActiveEffect>}                 A promise that resolves to the updated effect.
 */
export async function updateMacro(effect, type = "never", script) {
  if (effect.sheet.rendered) await effect.sheet.submit();
  if (!script) {
    return removeMacro(effect, type);
  } else if (script.toString() !== effect.getFlag(effectmacro.id, `${type}.script`)) {
    return createMacro(effect, type, script);
  }
}

/* -------------------------------------------------- */

/**
 * Get helper variables for the script call.
 * @param {foundry.documents.ActiveEffect} effect   The effect having a macro called.
 * @returns {object}                                Object of helper variables.
 */
export function getHelperVariables(effect) {
  /** @type {foundry.documents.Actor} */
  const actor = (effect.parent instanceof foundry.documents.Actor) ? effect.parent : (effect.parent.parent ?? null);

  /** @type {foundry.documents.Actor} */
  const character = game.user.character ?? null;

  /** @type {foundry.canvas.placeables.Token} */
  const token = actor?.token?.object ?? actor?.getActiveTokens()[0] ?? null;

  /** @type {foundry.documents.Scene} */
  const scene = token?.scene ?? game.scenes.active ?? null;

  const origin = effect.origin ? foundry.utils.fromUuidSync(effect.origin) : null;

  /** @type {object} */
  const speaker = actor ? ChatMessage.implementation.getSpeaker({ actor }) : {};

  /** @type {foundry.documents.Item} */
  const item = (effect.parent instanceof foundry.documents.Item) ? effect.parent : null;
  return { token, character, actor, speaker, scene, origin, effect, item };
}

/* -------------------------------------------------- */

/**
 * Get whether you, the user, should run the scripts on this actor.
 * @param {Actor} actor   The actor who has the effects.
 * @returns {boolean}     Whether you are the proper user to execute the scripts.
 */
export function isExecutor(actor) {
  return getExecutor(actor) === game.user;
}

/* -------------------------------------------------- */

/**
 * Return the user that should execute a macro.
 * @param {foundry.documents.Actor} actor   The actor that has the effect.
 * @returns {foundry.documents.User|null}   The designated user, or `null` if none found.
 */
export function getExecutor(actor) {
  return game.users.getDesignatedUser(user => {
    return !user.isGM && user.active && actor.testUserPermission(user, "OWNER");
  }) ?? game.users.activeGM;
}
