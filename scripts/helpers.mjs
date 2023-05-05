/**
 * Get whether you, the user, should run the scripts on this actor.
 * @param {Actor} actor     The actor who has the effects.
 * @returns {boolean}       Whether you are the proper user to execute the scripts.
 */
export function should_I_run_this(actor) {
  if (!actor) return false;

  // find a non-GM who is active and owner of the actor.
  let user = game.users.find(i => !i.isGM && i.active && actor.testUserPermission(i, "OWNER"));
  if (user) return user === game.user;

  // find a GM who is active.
  user = game.users.find(i => i.isGM && i.active);
  return user === game.user;
}
