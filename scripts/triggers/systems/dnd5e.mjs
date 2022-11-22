export function dnd5eTriggers() {
  Hooks.on("dnd5e.rollAttack", async (item, roll, ammoUpdate) => {
    const effects = item.parent.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollAttack");
      const isOn = effect.modifiesActor;
      return hasMacro && isOn;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollAttack", { item, roll, ammoUpdate });
    }
  });

  Hooks.on("dnd5e.rollAbilitySave", async (actor, roll, abilityId) => {
    const effects = actor.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollAbilitySave");
      const isOn = effect.modifiesActor;
      return hasMacro && isOn;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollAbilitySave", { roll, abilityId });
    }
  });

  Hooks.on("dnd5e.rollDeathSave", async (actor, roll, updates) => {
    const effects = actor.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollDeathSave");
      const isOn = effect.modifiesActor;
      return hasMacro && isOn;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollDeathSave", { roll, updates });
    }
  });

  Hooks.on("dnd5e.rollAbilityTest", async (actor, roll, abilityId) => {
    const effects = actor.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollAbilityTest");
      const isOn = effect.modifiesActor;
      return hasMacro && isOn;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollAbilityTest", { roll, abilityId });
    }
  });

  Hooks.on("dnd5e.rollSkill", async (actor, roll, skillId) => {
    const effects = actor.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollSkill");
      const isOn = effect.modifiesActor;
      return hasMacro && isOn;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollSkill", { roll, skillId });
    }
  });

  Hooks.on("dnd5e.rollDamage", async (item, roll) => {
    const effects = item.parent.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollDamage");
      const isOn = effect.modifiesActor;
      return hasMacro && isOn;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollDamage", { item, roll });
    }
  });

  Hooks.on("dnd5e.rollToolCheck", async (item, roll) => {
    const effects = item.parent.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollToolCheck");
      const isOn = effect.modifiesActor;
      return hasMacro && isOn;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollToolcheck", { item, roll });
    }
  });
}
