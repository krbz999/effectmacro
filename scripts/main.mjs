import { MODULE } from "./constants.mjs";

export class EM {
    
    // take a string and execute it after turning it into a script.
    static executeScripts = async (eff, scripts, context = {}) => {
        if ( scripts.size < 1 ) return;
        
        // define helper variables.
        let {actor, character, token, scene, origin, effect} = await this.getHelperVariables(eff);
        
        for ( let {script} of Object.values(scripts) ) {
            const body = `(async()=>{
                ${script}
            })();`;
            const fn = Function("token", "character", "actor", "scene", "origin", "effect", body);
            await fn.call(context, token, character, actor, scene, origin, effect);
        }
        
    }
    
    // prime context to execute script (in pre hooks).
    static primer = (context, type) => {
        if ( !context.effectmacro ) context.effectmacro = [type];
        else context.effectmacro.push(type);
    }
    
    // get the scripts.
    static getScripts = (effect, types, context) => {
        const scripts = {};
        for ( let type of types ) {
            scripts[type] = effect.getFlag("effectmacro", type);
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
        
        return {actor, character, token, scene, origin, effect};
    }
    
}

export class CHECKS {
    
    // does effect have actor parent and is it NOT suppressed?
    static verifyEffect = (effect) => {
        return ( effect.parent instanceof Actor ) && ( effect.isSuppressed === false );
    }

    // was this an effect that got toggled ON?
    static toggledOn = (effect, update) => {
        const wasOff = effect.disabled === true;
        const isOn = update.disabled === false;
        return ( wasOff && isOn );
    }
    
    // was this an effect that got toggled OFF?
    static toggledOff = (effect, update) => {
        const wasOn = effect.disabled === false;
        const isOff = update.disabled === true;
        return ( wasOn && isOff );
    }
    
    // was this an effect that got toggled?
    static toggled = (effect, update) => {
        return this.toggledOn(effect, update) || this.toggledOff(effect, update);
    }
    
    // does it have a script of a certain type?
    static hasMacroOfType = (effect, type, verifySupression = true) => {
        // must be on an actor, and must be non-suppressed (in case of unequipped/unattuned items)
        if ( verifySupression && !this.verifyEffect(effect) ) return false;
        const embedded = effect.getFlag(MODULE, `${type}.script`) ?? "";
        return embedded;
    }
    
    // is this effect active (not disabled)?
    static isActive = (effect) => {
        return !effect.disabled;
    }
    
    // get first active player (id) who owns the actor.
    static firstPlayerOwner = (actor) => {
        if ( !actor.hasPlayerOwner ) return false;
        const active_players = game.users.filter(i => !i.isGM && i.active);
        const {OWNER} = CONST.DOCUMENT_OWNERSHIP_LEVELS;
        for ( let p of active_players ) {
            if ( actor.testUserPermission(p, OWNER) ) return p.id;
        }
        return false;
    }
    
}

export class API {
    
    // call a specific type of script in an effect.
    static callMacro = function(type = "never", context = {}){
        const script = this.getFlag(MODULE, type);
        if ( !script ) return ui.notifications.warn(game.i18n.localize("EFFECTMACRO.WARNNG.NO_SUCH_SCRIPT"));
        return EM.getScripts(this, [type], context);
    }
    
    // return true or false if has macro of specific type.
    static hasMacro = function(type = "never"){
        return !!this.getFlag(MODULE, `${type}.script`);
    }
    
    // remove a specific type of script in an effect.
    static removeMacro = function(type = "never"){
        const script = this.getFlag(MODULE, type);
        if ( !script ) return ui.notifications.warn(game.i18n.localize("EFFECTMACRO.WARNNG.NO_SUCH_SCRIPT"));
        return this.unsetFlag(MODULE, type);
    }
    
    // create a function on the effect.
    static createMacro = function(type = "never", script){
        if ( !script ) {
            return ui.notifications.warn(game.i18n.localize("EFFECTMACRO.WARNNG.NO_SCRIPT_PROVIDED"));
        }
        else {
            if ( script instanceof Function ) {
                return this.setFlag(MODULE, `${type}.script`, `(
                    ${script.toString()}
                )()`);
            }
            return this.setFlag(MODULE, `${type}.script`, script.toString());
        }
    }
    
    // update a function on the effect.
    static updateMacro = function(type = "never", script){
        if ( script.toString() !== this.getFlag(MODULE, `${type}.script`) ) {
            return this.setFlag(MODULE, `${type}.script`, script.toString());
        }
    }
}

export class EffectMacroConfig extends MacroConfig {
    constructor(doc, options){
        super(doc, {});
        this.type = options.type;
    }
    
    /* Override */
    static get defaultOptions(){
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "effectmacro-menu",
            template: "modules/effectmacro/templates/macro-menu.html",
            classes: ["macro-sheet", "sheet"]
        });
    }
    
    /* Override */
    async getData(){
        const data = super.getData();
        data.img = this.object.icon;
        data.name = this.object.label;
        data.script = this.object.getFlag(MODULE, this.type)?.script ?? "";
        return data;
    }
    
    /* Override */
    _onEditImage(event){
        return ui.notifications.error(game.i18n.localize("EFFECTMACRO.APPLYMACRO.EDIT_IMG_ERROR"));
    }
    
    /* Override */
    async _updateObject(event, formData){
        const type = this.type;
        return this.object.updateMacro(type, formData.command);
    }
}
