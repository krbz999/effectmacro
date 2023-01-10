import { MODULE } from "./constants.mjs";

export class EM {

  // take a string and execute it after turning it into a script.
  static executeScripts = async (eff, scripts = {}, context = {}) => {
    const length = Object.keys(scripts).length;
    if (!length) return;

    // define helper variables.
    let {
      actor, character, token,
      scene, origin, effect
    } = await this.getHelperVariables(eff);

    for (const { script } of Object.values(scripts)) {
      if (!script) continue;
      const body = `return (async()=>{
        ${script}
      })();`;
      const fn = Function("token", "character", "actor", "scene", "origin", "effect", body);
      try {
        await fn.call(context, token, character, actor, scene, origin, effect);
      } catch (err) {
        console.error(err);
        return null;
      }
    }
  }

  // get the scripts.
  static getScripts = (effect, types, context) => {
    const scripts = {};
    for (const type of types) {
      scripts[type] = effect.getFlag(MODULE, type);
    }
    return this.executeScripts(effect, scripts, context);
  }

  // get helper variables.
  static getHelperVariables = async (effect) => {
    let actor = effect.parent;
    let character = game.user.character ?? actor;
    let token = actor.token?.object ?? actor.getActiveTokens()[0];
    let scene = token?.scene ?? game.scenes.active;
    let origin = effect.origin ? await fromUuid(effect.origin) : actor;

    return { actor, character, token, scene, origin, effect };
  }

  // warning helper function, returns null.
  static displayWarning(string) {
    ui.notifications.warn(`EFFECTMACRO.${string}`, { localize: true });
    return null;
  }
}
