class EM {
	
	// take a string and execute it after turning it into a script.
	static executeScripts = async (eff, scripts, context = {}) => {
		if(scripts.size < 1) return;
		
		// define helper variables.
		let {actor, character, token, scene, origin, effect} = await this.getHelperVariables(eff);
		
		for(let {script} of Object.values(scripts)){
			const body = `(async()=>{
				${script}
			})();`;
			const fn = Function("token", "character", "actor", "scene", "origin", "effect", body);
			await fn.call(context, token, character, actor, scene, origin, effect);
		}
		
	}
	
	// prime context to execute script (in pre hooks).
	static primer = (context, type) => {
		if(!context.effectmacro) context.effectmacro = [type];
		else context.effectmacro.push(type);
	}
	
	// get the scripts.
	static getScripts = (effect, types, context) => {
		const scripts = {};
		for(let type of types){
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
		
		return {actor, character, token, scene, origin, effect}
	}
	
}

class CONSTANT {
	static MODULE = "effectmacro";
	static TRIGGERS = [
		"never",
		"onCreate", "onDelete",
		"onToggle", "onEnable", "onDisable",
		"onTurnStart", "onTurnEnd",
		"onCombatStart", "onCombatEnd",
		"onCombatantDefeated"
	];
}

class CHECKS {
	
	// does effect have actor parent and is it NOT suppressed?
	static verifyEffect = (effect) => {
		return (effect.parent instanceof Actor) && (effect.isSuppressed === false);
	}

	// was this an effect that got toggled ON?
	static toggledOn = (effect, update) => {
		const wasOff = effect.disabled === true;
		const isOn = update.disabled === false;
		return (wasOff && isOn);
	}
	
	// was this an effect that got toggled OFF?
	static toggledOff = (effect, update) => {
		const wasOn = effect.disabled === false;
		const isOff = update.disabled === true;
		return (wasOn && isOff);
	}
	
	// was this an effect that got toggled?
	static toggled = (effect, update) => {
		return this.toggledOn(effect, update) || this.toggledOff(effect, update);
	}
	
	// does it have a script of a certain type?
	static hasMacroOfType = (effect, type, verifySupression = true) => {
		// must be on an actor, and must be non-suppressed (in case of unequipped/unattuned items)
		if(verifySupression && !this.verifyEffect(effect)) return false;
		const embedded = effect.getFlag(CONSTANT.MODULE, `${type}.script`) ?? "";
		return embedded;
	}
	
	// is this effect active (not disabled)?
	static isActive = (effect) => {
		return !effect.disabled;
	}
	
}

class API {
	
	// call a specific type of script in an effect.
	static callMacro = function(type = "never", context = {}){
		const script = this.getFlag(CONSTANT.MODULE, type);
		if(!script) return ui.notifications.warn(game.i18n.localize("EffectMacro.Warning.NoSuchScript"));
		return EM.getScripts(this, [type], context);
	}
	
	// return true or false if has macro of specific type.
	static hasMacro = function(type = "never"){
		return !!this.getFlag(CONSTANT.MODULE, `${type}.script`);
	}
	
	// remove a specific type of script in an effect.
	static removeMacro = function(type = "never"){
		const script = this.getFlag(CONSTANT.MODULE, type);
		if(!script) return ui.notifications.warn(game.i18n.localize("EffectMacro.Warning.NoSuchScript"));
		return this.unsetFlag(CONSTANT.MODULE, type);
	}
	
	// create a function on the effect.
	static createMacro = function(type = "never", script){
		if(!script){
			return ui.notifications.warn(game.i18n.localize("EffectMacro.Warning.NoScriptProvided"));
		}
		else{
			return this.setFlag(CONSTANT.MODULE, `${type}.script`, script.toString());
		}
	}
	
	// update a function on the effect.
	static updateMacro = function(type = "never", script){
		if(script.toString() !== this.getFlag(CONSTANT.MODULE, `${type}.script`)){
			return this.setFlag(CONSTANT.MODULE, `${type}.script`, script.toString());
		}
	}
	
	
}

class EffectMacroConfig extends MacroConfig {
	constructor(doc, options){
		super(doc, {});
		this.type = options.type;
	}
	
