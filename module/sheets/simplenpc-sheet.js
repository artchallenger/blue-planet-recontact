const TABLE = {
    below:   { everyday: [3, 3],  exceptional: [6, 6],  elite: [7, 8]  },
    average: { everyday: [5, 5],  exceptional: [6, 7],  elite: [8, 9]  },
    above:   { everyday: [6, 5],  exceptional: [7, 7],  elite: [8, 10] },
};

export class BluePlanetSimpleNPCSheet extends foundry.appv1.sheets.ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["blueplanet", "sheet", "actor", "simplenpc"],
            template: "systems/blue-planet-recontact/templates/actor/simplenpc-sheet.hbs",
            width: 380,
            height: 580,
            resizable: true
        });
    }

    getData() {
        const context = super.getData();
        context.system = this.actor.system;
        context.actor  = this.actor;
        const [attrTN, skillTN] = this._getTNs();
        context.attrTN  = attrTN;
        context.skillTN = skillTN;
        return context;
    }

    _getTNs() {
        const { tier, level } = this.actor.system;
        return TABLE[level]?.[tier] ?? [5, 5];
    }

    _getWoundPenalty() {
        const w = this.actor.system.wounds;
        return (w.minor ? -1 : 0) + (w.major ? -2 : 0) + (w.mortal ? -3 : 0);
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.simplenpc-wound-pip').click(this._onWoundClick.bind(this));
        html.find('.snpc-attr-roll').click(this._onAttrRoll.bind(this));
        html.find('.snpc-skill-roll').click(this._onSkillRoll.bind(this));
        html.find('.snpc-physique-roll').click(this._onPhysiqueRoll.bind(this));
    }

    /* -------------------------------------------- */
    /* WOUNDS                                       */
    /* -------------------------------------------- */

    async _onWoundClick(event) {
        event.preventDefault();
        const type = event.currentTarget.dataset.wound;
        const w    = foundry.utils.deepClone(this.actor.system.wounds);
        w[type]    = !w[type];
        await this.actor.update({ 'system.wounds': w });
    }

    /* -------------------------------------------- */
    /* ROLLS                                        */
    /* -------------------------------------------- */

    async _onAttrRoll(event) {
        event.preventDefault();
        const [attrTN] = this._getTNs();
        await this._doRoll(attrTN, 1, "Attribute Test");
    }

    async _onSkillRoll(event) {
        event.preventDefault();
        const dice     = Number(event.currentTarget.dataset.dice) || 1;
        const [, skillTN] = this._getTNs();
        const tierName = dice === 1 ? "General" : dice === 2 ? "Core" : "Specialty";
        await this._doRoll(skillTN, dice, `${tierName} Skill (${dice}d10)`);
    }

    async _onPhysiqueRoll(event) {
        event.preventDefault();
        const [attrTN] = this._getTNs();
        const isMortal = this.actor.system.wounds.mortal;
        await this._doRoll(attrTN, 1, isMortal ? "Physique — Survival" : "Physique — Incapacitation", true);
    }

    async _doRoll(baseTN, diceCount, label, isPhysique = false) {
        const woundPenalty = this._getWoundPenalty();

        const dialogContent = `
            <form class="bp-roll-dialog">
                <p style="margin:0 0 8px;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
                    <strong>${this.actor.name}</strong> — ${label}
                </p>
                <p style="margin:0 0 8px;font-size:0.85rem;color:#555;">
                    Base TN: ${baseTN}${woundPenalty < 0 ? ` <span style="color:#c9302c;">Wounds: ${woundPenalty}</span>` : ''}
                </p>
                <div class="form-group">
                    <label>Situational Modifier</label>
                    <input type="number" id="sit-mod" value="0"/>
                </div>
            </form>`;

        new Dialog({
            title: `${this.actor.name} — ${label}`,
            content: dialogContent,
            buttons: {
                roll: {
                    label: "ROLL",
                    callback: async (html) => {
                        const sitMod  = Number(html.find('#sit-mod').val()) || 0;
                        const finalTN = baseTN + woundPenalty + sitMod;

                        const roll    = new Roll(`${diceCount}d10`);
                        await roll.evaluate();
                        const results = roll.dice[0].results.map(r => r.result);
                        const lowest  = Math.min(...results);
                        const success = lowest <= finalTN;
                        const av      = finalTN - lowest;

                        let outcomeHTML = "";
                        if (isPhysique) {
                            const isMortal = this.actor.system.wounds.mortal;
                            if (isMortal) {
                                outcomeHTML = success
                                    ? `<div class="bp-chat-special bp-benefit">SURVIVES — still incapacitated</div>`
                                    : `<div class="bp-chat-special bp-consequence">DOES NOT SURVIVE</div>`;
                            } else {
                                outcomeHTML = success
                                    ? `<div class="bp-chat-special bp-benefit">FIGHTING FIT — acting at −2</div>`
                                    : `<div class="bp-chat-special bp-complication">INCAPACITATED by major wound</div>`;
                            }
                        } else {
                            if (av >= 5)  outcomeHTML = `<div class="bp-chat-special bp-benefit">▲ BENEFIT</div>`;
                            if (av === 0) outcomeHTML = `<div class="bp-chat-special bp-complication">▼ COMPLICATION</div>`;
                            if (av <= -5) outcomeHTML = `<div class="bp-chat-special bp-consequence">▼ CONSEQUENCE</div>`;
                        }

                        const tnNote = `${baseTN} base${woundPenalty < 0 ? ' ' + woundPenalty + ' wounds' : ''}${sitMod ? (sitMod > 0 ? ' +' : ' ') + sitMod + ' situational' : ''}`;

                        await ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            rolls: [roll],
                            content: `
                                <div class="bp-chat-card">
                                    <div class="bp-chat-header">${this.actor.name} <span style="font-weight:400;font-size:0.85em;">(${label})</span></div>
                                    <div class="bp-chat-body">
                                        <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnNote}">ⓘ</span></span></div>
                                        <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${diceCount}d10 [${results.join(', ')}]${diceCount > 1 ? ` — lowest: ${lowest}` : ''}</span></div>
                                        <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${av >= 0 ? '+' : ''}${av}</span></div>
                                        ${outcomeHTML}
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