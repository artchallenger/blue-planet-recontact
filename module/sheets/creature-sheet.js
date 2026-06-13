export class BluePlanetCreatureSheet extends foundry.appv1.sheets.ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["blueplanet", "sheet", "actor", "creature"],
            template: "systems/blue-planet-recontact/templates/actor/creature-sheet.hbs",
            width: 440,
            height: 620,
            resizable: true
        });
    }

    getData() {
        const context = super.getData();
        context.system = this.actor.system;
        context.actor  = this.actor;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.injury-dots .injury-val').click(this._onWoundClick.bind(this));
        html.find('.creature-attr-roll').click(this._onAttrRoll.bind(this));
    }

    /* -------------------------------------------- */
    /* WOUND PIPS                                   */
    /* -------------------------------------------- */

    async _onWoundClick(event) {
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
    /* ATTRIBUTE ROLL                               */
    /* -------------------------------------------- */

    async _onAttrRoll(event) {
        event.preventDefault();
        const attrKey  = event.currentTarget.dataset.attr;
        const attrVal  = Number(this.actor.system.attributes[attrKey]?.value) || 0;
        const attrLabel = attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
        const wounds   = this.actor.system.wounds;
        const woundPenalty = -(
            wounds.minor.value +
            wounds.major.value * 2 +
            wounds.mortal.value * 3
        );
        const baseTN = 5 + attrVal + woundPenalty;

        new Dialog({
            title: `${this.actor.name} — ${attrLabel} Test`,
            content: `
                <form class="bp-roll-dialog">
                    <p style="margin:0 0 8px;font-family:'Barlow Condensed',sans-serif;font-size:1.05rem;">
                        <strong>${this.actor.name}</strong> — ${attrLabel} (${attrVal >= 0 ? '+' : ''}${attrVal})
                        ${woundPenalty < 0 ? `<span style="color:#c9302c;"> — Wounds: ${woundPenalty}</span>` : ''}
                    </p>
                    <p style="margin:0 0 8px;font-size:0.85rem;color:#555;">TN: 5 + ${attrVal}${woundPenalty < 0 ? ' ' + woundPenalty + ' wounds' : ''} = <strong>${baseTN}</strong></p>
                    <div class="form-group">
                        <label>Situational Modifier</label>
                        <input type="number" id="sit-mod" value="0"/>
                    </div>
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

                        const outcome = av >= 5
                            ? `<div class="bp-chat-special bp-benefit">▲ BENEFIT</div>`
                            : av === 0 ? `<div class="bp-chat-special bp-complication">▼ COMPLICATION</div>`
                            : av <= -5 ? `<div class="bp-chat-special bp-consequence">▼ CONSEQUENCE</div>` : "";

                        await ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            rolls: [roll],
                            content: `
                                <div class="bp-chat-card">
                                    <div class="bp-chat-header">${this.actor.name} <span style="font-weight:400;font-size:0.85em;">(${attrLabel})</span></div>
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