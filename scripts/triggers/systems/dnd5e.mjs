export function dnd5eTriggers() {
  Hooks.on("dnd5e.rollAttack", async (item, roll, ammoUpdate) => {
    const effects = item.parent.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollAttack");
      if (!hasMacro) return false;
      const isOn = effect.modifiesActor;
      if (!isOn) return false;
      return true;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollAttack", { item, roll, ammoUpdate });
    }
  });

  Hooks.on("dnd5e.rollAbilitySave", async (actor, roll, abilityId) => {
    const effects = actor.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollAbilitySave");
      if (!hasMacro) return false;
      const isOn = effect.modifiesActor;
      if (!isOn) return false;
      return true;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollAbilitySave", { roll, abilityId });
    }
  });

  Hooks.on("dnd5e.rollAbilityTest", async (actor, roll, abilityId) => {
    const effects = actor.effects.filter(effect => {
      const hasMacro = effect.hasMacro("dnd5e.rollAbilityTest");
      if (!hasMacro) return false;
      const isOn = effect.modifiesActor;
      if (!isOn) return false;
      return true;
    });
    for (const effect of effects) {
      await effect.callMacro("dnd5e.rollAbilityTest", { roll, abilityId });
    }
  });
}
