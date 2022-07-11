# Effect Macro

A module that allows users to embed macros directly into effects.

These macros are then called automatically when the appropriate trigger happens. The options are:
* When an effect is created.
* When an effect is deleted.
* When an effect is toggled (on, off, or both).
* When the actor who has the effect starts their turn.
* When the actor who has the effect ends their turn.

An effect can have a macro of any of these types, not just one. There is also the static 'never' type meant for being explicitly called by other scripts. This type is never called automatically.

## How to
Macros are added in the ActiveEffect config. Selecting the type of trigger and clicking the arrow (or green check if there is a preexisting macro) opens a macro editor. When an embedded macro is triggered, it is executed for the user who caused the trigger.

![effect-macro-dropdown](https://user-images.githubusercontent.com/50169243/178143073-d4f1ddaa-edb4-4ecb-b4b8-152f06e5db36.png)

### Added functions
A set of functions have been added to active effects.
* `ActiveEffect#callMacro(type = "never", context = {})` calls a macro embedded in the effect of the specific type. The `context` object can be used to pass additional parameters to the script, and can be referenced with `this`.
* `ActiveEffect#hasMacro(type = "never")` returns true or false whether or not an effect has a macro of the given type.
* `ActiveEffect#removeMacro(type = "never")` removes a macro of the given type from the effect.
* `ActiveEffect#createMacro(type = "never", script)` creates an embedded macro of the given type inside the effect. Identical to using the provided interface and writing a macro there. The provided script must be a string.
* `ActiveEffect#updateMacro(type = "never", script)` updates a macro of the given type on an effect. In most cases functionally identical to `createMacro`, and will remove the embedded macro if no script is provided. The provided script must be a string.

### Script Helpers
By default, these variables are pre-defined in any effect macro.
* `actor`, the owner of the effect.
* `character`, the assigned character of the user who triggered the macro (if they have any), otherwise the owner of the effect.
* `token`, the actor's token on the scene.
* `scene`, the current scene where `token` exists, otherwise the currently active scene.
* `origin`, the actor or item who is the origin of the effect (as seen under Source in the Effects tab of the actor), otherwise the owner of the effect.
* `effect`, the active effect itself.
