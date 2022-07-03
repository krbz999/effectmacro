class EM {

	
	// take a string and execute it after turning it into a script.
	static executeScripts = async (eff, scripts) => {
		if(scripts.size < 1) return;
		
		// define helper variables.
		let {actor, character, token, scene, origin, effect} = await this.getHelperVariables(eff);
		
		for(let scriptObj of Object.values(scripts)){
			const body = `(${scriptObj.script})();`;
			const fn = Function("token", "character", "actor", "scene", "origin", "effect", body);
			
		console.log("ACTOR", actor);
		console.log("CHAR", character);
		console.log("TOKEN", token);
		console.log("SCENE", scene);
		console.log("ORIGIN", origin);
			
			await fn.call(scriptObj, token, character, actor, scene, origin, effect);
		}
		
	}
	
	// prime context to execute script.
	static primer = (context, type) => {
		if(!context.effectmacro) context.effectmacro = [type];
		else context.effectmacro.push(type);
	}
	
	// get the scripts.
	static getScripts = (effect, types) => {
		const scripts = {};
		for(let type of types){
			scripts[type] = effect.getFlag("effectmacro", type);
		}
		return this.executeScripts(effect, scripts);
	}
	
	// get helper variables.
	static getHelperVariables = async (effect) => {
		let actor = effect.parent;
		let character = game.user.character ?? actor;
		let token = actor.token ?? actor.getActiveTokens()[0];
		let scene = token?.scene ?? game.scenes.active;
		let origin = await fromUuid(effect.data.origin);
		
		return {actor, character, token, scene, origin, effect}
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
	
	// does this effect have something to fire off on creation?
	static hasOnCreate = (effect, update, userId) => {
		const embedded = effect.getFlag("effectmacro", "onCreate");
		if(!embedded || embedded.size < 1) return false;
		return embedded;
	}
	
	// does this effect have something to fire off on deletion?
	static hasOnDelete = (effect) => {
		const embedded = effect.getFlag("effectmacro", "onDelete");
		if(!embedded || embedded.size < 1) return false;
		return embedded;
	}
	
	// does this effect have something to fire off on any toggle?
	static hasOnToggle = (effect, update, context, userId) => {
		const embedded = effect.getFlag("effectmacro", "onToggle");
		if(!embedded || embedded.size < 1) return false;
		return embedded;
	}
	
	// does this effect have something to fire off when enabled?
	static hasOnToggleOn = (effect) => {
		const embedded = effect.getFlag("effectmacro", "onEnable");
		if(!embedded || embedded.size < 1) return false;
		return embedded;
	}
	
	// does this effect have something to fire off when disabled?
	static hasOnToggleOff = (effect) => {
		const embedded = effect.getFlag("effectmacro", "onDisable");
		if(!embedded || embedded.size < 1) return false;
		return embedded;
	}
	
}

export class API {
	// single method to flag an effect properly.
	static flag_effect = async (effect) => {
		const options = ["onCreate", "onDelete", "onToggle", "onEnable", "onDisable"].reduce((acc, e) => acc += `<option value=${e}>${e}</option>`, ``);
		const content = `
		<form>
		<header>
			<img src="${effect.data.icon}" title="${effect.data.label}" height="64" width="64">
			<h1> <input name="label" type="text" value="${effect.data.label}" placeholder="name" disabled> </h1>
		</header>
		<div class="form-group">
			<label for="trigger-select">Trigger</label>
			<div class="form-fields">
				<select id="trigger-select">${options}</select>
			</div>
		</div>
		<div class="form-group stacked command">
			<label>Command</label>
			<textarea id="effectmacro-function" cols="60" rows="15"></textarea>
		</div>
		</form>`;
		new Dialog({
			title: "Effect Macro",
			content,
			buttons: {go: {
				icon: `<i class="fas fa-save"></i>`,
				label: "Save Macro",
				callback: async (html) => {
					const trigger = html[0].querySelector("select[id='trigger-select']").value;
					const textareaInput = html[0].querySelector("textarea[id='effectmacro-function']").value;
					const script = `async () => {${textareaInput}}`;
					console.log(script);
					return effect.setFlag("effectmacro", trigger, {script});
				}
			}}
		}).render(true);
	}
	
}

// hooks to flag contexts.
Hooks.on("preDeleteActiveEffect", (effect, context) => {
	if(CHECKS.hasOnDelete(effect)) EM.primer(context, "onDelete");
});
Hooks.on("preCreateActiveEffect", (effect, effectData, context) => {
	if(CHECKS.hasOnCreate(effect)) EM.primer(context, "onCreate");
});
Hooks.on("preUpdateActiveEffect", (effect, update, context) => {
	if(CHECKS.hasOnToggle(effect) && CHECKS.toggled(effect, update)) EM.primer(context, "onToggle");
	if(CHECKS.hasOnToggleOn(effect) && CHECKS.toggledOn(effect, update)) EM.primer(context, "onEnable");
	if(CHECKS.hasOnToggleOff(effect) && CHECKS.toggledOff(effect, update)) EM.primer(context, "onDisable");
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

Hooks.on("setup", () => {
	game.effectmacro = {
		flagEffect: API.flag_effect
	}
});