	/* Override */
	static get defaultOptions(){
		return mergeObject(super.defaultOptions, {
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
		data.command = game.i18n.localize("EffectMacro.ApplyMacro.Command");
		data.apply = game.i18n.localize("EffectMacro.ApplyMacro.Save");
		data.script = this.object.getFlag(CONSTANT.MODULE, this.type)?.script || "";
		return data;
	}
	
	/* Override */
	_onEditImage(event){
		return ui.notifications.error(game.i18n.localize("EffectMacro.ApplyMacro.EditImgError"));
	}
	
	/* Override */
	async _updateObject(event, formData){
		const type = this.type;
		await this.object.updateMacro(type, formData.command);
	}
	
}

// init msg.
Hooks.once("init", () => {
    console.log(`ZHELL | Initializing Effect Macro`);
});

// set up hooks.
Hooks.once("ready", () => {
	// hooks to flag contexts.
	Hooks.on("preDeleteActiveEffect", (effect, context) => {
		if(!!CHECKS.hasMacroOfType(effect, "onDelete") && CHECKS.isActive(effect)) EM.primer(context, "onDelete");
	});
	Hooks.on("preCreateActiveEffect", (effect, effectData, context) => {
		if(!!CHECKS.hasMacroOfType(effect, "onCreate")) EM.primer(context, "onCreate");
	});
	Hooks.on("preUpdateActiveEffect", (effect, update, context) => {
		if(!!CHECKS.hasMacroOfType(effect, "onToggle") && CHECKS.toggled(effect, update)) EM.primer(context, "onToggle");
		else if(!!CHECKS.hasMacroOfType(effect, "onEnable") && CHECKS.toggledOn(effect, update)) EM.primer(context, "onEnable");
		else if(!!CHECKS.hasMacroOfType(effect, "onDisable") && CHECKS.toggledOff(effect, update)) EM.primer(context, "onDisable");
	});

	// hooks to execute scripts.
	Hooks.on("deleteActiveEffect", (effect, context, userId) => {
		if(userId !== game.user.id) return;
		const types = context.effectmacro;
		if(!!types && types.length > 0) EM.getScripts(effect, types);
	});
	Hooks.on("createActiveEffect", (effect, context, userId) => {
		if(userId !== game.user.id) return;
		const types = context.effectmacro;
		if(!!types && types.length > 0) EM.getScripts(effect, types);
	});
	Hooks.on("updateActiveEffect", (effect, update, context, userId) => {
		if(userId !== game.user.id) return;
		const types = context.effectmacro;
		if(!!types && types.length > 0) EM.getScripts(effect, types);
	});

	// onTurnStart/End is special and weird and has to do it all on its own, but we love him all the same.
	Hooks.on("updateCombat", async (combat, changes) => {
		// no change in turns nor rounds.
		if(changes.turn === undefined && changes.round === undefined) return;
		
		// combat not started.
		if(!combat.started) return;
		
		// not active combat.
		if(!combat.isActive) return;
		
		// we went back.
		if(combat.current.round < combat.previous.round) return;
		
		// we went back.
		if(combat.current.turn < combat.previous.turn && combat.current.round === combat.previous.round) return;
		
		// current and previous combatant ids.
		const currentId = combat.current.combatantId;
		const previousId = combat.previous.combatantId;
		
		// current and previous combatants:
		const currentCombatant = combat.combatants.get(currentId);
		const previousCombatant = combat.combatants.get(previousId);
		
		// current and previous ACTORS in combat.
		const actorCurrent = currentCombatant.token.actor;
		const actorPrevious = previousCombatant?.token.actor;
		
		// find active effects with onTurn triggers.
		const effectsStart = actorCurrent.effects.filter(eff => {
			return !!CHECKS.hasMacroOfType(eff, "onTurnStart") && CHECKS.isActive(eff);
		});
		const effectsEnd = actorPrevious?.effects.filter(eff => {
			return !!CHECKS.hasMacroOfType(eff, "onTurnEnd") && CHECKS.isActive(eff);
		}) ?? [];
		
		// get active player who is owner of combatant.
		const playerCurrent = currentCombatant.players.filter(i => i.active)[0];
		const playerPrevious = previousCombatant?.players.filter(i => i.active)[0];
		
		// are you the player owner of current combatant? if not, are you gm?
		if(!!currentCombatant){
			if(game.user === playerCurrent) for(let eff of effectsStart) await eff.callMacro("onTurnStart");
			else if(!playerCurrent && game.user.isGM) for(let eff of effectsStart) await eff.callMacro("onTurnStart");
		}
		
		// are you the player owner of previous combatant? if not, are you gm?
		if(!!previousCombatant){
			if(game.user === playerPrevious) for(let eff of effectsEnd) await eff.callMacro("onTurnEnd");
			else if(!playerPrevious && game.user.isGM) for(let eff of effectsEnd) await eff.callMacro("onTurnEnd");
		}
	});
	
	// onCombatStart
	Hooks.on("updateCombat", async (combat, update) => {
		// current must be round1, turn0.
		if(combat.current.round !== 1 || combat.current.turn !== 0) return;
		// previous turn must be round0, turn null.
		if(combat.previous.round !== 0 || combat.previous.turn !== null) return;
		// must be active combat now.
		if(!combat.isActive) return;
		// must be a started combat.
		if(!combat.started) return;
		
		// all combatants that have 'onCombatStart' effects.
		const combatants = combat.combatants.reduce((acc, c) => {
			const effects = c.actor.effects.filter(e => {
				if(!CHECKS.hasMacroOfType(e, "onCombatStart")) return false;
				if(!CHECKS.isActive(e)) return false;
				return true;
			});
			if(effects.length) acc.push([c, effects]);
			return acc;
		}, []);
		
		// for each eligible combatant...
		for(let [combatant, effects] of combatants){
			// get active player who is owner of combatant.
			const owner = combatant.players.filter(i => i.active)[0];
			// if there is an active player, and that's you, you call this.
			if(owner === game.user) for(let eff of effects) await eff.callMacro("onCombatStart");
			// else the gm calls it.
			else if(!owner && game.user.isGM) for(let eff of effects) await eff.callMacro("onCombatStart");
		}
	});
	
	// onCombatEnd
	Hooks.on("deleteCombat", async (combat) => {
		// must be a started combat.
		if(!combat.started) return;
		// must be an active combat that was ended.
		if(!combat.isActive) return;
		
		// all combatants that have 'onCombatEnd' effects.
		const combatants = combat.combatants.reduce((acc, c) => {
			const effects = c.actor.effects.filter(e => {
				if(!CHECKS.hasMacroOfType(e, "onCombatEnd")) return false;
				if(!CHECKS.isActive(e)) return false;
				return true;
			});
			if(effects.length) acc.push([c, effects]);
			return acc;
		}, []);
		
		// for each eligible combatant...
		for(let [combatant, effects] of combatants){
			// get active player who is owner of combatant.
			const owner = combatant.players.filter(i => i.active)[0];
			// if there is an active player, and that's you, you call this.
			if(owner === game.user) for(let eff of effects) await eff.callMacro("onCombatEnd");
			// else the gm calls it.
			else if(!owner && game.user.isGM) for(let eff of effects) await eff.callMacro("onCombatEnd");
		}
	});
	
	// onCombatantDefeated
	Hooks.on("updateCombatant", async (combatant, update) => {
		// must be combatant marked defeated.
		if(!update.defeated) return;
		
		// find effects that are "onCombatantDefeated".
		const effects = combatant.actor.effects.filter(eff => {
			return !!CHECKS.hasMacroOfType(eff, "onCombatantDefeated") && CHECKS.isActive(eff);
		});
		if(!effects.length) return;
		
		// get first active player who is owner of combatant.
		const owner = combatant.players.filter(i => i.active)[0];
		
		// if there is an active player, and that's you, you call this.
		if(owner === game.user) for(let eff of effects) await eff.callMacro("onCombatantDefeated");
		// else the gm calls it.
		else if(!owner && game.user.isGM) for(let eff of effects) await eff.callMacro("onCombatantDefeated");
	});
	
	// slap button onto effect config dialog.
	Hooks.on("renderActiveEffectConfig", async (dialog, html, data) => {
		const effect = dialog.object;
		
		
		const appendWithin = html[0].querySelector("section[data-tab=details]");
		
		const options = CONSTANT.TRIGGERS.reduce((acc, key) => {
			const selected = foundry.utils.getProperty(dialog, `${CONSTANT.MODULE}.lastUpdated`) === key && "selected";
			const label = game.i18n.localize(`EffectMacro.Label.${key}`);
			return acc + `<option value="${key}" ${selected}>${label}</option>`;
		}, ``);
		
		const hr = document.createElement("hr");
		const newElement = document.createElement("div");
		newElement.setAttribute("class", "form-group");
		newElement.innerHTML = `
			<label>Effect Macro</label>
			<div class="form-fields">
				<select id="effectmacro-config-select">${options}</select>
				<button type="button" style="width: 30px;" id="effectmacro-config-button"><i class="fas fa-arrow-right"></i></button>
			</div>`;
		appendWithin.appendChild(hr);
		appendWithin.appendChild(newElement);
		html.css("height", "auto");
		const update_fas_fa = () => {
			const has_macro = effect.hasMacro(html[0].querySelector("#effectmacro-config-select").value);
			html[0].querySelector("#effectmacro-config-button > .fas").setAttribute("class", has_macro ? "fas fa-check" : "fas fa-arrow-right");
			html[0].querySelector("#effectmacro-config-button > .fas").setAttribute("style", has_macro ? "color: #078907" : "");
		}
		update_fas_fa();
		
		html[0].querySelector("#effectmacro-config-select").addEventListener("change", update_fas_fa);
		
		html[0].querySelector("#effectmacro-config-button").addEventListener("click", () => {
			const type = html[0].querySelector("#effectmacro-config-select").value;
			foundry.utils.setProperty(dialog, `${CONSTANT.MODULE}.lastUpdated`, type);
			new EffectMacroConfig(dialog.document, {type}).render(true);
		});
		
		dialog.element.css("height", "auto");
	});	
});

// set up prototype functions.
Hooks.once("setup", () => {
	ActiveEffect.prototype.callMacro = API.callMacro;
	ActiveEffect.prototype.removeMacro = API.removeMacro;
	ActiveEffect.prototype.createMacro = API.createMacro;
	ActiveEffect.prototype.updateMacro = API.updateMacro;
	ActiveEffect.prototype.hasMacro = API.hasMacro;
});
