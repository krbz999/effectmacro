export class EM {
  // take a string and execute it after turning it into a script.
  static async executeScripts(effect, script, context) {
    // define helper variables.
    const variables = this._getHelperVariables(effect);
    const body = `return (async()=>{
      ${script}
    })();`;
    const fn = Function(...Object.keys(variables), body);
    try {
      await fn.call(context, ...Object.values(variables));
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // get helper variables.
  static _getHelperVariables(effect) {
    let actor = effect.parent;
    let character = game.user.character ?? null;
    let token = actor.token?.object ?? actor.getActiveTokens()[0];
    let scene = token?.scene ?? game.scenes.active;
    let origin = effect.origin ? fromUuidSync(effect.origin) : actor;
    let speaker = ChatMessage.getSpeaker({actor});
    return {token, character, actor, speaker, scene, origin, effect};
  }
}
