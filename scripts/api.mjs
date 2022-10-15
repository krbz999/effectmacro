import { MODULE } from "./constants.mjs";
import { EM } from "./main.mjs";

export class API {

  // call a specific type of script in an effect.
  static callMacro = async function (type = "never", context = {}) {
    const script = this.getFlag(MODULE, type);
    if (!script) {
      return EM.displayWarning("NO_SUCH_SCRIPT");
    }
    return EM.getScripts(this, [type], context);
  }

  // return true or false if has macro of specific type.
  static hasMacro = function (type = "never") {
    return !!this.getFlag(MODULE, `${type}.script`);
  }

  // remove a specific type of script in an effect.
  static removeMacro = async function (type = "never") {
    const script = this.getFlag(MODULE, type);
    if (!script) {
      return null;
    }
    return this.unsetFlag(MODULE, type);
  }

  // create a function on the effect.
  static createMacro = async function (type = "never", script) {
    if (!script) {
      return EM.displayWarning("NO_SCRIPT_PROVIDED");
    }
    else {
      if (script instanceof Function) {
        return this.setFlag(MODULE, `${type}.script`, `(
          ${script.toString()}
        )()`);
      }
      return this.setFlag(MODULE, `${type}.script`, script.toString());
    }
  }

  // update a function on the effect.
  static updateMacro = async function (type = "never", script) {
    if (!script) return this.removeMacro(type);
    else if (script.toString() !== this.getFlag(MODULE, `${type}.script`)) {
      return this.createMacro(type, script);
    }
  }
}
