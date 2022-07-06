class EM {
	
	// take a string and execute it after turning it into a script.
	static executeScripts = async (eff, scripts, context = {}) => {
		if(scripts.size < 1) return;
		
		// define helper variables.
		let {actor, character, token, scene, origin, effect} = await this.getHelperVariables(eff);
		
		for(let {script} of Object.values(scripts)){
			const body = `(async()=>{${script}})();`;
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
		let origin = await fromUuid(effect.data.origin);
		
		return {actor, character, token, scene, origin, effect}
	}
	
	// flag an effect with a macro via the effect config.
	static configureEffectMacro = async (effect, type) => {
		const existingMacro = CHECKS.hasMacroOfType(effect, type);
		const content = `
		<form>
		<header>
			<img src="${effect.data.icon}" title="${effect.data.label}" height="64" width="64">
			<h1> <input name="label" type="text" value="${effect.data.label}" placeholder="name" disabled> </h1>
		</header>
		<div class="form-group stacked command">
			<label>Command</label>
			<textarea id="effectmacro-function" cols="60" rows="15" value=""></textarea>
		</div>
		</form>`;
		new Dialog({
			title: `Effect Macro: ${type}`,
			content,
			buttons: {go: {
				icon: `<i class="fas fa-save"></i>`,
				label: `Apply to ${type}`,
				callback: async (html) => {
					const script = html[0].querySelector("textarea[id='effectmacro-function']").value;
					return effect.updateMacro(type, script);
				}
			}},
			render: (html) => {
				html[0].querySelector("textarea[id='effectmacro-function']").value = (existingMacro || "");
				html.css("width", "auto");
			}
		}).render(true);
	}
	
}

class CHECKS {

	// was this an effect that got toggled ON?
	static toggledOn = (effect, update) => {
		const wasOff = effect.data.disabled === true;
		const isOn = update.disabled === false;
		return (wasOff && isOn);
	}
	
	// was this an effect that got toggled OFF?
	static toggledOff = (effect, update) => {
		const wasOn = effect.data.disabled === false;
		const isOff = update.disabled === true;
		return (wasOn && isOff);
	}
	
	// was this an effect that got toggled?
	static toggled = (effect, update) => {
		return this.toggledOn(effect, update) || this.toggledOff(effect, update);
	}
	
	// does it have a script of a certain type?
	static hasMacroOfType = (effect, type) => {
		const embedded = effect.getFlag("effectmacro", `${type}.script`) ?? "";
		return embedded;
	}
	
}

class API {
	
	// call a specific type of script in an effect.
	static callMacro = function(type = "never", context = {}){
		const script = this.getFlag("effectmacro", type);
		if(!script) return ui.notifications.warn("No such script embedded in effect.");
		return EM.getScripts(this, [type], context);
	}
	
	// return true or false if has macro of specific type.
	static hasMacro = function(type = "never"){
		return !!this.getFlag("effectmacro", `${type}.script`);
	}
	
	// remove a specific type of script in an effect.
	static removeMacro = function(type = "never"){
		const script = this.getFlag("effectmacro", type);
		if(!script) return ui.notifications.warn("No such script embedded in effect.");
		return this.unsetFlag("effectmacro", type);
	}
	
	// create a function on the effect.
	static createMacro = function(type = "never", script){
		if(!script) return ui.notifications.warn("You did not provide a function.");
		return this.setFlag("effectmacro", type, {script: script.toString()});
	}
	
	// update a function on the effect.
	static updateMacro = function(type = "never", script){
		if(!script) return this.unsetFlag("effectmacro", type);
		return this.setFlag("effectmacro", type, {script: script.toString()});
	}
	
	
}

Hooks.once("ready", () => {
	// hooks to flag contexts.
	Hooks.on("preDeleteActiveEffect", (effect, context) => {
		if(!!CHECKS.hasMacroOfType(effect, "onDelete")) EM.primer(context, "onDelete");
	});
	Hooks.on("preCreateActiveEffect", (effect, effectData, context) => {
		if(!!CHECKS.hasMacroOfType(effect, "onCreate")) EM.primer(context, "onCreate");
	});
	Hooks.on("preUpdateActiveEffect", (effect, update, context) => {
		if(!!CHECKS.hasMacroOfType(effect, "onToggle") && CHECKS.toggled(effect, update)) EM.primer(context, "onToggle");
		if(!!CHECKS.hasMacroOfType(effect, "onEnable") && CHECKS.toggledOn(effect, update)) EM.primer(context, "onEnable");
		if(!!CHECKS.hasMacroOfType(effect, "onDisable") && CHECKS.toggledOff(effect, update)) EM.primer(context, "onDisable");
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
		// no change in turns (this check needed for when adding combatants mid-combat).
		if(changes.turn === undefined) return;
		
		// combat not started.
		if(!combat.started) return;
		
		// we went back.
		if(combat.current.round < combat.previous.round) return;
		
		// we went back.
		if(combat.current.turn < combat.previous.turn && combat.current.round === combat.previous.round) return;
		
		// not active combat.
		if(!combat.isActive) return;
		
		// current and previous combatant index in turns.
		const indexCurrent = combat.turns.indexOf(combat.combatant);
		const indexPrevious = (combat.previous.round === 0) ? undefined : (indexCurrent === 0 ? (combat.turns.length - 1) : (indexCurrent - 1));
		
		// current and previous combatants:
		const currentCombatant = combat.turns[indexCurrent];
		const previousCombatant = combat.turns[indexPrevious];
		
		// current and previous ACTORS in combat.
		const actorCurrent = currentCombatant.token.actor;
		const actorPrevious = previousCombatant?.token.actor;
		
		// find active effects with onTurn triggers.
		const effectsStart = actorCurrent.effects.filter(eff => !!CHECKS.hasMacroOfType(eff, "onTurnStart"));
		const effectsEnd = actorPrevious?.effects.filter(eff => !!CHECKS.hasMacroOfType(eff, "onTurnEnd")) ?? [];
		
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
	
	// slap button onto effect config dialog.
	Hooks.on("renderActiveEffectConfig", async (dialog, html, data) => {
		const effect = dialog.object;
		
		const appendWithin = html[0].querySelector("section[data-tab=details]");
		
		const options = ["never", "onCreate", "onDelete", "onToggle", "onEnable",
		"onDisable", "onTurnStart", "onTurnEnd"].reduce((acc, e) => acc += `<option value="${e}">${e}</option>`, ``);
		
		const hr = document.createElement("hr");
		const newElement = document.createElement("div");
		newElement.setAttribute("class", "form-group");
		newElement.innerHTML = `
			<label>Effect Macros</label>
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
			EM.configureEffectMacro(effect, type);
		});
	});
	
	// dont look too hard at this.
	Hooks.on("updateActiveEffect", async (effect) => {
		await new Promise(resolve => {setTimeout(resolve, 5)});
		Object.values(effect.apps)[0]?.element?.css("height", "auto");
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


