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
    Handlebars.registerHelper('bpSelectOptions', function(choices, options) {
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


/* ============================================================ */
/* BLUE PLANET COMBAT — INITIATIVE                              */
/* ============================================================ */

const BP_SIMPLENPC_TABLE = {
    below:   { everyday: [3, 3],  exceptional: [6, 6],  elite: [7, 8]  },
    average: { everyday: [5, 5],  exceptional: [6, 7],  elite: [8, 9]  },
    above:   { everyday: [6, 5],  exceptional: [7, 7],  elite: [8, 10] },
};

class BluePlanetCombat extends Combat {

    /** Roll initiative for one or more combatants. */
    async rollInitiative(ids, options = {}) {
        if (!Array.isArray(ids)) ids = [ids];
        for (const id of ids) {
            const combatant = this.combatants.get(id);
            if (!combatant?.actor) continue;
            const av = await this._bpRollInitiative(combatant);
            if (av !== null && av !== undefined) {
                await combatant.update({ initiative: av });
            }
        }
        return this;
    }

    /** Re-roll initiative for every combatant. */
    async rollAll() {
        const ids = this.combatants.map(c => c.id);
        return this.rollInitiative(ids);
    }

    /** Re-roll initiative for combatants that have not yet acted. */
    async rollNPC() {
        const ids = this.combatants
            .filter(c => !c.actor || ["npc","creature","simplenpc"].includes(c.actor.type))
            .map(c => c.id);
        return this.rollInitiative(ids);
    }

    async _bpRollInitiative(combatant) {
        const actor = combatant.actor;
        if (!actor) return null;

        switch (actor.type) {
            case "character": return this._characterInitiative(actor, combatant.name);
            case "npc":       return this._attributeInitiative(actor, "coordination", combatant.name);
            case "creature":  return this._attributeInitiative(actor, "coordination", combatant.name);
            case "simplenpc": return this._simpleNPCInitiative(actor, combatant.name);
            default:          return null;
        }
    }

    /** Character: dialog to choose Coordination or Cognition. */
    async _characterInitiative(actor, name) {
        const attrs = actor.system.attributes;
        const coord = Number(attrs.coordination?.value) || 0;
        const cogn  = Number(attrs.cognition?.value)    || 0;

        return new Promise(resolve => {
            let rolling = false;
            new Dialog({
                title: `${name} — Initiative`,
                content: `
                    <form class="bp-roll-dialog">
                        <p style="margin:0 0 10px;font-family:'Barlow Condensed',sans-serif;font-size:1.05rem;">
                            Choose attribute for initiative test:
                        </p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                            <label style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #c9d6e3;border-radius:4px;cursor:pointer;background:#f4f7fb;">
                                <input type="radio" name="init-attr" value="coordination" checked/>
                                <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.95rem;">
                                    <strong>Coordination</strong> (${coord >= 0 ? '+' : ''}${coord})<br>
                                    <span style="font-size:0.8rem;color:#555;">TN ${5 + coord} — physical reflexes</span>
                                </span>
                            </label>
                            <label style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #c9d6e3;border-radius:4px;cursor:pointer;background:#f4f7fb;">
                                <input type="radio" name="init-attr" value="cognition"/>
                                <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.95rem;">
                                    <strong>Cognition</strong> (${cogn >= 0 ? '+' : ''}${cogn})<br>
                                    <span style="font-size:0.8rem;color:#555;">TN ${5 + cogn} — awareness / mental speed</span>
                                </span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Situational Modifier</label>
                            <input type="number" id="init-mod" value="0"/>
                        </div>
                    </form>`,
                buttons: {
                    roll: {
                        label: "ROLL INITIATIVE",
                        callback: async (html) => {
                            rolling = true;
                            const attrKey  = html.find('input[name="init-attr"]:checked').val();
                            const attrVal  = Number(actor.system.attributes[attrKey]?.value) || 0;
                            const sitMod   = Number(html.find('#init-mod').val()) || 0;
                            const tn       = 5 + attrVal + sitMod;
                            const roll     = new Roll("1d10");
                            await roll.evaluate();
                            const die      = roll.dice[0].results[0].result;
                            const av       = tn - die;
                            const label    = attrKey === "coordination" ? "Coordination" : "Cognition";
                            await this._postInitiativeChat(actor, label, attrVal, tn, die, av, sitMod, roll);
                            resolve(av);
                        }
                    },
                    cancel: { label: "Cancel", callback: () => { rolling = true; resolve(null); } }
                },
                default: "roll",
                close: () => { if (!rolling) resolve(null); }
            }).render(true);
        });
    }

    /** NPC / Creature: auto-roll using named attribute. */
    async _attributeInitiative(actor, attrKey, name) {
        const attrVal  = Number(actor.system.attributes[attrKey]?.value) || 0;
        const tn       = 5 + attrVal;
        const roll     = new Roll("1d10");
        await roll.evaluate();
        const die      = roll.dice[0].results[0].result;
        const av       = tn - die;
        const label    = attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
        await this._postInitiativeChat(actor, label, attrVal, tn, die, av, 0, roll);
        return av;
    }

    /** Quick NPC: use matrix attribute TN directly. */
    async _simpleNPCInitiative(actor, name) {
        const tier    = actor.system.tier  || "everyday";
        const level   = actor.system.level || "average";
        const attrTN  = BP_SIMPLENPC_TABLE[level]?.[tier]?.[0] ?? 5;
        const attrVal = attrTN - 5;
        const roll    = new Roll("1d10");
        await roll.evaluate();
        const die     = roll.dice[0].results[0].result;
        const av      = attrTN - die;
        await this._postInitiativeChat(actor, "Attribute", attrVal, attrTN, die, av, 0, roll);
        return av;
    }

    /** Post initiative roll result to chat. */
    async _postInitiativeChat(actor, attrLabel, attrVal, tn, die, av, sitMod = 0, roll = null) {
        const modStr = sitMod ? ` ${sitMod > 0 ? '+' : ''}${sitMod} situational` : '';
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            rolls: roll ? [roll] : [],
            content: `
                <div class="bp-chat-card">
                    <div class="bp-chat-header">${actor.name}
                        <span style="font-weight:400;font-size:0.85em;">(Initiative)</span>
                    </div>
                    <div class="bp-chat-body">
                        <div class="bp-chat-row">
                            <span class="bp-label">ATTR</span>
                            <span class="bp-value">${attrLabel} ${attrVal >= 0 ? '+' : ''}${attrVal}${modStr}</span>
                        </div>
                        <div class="bp-chat-row">
                            <span class="bp-label">TN / DICE</span>
                            <span class="bp-value">${tn} vs ${die}</span>
                        </div>
                        <div class="bp-chat-result ${die <= tn ? 'bp-success' : 'bp-failure'}">
                            AV <strong>${av >= 0 ? '+' : ''}${av}</strong>
                            <span class="bp-av">acts at count ${av}</span>
                        </div>
                    </div>
                </div>`
        });
    }
}

