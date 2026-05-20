/**
 * Actor sheet for Blue Planet NPC actors.
 * Single-page, no tabs, no strain, no gear.
 */
export class BluePlanetNPCSheet extends foundry.appv1.sheets.ActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["blueplanet", "sheet", "actor", "npc"],
            template: "systems/blue-planet-recontact/templates/actor/npc-sheet.hbs",
            width: 480,
            height: 680,
            resizable: true
        });
    }

    /** @override */
    getData() {
        const context = super.getData();
        context.system = this.actor.system;
        context.actor  = this.actor;

        // Wound penalty for display
        const wounds = context.system.wounds;
        const woundPenalty = -(wounds.minor.value + wounds.major.value * 2 + wounds.mortal.value * 3);
        context.woundPenalty = woundPenalty;

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // WOUND PIPS
        html.find('.injury-dots .injury-val').click(this._onNPCWoundClick.bind(this));

        // SKILL ADD
        html.find('.npc-skill-add-btn').click(this._onSkillAdd.bind(this));
        html.find('.npc-skill-tier-input, .npc-skill-rank-input').on('keydown', (e) => {
            if (e.key === 'Enter') this._onSkillAdd(e);
        });

        // SKILL DELETE
        html.find('.npc-skill-delete').click(this._onSkillDelete.bind(this));

        // SKILL ROLL
        html.find('.npc-skill-roll').click(this._onSkillRoll.bind(this));

        // TRAUMA / STUN
        html.find('.trauma-roll-btn').click(this._onTraumaRoll.bind(this));
        html.find('.stun-roll-btn').click(this._onStunRoll.bind(this));
    }

    /* -------------------------------------------- */
    /* WOUND PIPS                                   */
    /* -------------------------------------------- */

    async _onNPCWoundClick(event) {
        event.preventDefault();
        const dot       = event.currentTarget;
        const container = dot.closest('.injury-dots');
        const type      = container.dataset.woundType;
        const idx       = Number(dot.dataset.index);
        const current   = this.actor.system.wounds[type].value;
        const newVal    = current === idx ? idx - 1 : idx;
        await this.actor.update({ [`system.wounds.${type}.value`]: newVal });
    }

    /* -------------------------------------------- */
    /* SKILL MANAGEMENT                             */
    /* -------------------------------------------- */

    async _onSkillAdd(event) {
        event.preventDefault();
        const rank      = this.element.find('#npc-skill-rank')[0];
        const general   = this.element.find('#npc-skill-general')[0];
        const core      = this.element.find('#npc-skill-core')[0];
        const specialty = this.element.find('#npc-skill-specialty')[0];

        const rankVal = rank.value.trim();
        const genVal  = general.value.trim();
        const coreVal = core.value.trim();
        const specVal = specialty.value.trim();

        if (!rankVal || !genVal) return; // rank and general are required

        const parts = [genVal, coreVal, specVal].filter(Boolean);
        const val   = `${rankVal} • ${parts.join(' → ')}`;

        const skills = foundry.utils.deepClone(this.actor.system.skills || []);
        skills.push(val);
        await this.actor.update({ 'system.skills': skills });

        // Clear inputs
        rank.value = '';
        general.value = '';
        core.value = '';
        specialty.value = '';
        rank.focus();
    }

    async _onSkillDelete(event) {
        event.preventDefault();
        const idx    = Number(event.currentTarget.dataset.index);
        const skills = foundry.utils.deepClone(this.actor.system.skills || []);
        skills.splice(idx, 1);
        await this.actor.update({ 'system.skills': skills });
    }

    /* -------------------------------------------- */
    /* SKILL SET ROLL                               */
    /* -------------------------------------------- */

    async _onSkillRoll(event) {
        event.preventDefault();
        const idx      = Number(event.currentTarget.dataset.index);
        const skillStr = this.actor.system.skills[idx] || "";
        const wounds   = this.actor.system.wounds;
        const woundPenalty = -(
            wounds.minor.value +
            wounds.major.value * 2 +
            wounds.mortal.value * 3
        );

        // Parse "5 • Charismatic Leader → Submarine Captain → Vengeful Megalomaniac"
        const rankMatch = skillStr.match(/^(\d+)\s*[•·]\s*/);
        const rank      = rankMatch ? Number(rankMatch[1]) : 0;
        const remainder = skillStr.replace(/^\d+\s*[•·]\s*/, '');
        const parts     = remainder.split(/\s*→\s*/);
        const general   = parts[0]?.trim() || "General";
        const core      = parts[1]?.trim() || "Core";
        const specialty = parts[2]?.trim() || "Specialty";

        // Attribute options
        const attrOptions = Object.entries(this.actor.system.attributes)
            .map(([k, a]) => `<option value="${a.value}">${a.label} (${a.value >= 0 ? '+' : ''}${a.value})</option>`)
            .join('');

        const dialogContent = `
            <form class="bp-roll-dialog">
                <p style="margin:0 0 8px;font-family:'Barlow Condensed',sans-serif;font-size:1.05rem;">
                    <strong>${this.actor.name}</strong> — Rank ${rank}
                    ${woundPenalty < 0 ? `<span style="color:#c9302c;"> — Wounds: ${woundPenalty}</span>` : ''}
                </p>
                <div class="form-group" style="margin-bottom:10px;">
                    <label style="font-weight:700;font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:#1b3f75;">Tier</label>
                    <div style="display:flex;gap:6px;margin-top:4px;">
                        <label style="flex:1;display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid #c9d6e3;border-radius:3px;cursor:pointer;background:#f4f7fb;">
                            <input type="radio" name="tier" value="1" checked/>
                            <span style="font-family:'Barlow Condensed',sans-serif;"><strong>1d10</strong> — ${general}</span>
                        </label>
                        <label style="flex:1;display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid #c9d6e3;border-radius:3px;cursor:pointer;background:#f4f7fb;">
                            <input type="radio" name="tier" value="2"/>
                            <span style="font-family:'Barlow Condensed',sans-serif;"><strong>2d10</strong> — ${core}</span>
                        </label>
                        <label style="flex:1;display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid #c9d6e3;border-radius:3px;cursor:pointer;background:#f4f7fb;">
                            <input type="radio" name="tier" value="3"/>
                            <span style="font-family:'Barlow Condensed',sans-serif;"><strong>3d10</strong> — ${specialty}</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Governing Attribute</label>
                    <select id="npc-attr-select">
                        <option value="0">None (0)</option>
                        ${attrOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Situational Modifier</label>
                    <input type="number" id="npc-sit-mod" value="0"/>
                </div>
            </form>`;

        new Dialog({
            title: `${this.actor.name} — Skill Set Roll`,
            content: dialogContent,
            buttons: {
                roll: {
                    label: "ROLL",
                    callback: async (html) => {
                        const diceCount  = Number(html.find('input[name="tier"]:checked').val()) || 1;
                        const attrVal    = Number(html.find('#npc-attr-select').val()) || 0;
                        const sitMod     = Number(html.find('#npc-sit-mod').val()) || 0;
                        const finalTN    = 5 + attrVal + rank + sitMod + woundPenalty;
                        const tierLabel  = diceCount === 1 ? general : diceCount === 2 ? core : specialty;
                        const tierName   = diceCount === 1 ? "General" : diceCount === 2 ? "Core" : "Specialty";

                        const roll        = new Roll(`${diceCount}d10`);
                        await roll.evaluate();
                        const results     = roll.dice[0].results.map(r => r.result);
                        const lowestDie   = Math.min(...results);
                        const success     = lowestDie <= finalTN;
                        const av          = finalTN - lowestDie;

                        const outcome = av >= 5
                            ? `<div class="bp-chat-special bp-benefit">▲ BENEFIT</div>`
                            : av === 0 ? `<div class="bp-chat-special bp-complication">▼ COMPLICATION</div>`
                            : av <= -5 ? `<div class="bp-chat-special bp-consequence">▼ CONSEQUENCE</div>` : "";

                        const tnBreakdown = `5 base + ${attrVal} attr + ${rank} rank${sitMod ? (sitMod > 0 ? ' +' : ' ') + sitMod + ' situational' : ''}${woundPenalty < 0 ? ' ' + woundPenalty + ' wounds' : ''}`;

                        await ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            content: `
                                <div class="bp-chat-card">
                                    <div class="bp-chat-header">${this.actor.name} <span style="font-weight:400;font-size:0.85em;">(${tierName})</span></div>
                                    <div class="bp-chat-body">
                                        <div class="bp-chat-row"><span class="bp-label">SKILL</span><span class="bp-value">${tierLabel}</span></div>
                                        <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnBreakdown}">ⓘ</span></span></div>
                                        <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${diceCount}d10 [${results.join(', ')}] — lowest: ${lowestDie}</span></div>
                                        <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${av >= 0 ? '+' : ''}${av}</span></div>
                                        ${outcome}
                                    </div>
                                </div>`
                        });
                    }
                }
            },
            default: "roll"
        }).render(true);
    }

    /* -------------------------------------------- */
    /* TRAUMA ROLL                                  */
    /* -------------------------------------------- */

    async _onTraumaRoll(event) {
        event.preventDefault();
        const physVal   = Number(this.actor.system.attributes.physique?.value) || 0;
        const woundMod  = -3;
        const baseTN    = 5 + physVal + woundMod;

        new Dialog({
            title: "Trauma Roll",
            content: `
                <form class="bp-roll-dialog">
                    <p style="margin:0 0 6px;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
                        <strong>Trauma Roll</strong> — Physique (${physVal}) − 3 = TN ${baseTN}
                    </p>
                    <div class="form-group"><label>Situational Modifier</label><input type="number" id="sit-mod" value="0"/></div>
                </form>`,
            buttons: {
                roll: {
                    label: "ROLL",
                    callback: async (html) => {
                        const sitMod  = Number(html.find('#sit-mod').val()) || 0;
                        const finalTN = baseTN + sitMod;
                        const roll    = new Roll("1d10");
                        await roll.evaluate();
                        const die     = roll.dice[0].results[0].result;
                        const success = die <= finalTN;
                        const av      = finalTN - die;

                        const outcome = success
                            ? `<div class="bp-chat-special bp-benefit">WOUND NOT LETHAL — Make a Stun Test (−3) to act.</div>`
                            : av > -5
                            ? `<div class="bp-chat-special bp-complication">DYING — ${5 - Math.abs(av)} min until death.</div>`
                            : `<div class="bp-chat-special bp-consequence">INSTANTLY FATAL</div>`;

                        await ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            content: `
                                <div class="bp-chat-card">
                                    <div class="bp-chat-header">Trauma Roll — ${this.actor.name}</div>
                                    <div class="bp-chat-body">
                                        <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN}</span></div>
                                        <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${die}</span></div>
                                        <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${av >= 0 ? '+' : ''}${av}</span></div>
                                        ${outcome}
                                    </div>
                                </div>`
                        });
                    }
                }
            },
            default: "roll"
        }).render(true);
    }

    /* -------------------------------------------- */
    /* STUN TEST                                    */
    /* -------------------------------------------- */

    async _onStunRoll(event) {
        event.preventDefault();
        const psychVal  = Number(this.actor.system.attributes.psyche?.value) || 0;
        const woundMod  = -2;
        const baseTN    = 5 + psychVal + woundMod;

        new Dialog({
            title: "Stun Test",
            content: `
                <form class="bp-roll-dialog">
                    <p style="margin:0 0 6px;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
                        <strong>Stun Test</strong> — Psyche (${psychVal}) − 2 = TN ${baseTN}
                    </p>
                    <div class="form-group"><label>Situational Modifier</label><input type="number" id="sit-mod" value="0"/></div>
                </form>`,
            buttons: {
                roll: {
                    label: "ROLL",
                    callback: async (html) => {
                        const sitMod  = Number(html.find('#sit-mod').val()) || 0;
                        const finalTN = baseTN + sitMod;
                        const roll    = new Roll("1d10");
                        await roll.evaluate();
                        const die     = roll.dice[0].results[0].result;
                        const success = die <= finalTN;
                        const av      = finalTN - die;
                        const dur     = Math.abs(av);

                        const outcome = success
                            ? `<div class="bp-chat-special bp-benefit">SUCCESS — Act normally.</div>`
                            : av > -5
                            ? `<div class="bp-chat-special bp-complication">FAIL — Conscious, no test actions. ${dur} min.</div>`
                            : `<div class="bp-chat-special bp-consequence">FAIL — Incapacitated. ${dur} min.</div>`;

                        await ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            content: `
                                <div class="bp-chat-card">
                                    <div class="bp-chat-header">Stun Test — ${this.actor.name}</div>
                                    <div class="bp-chat-body">
                                        <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN}</span></div>
                                        <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${die}</span></div>
                                        <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${av >= 0 ? '+' : ''}${av}</span></div>
                                        ${outcome}
                                    </div>
                                </div>`
                        });
                    }
                }
            },
            default: "roll"
        }).render(true);
    }
}