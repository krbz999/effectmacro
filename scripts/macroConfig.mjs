import { MODULE, TRIGGERS } from "./constants.mjs";
import { EffectMacroConfig } from "./main.mjs";

export function registerMacroConfig(){
    // slap button onto effect config.
    Hooks.on("renderActiveEffectConfig", async (config, html, data) => {
        const appendWithin = html[0].querySelector("section[data-tab=details]");

        // set up config[MODULE] and the array for the template.
        const usedOptions = setUsedOptions(config).map(key => {
            const label = `EFFECTMACRO.LABEL.${key}`;
            return { key, label };
        });
        const remainingOptions = getRemainingOptions(config).reduce((acc, key) => {
            const label = game.i18n.localize(`EFFECTMACRO.LABEL.${key}`);
            return acc + `<option value="${key}">${label}</option>`;
        }, "");
        
        const hr = document.createElement("HR");
        const div = document.createElement("DIV");
        const template = "modules/effectmacro/templates/effect-sheet.html";

        div.innerHTML = await renderTemplate(template, {
            remainingOptions,
            usedOptions
        });
        appendWithin.appendChild(hr);
        appendWithin.appendChild(div.firstChild);
        
        html[0].addEventListener("click", (event) => {
            const unusedButton = event.target.closest("#effectmacro-unusedOption");
            const usedButton = event.target.closest("#effectmacro-usedOption");
            let key;
            if ( unusedButton ) {
                key = html[0].querySelector("#effectmacro-unusedOption-select").value;
            } else if ( usedButton ) {
                key = usedButton.dataset.key;
            } else return;
            new EffectMacroConfig(config.document, { type: key }).render(true);
        });
        
        config.setPosition();
    });
}

function getRemainingOptions(config){
    return TRIGGERS.filter(key => {
        return !config[MODULE].includes(key);
    });
}

function setUsedOptions(config){
    const current = new Set(config[MODULE] ?? []);
    for ( const key of TRIGGERS ) {
        if ( !config.object.hasMacro(key) ) {
            current.delete(key);
        } else current.add(key);
    }
    
    config[MODULE] = Array.from(current);
    return config[MODULE];
}