// Register custom Combat class
Hooks.once("init", function() {
    CONFIG.Combat.documentClass = BluePlanetCombat;
    CONFIG.Combat.initiative     = { formula: "1d10", decimals: 0 };
});

// Add Re-roll Initiative button to combat tracker
Hooks.on("renderCombatTracker", (app, html) => {
    if (!game.user.isGM) return;
    const combat = game.combat;
    if (!combat) return;

    const el = html instanceof HTMLElement ? html : html[0];
    if (!el) return;

    // Find the combat controls area
    const controls = el.querySelector(".combat-controls, .encounter-controls, header .controls");
    if (!controls) return;

    const btn = document.createElement("a");
    btn.classList.add("bp-reroll-initiative");
    btn.setAttribute("title", "Re-roll All Initiative");
    btn.innerHTML = '<i class="fas fa-dice-d10"></i> Re-roll Initiative';
    btn.style.cssText = "cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:3px 8px;background:#1b3f75;color:#e8f0fb;border-radius:4px;display:inline-flex;align-items:center;gap:5px;";

    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (game.combat) await game.combat.rollAll();
    });

    controls.appendChild(btn);
});

// Fix DocumentOwnershipConfig dialog.
// In V13.335+, DocumentOwnershipConfig was converted to ApplicationV2.
// AppV2 render hooks pass (app, context, options) — html lives on app.element.
Hooks.on("renderDocumentOwnershipConfig", (app, context, options) => {
    const el = app.element;
    if (!el) return;

    const LEVEL_MAP = {
        "inherit": -1, "default": -1,
        "none": 0, "limited": 1, "observer": 2, "owner": 3
    };
    const LABELS = { "-1": "Default", "0": "None", "1": "Limited", "2": "Observer", "3": "Owner" };
    const VALID  = new Set(["-1", "0", "1", "2", "3"]);

    const fixSelects = () => {
        el.querySelectorAll("select").forEach(select => {
            for (const option of select.options) {
                if (!VALID.has(option.value)) {
                    const guessed = LEVEL_MAP[option.text.toLowerCase().trim()];
                    option.value = guessed !== undefined ? String(guessed) : "-1";
                }
                if (LABELS[option.value]) option.text = LABELS[option.value];
            }
            if (!VALID.has(select.value)) select.value = "-1";
        });
    };

    fixSelects();

    const saveBtn = el.querySelector("button[data-action='save'], footer button");
    if (saveBtn) saveBtn.addEventListener("click", fixSelects, { once: true });
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