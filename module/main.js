import { BluePlanetCharacterData, BluePlanetNPCData, BluePlanetCreatureData, BluePlanetSimpleNPCData } from "./character-data.js";
import { BluePlanetActorSheet } from "./sheets/actor-sheet.js";
import { BluePlanetNPCSheet } from "./sheets/npc-sheet.js";
import { BluePlanetCreatureSheet } from "./sheets/creature-sheet.js";
import { BluePlanetSimpleNPCSheet } from "./sheets/simplenpc-sheet.js";
import { BluePlanetItemSheet } from "./sheets/item-sheet.js";
import { BLUEPLANET } from "./config.js";

Hooks.once("init", function() {
    console.log("BluePlanet | Initializing System...");

    // 1. REGISTER CONFIG
    CONFIG.BLUEPLANET = BLUEPLANET;

    // 2. Register Data Models
    CONFIG.Actor.dataModels.character = BluePlanetCharacterData;
    CONFIG.Actor.dataModels.npc = BluePlanetNPCData;
    CONFIG.Actor.dataModels.creature = BluePlanetCreatureData;
    CONFIG.Actor.dataModels.simplenpc = BluePlanetSimpleNPCData;

    // 3. Register Sheets
    Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
    Actors.registerSheet("blue-planet-recontact", BluePlanetActorSheet, {
        makeDefault: true,
        types: ["character"],
        label: "Blue Planet Character"
    });
    Actors.registerSheet("blue-planet-recontact", BluePlanetNPCSheet, {
        makeDefault: true,
        types: ["npc"],
        label: "Blue Planet NPC"
    });
    Actors.registerSheet("blue-planet-recontact", BluePlanetCreatureSheet, {
        makeDefault: true,
        types: ["creature"],
        label: "Blue Planet Creature"
    });
    Actors.registerSheet("blue-planet-recontact", BluePlanetSimpleNPCSheet, {
        makeDefault: true,
        types: ["simplenpc"],
        label: "Blue Planet Quick NPC"
    });

    Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
    Items.registerSheet("blue-planet-recontact", BluePlanetItemSheet, {
        makeDefault: true
    });

    // 4. Handlebars Helpers
    Handlebars.registerHelper('eq',  function(a, b) { return a === b; });
    Handlebars.registerHelper('lt',  function(a, b) { return a < b; });
    Handlebars.registerHelper('gt',  function(a, b) { return a > b; });
    Handlebars.registerHelper('lte', function(a, b) { return a <= b; });
    Handlebars.registerHelper('gte', function(a, b) { return a >= b; });
    Handlebars.registerHelper('ne',  function(a, b) { return a !== b; });
    Handlebars.registerHelper('or',  function() { return Array.prototype.slice.call(arguments, 0, -1).some(Boolean); });
    Handlebars.registerHelper('add', function(a, b) { return Number(a) + Number(b); });
    Handlebars.registerHelper('times', function(n, options) {
        let result = '';
        for (let i = 0; i < n; i++) result += options.fn({ index: i });
        return result;
    });
    Handlebars.registerHelper('selectOptions', function(choices, options) {
        let selected = options.hash.selected;
        let html = "";
        for (let [key, label] of Object.entries(choices)) {
            let isSelected = selected === key ? "selected" : "";
            html += `<option value="${key}" ${isSelected}>${label}</option>`;
        }
        return new Handlebars.SafeString(html);
    });

    // 5. Custom Features Setting
    game.settings.register("blue-planet-recontact", "customFeatures", {
        name: "Custom Features", scope: "world", config: false, type: Object, default: {},
        onChange: value => {
            if (CONFIG.BLUEPLANET?.featureCatalog) {
                CONFIG.BLUEPLANET.featureCatalog = { ...BLUEPLANET.featureCatalog, ...value };
            }
        }
    });

    if (CONFIG.BLUEPLANET?.featureCatalog) {
        const customFeatures = game.settings.get("blue-planet-recontact", "customFeatures");
        CONFIG.BLUEPLANET.featureCatalog = { ...BLUEPLANET.featureCatalog, ...customFeatures };
    }

    CONFIG.BLUEPLANET.addCustomFeature = async (key, data) => {
        const current = game.settings.get("blue-planet-recontact", "customFeatures");
        current[key] = data;
        await game.settings.set("blue-planet-recontact", "customFeatures", current);
    };
});

// Fix Create Actor dialog type dropdown labels.
// V13 sometimes renders type option text as [object Object] when typeLabels
// isn't fully resolved — this hook patches all options as a safety net.
Hooks.on("renderDialog", (dialog, html) => {
    setTimeout(() => {
        const select = document.querySelector("select[name='type']");
        if (!select) return;
        for (const option of select.options) {
            if (option.value === "character") option.text = "Character";
            if (option.value === "npc")       option.text = "NPC";
            if (option.value === "creature")  option.text = "Creature";
            if (option.value === "simplenpc") option.text = "Quick NPC";
            if (option.value === "0") { option.value = "character"; option.text = "Character"; }
            if (option.value === "1") { option.value = "npc";       option.text = "NPC"; }
            if (option.value === "2") { option.value = "creature";  option.text = "Creature"; }
            if (option.value === "3") { option.value = "simplenpc"; option.text = "Quick NPC"; }
        }
    }, 100);
});

Hooks.on("renderDialogV2", (dialog, html) => {
    setTimeout(() => {
        const select = html.querySelector("select[name='type']");
        if (!select) return;
        for (const option of select.options) {
            if (option.value === "character") option.text = "Character";
            if (option.value === "npc")       option.text = "NPC";
            if (option.value === "creature")  option.text = "Creature";
            if (option.value === "simplenpc") option.text = "Quick NPC";
            if (option.value === "0") { option.value = "character"; option.text = "Character"; }
            if (option.value === "1") { option.value = "npc";       option.text = "NPC"; }
            if (option.value === "2") { option.value = "creature";  option.text = "Creature"; }
            if (option.value === "3") { option.value = "simplenpc"; option.text = "Quick NPC"; }
        }
    }, 100);
});