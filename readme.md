Interested in following along with development of any of my modules? Join the [Discord server](https://discord.gg/QAG8eWABGT).

# Effect Macro
A module that allows users to embed macros directly into effects.
These macros are then called automatically when the appropriate trigger happens. The options are:

- When an effect is created.
- When an effect is deleted.
- When an effect is toggled (on, off, or both).
- When the actor who has the effect starts their turn.
- When the actor who has the effect ends their turn.
- At the start of any combatant's turn.
- At the start of every round.
- At the end of every round.
- When the actor who has the effect is marked defeated in combat.
- When combat is started.
- When combat is ended.

An effect can have a macro of any of these types, not just one. There is also the static 'never' type meant for being explicitly called by other scripts. This type is never called automatically.

## How to
Macros are added in the ActiveEffect config. Selecting the type of trigger and clicking 'Add Macro' (or 'Edit Macro' for an existing macro) opens a macro editor.
When an embedded macro is triggered, it is executed for the owner of the actor who has the effect. If no such owner, then it is executed as if by the GM.

The module will automatically iterate over all effects that *currently affect the actor*.

## Script Helpers
By default, these variables are pre-defined in any effect macro.
* `effect`: The effect itself.
* `actor`: The actor who owns the effect (even if the effect is on an item). If no actor, then `null`.
* `character`: The user's assigned actor. If no assigned actor, then `null`.
* `token`: If the actor is synthetic (unlinked), then `token` is the is the token placeable on the actor's scene, otherwise the first token found on the currently viewed scene belonging to `actor`. If none found, then `null`.
* `scene`: The scene on which `token` is embedded. If there is no token, then the currently active scene is used. If no scene, then `null`.
* `origin`: The document that `ActiveEffect#origin` points to. If no such thing, then `null`.
* `speaker`: The 'speaker' object normally used in chat messages, speaking as the `actor` if they exist.
* `item`: If the effect is on an item and not an actor, this is that, otherwise `null`.

## System Specific Triggers
The module works in every system that has Active Effect support, however it can leverage system-specific hooks as well, if added. The module is open to contributions for this purpose.
