import {MODULE} from "./constants.mjs";

/**
 * Call a specific type of script in an effect.
 * @param {ActiveEffect} effect   The triggering effect.
 * @param {string} [type]         The trigger of the script (default "never").
 * @param {object} [context]      Additional arguments to pass to the macro.
 */
export async function callMacro(effect, type = "never", context = {}) {
  return _callMacro.call(effect, type, context);
}

/**
 * Internal method to call a specific type of script in an effect.
 * @this {ActiveEffect}
 * @param {string} [type]         The trigger of the script (default "never").
 * @param {object} [context]      Additional arguments to pass to the macro.
 */
async function _callMacro(type = "never", context = {}) {
  const script = this.getFlag(MODULE, `${type}.script`);
  if (!script) {
    ui.notifications.warn("EFFECTMACRO.NoSuchScript", {localize: true});
    return;
  }
  const variables = EffectMethods._getHelperVariables(this);
  const fn = new foundry.utils.AsyncFunction(...Object.keys(variables), `{${script}\n}`);
  try {
    await fn.call(context, ...Object.values(variables));
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Return whether an effect has a script of this type.
 * @this {ActiveEffect}
 * @param {string} [type]     The trigger to check for.
 * @returns {boolean}         Whether the effect has a script of this type.
 */
export function hasMacro(type = "never") {
  return !!this.getFlag(MODULE, `${type}.script`);
}

/**
 * Remove a specific triggered script from this effect.
 * @this {ActiveEffect}
 * @param {string} [type]       The script to remove.
 * @returns {ActiveEffect}      The effect after being updated.
 */
export async function removeMacro(type = "never") {
  const script = this.getFlag(MODULE, type);
  if (!script) return null;
  return this.unsetFlag(MODULE, type);
}

/**
 * Create a script on the effect.
 * @this {ActiveEffect}
 * @param {string} [type]       The type of script to embed.
 * @param {string} [script]     The macro command to embed.
 * @returns {ActiveEffect}      The effect after being updated.
 */
export async function createMacro(type = "never", script) {
  if (!script) {
    ui.notifications.warn("EFFECTMACRO.NoScriptProvided", {localize: true});
    return;
  } else if (script instanceof Function) {
    return this.setFlag(MODULE, `${type}.script`, `(
        ${script.toString()}
      )()`);
  } else {
    return this.setFlag(MODULE, `${type}.script`, script.toString());
  }
}

/**
 * Update a script on the effect.
 * @this {ActiveEffect}
 * @param {string} [type]       The type of script to update.
 * @param {string} script       The new macro command to embed.
 * @returns {ActiveEffect}      The effect after being updated.
 */
export async function updateMacro(type = "never", script) {
  if (!script) return removeMacro.call(this, type);
  else if (script.toString() !== this.getFlag(MODULE, `${type}.script`)) {
    return createMacro.call(this, type, script);
  }
}

export class EffectMethods {

  /**
   * Get helper variables for the script call.
   * @param {ActiveEffect} effect     The effect having a macro called.
   * @returns {object}                Object of helper variables.
   */
  static _getHelperVariables(effect) {
    let actor = effect.parent instanceof Actor ? effect.parent : effect.parent.parent ?? null;
    let character = game.user.character ?? null;
    let token = actor?.token?.object ?? actor?.getActiveTokens()[0] ?? null;
    let scene = token?.scene ?? game.scenes.active ?? null;
    let origin = effect.origin ? fromUuidSync(effect.origin) : null;
    let speaker = actor ? ChatMessage.implementation.getSpeaker({actor}) : {};
    let item = effect.parent instanceof Item ? effect.parent : null;
    return {token, character, actor, speaker, scene, origin, effect, item};
  }

  /**
   * Get whether you, the user, should run the scripts on this actor.
   * @param {Actor} actor     The actor who has the effects.
   * @returns {boolean}       Whether you are the proper user to execute the scripts.
   */
  static isExecutor(actor) {
    if (!actor) return false;

    // find a non-GM who is active and owner of the actor.
    let user = game.users.find(i => !i.isGM && i.active && actor.testUserPermission(i, "OWNER"));
    if (user) return user === game.user;

    // find a GM who is active.
    user = game.users.find(i => i.isGM && i.active);
    return user === game.user;
  }
}
