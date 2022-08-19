import { MODULE, TRIGGERS } from "./constants.mjs";
import { EffectMacroConfig } from "./main.mjs";

export function registerMacroConfig(){
    // slap button onto effect config dialog.
    Hooks.on("renderActiveEffectConfig", async (dialog, html, data) => {
        const effect = dialog.object;
        
        const appendWithin = html[0].querySelector("section[data-tab=details]");
        const arrow = "fa-arrow-right";
        const check = "fa-check";

        const options = TRIGGERS.map(key => {
            const selected = foundry.utils.getProperty(dialog, `${MODULE}.lastUpdated`) === key && "selected";
            const label = game.i18n.localize(`EffectMacro.Label.${key}`);
            const optionClass = effect.hasMacro(key) ? "effectmacro-option-has-macro" : "effectmacro-option-no-macro";
            return {key, selected, label, optionClass};
        }).sort((a,b) => {
            return effect.hasMacro(b.key) - effect.hasMacro(a.key);
        });
        
        const hr = document.createElement("HR");
        const div = document.createElement("DIV");
        div.innerHTML = await renderTemplate("modules/effectmacro/templates/effect-sheet.html", {options});
        appendWithin.appendChild(hr);
        appendWithin.appendChild(div.firstChild);
        const update_fas_fa = () => {
            const has_macro = effect.hasMacro(html[0].querySelector(".effectmacro-config-select").value);

            const button = html[0].querySelector(".effectmacro-config-button > .fas");
            
            if( has_macro ) button.classList.replace(arrow, check);
            if(!has_macro ) button.classList.replace(check, arrow);
        }
        update_fas_fa();
        
        html[0].querySelector(".effectmacro-config-select").addEventListener("change", update_fas_fa);
        
        html[0].querySelector(".effectmacro-config-button").addEventListener("click", () => {
            const type = html[0].querySelector(".effectmacro-config-select").value;
            foundry.utils.setProperty(dialog, `${MODULE}.lastUpdated`, type);
            new EffectMacroConfig(dialog.document, {type}).render(true);
        });
        
        dialog.element.css("height", "auto");
    });
}
