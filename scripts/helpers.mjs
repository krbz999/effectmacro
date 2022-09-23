// return true or false if you, the user, should run the scripts on this actor.
export function should_I_run_this(actor){
    let user;
    const { OWNER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;
    
    // find a non-GM who is active and owner of the actor.
    user = game.users.find(i => {
        const a = !i.isGM;
        const b = i.active;
        const c = actor.testUserPermission(i, OWNER);
        return a && b && c;
    });
    if ( user ) return user === game.user;
    
    // find a GM who is active and owner of the actor.
    user = game.users.find(i => {
        const a = i.isGM;
        const b = i.active;
        return a && b;
    });
    return user === game.user;
}
