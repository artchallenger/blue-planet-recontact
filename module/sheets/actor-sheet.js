/**
 * Extend the basic ActorSheet to handle Blue Planet specific logic.
 * @extends {foundry.appv1.sheets.ActorSheet}
 */
export class BluePlanetActorSheet extends foundry.appv1.sheets.ActorSheet {

  /** @override */
 static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blueplanet", "sheet", "actor"],
      template: "systems/blue-planet-recontact/templates/actor/actor-sheet.hbs",
      width: 850,
      height: 750,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }],
      dragDrop: [{ dragSelector: ".item", dropSelector: null }]
    });
  }

  /** @override */
  async getData() {
    const context = await super.getData();
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;
    context.flags  = actorData.flags;

    // --- PLAY MODE ---
    const isPlayMode = this.actor.getFlag("blue-planet-recontact", "playMode") || false;
    context.isEditing = !isPlayMode;

    // --- PIPS ---
    const buildPips = (current, max) => {
      const pips = [];
      for (let i = 0; i < max; i++) pips.push({ index: i, filled: i < current });
      return pips;
    };

    context.pips = {
      mental:   buildPips(context.system.strain.mental.value,   context.system.strain.mental.max),
      physical: buildPips(context.system.strain.physical.value, context.system.strain.physical.max),
      minor:  buildPips(context.system.wounds.minor.value,  context.system.wounds.minor.max).map((p, i)  => ({ ...p, penaltyDisplay: `-${i + 1}` })),
      major:  buildPips(context.system.wounds.major.value,  context.system.wounds.major.max).map((p, i)  => ({ ...p, penaltyDisplay: `-${(i + 1) * 2}` })),
      mortal: buildPips(context.system.wounds.mortal.value, context.system.wounds.mortal.max).map((p, i) => ({ ...p, penaltyDisplay: `-${(i + 1) * 3}` })),
      chips:  buildPips(context.system.chips ?? 0, 25)
    };

    // --- CHIPS GROUPS (5x5) ---
    const chipsAll = context.pips.chips;
    context.chipsGroups = [0,1,2,3,4].map(g => ({
      pips: chipsAll.slice(g * 5, g * 5 + 5)
    }));

    // --- REPUTATION GROUPS ---
    const repValue = context.system.reputation?.value ?? 0;
    const repLabels = ['label1','label2','label3','label4','label5'];
    const repDefaults = ['Unknown','Rumored','Notable','(In)Famous','Renowned'];
    context.repGroups = repLabels.map((lk, i) => ({
      labelKey: lk,
      label: context.system.reputation?.[lk] ?? repDefaults[i],
      pips: buildPips(Math.min(Math.max(repValue - i * 5, 0), 5), 5).map((p) => ({
        ...p,
        index: i * 5 + p.index
      }))
    }));

    // --- WOUND PENALTY ---
    context.woundPenalty =
      (context.system.wounds.minor.value  * -1) +
      (context.system.wounds.major.value  * -2) +
      (context.system.wounds.mortal.value * -3);

    // --- SKILL SET ROWS ---
    const skillSetOrder = [
      "origin", "background", "occupation", "experiential", "developmental",
      "exceptional", "elite", "advancement1", "advancement2", "advancement3"
    ];
    context.skillSetRows = skillSetOrder.map(key => ({
      key,
      label:     context.system.skillSets?.[key]?.label     ?? key,
      rank:      context.system.skillSets?.[key]?.rank      ?? 0,
      general:   context.system.skillSets?.[key]?.general   ?? "",
      core:      context.system.skillSets?.[key]?.core      ?? "",
      specialty: context.system.skillSets?.[key]?.specialty ?? ""
    }));

    // --- TRACK LIST ---
    context.trackList = ["track1", "track2", "track3"].map(key => ({
      id:    key,
      label: context.system.tracks[key]?.label ?? key,
      value: context.system.tracks[key]?.value ?? 3,
      line5: context.system.tracks[key]?.line5 ?? "",
      line4: context.system.tracks[key]?.line4 ?? "",
      line3: context.system.tracks[key]?.line3 ?? "",
      line2: context.system.tracks[key]?.line2 ?? "",
      line1: context.system.tracks[key]?.line1 ?? ""
    }));

    // --- TAGS ---
    context.tags = this.actor.items
      .filter(i => i.type === "tag")
      .sort((a, b) => a.sort - b.sort);

// --- TIES ---
    context.ties = this.actor.items
      .filter(i => i.type === "tie")
      .sort((a, b) => a.sort - b.sort);

    // --- GEAR TAB ---
    context.weapons = this.actor.items.filter(i => i.type === "weapon");
    context.ammo    = this.actor.items.filter(i => i.type === "ammo");
    context.armor   = this.actor.items.filter(i => i.type === "armor");
    context.biomods = this.actor.items.filter(i => i.type === "biomod");
    context.gear    = this.actor.items.filter(i => i.type === "gear");

    return context;
  }

  /** @override */
  activateListeners(html) {
super.activateListeners(html);

// PLAY MODE TOGGLE
    html.find('.edit-mode-toggle').click(this._onToggleSheetMode.bind(this));

    // STRAIN PIPS
    html.find('.strain-pip').click(this._onStrainPipClick.bind(this));

    // CHIPS PIPS
    html.find('.chips-pip').click(this._onChipsPipClick.bind(this));

    // REPUTATION PIPS
    html.find('.rep-pip').click(this._onRepPipClick.bind(this));

    // WOUND PIPS
    html.find('.wound-pip').click(this._onWoundPipClick.bind(this));

    // TRACK POSITION CLICKS
    html.find('.track-shape').click(this._onTrackClick.bind(this));

    // TRAUMA / STUN ROLLS
    html.find('.trauma-roll-btn').click(this._onTraumaRoll.bind(this));
    html.find('.stun-roll-btn').click(this._onStunRoll.bind(this));

    // TIE BUBBLE CLICKS
    html.find('.tie-bubble').click(this._onTieBubbleClick.bind(this));

    // ATTRIBUTE ROLLS
    html.find('.rollable-attribute, .attr-input[readonly]').click(this._onRollAttribute.bind(this));

    // FOCUS ROLLS
    html.find('.focus-name[readonly], .focus-rank[readonly]').click(this._onRollFocus.bind(this));

    // SKILL SET ROLLS
    html.find('.rollable-skill').click(this._onRollSkillSet.bind(this));

    // ITEM OPEN (edit mode)
    html.find('.item-open').click(ev => {
      if (!this.actor.isOwner) return;
      const itemId = ev.currentTarget.dataset.itemId;
      const item   = this.actor.items.get(itemId);
      if (!item) return;
      item.sheet.render(true);
    });

    // WEAPON ATTACK ROLL
    html.find('.rollable-weapon').click(this._onRollWeaponAttack.bind(this));

    // WEAPON DAMAGE ROLL
    html.find('.rollable-damage').click(this._onRollWeaponDamage.bind(this));

    // FEATURE CHIPS
    html.find('.feature-chip').click(ev => {
      const key            = ev.currentTarget.dataset.key;
      const catalog        = CONFIG.BLUEPLANET?.featureCatalog || {};
      const entry          = catalog[key];
      const customFeatures = game.settings.get("blue-planet-recontact", "customFeatures") || {};
      const isCustom       = !!customFeatures[key];

      if (entry) {
        const dialogButtons = {
          post: {
            label: "Post to Chat",
            icon: '<i class="fas fa-comment"></i>',
            callback: () => ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: `
                <div class="bp-chat-card">
                  <div class="bp-chat-header">${entry.label}</div>
                  <div class="bp-chat-body">${entry.description}</div>
                </div>`
            })
          }
        };
        if (isCustom) {
          dialogButtons.edit = {
            label: "Edit",
            icon: '<i class="fas fa-edit"></i>',
            callback: () => this._renderFeatureEditDialog(key, entry)
          };
        }
        new Dialog({
          title: entry.label,
          content: `
            <div class="blue-planet-chat">
              <div style="font-size:1.1em;margin-bottom:10px;">${entry.description}</div>
              <hr>
              ${isCustom ? '<p style="font-size:0.8em;color:#666;"><em>Custom feature.</em></p>' : ''}
            </div>`,
          buttons: dialogButtons,
          default: "post"
        }).render(true);
        return;
      }
      this._renderFeatureEditDialog(key, null);
    });

// ITEM EDITING
    html.find('.item-edit').click(ev => {
      const itemId = ev.currentTarget.dataset.itemId;
      const item   = this.actor.items.get(itemId);
      if (!item) return;
      item.sheet.render(true);
    });

    html.find('.item-delete').click(ev => {
      const itemId = ev.currentTarget.dataset.itemId;
      const item   = this.actor.items.get(itemId);
      if (!item) return;
      item.delete();
      this.render(false);
    });

    // TAG CHAT POST
    html.find('.tag-post-btn').click(this._onTagPost.bind(this));

    // SET LOADED AMMO SELECTIONS after render
    html.find('.weapon-ammo-select').each(function() {
      const loaded = this.dataset.loaded;
      if (loaded) this.value = loaded;
    });

    // AMMO INFO CLICK
    html.find('.ammo-info').click(this._onAmmoInfo.bind(this));

    // WEAPON AMMO SELECT
    html.find('.weapon-ammo-select').change(this._onWeaponAmmoChange.bind(this));

    // ITEM EQUIPPED TOGGLE
    html.find('.equipped-toggle').click(this._onEquippedToggle.bind(this));

    // ITEM CHAT POST
    html.find('.item-post-btn').click(this._onItemPost.bind(this));
    html.find('.item-post').click(this._onItemPost.bind(this));

    if (!this.isEditable) return;

    // INLINE ITEM EDITS (tags, ties)
    html.find('.item-edit-inline').change(this._onInlineItemEdit.bind(this));

    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-delete').click(ev => {
      const li   = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
  }

  /* -------------------------------------------- */
  /* PIP HANDLERS                                 */
  /* -------------------------------------------- */

  async _onStrainPipClick(event) {
    event.preventDefault();
    const pip      = event.currentTarget;
    const path     = pip.dataset.path;
    const index    = Number(pip.dataset.index);
    const parts    = path.split(".");
    const current  = this.actor.system[parts[0]][parts[1]].value;
    const newValue = (index < current) ? index : index + 1;
    await this.actor.update({ [`system.${path}.value`]: newValue });
  }

  async _onChipsPipClick(event) {
    event.preventDefault();
    const pip      = event.currentTarget;
    const index    = Number(pip.dataset.index);
    const current  = this.actor.system.chips ?? 0;
    const newValue = (index < current) ? index : index + 1;
    await this.actor.update({ "system.chips": newValue });
  }

  async _onRepPipClick(event) {
    event.preventDefault();
    const pip      = event.currentTarget;
    const index    = Number(pip.dataset.index);
    const current  = this.actor.system.reputation?.value ?? 0;
    const newValue = (index < current) ? index : index + 1;
    await this.actor.update({ "system.reputation.value": newValue });
  }

  async _onWoundPipClick(event) {
    event.preventDefault();
    const pip      = event.currentTarget;
    const path     = pip.dataset.path;
    const index    = Number(pip.dataset.index);
    const parts    = path.split(".");
    const current  = this.actor.system[parts[0]][parts[1]].value;
    const newValue = (index < current) ? index : index + 1;
    await this.actor.update({ [`system.${path}.value`]: newValue });
  }

  /* -------------------------------------------- */
  /* TRACK / TIE / INLINE HANDLERS                */
  /* -------------------------------------------- */

  async _onTrackClick(event) {
    event.preventDefault();
    const el      = event.currentTarget;
    const trackId = el.dataset.track;
    const newValue = Number(el.dataset.value);
    await this.actor.update({ [`system.tracks.${trackId}.value`]: newValue });
  }

  async _onTieBubbleClick(event) {
    event.preventDefault();
    const el      = event.currentTarget;
    const itemId  = el.dataset.itemId;
    const item    = this.actor.items.get(itemId);
    if (!item) return;
    const current = Number(item.system.rank) || 0;
    const newRank = current >= 5 ? 0 : current + 1;
    await item.update({ "system.rank": newRank });
  }

  async _onInlineItemEdit(event) {
    event.preventDefault();
    const el     = event.currentTarget;
    const itemId = el.dataset.itemId;
    const field  = el.dataset.field;
    const value  = el.type === "number" ? Number(el.value) : el.value;
    const item   = this.actor.items.get(itemId);
    if (!item) return;
    await item.update({ [field]: value });
  }

  /* -------------------------------------------- */
  /* EVENT HANDLERS                               */
  /* -------------------------------------------- */

  async _onToggleSheetMode(event) {
    event.preventDefault();
    const currentMode = this.actor.getFlag("blue-planet-recontact", "playMode") || false;
    await this.actor.setFlag("blue-planet-recontact", "playMode", !currentMode);
  }

  _onItemCreate(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    return this.actor.createEmbeddedDocuments("Item", [{ name: `New ${type}`, type }]);
  }


  /* -------------------------------------------- */
  /* TRAUMA ROLL                                  */
  /* -------------------------------------------- */

  async _onTraumaRoll(event) {
    event.preventDefault();
    const physique    = this.actor.system.attributes.physique;
    const physVal     = Number(physique?.value) || 0;
    const woundMod    = -3; // mortal wound only — NOT cumulative
    const baseTN      = 5 + physVal + woundMod;

    // Check for Improved Blood Clotting equipped
    const hasClotting = this.actor.items.some(i =>
      i.type === "biomod" && i.system.equipped && i.name.toLowerCase().includes("blood clotting")
    );
    const clottingMod = hasClotting ? 1 : 0;

    const strainHTML = this._buildStrainHTML();

    const content = `
      <form class="bp-roll-dialog">
        <p style="margin:0 0 6px 0;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
          <strong>Trauma Roll</strong> — Physique Test
          <span style="color:#c9302c;"> — Wounds: −3 (mortal, non-cumulative)</span>
        </p>
        <p style="margin:0 0 8px 0;font-size:0.85rem;color:#555;font-style:italic;">
          Base TN: 5 + ${physVal} (Physique) − 3 = <strong>${baseTN}</strong>
          ${hasClotting ? ' + 1 (Improved Blood Clotting) = <strong>' + (baseTN + clottingMod) + '</strong>' : ''}
        </p>
        <div class="form-group">
          <label>Situational Modifier</label>
          <input type="number" id="situational-mod" value="0"/>
        </div>
        ${strainHTML}
      </form>`;

    new Dialog({
      title: "Trauma Roll",
      content,
      buttons: {
        roll: {
          label: "ROLL",
          callback: async (html) => {
            const sitMod      = Number(html.find('#situational-mod').val()) || 0;
            const spendMental   = html.find('#strain-mental').is(':checked');
            const spendPhysical = html.find('#strain-physical').is(':checked');
            const strainBonus   = (spendMental || spendPhysical) ? 2 : 0;
            const strainType    = spendMental ? "mental" : spendPhysical ? "physical" : null;

            if (strainType) {
              const cur = this.actor.system.strain[strainType].value;
              await this.actor.update({ [`system.strain.${strainType}.value`]: cur + 1 });
            }

            const finalTN = baseTN + clottingMod + sitMod + strainBonus;
            const roll    = new Roll("1d10");
            await roll.evaluate();
            const die     = roll.dice[0].results[0].result;
            const success = die <= finalTN;
            const av      = finalTN - die;

            let outcomeHTML;
            if (success) {
              outcomeHTML = `<div class="bp-chat-special bp-benefit">WOUND NOT LETHAL — Make a Stun Test (−3) to act normally.</div>`;
            } else if (av > -5) {
              const minutes = 5 - Math.abs(av);
              outcomeHTML = `<div class="bp-chat-special bp-complication">DYING — ${minutes} minute${minutes !== 1 ? 's' : ''} until death from shock and blood loss. Medical intervention required.</div>`;
            } else {
              outcomeHTML = `<div class="bp-chat-special bp-consequence">INSTANTLY FATAL</div>`;
            }

            const tnBreakdown = `5 + ${physVal} Physique − 3 mortal${clottingMod ? ' + 1 Blood Clotting' : ''}${sitMod ? (sitMod > 0 ? ' +' : ' ') + sitMod + ' situational' : ''}${strainBonus ? ' + 2 strain' : ''}`;

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: `
                <div class="bp-chat-card">
                  <div class="bp-chat-header">Trauma Roll <span style="font-weight:400;font-size:0.85em;">(Physique Test)</span></div>
                  <div class="bp-chat-body">
                    <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnBreakdown}">ⓘ</span></span></div>
                    <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${die}</span></div>
                    ${hasClotting ? '<div class="bp-chat-row"><span class="bp-label">BIOMOD</span><span class="bp-value">Improved Blood Clotting (+1)</span></div>' : ''}
                    ${strainType ? `<div class="bp-chat-row"><span class="bp-label">STRAIN</span><span class="bp-value">${strainType.charAt(0).toUpperCase() + strainType.slice(1)} spent (+2 TN)</span></div>` : ''}
                    <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${av >= 0 ? '+' : ''}${av}</span></div>
                    ${outcomeHTML}
                  </div>
                </div>`,
              flags: { "blue-planet-recontact": { rollData: { actorId: this.actor.id, type: "trauma" } } }
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
    const psyche  = this.actor.system.attributes.psyche;
    const psychVal = Number(psyche?.value) || 0;
    const woundMod = -2; // major wound only — NOT cumulative
    const baseTN   = 5 + psychVal + woundMod;

    const strainHTML = this._buildStrainHTML();

    const content = `
      <form class="bp-roll-dialog">
        <p style="margin:0 0 6px 0;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
          <strong>Stun Test</strong> — Psyche Test
          <span style="color:#c9302c;"> — Wounds: −2 (major, non-cumulative)</span>
        </p>
        <p style="margin:0 0 8px 0;font-size:0.85rem;color:#555;font-style:italic;">
          Base TN: 5 + ${psychVal} (Psyche) − 2 = <strong>${baseTN}</strong>
        </p>
        <div class="form-group">
          <label>Situational Modifier</label>
          <input type="number" id="situational-mod" value="0"/>
        </div>
        ${strainHTML}
      </form>`;

    new Dialog({
      title: "Stun Test",
      content,
      buttons: {
        roll: {
          label: "ROLL",
          callback: async (html) => {
            const sitMod      = Number(html.find('#situational-mod').val()) || 0;
            const spendMental   = html.find('#strain-mental').is(':checked');
            const spendPhysical = html.find('#strain-physical').is(':checked');
            const strainBonus   = (spendMental || spendPhysical) ? 2 : 0;
            const strainType    = spendMental ? "mental" : spendPhysical ? "physical" : null;

            if (strainType) {
              const cur = this.actor.system.strain[strainType].value;
              await this.actor.update({ [`system.strain.${strainType}.value`]: cur + 1 });
            }

            const finalTN = baseTN + sitMod + strainBonus;
            const roll    = new Roll("1d10");
            await roll.evaluate();
            const die     = roll.dice[0].results[0].result;
            const success = die <= finalTN;
            const av      = finalTN - die;
            const duration = Math.abs(av);

            let outcomeHTML;
            if (success) {
              outcomeHTML = `<div class="bp-chat-special bp-benefit">SUCCESS — Act normally (subject to cumulative wound penalties).</div>`;
            } else if (av > -5) {
              outcomeHTML = `<div class="bp-chat-special bp-complication">FAIL — Conscious but cannot take actions requiring tests. Duration: ${duration} minute${duration !== 1 ? 's' : ''} or until medical attention.</div>`;
            } else {
              outcomeHTML = `<div class="bp-chat-special bp-consequence">FAIL — Incapacitated. Duration: ${duration} minute${duration !== 1 ? 's' : ''} or until medical attention.</div>`;
            }

            const tnBreakdown = `5 + ${psychVal} Psyche − 2 major${sitMod ? (sitMod > 0 ? ' +' : ' ') + sitMod + ' situational' : ''}${strainBonus ? ' + 2 strain' : ''}`;

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: `
                <div class="bp-chat-card">
                  <div class="bp-chat-header">Stun Test <span style="font-weight:400;font-size:0.85em;">(Psyche Test)</span></div>
                  <div class="bp-chat-body">
                    <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnBreakdown}">ⓘ</span></span></div>
                    <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${die}</span></div>
                    ${strainType ? `<div class="bp-chat-row"><span class="bp-label">STRAIN</span><span class="bp-value">${strainType.charAt(0).toUpperCase() + strainType.slice(1)} spent (+2 TN)</span></div>` : ''}
                    <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${av >= 0 ? '+' : ''}${av}</span></div>
                    ${outcomeHTML}
                  </div>
                </div>`,
              flags: { "blue-planet-recontact": { rollData: { actorId: this.actor.id, type: "stun" } } }
            });
          }
        }
      },
      default: "roll"
    }).render(true);
  }

  /* -------------------------------------------- */
  /* HELPERS                                      */
  /* -------------------------------------------- */

  _getWoundPenalty() {
    return (this.actor.system.wounds.minor.value  * -1) +
           (this.actor.system.wounds.major.value  * -2) +
           (this.actor.system.wounds.mortal.value * -3);
  }

  _buildStrainHTML() {
    const mental        = this.actor.system.strain.mental;
    const physical      = this.actor.system.strain.physical;
    const mentalAvail   = mental.max   - mental.value;
    const physicalAvail = physical.max - physical.value;

    return `
      <div class="bp-strain-section" style="border:1px solid #c9d6e3;padding:6px 8px;margin-bottom:10px;background:#f4f7fb;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;color:#1b3f75;font-size:0.85rem;margin-bottom:4px;">Spend Strain (+2 TN)</div>
        <div style="display:flex;gap:16px;align-items:center;">
          <label style="display:flex;align-items:center;gap:4px;font-size:0.9rem;${mentalAvail <= 0 ? 'opacity:0.4;' : ''}">
            <input type="checkbox" id="strain-mental" ${mentalAvail <= 0 ? 'disabled' : ''}/>
            Mental <span style="color:#666;">(${mentalAvail} available)</span>
          </label>
          <label style="display:flex;align-items:center;gap:4px;font-size:0.9rem;${physicalAvail <= 0 ? 'opacity:0.4;' : ''}">
            <input type="checkbox" id="strain-physical" ${physicalAvail <= 0 ? 'disabled' : ''}/>
            Physical <span style="color:#666;">(${physicalAvail} available)</span>
          </label>
        </div>
      </div>`;
  }

  _buildTagsHTML() {
    const tags = this.actor.items.filter(i => i.type === "tag" && i.system.modifier !== 0);
    if (!tags.length) return "";
    return `
      <div class="bp-roll-section" style="border:1px solid #c9d6e3;padding:6px 8px;margin-bottom:10px;background:#f4f7fb;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;color:#1b3f75;font-size:0.85rem;margin-bottom:6px;">Tags</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${tags.map(t => `
            <label class="bp-tag-toggle" style="display:flex;align-items:center;gap:4px;font-size:0.9rem;cursor:pointer;padding:2px 6px;border:1px solid #c9d6e3;border-radius:3px;background:white;">
              <input type="checkbox" class="bp-tag-check" data-modifier="${t.system.modifier}" data-name="${t.name}"/>
              ${t.name}
            </label>`).join('')}
        </div>
      </div>`;
  }

  _buildTracksHTML() {
    const trackModMap = { 5: 4, 4: 2, 3: 0, 2: -2, 1: -4 };
    const tracks = ["track1", "track2", "track3"]
      .map(key => ({ key, ...this.actor.system.tracks[key] }))
.filter(t => t.label && t.label !== t.key);
    if (!tracks.length) return "";

    return `
      <div class="bp-roll-section" style="border:1px solid #c9d6e3;padding:6px 8px;margin-bottom:10px;background:#f4f7fb;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;color:#1b3f75;font-size:0.85rem;margin-bottom:6px;">Track</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
          <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;">
            <input type="radio" name="bp-track-select" value="" checked/> None
          </label>
          ${tracks.map(t => {
            const mod = trackModMap[t.value] ?? 0;
            return `<label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="bp-track-select" value="${t.key}" data-mod="${mod}" data-label="${t.label}"/>
              ${t.label}
            </label>`;
          }).join('')}
        </div>
        <div id="bp-track-direction" style="display:none;margin-top:4px;">
          <label style="font-size:0.85rem;font-family:'Barlow Condensed',sans-serif;font-weight:700;color:#1b3f75;text-transform:uppercase;">Direction</label>
          <div style="display:flex;gap:12px;margin-top:2px;">
            <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;">
              <input type="radio" name="bp-track-dir" value="helping" checked/> Helping
            </label>
            <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;">
              <input type="radio" name="bp-track-dir" value="hurting"/> Hurting
            </label>
          </div>
        </div>
      </div>`;
  }

  _updateFocusSelect(attrKey, focusSelect) {
    const attrData = this.actor.system.attributes[attrKey];
    focusSelect.html('<option value="0">None</option>');
    if (attrData) {
      if (attrData.focus1?.name) focusSelect.append(`<option value="${attrData.focus1.rank}">${attrData.focus1.name} +${attrData.focus1.rank}</option>`);
      if (attrData.focus2?.name) focusSelect.append(`<option value="${attrData.focus2.rank}">${attrData.focus2.name} +${attrData.focus2.rank}</option>`);
    }
  }

  /* -------------------------------------------- */
  /* SKILL SET ROLL                               */
  /* -------------------------------------------- */

  async _onRollSkillSet(event) {
    event.preventDefault();
    event.stopPropagation();

    const el        = event.currentTarget;
    const skillKey  = el.dataset.skillkey;
    const tier      = Number(el.dataset.tier);
    const skillName = el.dataset.skillname;

    const skillSet  = this.actor.system.skillSets[skillKey];
    if (!skillSet) return;

    const skillLabel   = skillSet.label ?? "";
    const skillRank    = Number(skillSet.rank) || 0;
    const diceCount    = tier;
    const tierLabel    = tier === 1 ? "General" : tier === 2 ? "Core" : "Specialty";
    const woundPenalty = this._getWoundPenalty();

    const buildAttrOptions = () => {
      let html = "";
      for (const [key, attr] of Object.entries(this.actor.system.attributes)) {
        html += `<option value="${key}">${attr.label} (${attr.value})</option>`;
      }
      return html;
    };

    const content = `
      <form class="bp-roll-dialog">
        <p style="margin:0 0 8px 0;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
          <strong>${skillName}</strong> — ${tierLabel} (${diceCount}d10) — Rank ${skillRank}
          ${woundPenalty < 0 ? `<span style="color:#c9302c;"> — Wounds: ${woundPenalty}</span>` : ''}
        </p>
        <div class="form-group">
          <label>Governing Attribute</label>
          <select id="attribute-select">${buildAttrOptions()}</select>
        </div>
        <div class="form-group">
          <label>Focus Attribute</label>
          <select id="focus-select"><option value="0">None</option></select>
        </div>
        <div class="form-group">
          <label>Situational Modifier</label>
          <input type="number" id="situational-mod" value="0"/>
        </div>
        ${this._buildStrainHTML()}
        ${this._buildTagsHTML()}
        ${this._buildTracksHTML()}
        ${this._buildEquipmentHTML()}
      </form>`;

    new Dialog({
      title: skillName,
      content,
      render: (html) => {
        const attrSelect  = html.find("#attribute-select");
        const focusSelect = html.find("#focus-select");
        this._updateFocusSelect(attrSelect.val(), focusSelect);
        attrSelect.change(() => this._updateFocusSelect(attrSelect.val(), focusSelect));
        // Show/hide track direction toggle
        html.find('input[name="bp-track-select"]').change(function() {
          const dir = html.find('#bp-track-direction');
          $(this).val() ? dir.show() : dir.hide();
        });
        html.find('input[name="bp-armor-select"]').change(function() {
          html.find('#bp-armor-direction').toggle(!!$(this).val());
        });
      },
      buttons: {
        roll: {
          label: "ROLL",
          callback: async (html) => {
            const attrKey       = html.find('#attribute-select').val();
            const attrValue     = Number(this.actor.system.attributes[attrKey].value) || 0;
            const attrLabel     = this.actor.system.attributes[attrKey].label;
            const focusBonus    = Number(html.find('#focus-select').val()) || 0;
            const focusName     = html.find('#focus-select option:selected').text();
            const situationMod  = Number(html.find('#situational-mod').val()) || 0;
            const spendMental   = html.find('#strain-mental').is(':checked');
            const spendPhysical = html.find('#strain-physical').is(':checked');
            const strainBonus   = (spendMental || spendPhysical) ? 2 : 0;
            const strainType    = spendMental ? "mental" : spendPhysical ? "physical" : null;

            // Tags
            let tagBonus = 0;
            const appliedTags = [];
            html.find('.bp-tag-check:checked').each((i, el) => {
              const mod = Number(el.dataset.modifier) || 0;
              tagBonus += mod;
              appliedTags.push(el.dataset.name);
            });

            // Track
            let trackBonus = 0;
            let trackLabel = null;
            const selectedTrack = html.find('input[name="bp-track-select"]:checked').val();
            if (selectedTrack) {
              const trackMod = Number(html.find(`input[value="${selectedTrack}"]`).data('mod')) || 0;
              trackLabel = html.find(`input[value="${selectedTrack}"]`).data('label');
              const helping = html.find('input[name="bp-track-dir"]:checked').val() === "helping";
              trackBonus = helping ? Math.abs(trackMod) : -Math.abs(trackMod);
            }

            let equipBonus = 0; const appliedEquip = [];
            html.find('.bp-equip-check:checked').each((i, el) => { equipBonus += Number(el.dataset.modifier)||0; appliedEquip.push(el.dataset.name); });
            let armorBonus = 0; let armorLabel = null;
            const selArmor = html.find('input[name="bp-armor-select"]:checked').val();
            if (selArmor) {
              const aMod = Number(html.find(`input[value="${selArmor}"]`).data('mod'))||0;
              armorLabel = html.find(`input[value="${selArmor}"]`).data('label');
              armorBonus = html.find('input[name="bp-armor-dir"]:checked').val() === "helping" ? Math.abs(aMod) : -Math.abs(aMod);
            }

            if (strainType) {
              const cur = this.actor.system.strain[strainType].value;
              await this.actor.update({ [`system.strain.${strainType}.value`]: cur + 1 });
            }

            const finalTN     = attrValue + skillRank + focusBonus + situationMod + strainBonus + woundPenalty + tagBonus + trackBonus + equipBonus + armorBonus;
            const roll        = new Roll(`${diceCount}d10`);
            await roll.evaluate();

            const diceResults = roll.dice[0].results.map(r => r.result);
            const lowestDie   = Math.min(...diceResults);
            const success     = lowestDie <= finalTN;
            const actionValue = finalTN - lowestDie;

            await this._postRollMessage({
              title: skillName, subtitle: tierLabel,
              finalTN, attrLabel, attrValue, skillRank, skillLabel,
              focusBonus, focusName: focusName !== "None" ? focusName : null,
              situationMod, strainType, strainBonus, woundPenalty,
              tagBonus, appliedTags, trackBonus, trackLabel,
              equipBonus, appliedEquip, armorBonus, armorLabel,
              diceResults, lowestDie, diceCount, success, actionValue,
              rollData: {
                actorId: this.actor.id, type: "skill",
                skillKey, tier, attrKey,
                focusBonus, situationMod, strainBonus, woundPenalty
              }
            });
          }
        }
      },
      default: "roll"
    }).render(true);
  }

  /* -------------------------------------------- */
  /* ATTRIBUTE ROLL                               */
  /* -------------------------------------------- */

  async _onRollAttribute(event) {
    event.preventDefault();
    event.stopPropagation();

    const el = event.currentTarget;
    let attrKey = el.dataset.key;
    if (!attrKey && el.name) {
      const match = el.name.match(/system\.attributes\.(\w+)\./);
      if (match) attrKey = match[1];
    }
    if (!attrKey) return;

    const attrData = this.actor.system.attributes[attrKey];
    if (!attrData) return;

    const attrLabel    = attrData.label || attrKey;
    const attrValue    = Number(attrData.value) || 0;
    const woundPenalty = this._getWoundPenalty();

    const focuses = [];
    if (attrData.focus1?.name) focuses.push({ name: attrData.focus1.name, rank: Number(attrData.focus1.rank) || 0 });
    if (attrData.focus2?.name) focuses.push({ name: attrData.focus2.name, rank: Number(attrData.focus2.rank) || 0 });

    let focusHTML = `<option value="0">None</option>`;
    focuses.forEach(f => { focusHTML += `<option value="${f.rank}">${f.name} +${f.rank}</option>`; });

    const content = `
      <form class="bp-roll-dialog">
        <p style="margin:0 0 8px 0;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
          Base TN: <strong>5 + ${attrValue} (${attrLabel})</strong>
          ${woundPenalty < 0 ? `<span style="color:#c9302c;"> — Wounds: ${woundPenalty}</span>` : ''}
        </p>
        ${focuses.length > 0 ? `
        <div class="form-group">
          <label>Focus Attribute</label>
          <select id="focus-select">${focusHTML}</select>
        </div>` : ''}
        <div class="form-group">
          <label>Situational Modifier</label>
          <input type="number" id="situational-mod" value="0"/>
        </div>
        ${this._buildStrainHTML()}
        ${this._buildTagsHTML()}
        ${this._buildTracksHTML()}
        ${this._buildEquipmentHTML()}
      </form>`;

    new Dialog({
      title: `${attrLabel} Test`,
      content,
      render: (html) => {
        html.find('input[name="bp-track-select"]').change(function() {
          const dir = html.find('#bp-track-direction');
          $(this).val() ? dir.show() : dir.hide();
        });
        html.find('input[name="bp-armor-select"]').change(function() {
          html.find('#bp-armor-direction').toggle(!!$(this).val());
        });
      },
      buttons: {
        roll: {
          label: "ROLL",
          callback: async (html) => {
            const focusBonus    = Number(html.find('#focus-select').val() || 0);
            const focusName     = html.find('#focus-select option:selected').text();
            const situationMod  = Number(html.find('#situational-mod').val() || 0);
            const spendMental   = html.find('#strain-mental').is(':checked');
            const spendPhysical = html.find('#strain-physical').is(':checked');
            const strainBonus   = (spendMental || spendPhysical) ? 2 : 0;
            const strainType    = spendMental ? "mental" : spendPhysical ? "physical" : null;

            let tagBonus = 0;
            const appliedTags = [];
            html.find('.bp-tag-check:checked').each((i, el) => {
              tagBonus += Number(el.dataset.modifier) || 0;
              appliedTags.push(el.dataset.name);
            });

            let trackBonus = 0;
            let trackLabel = null;
            const selectedTrack = html.find('input[name="bp-track-select"]:checked').val();
            if (selectedTrack) {
              const trackMod = Number(html.find(`input[value="${selectedTrack}"]`).data('mod')) || 0;
              trackLabel = html.find(`input[value="${selectedTrack}"]`).data('label');
              const helping = html.find('input[name="bp-track-dir"]:checked').val() === "helping";
              trackBonus = helping ? Math.abs(trackMod) : -Math.abs(trackMod);
            }

            let equipBonus = 0; const appliedEquip = [];
            html.find('.bp-equip-check:checked').each((i, el) => { equipBonus += Number(el.dataset.modifier)||0; appliedEquip.push(el.dataset.name); });
            let armorBonus = 0; let armorLabel = null;
            const selArmor2 = html.find('input[name="bp-armor-select"]:checked').val();
            if (selArmor2) {
              const aMod2 = Number(html.find(`input[value="${selArmor2}"]`).data('mod'))||0;
              armorLabel = html.find(`input[value="${selArmor2}"]`).data('label');
              armorBonus = html.find('input[name="bp-armor-dir"]:checked').val() === "helping" ? Math.abs(aMod2) : -Math.abs(aMod2);
            }

            if (strainType) {
              const cur = this.actor.system.strain[strainType].value;
              await this.actor.update({ [`system.strain.${strainType}.value`]: cur + 1 });
            }

            await this._executeAttributeRoll(
              attrLabel, attrValue, focusBonus,
              focusName !== "None" ? focusName : null,
              situationMod, strainType, strainBonus, woundPenalty,
              tagBonus, appliedTags, trackBonus, trackLabel,
              equipBonus, appliedEquip, armorBonus, armorLabel
            );
          }
        }
      },
      default: "roll"
    }).render(true);
  }

  /* -------------------------------------------- */
  /* FOCUS ATTRIBUTE ROLL                         */
  /* -------------------------------------------- */

  async _onRollFocus(event) {
    event.preventDefault();
    event.stopPropagation();

    const el         = event.currentTarget;
    const attrKey    = el.dataset.attrkey;
    const focusIndex = el.dataset.focusindex;
    if (!attrKey || !focusIndex) return;

    const attrData = this.actor.system.attributes[attrKey];
    if (!attrData) return;

    const focusData = attrData[`focus${focusIndex}`];
    if (!focusData?.name) return;

    const attrLabel    = attrData.label || attrKey;
    const attrValue    = Number(attrData.value) || 0;
    const focusRank    = Number(focusData.rank) || 0;
    const focusName    = focusData.name;
    const woundPenalty = this._getWoundPenalty();

    const content = `
      <form class="bp-roll-dialog">
        <p style="margin:0 0 8px 0;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
          TN: <strong>5 + ${attrValue} (${attrLabel}) + ${focusRank} (${focusName})</strong>
          ${woundPenalty < 0 ? `<span style="color:#c9302c;"> — Wounds: ${woundPenalty}</span>` : ''}
        </p>
        <div class="form-group">
          <label>Situational Modifier</label>
          <input type="number" id="situational-mod" value="0"/>
        </div>
        ${this._buildStrainHTML()}
        ${this._buildTagsHTML()}
        ${this._buildTracksHTML()}
        ${this._buildEquipmentHTML()}
      </form>`;

    new Dialog({
      title: `${focusName} Test`,
      content,
      render: (html) => {
        html.find('input[name="bp-track-select"]').change(function() {
          const dir = html.find('#bp-track-direction');
          $(this).val() ? dir.show() : dir.hide();
        });
        html.find('input[name="bp-armor-select"]').change(function() {
          html.find('#bp-armor-direction').toggle(!!$(this).val());
        });
      },
      buttons: {
        roll: {
          label: "ROLL",
          callback: async (html) => {
            const situationMod  = Number(html.find('#situational-mod').val() || 0);
            const spendMental   = html.find('#strain-mental').is(':checked');
            const spendPhysical = html.find('#strain-physical').is(':checked');
            const strainBonus   = (spendMental || spendPhysical) ? 2 : 0;
            const strainType    = spendMental ? "mental" : spendPhysical ? "physical" : null;

            let tagBonus = 0;
            const appliedTags = [];
            html.find('.bp-tag-check:checked').each((i, el) => {
              tagBonus += Number(el.dataset.modifier) || 0;
              appliedTags.push(el.dataset.name);
            });

            let trackBonus = 0;
            let trackLabel = null;
            const selectedTrack = html.find('input[name="bp-track-select"]:checked').val();
            if (selectedTrack) {
              const trackMod = Number(html.find(`input[value="${selectedTrack}"]`).data('mod')) || 0;
              trackLabel = html.find(`input[value="${selectedTrack}"]`).data('label');
              const helping = html.find('input[name="bp-track-dir"]:checked').val() === "helping";
              trackBonus = helping ? Math.abs(trackMod) : -Math.abs(trackMod);
            }

            let equipBonus = 0; const appliedEquip = [];
            html.find('.bp-equip-check:checked').each((i, el) => { equipBonus += Number(el.dataset.modifier)||0; appliedEquip.push(el.dataset.name); });
            let armorBonus = 0; let armorLabel = null;
            const selArmor2 = html.find('input[name="bp-armor-select"]:checked').val();
            if (selArmor2) {
              const aMod2 = Number(html.find(`input[value="${selArmor2}"]`).data('mod'))||0;
              armorLabel = html.find(`input[value="${selArmor2}"]`).data('label');
              armorBonus = html.find('input[name="bp-armor-dir"]:checked').val() === "helping" ? Math.abs(aMod2) : -Math.abs(aMod2);
            }

            if (strainType) {
              const cur = this.actor.system.strain[strainType].value;
              await this.actor.update({ [`system.strain.${strainType}.value`]: cur + 1 });
            }

            await this._executeAttributeRoll(
              attrLabel, attrValue, focusRank, focusName,
              situationMod, strainType, strainBonus, woundPenalty,
              tagBonus, appliedTags, trackBonus, trackLabel,
              equipBonus, appliedEquip, armorBonus, armorLabel
            );
          }
        }
      },
      default: "roll"
    }).render(true);
  }

  /* -------------------------------------------- */
  /* SHARED ATTRIBUTE ROLL EXECUTOR               */
  /* -------------------------------------------- */

  async _executeAttributeRoll(attrLabel, attrValue, focusBonus, focusName, situationMod, strainType = null, strainBonus = 0, woundPenalty = 0, tagBonus = 0, appliedTags = [], trackBonus = 0, trackLabel = null, equipBonus = 0, appliedEquip = [], armorBonus = 0, armorLabel = null) {
    const finalTN     = 5 + attrValue + focusBonus + situationMod + strainBonus + woundPenalty + tagBonus + trackBonus + equipBonus + armorBonus;
    const roll        = new Roll("1d10");
    await roll.evaluate();

    const dieResult   = roll.dice[0].results[0].result;
    const success     = dieResult <= finalTN;
    const actionValue = finalTN - dieResult;

    await this._postRollMessage({
      title: `${attrLabel}${focusName ? ' / ' + focusName : ''} Test`,
      subtitle: null,
      finalTN, attrLabel, attrValue, skillRank: 0, skillLabel: "",
      focusBonus, focusName, situationMod, strainType, strainBonus, woundPenalty,
      tagBonus, appliedTags, trackBonus, trackLabel,
      equipBonus, appliedEquip, armorBonus, armorLabel,
      diceResults: [dieResult], lowestDie: dieResult, diceCount: 1,
      success, actionValue,
      rollData: {
        actorId: this.actor.id, type: "attribute",
        attrLabel, attrValue, focusBonus, focusName,
        situationMod, strainBonus, woundPenalty
      }
    });
  }

  /* -------------------------------------------- */
  /* SHARED MESSAGE POSTER                        */
  /* -------------------------------------------- */

  async _postRollMessage({ title, subtitle, finalTN, attrLabel, attrValue, skillRank, skillLabel = "",
    focusBonus, focusName, situationMod, strainType, strainBonus, woundPenalty = 0,
    tagBonus = 0, appliedTags = [], trackBonus = 0, trackLabel = null,
    equipBonus = 0, appliedEquip = [], armorBonus = 0, armorLabel = null,
    diceResults, lowestDie, diceCount, success, actionValue, rollData }) {

    const specialResult = actionValue >= 5
      ? `<div class="bp-chat-special bp-benefit">▲ BENEFIT — +2 on next relevant test or narrative alteration</div>`
      : actionValue === 0
      ? `<div class="bp-chat-special bp-complication">▼ COMPLICATION</div>`
      : actionValue <= -5
      ? `<div class="bp-chat-special bp-consequence">▼ CONSEQUENCE</div>`
      : "";

    const tnBreakdown = diceCount > 1
      ? `${attrLabel} +${attrValue}${focusName ? ' ' + focusName : ''} ${skillLabel} +${skillRank}${situationMod ? ' Situation ' + (situationMod > 0 ? '+' : '') + situationMod : ''}${strainBonus ? ' Strain +2' : ''}${woundPenalty < 0 ? ' Wounds ' + woundPenalty : ''}${tagBonus ? ' Tags ' + (tagBonus > 0 ? '+' : '') + tagBonus : ''}${trackBonus ? ' Track ' + (trackBonus > 0 ? '+' : '') + trackBonus : ''}`
      : `5 + ${attrValue}${focusBonus ? ' + ' + focusBonus : ''}${situationMod ? (situationMod > 0 ? ' +' : ' ') + situationMod : ''}${strainBonus ? ' Strain +2' : ''}${woundPenalty < 0 ? ' Wounds ' + woundPenalty : ''}${tagBonus ? ' Tags ' + (tagBonus > 0 ? '+' : '') + tagBonus : ''}${trackBonus ? ' Track ' + (trackBonus > 0 ? '+' : '') + trackBonus : ''}`;

    const diceDisplay = diceCount > 1
      ? `${diceCount}d10 [${diceResults.join(", ")}] — lowest: ${lowestDie}`
      : `${lowestDie}`;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="bp-chat-card">
          <div class="bp-chat-header">${title}${subtitle ? ` <span style="font-weight:400;font-size:0.85em;">(${subtitle})</span>` : ''}</div>
          <div class="bp-chat-body">
            <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnBreakdown}">ⓘ</span></span></div>
            <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${diceDisplay}</span></div>
            ${focusName ? `<div class="bp-chat-row"><span class="bp-label">FOCUS</span><span class="bp-value">${focusName}</span></div>` : ""}
            ${strainType ? `<div class="bp-chat-row"><span class="bp-label">STRAIN</span><span class="bp-value">${strainType.charAt(0).toUpperCase() + strainType.slice(1)} spent (+2 TN)</span></div>` : ""}
            ${woundPenalty < 0 ? `<div class="bp-chat-row"><span class="bp-label">WOUNDS</span><span class="bp-value" style="color:#c9302c;">${woundPenalty}</span></div>` : ""}
            ${appliedTags.length ? `<div class="bp-chat-row"><span class="bp-label">TAGS</span><span class="bp-value">${appliedTags.join(', ')} (${tagBonus > 0 ? '+' : ''}${tagBonus})</span></div>` : ""}
            ${trackLabel ? `<div class="bp-chat-row"><span class="bp-label">TRACK</span><span class="bp-value">${trackLabel} (${trackBonus > 0 ? '+' : ''}${trackBonus})</span></div>` : ""}
            ${appliedEquip && appliedEquip.length ? `<div class="bp-chat-row"><span class="bp-label">EQUIP</span><span class="bp-value">${appliedEquip.join(', ')} (${equipBonus > 0 ? '+' : ''}${equipBonus})</span></div>` : ""}
            ${armorLabel ? `<div class="bp-chat-row"><span class="bp-label">ARMOR</span><span class="bp-value">${armorLabel} (${armorBonus > 0 ? '+' : ''}${armorBonus})</span></div>` : ""}
            ${situationMod !== 0 ? `<div class="bp-chat-row"><span class="bp-label">MODIFIER</span><span class="bp-value">${situationMod > 0 ? '+' : ''}${situationMod}</span></div>` : ""}
            <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${actionValue >= 0 ? '+' : ''}${actionValue}</span></div>
            ${specialResult}
          </div>
        </div>`,
      flags: { "blue-planet-recontact": { rollData } }
    });
  }

  async _onAmmoInfo(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item   = this.actor.items.get(itemId);
    if (!item) return;
    const sys = item.system;
    new Dialog({
      title: item.name,
      content: `
        <div class="bp-chat-card" style="margin:0;">
          <div class="bp-chat-header">${item.name}</div>
          <div class="bp-chat-body">
            ${sys.weaponClass ? `<div class="bp-chat-row"><span class="bp-label">WEAPON CLASS</span><span class="bp-value">${sys.weaponClass}</span></div>` : ""}
            ${sys.availability ? `<div class="bp-chat-row"><span class="bp-label">AVAILABILITY</span><span class="bp-value">${sys.availability}</span></div>` : ""}
            ${sys.cost ? `<div class="bp-chat-row"><span class="bp-label">COST</span><span class="bp-value">${sys.cost}cs/mag</span></div>` : ""}
            ${sys.special ? `<div class="bp-chat-row" style="flex-direction:column;"><span class="bp-label">SPECIAL</span><span style="font-size:0.85rem;color:#856404;margin-top:2px;">${sys.special}</span></div>` : ""}
            ${sys.description ? `<div style="margin-top:8px;font-size:0.85rem;color:#444;font-style:italic;">${sys.description.replace(/<[^>]+>/g,'')}</div>` : ""}
          </div>
        </div>`,
      buttons: { close: { label: "Close" } },
      default: "close"
    }).render(true);
  }

  async _onWeaponAmmoChange(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const ammoId = event.currentTarget.value;
    const item   = this.actor.items.get(itemId);
    if (!item) return;
    await item.update({ "system.loadedAmmo": ammoId });
  }

  async _onEquippedToggle(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item   = this.actor.items.get(itemId);
    if (!item) return;
    await item.update({ "system.equipped": !item.system.equipped });
  }

  async _onItemPost(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item   = this.actor.items.get(itemId);
    if (!item) return;
    const sys = item.system;
    const rows = [];
    if (sys.damage)       rows.push(`<div class="bp-chat-row"><span class="bp-label">DAMAGE</span><span class="bp-value">${sys.damage}</span></div>`);
    if (sys.range)        rows.push(`<div class="bp-chat-row"><span class="bp-label">RANGE</span><span class="bp-value">${sys.range}</span></div>`);
    if (sys.rating)       rows.push(`<div class="bp-chat-row"><span class="bp-label">RATING</span><span class="bp-value">${sys.rating}</span></div>`);
    if (sys.coverage)     rows.push(`<div class="bp-chat-row"><span class="bp-label">COVERAGE</span><span class="bp-value">${sys.coverage}</span></div>`);
    if (sys.function)     rows.push(`<div class="bp-chat-row"><span class="bp-label">FUNCTION</span><span class="bp-value">${sys.function}</span></div>`);
    if (sys.availability) rows.push(`<div class="bp-chat-row"><span class="bp-label">AVAILABILITY</span><span class="bp-value">${sys.availability}</span></div>`);
    if (sys.features)     rows.push(`<div class="bp-chat-row"><span class="bp-label">FEATURES</span><span class="bp-value">${sys.features}</span></div>`);
    const desc = sys.description ? sys.description.replace(/<[^>]+>/g, ' ').trim() : '';
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="bp-chat-card">
          <div class="bp-chat-header">${item.name} <span style="font-weight:400;font-size:0.8em;text-transform:uppercase;">(${item.type})</span></div>
          <div class="bp-chat-body">
            ${rows.join('')}
            ${desc ? `<div style="font-size:0.85rem;color:#555;margin-top:6px;font-style:italic;">${desc}</div>` : ''}
          </div>
        </div>`
    });
  }

_buildEquipmentHTML() {
    const equipped   = this.actor.items.filter(i => i.system.equipped);
    const checkable  = equipped.filter(i => i.type !== "armor");
    const armorItems = equipped.filter(i => i.type === "armor");
    if (!checkable.length && !armorItems.length) return "";

    let html = `<div class="bp-roll-section" style="border:1px solid #c9d6e3;padding:6px 8px;margin-bottom:10px;background:#f4f7fb;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;color:#1b3f75;font-size:0.85rem;margin-bottom:6px;">Gear & Biomods</div>`;

    if (checkable.length) {
      const chips = [];
      for (const item of checkable) {
        let testMod = 0;
        if (item.type === "biomod") {
          testMod = Number(item.system.testMod) || 0;
        } else if (item.system.features && CONFIG.BLUEPLANET?.featureCatalog) {
          for (const key of item.system.features.split(',').map(s => s.trim().toLowerCase())) {
            const feat = CONFIG.BLUEPLANET.featureCatalog[key];
            if (feat?.testMod) testMod += feat.testMod;
          }
        }
        if (testMod === 0) continue;
        const modLabel = testMod > 0 ? `+${testMod}` : `${testMod}`;
        chips.push(`<label class="bp-tag-toggle" style="display:flex;align-items:center;gap:4px;font-size:0.9rem;cursor:pointer;padding:2px 6px;border:1px solid #c9d6e3;border-radius:3px;background:white;">
          <input type="checkbox" class="bp-equip-check" data-modifier="${testMod}" data-name="${item.name}"/>
          ${item.name} <span style="color:#1b3f75;font-weight:700;font-size:0.8rem;">(${modLabel})</span>
        </label>`);
      }
      if (chips.length) html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">${chips.join('')}</div>`;
    }

    if (armorItems.length) {
      html += `<div style="margin-top:4px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;color:#1b3f75;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Armor</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;">
          <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="bp-armor-select" value="" checked/> None</label>`;
      for (const item of armorItems) {
        let testMod = 0;
        if (item.system.features && CONFIG.BLUEPLANET?.featureCatalog) {
          for (const key of item.system.features.split(',').map(s => s.trim().toLowerCase())) {
            const feat = CONFIG.BLUEPLANET.featureCatalog[key];
            if (feat?.testMod) testMod += feat.testMod;
          }
        }
        html += `<label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;cursor:pointer;">
          <input type="radio" name="bp-armor-select" value="${item._id}" data-mod="${testMod}" data-label="${item.name}"/>
          ${item.name}
        </label>`;
      }
      html += `</div>
        <div id="bp-armor-direction" style="display:none;margin-top:4px;">
          <div style="display:flex;gap:12px;">
            <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="bp-armor-dir" value="helping" checked/> Helping</label>
            <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="bp-armor-dir" value="hurting"/> Hurting</label>
          </div>
        </div>
      </div>`;
    }
    html += `</div>`;
    return html;
  }

  async _onTagPost(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item   = this.actor.items.get(itemId);
    if (!item) return;
    const mod    = item.system.modifier;
    const modStr = mod ? ` <span style="color:#1b3f75;font-weight:700;">${mod > 0 ? '+' : ''}${mod}</span>` : '';
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<div class="bp-chat-card"><div class="bp-chat-header">${item.name}${modStr}</div>${item.system.description ? `<div class="bp-chat-body">${item.system.description}</div>` : ''}</div>` });
  }

/** @override */
async _onDropItem(event, data) {
    console.log("_onDropItem called", data);
    if ( !this.actor.isOwner ) return false;
    const item = await Item.fromDropData(data);
    console.log("item resolved", item);
    const itemData = item.toObject();
    console.log("itemData", itemData);
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /** @override */
async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if ( data.type === "Item" ) {
      return this._onDropItem(event, data);
    }
    return super._onDrop(event);
  }

  /** @override */
  async _onDropActor(event, data) {
    return false;
  }

  async _onRollWeaponAttack(event) {
    event.preventDefault();
    event.stopPropagation();

    const el       = event.currentTarget;
    const itemId   = el.dataset.itemId;
    const item     = this.actor.items.get(itemId);
    if (!item) return;

    const weaponName   = item.name;
    const woundPenalty = this._getWoundPenalty();
    const activeFeatures = (item.system.features || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const hasBurst = activeFeatures.includes('burst') || activeFeatures.includes('full');
    const hasFull  = activeFeatures.includes('full');

    const loadedAmmoId   = item.system.loadedAmmo || "";
    const loadedAmmoItem = loadedAmmoId ? this.actor.items.get(loadedAmmoId) : null;
    const ammoAttackMod  = loadedAmmoItem?.system?.attackMod ?? 0;
    const ammoName       = loadedAmmoItem?.name ?? "";

    const buildAttrOptions = () => {
      let html = "";
      for (const [key, attr] of Object.entries(this.actor.system.attributes)) {
        html += `<option value="${key}">${attr.label} (${attr.value})</option>`;
      }
      return html;
    };

    const buildSkillOptions = () => {
      const order = ["origin","background","occupation","experiential","developmental","exceptional","elite","advancement1","advancement2","advancement3"];
      let html = "";
      for (const key of order) {
        const row = this.actor.system.skillSets[key];
        if (!row) continue;
        const label = row.label || key;
        if (row.general)   html += `<option value="${key}|1|${row.general}">${label} — ${row.general} (General)</option>`;
        if (row.core)      html += `<option value="${key}|2|${row.core}">${label} — ${row.core} (Core)</option>`;
        if (row.specialty) html += `<option value="${key}|3|${row.specialty}">${label} — ${row.specialty} (Specialty)</option>`;
      }
      return html || '<option value="">No skills defined</option>';
    };

    const buildCalledShotOptions = () => {
      let html = '<option value="0">0 (No called shot)</option>';
      for (let i = 1; i <= 10; i++) html += `<option value="${i}">-${i} TN / +${i} damage</option>`;
      return html;
    };

    const content = `
      <form class="bp-roll-dialog">
        <p style="margin:0 0 8px 0;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
          <strong>${weaponName}</strong> — Attack Roll
          ${woundPenalty < 0 ? `<span style="color:#c9302c;"> — Wounds: ${woundPenalty}</span>` : ''}
        </p>
        ${ammoAttackMod ? `<p style="margin:0 0 8px 0;font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;color:#1b3f75;background:#eef3fb;padding:4px 8px;border-left:3px solid #1b3f75;">AMMO: ${ammoName} — <strong>+${ammoAttackMod} to hit</strong></p>` : ''}
        <div class="form-group">
          <label>Skill</label>
          <select id="skill-select">${buildSkillOptions()}</select>
        </div>
        <div class="form-group">
          <label>Governing Attribute</label>
          <select id="attribute-select">${buildAttrOptions()}</select>
        </div>
        <div class="form-group">
          <label>Focus Attribute</label>
          <select id="focus-select"><option value="0">None</option></select>
        </div>
        <div class="form-group">
          <label>Called Shot</label>
          <select id="called-shot-select">${buildCalledShotOptions()}</select>
        </div>
        <div class="form-group">
          <label>Situational Modifier</label>
          <input type="number" id="situational-mod" value="0"/>
        </div>
        ${hasBurst ? `
        <div class="bp-roll-section" style="border:1px solid #c9d6e3;padding:6px 8px;margin-bottom:10px;background:#f4f7fb;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;color:#1b3f75;font-size:0.85rem;margin-bottom:6px;">Fire Mode</div>
          <div style="display:flex;gap:12px;margin-bottom:6px;">
            <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="fire-mode" value="single" checked/> Single</label>
            <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="fire-mode" value="burst"/> Burst</label>
            ${hasFull ? '<label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="fire-mode" value="full"/> Full Auto</label>' : ''}
          </div>
          <div id="burst-mode-options" style="display:none;padding-left:8px;">
            <label style="font-size:0.85rem;font-family:'Barlow Condensed',sans-serif;font-weight:700;color:#1b3f75;text-transform:uppercase;">Burst Type</label>
            <div style="display:flex;gap:12px;margin-top:2px;">
              <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="burst-type" value="split" checked/> Split Target</label>
              <label style="font-size:0.9rem;display:flex;align-items:center;gap:4px;"><input type="radio" name="burst-type" value="focus"/> Focus Fire (+2 damage)</label>
            </div>
          </div>
        </div>` : ''}
        ${this._buildStrainHTML()}
        ${this._buildTagsHTML()}
        ${this._buildTracksHTML()}
        ${this._buildEquipmentHTML()}
      </form>`;

    new Dialog({
      title: `${weaponName} — Attack`,
      content,
      render: (html) => {
        const attrSelect  = html.find("#attribute-select");
        const focusSelect = html.find("#focus-select");
        this._updateFocusSelect(attrSelect.val(), focusSelect);
        attrSelect.change(() => this._updateFocusSelect(attrSelect.val(), focusSelect));
        html.find('input[name="bp-track-select"]').change(function() {
          $(html.find('#bp-track-direction')).toggle(!!$(this).val());
        });
        html.find('input[name="bp-armor-select"]').change(function() {
          $(html.find('#bp-armor-direction')).toggle(!!$(this).val());
        });
        html.find('input[name="fire-mode"]').change(function() {
          const val = $(this).val();
          html.find('#burst-mode-options').toggle(val === 'burst' || val === 'full');
        });
      },
      buttons: {
        roll: {
          label: "ROLL",
          callback: async (html) => {
            const skillVal      = html.find('#skill-select').val();
            const [skillKey, tierStr, skillName] = skillVal ? skillVal.split('|') : ['', '1', 'Unknown'];
            const tier          = Number(tierStr) || 1;
            const diceCount     = tier;
            const tierLabel     = tier === 1 ? "General" : tier === 2 ? "Core" : "Specialty";
            const skillSet      = this.actor.system.skillSets[skillKey];
            const skillRank     = Number(skillSet?.rank) || 0;
            const skillLabel    = skillSet?.label ?? "";

            const attrKey       = html.find('#attribute-select').val();
            const attrValue     = Number(this.actor.system.attributes[attrKey]?.value) || 0;
            const attrLabel     = this.actor.system.attributes[attrKey]?.label ?? attrKey;
            const focusBonus    = Number(html.find('#focus-select').val()) || 0;
            const focusName     = html.find('#focus-select option:selected').text();
            const calledShot    = Number(html.find('#called-shot-select').val()) || 0;
            const situationMod  = Number(html.find('#situational-mod').val()) || 0;
            const spendMental   = html.find('#strain-mental').is(':checked');
            const spendPhysical = html.find('#strain-physical').is(':checked');
            const strainBonus   = (spendMental || spendPhysical) ? 2 : 0;
            const strainType    = spendMental ? "mental" : spendPhysical ? "physical" : null;

            let tagBonus = 0; const appliedTags = [];
            html.find('.bp-tag-check:checked').each((i, el) => { tagBonus += Number(el.dataset.modifier)||0; appliedTags.push(el.dataset.name); });

            let trackBonus = 0; let trackLabel = null;
            const selTrack = html.find('input[name="bp-track-select"]:checked').val();
            if (selTrack) {
              const tMod = Number(html.find(`input[value="${selTrack}"]`).data('mod'))||0;
              trackLabel = html.find(`input[value="${selTrack}"]`).data('label');
              trackBonus = html.find('input[name="bp-track-dir"]:checked').val() === "helping" ? Math.abs(tMod) : -Math.abs(tMod);
            }

            let equipBonus = 0; const appliedEquip = [];
            html.find('.bp-equip-check:checked').each((i, el) => { equipBonus += Number(el.dataset.modifier)||0; appliedEquip.push(el.dataset.name); });

            let armorBonus = 0; let armorLabel = null;
            const selArmor = html.find('input[name="bp-armor-select"]:checked').val();
            if (selArmor) {
              const aMod = Number(html.find(`input[value="${selArmor}"]`).data('mod'))||0;
              armorLabel = html.find(`input[value="${selArmor}"]`).data('label');
              armorBonus = html.find('input[name="bp-armor-dir"]:checked').val() === "helping" ? Math.abs(aMod) : -Math.abs(aMod);
            }

            // Fire mode
            const fireMode  = html.find('input[name="fire-mode"]:checked').val() || 'single';
            const burstType = html.find('input[name="burst-type"]:checked').val() || 'split';
            const focusFire = fireMode !== 'single' && burstType === 'focus';

            if (strainType) {
              const cur = this.actor.system.strain[strainType].value;
              await this.actor.update({ [`system.strain.${strainType}.value`]: cur + 1 });
            }

            const finalTN = attrValue + skillRank + focusBonus + situationMod + strainBonus + woundPenalty + tagBonus + trackBonus + equipBonus + armorBonus - calledShot + ammoAttackMod;
            const roll = new Roll(`${diceCount}d10`);
            await roll.evaluate();

            const diceResults = roll.dice[0].results.map(r => r.result);
            const lowestDie   = Math.min(...diceResults);
            const success     = lowestDie <= finalTN;
            const actionValue = finalTN - lowestDie;

            const calledShotNote = calledShot > 0 ? `<div class="bp-chat-row"><span class="bp-label">CALLED SHOT</span><span class="bp-value">-${calledShot} TN / +${calledShot} to damage</span></div>` : "";

            const specialResult = actionValue >= 5
              ? `<div class="bp-chat-special bp-benefit">▲ BENEFIT</div>`
              : actionValue === 0 ? `<div class="bp-chat-special bp-complication">▼ COMPLICATION</div>`
              : actionValue <= -5 ? `<div class="bp-chat-special bp-consequence">▼ CONSEQUENCE</div>` : "";

            const tnBreakdown = `${attrLabel} +${attrValue} ${skillLabel} +${skillRank}${focusBonus ? ' Focus +'+focusBonus : ''}${situationMod ? ' Sit '+(situationMod>0?'+':'')+situationMod : ''}${strainBonus ? ' Strain +2' : ''}${woundPenalty < 0 ? ' Wounds '+woundPenalty : ''}${tagBonus ? ' Tags '+(tagBonus>0?'+':'')+tagBonus : ''}${trackBonus ? ' Track '+(trackBonus>0?'+':'')+trackBonus : ''}${calledShot ? ' Called -'+calledShot : ''}${ammoAttackMod ? ' Ammo '+(ammoAttackMod>0?'+':'')+ammoAttackMod : ''}`;

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: `
                <div class="bp-chat-card">
                  <div class="bp-chat-header">${weaponName} <span style="font-weight:400;font-size:0.85em;">(${tierLabel} Attack)</span></div>
                  <div class="bp-chat-body">
                    <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnBreakdown}">ⓘ</span></span></div>
                    <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${diceCount}d10 [${diceResults.join(', ')}] — lowest: ${lowestDie}</span></div>
                    ${ammoAttackMod ? `<div class="bp-chat-row"><span class="bp-label">AMMO</span><span class="bp-value">${ammoName} (${ammoAttackMod > 0 ? '+' : ''}${ammoAttackMod} to hit)</span></div>` : ""}
                    ${focusName && focusName !== "None" ? `<div class="bp-chat-row"><span class="bp-label">FOCUS</span><span class="bp-value">${focusName}</span></div>` : ""}
                    ${strainType ? `<div class="bp-chat-row"><span class="bp-label">STRAIN</span><span class="bp-value">${strainType.charAt(0).toUpperCase()+strainType.slice(1)} spent</span></div>` : ""}
                    ${calledShotNote}
                    ${fireMode !== 'single' ? `<div class="bp-chat-row"><span class="bp-label">FIRE MODE</span><span class="bp-value">${fireMode === 'full' ? 'Full Auto' : 'Burst'} — ${focusFire ? 'Focus Fire (+2 damage)' : 'Split Target'}</span></div>` : ""}
                    <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${actionValue >= 0 ? '+' : ''}${actionValue}</span></div>
                    ${specialResult}
                  </div>
                </div>`,
              flags: { "blue-planet-recontact": { rollData: { actorId: this.actor.id, type: "weaponAttack", weaponName, diceCount, attrKey, attrValue, attrLabel, skillRank, skillLabel, focusBonus, situationMod, strainBonus, woundPenalty, tagBonus, trackBonus, equipBonus, armorBonus, calledShot, ammoAttackMod, ammoName } } }
            });
          }
        }
      },
      default: "roll"
    }).render(true);
  }

  async _onRollWeaponDamage(event) {
    event.preventDefault();
    event.stopPropagation();

    const el         = event.currentTarget;
    const itemId     = el.dataset.itemId;
    const weaponName = el.dataset.name;
    const rawDamage  = el.dataset.damage || "0";
    const isVariable = rawDamage.toLowerCase() === "variable";

    // Ammo catalogs for variable damage weapons
    const GRENADE_AMMO = [
      { name: "Armor-Piercing",  damage: 12, special: null },
      { name: "Concussion",      damage: 8,  special: null },
      { name: "Fragmentation",   damage: 10, special: null },
      { name: "Incendiary",      damage: 8,  special: "Burning compound — DR drops by 1 each round until 0. See special rules p.281." },
      { name: "Breaching",       damage: 15, special: "Directed DR 15 vs target, explosive backblast DR 6. See special rules." },
      { name: "EMP",             damage: 0,  special: "No physical damage. Electronics within 10m make Durability test at -4 or short out." },
      { name: "Suppression",     damage: 0,  special: "No damage. Targets make Physique or Psyche test or suffer -6 penalty for (10-Physique) rounds." },
      { name: "Adhesive",        damage: 0,  special: "Targets within 4m blast radius bonded to surroundings. -6 penalty to all physical actions." },
      { name: "Flash-Bang",      damage: 1,  special: "Stun test required. Failure = -6 penalty for (10-Physique) rounds." },
      { name: "Nausea",          damage: 0,  special: "Contact gas. -6 penalty to all actions; Psyche test reduces to -3. Effect lasts 5+(10-Physique) min." },
      { name: "Sleep",           damage: 0,  special: "Contact gas. Unconscious for 5+(10-Physique) min. Blocked by filters/gas masks." },
      { name: "OBS",             damage: 0,  special: "Prismatic smoke cloud. Opaque to all sensors except high-powered sonar." }
    ];

    const TORPEDO_AMMO = [
      { name: "HE (High-Explosive)",   damage: 22, special: null },
      { name: "HEAP",                  damage: 16, special: "Halves target armor rating (round down)." },
      { name: "Incendiary",            damage: 12, special: "DR 12 first round, drops by 1 each round. See burning rules p.281." },
      { name: "EMP",                   damage: 0,  special: "See EMP Missile special rules." }
    ];

    // Standard ammo modifiers for firearms
    const STANDARD_AMMO = [
      { name: "Standard",         dmgMult: 1,   dmgAdd: 0,  armorMod: 0,    special: null },
      { name: "Antipersonnel",    dmgMult: 1,   dmgAdd: 2,  armorMod: 0,    special: "+2 DR vs unarmored. Against armored targets: -2 DR instead.", feature: "antipersonnel" },
      { name: "Armor-Piercing",   dmgMult: 1,   dmgAdd: 0,  armorMod: -4,   special: "Reduces target armor by 4 (min 0).", feature: "armor-piercing" },
      { name: "HE",               dmgMult: 2,   dmgAdd: 0,  armorMod: 0,    special: "Doubles the base damage rating.", feature: "he" },
      { name: "HEAP",             dmgMult: 1.5, dmgAdd: 0,  armorMod: -2,   special: "Damage rating x1.5 (round down). Reduces target armor by 2.", feature: "heap" },
      { name: "Suppression-Gel",  dmgMult: 0,   dmgAdd: 0,  armorMod: 0,    special: "Max minor wound only. Target makes Physique or Psyche test or suffers -6 penalty for (10-Physique) rounds. Half range. Ineffective vs armor.", feature: null },
      { name: "Harpoon",          dmgMult: 0.5, dmgAdd: 0,  armorMod: 0,    special: "Underwater DR reduced to 50% of normal instead of standard 90%. For amphibious weapons.", feature: null },
    ];

    // Determine ammo type from item system data
    const damageItem   = this.actor.items.get(itemId);
    const ammoType     = damageItem?.system?.ammoType || "grenade";
    const ammoList     = ammoType === "torpedo" ? TORPEDO_AMMO : GRENADE_AMMO;
    const loadedAmmoId = damageItem?.system?.loadedAmmo || "";
    const loadedAmmoItem = loadedAmmoId ? this.actor.items.get(loadedAmmoId) : null;

    const baseDamage = isVariable ? 0 : (Number(rawDamage) || 0);

    // Check active features for armor-piercing and burst
    const activeFeatures = damageItem ? (damageItem.system.features || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
    const hasArmorPiercing = activeFeatures.includes('armor-piercing');
    const hasBurst         = activeFeatures.includes('burst') || activeFeatures.includes('full');
    const armorPierceVal   = hasArmorPiercing ? (CONFIG.BLUEPLANET?.featureCatalog?.['armor-piercing']?.armorPierce ?? 4) : 0;

    const buildDropdown = (id, label, defaultVal = 0) => {
      let opts = '';
      for (let i = 0; i <= 10; i++) opts += `<option value="${i}" ${i === defaultVal ? 'selected' : ''}>${i}</option>`;
      return `<div class="form-group"><label>${label}</label><select id="${id}">${opts}</select></div>`;
    };

    // Build ammo selector
    const buildAmmoSelect = () => {
      if (!isVariable) {
        // Standard firearm — show loaded ammo note if any
        if (!loadedAmmoItem) return '';
        const sys = loadedAmmoItem.system;
        return `<div class="form-group" style="background:#f4f7fb;border:1px solid #c9d6e3;padding:6px 8px;margin-bottom:8px;">
          <label style="font-weight:700;color:#1b3f75;font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;font-size:0.8rem;">Loaded Ammo</label>
          <div style="font-size:0.9rem;font-weight:600;color:#1b3f75;margin-top:2px;">${loadedAmmoItem.name}</div>
          ${sys.special ? `<div style="font-size:0.8rem;color:#856404;margin-top:3px;">${sys.special}</div>` : ''}
        </div>`;
      }
      // Variable damage — show ammo selector
      const loadedAmmoName = loadedAmmoItem?.name || '';
      const opts = ammoList.map((a, i) => {
        const isSelected = loadedAmmoName && a.name.toLowerCase().includes(loadedAmmoName.toLowerCase().split('—')[1]?.trim() || '___');
        return `<option value="${i}" ${isSelected ? 'selected' : ''}>${a.name} (DR ${a.damage}${a.special ? ' — special' : ''})</option>`;
      }).join('');
      return `<div class="form-group">
        <label style="font-weight:700;color:#1b3f75;">Ammo Type</label>
        <select id="ammo-type-select">${opts}</select>
        <div id="ammo-special-note" style="font-size:0.8rem;color:#856404;margin-top:4px;padding:4px 6px;background:#fff3cd;border-left:3px solid #ffc107;display:none;"></div>
      </div>`;
    };

    const content = `
      <form class="bp-roll-dialog">
        <p style="margin:0 0 8px 0;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">
          <strong>${weaponName}</strong> — Damage Roll${isVariable ? '' : ' (Base: '+baseDamage+')'}
          ${hasArmorPiercing ? '<span style="color:#2d6da6;font-size:0.85rem;"> — Armor-Piercing (-'+armorPierceVal+' armor)</span>' : ''}
        </p>
        ${buildAmmoSelect()}
        ${buildDropdown('called-shot-bonus', 'Called Shot Bonus')}
        ${hasBurst ? `
        <div class="form-group">
          <label>Focus Fire Bonus</label>
          <select id="focus-fire-bonus">
            <option value="0">0 (No focus fire)</option>
            <option value="2">+2 (Focus Fire)</option>
          </select>
        </div>` : ''}
        ${buildDropdown('target-armor', 'Target Armor Rating')}
        ${buildDropdown('target-physique', 'Target Physique')}
        <div class="form-group">
          <label>Situational Modifier</label>
          <input type="number" id="damage-sit-mod" value="0"/>
        </div>
      </form>`;

    new Dialog({
      title: `${weaponName} — Damage`,
      content,
      render: (html) => {
        if (!isVariable) return;
        const updateAmmoNote = () => {
          const idx = Number(html.find('#ammo-type-select').val()) || 0;
          const ammo = ammoList[idx];
          const noteEl = html.find('#ammo-special-note');
          if (ammo?.special) {
            noteEl.text(ammo.special).show();
          } else {
            noteEl.hide();
          }
        };
        html.find('#ammo-type-select').change(updateAmmoNote);
        updateAmmoNote();
      },
      buttons: {
        roll: {
          label: "ROLL DAMAGE",
          callback: async (html) => {
            const calledBonus    = Number(html.find('#called-shot-bonus').val()) || 0;
            const focusFireBonus = Number(html.find('#focus-fire-bonus').val()) || 0;
            let   targetArmor   = Number(html.find('#target-armor').val()) || 0;
            const targetPhysique = Number(html.find('#target-physique').val()) || 0;
            const sitMod         = Number(html.find('#damage-sit-mod').val()) || 0;

            // Get ammo modifiers
            let selectedAmmo  = null;
            let ammoDamage    = baseDamage;
            let ammoArmorMod  = 0;
            let ammoName      = '';

            if (isVariable) {
              const idx = Number(html.find('#ammo-type-select').val()) || 0;
              selectedAmmo = ammoList[idx];
              ammoDamage   = selectedAmmo.damage;
              ammoName     = selectedAmmo.name;
            } else if (loadedAmmoItem) {
              const sys = loadedAmmoItem.system;
              // Apply loaded ammo modifiers to base damage
              if (sys.dmgMult !== undefined && sys.dmgMult !== 1) {
                ammoDamage = Math.floor(baseDamage * sys.dmgMult);
              } else {
                ammoDamage = baseDamage + (sys.dmgAdd || 0);
              }
              ammoArmorMod = sys.armorMod || 0;
              ammoName     = loadedAmmoItem.name;
              // Handle special-only ammo
              if (sys.dmgMult === 0 && sys.dmgAdd === 0 && sys.special) {
                await ChatMessage.create({
                  speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                  content: `<div class="bp-chat-card">
                    <div class="bp-chat-header">${weaponName} — ${ammoName}</div>
                    <div class="bp-chat-body">
                      <div class="bp-chat-special bp-complication" style="font-size:0.9rem;">${sys.special}</div>
                    </div>
                  </div>`
                });
                return;
              }
            }

            // If special-rules-only ammo (DR 0 and has special), post to chat and skip roll
            if (isVariable && selectedAmmo && selectedAmmo.damage === 0 && selectedAmmo.special) {
              await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `
                  <div class="bp-chat-card">
                    <div class="bp-chat-header">${weaponName} — ${selectedAmmo.name}</div>
                    <div class="bp-chat-body">
                      <div class="bp-chat-special bp-complication" style="font-size:0.9rem;">${selectedAmmo.special}</div>
                    </div>
                  </div>`
              });
              return;
            }

            // Apply armor-piercing and ammo armor modifier
            const armorReduction = hasArmorPiercing ? Math.min(armorPierceVal, targetArmor) : 0;
            const totalArmorMod  = armorReduction + Math.abs(Math.min(0, ammoArmorMod));
            const effectiveArmor = Math.max(0, targetArmor - totalArmorMod);

            const damageRating = ammoDamage + calledBonus + focusFireBonus;
            const finalTN = damageRating - effectiveArmor - targetPhysique + sitMod;
            const roll    = new Roll("3d10");
            await roll.evaluate();

            const results   = roll.dice[0].results.map(r => r.result);
            const successes = results.filter(r => r <= finalTN).length;
            const woundLevel = successes === 0 ? "No Wound"
              : successes === 1 ? "MINOR WOUND"
              : successes === 2 ? "MAJOR WOUND"
              : "MORTAL WOUND";

            const woundClass = successes === 0 ? "bp-success" : successes === 1 ? "bp-complication" : "bp-consequence";
            const tnBreakdown = `DMG ${ammoDamage}${calledBonus ? ' +'+calledBonus+' called' : ''}${focusFireBonus ? ' +'+focusFireBonus+' focus' : ''}${armorReduction ? ' AP-'+armorReduction : ''} − Armor ${effectiveArmor} − Physique ${targetPhysique}${sitMod ? (sitMod>0?' +':' ')+sitMod : ''}`;

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: `
                <div class="bp-chat-card">
                  <div class="bp-chat-header">${weaponName}${selectedAmmo ? ' — '+selectedAmmo.name : ''} <span style="font-weight:400;font-size:0.85em;">(Damage)</span></div>
                  <div class="bp-chat-body">
                    <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnBreakdown}">ⓘ</span></span></div>
                    ${hasArmorPiercing && armorReduction > 0 ? `<div class="bp-chat-row"><span class="bp-label">ARMOR-PIERCE</span><span class="bp-value">-${armorReduction} armor (${targetArmor} → ${effectiveArmor})</span></div>` : ""}
                    ${focusFireBonus ? `<div class="bp-chat-row"><span class="bp-label">FOCUS FIRE</span><span class="bp-value">+${focusFireBonus} damage</span></div>` : ""}
                    <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">3d10 [${results.join(', ')}] — ${successes} success${successes !== 1 ? 'es' : ''}</span></div>
                    ${selectedAmmo?.special ? `<div class="bp-chat-special bp-complication" style="font-size:0.8rem;margin-top:4px;">${selectedAmmo.special}</div>` : ""}
                    <div class="bp-chat-special ${woundClass}" style="font-size:1.1em;font-weight:700;text-align:center;padding:6px;">${woundLevel}</div>
                  </div>
                </div>`
            });
          }
        }
      },
      default: "roll"
    }).render(true);
  }

  async _onRollWeapon(event) {
    event.preventDefault();
    console.log("Weapon Roll Triggered");
  }

  _getFeatureModifier(featureKey, type) {
    const cleanKey = featureKey.toLowerCase();
    if (!CONFIG.BLUEPLANET || !CONFIG.BLUEPLANET.featureCatalog) return 0;
    const entry = CONFIG.BLUEPLANET.featureCatalog[cleanKey];
    return entry ? (entry[type] || 0) : 0;
  }

  _renderFeatureEditDialog(key, existingData) {
    new Dialog({
      title: "Feature Not Found",
      content: `<p>Feature '${key}' is not in the catalog.</p>`,
      buttons: { ok: { label: "OK" } }
    }).render(true);
  }
}

/* -------------------------------------------- */
/* CONTEXT MENU — STRAIN RE-ROLL                */
/* -------------------------------------------- */

Hooks.on("getChatMessageContextOptions", (html, options) => {
  const getData = (li) => {
    const msg = game.messages.get(li.dataset.messageId);
    return msg?.flags?.["blue-planet-recontact"]?.rollData ?? null;
  };

  const getActor = (li) => {
    const data = getData(li);
    return data ? game.actors.get(data.actorId) : null;
  };

  const hasStrain = (li, type) => {
    const actor = getActor(li);
    if (!actor) return false;
    const s = actor.system.strain[type];
    return s.value < s.max;
  };

  const doReroll = async (li, strainType) => {
    const data  = getData(li);
    const actor = getActor(li);
    if (!data || !actor) return;

    const cur = actor.system.strain[strainType].value;
    await actor.update({ [`system.strain.${strainType}.value`]: cur + 1 });

    const sheet        = actor.sheet;
    const woundPenalty = data.woundPenalty ?? 0;

    if (data.type === "skill") {
      const skillSet   = actor.system.skillSets[data.skillKey];
      const skillRank  = Number(skillSet?.rank) || 0;
      const skillLabel = skillSet?.label ?? "";
      const attrValue  = Number(actor.system.attributes[data.attrKey].value) || 0;
      const attrLabel  = actor.system.attributes[data.attrKey].label;
      const diceCount  = data.tier;
      const tierLabel  = data.tier === 1 ? "General" : data.tier === 2 ? "Core" : "Specialty";
      const tierKey    = data.tier === 1 ? "general" : data.tier === 2 ? "core" : "specialty";
      const skillName  = skillSet?.[tierKey] ?? "Skill";
      const finalTN    = attrValue + skillRank + data.focusBonus + data.situationMod + data.strainBonus + woundPenalty;

      const roll        = new Roll(`${diceCount}d10`);
      await roll.evaluate();
      const diceResults = roll.dice[0].results.map(r => r.result);
      const lowestDie   = Math.min(...diceResults);
      const success     = lowestDie <= finalTN;
      const actionValue = finalTN - lowestDie;

      await sheet._postRollMessage({
        title: `${skillName} (Re-roll)`, subtitle: tierLabel,
        finalTN, attrLabel, attrValue, skillRank, skillLabel,
        focusBonus: data.focusBonus, focusName: null,
        situationMod: data.situationMod, strainType,
        strainBonus: data.strainBonus, woundPenalty,
        diceResults, lowestDie, diceCount, success, actionValue,
        rollData: data
      });
    } else if (data.type === "weaponAttack") {
      const ammoMod     = data.ammoAttackMod ?? 0;
      const ammoName    = data.ammoName ?? "";
      const finalTN     = data.attrValue + data.skillRank + data.focusBonus + data.situationMod
                        + data.strainBonus + woundPenalty + data.tagBonus + data.trackBonus
                        + data.equipBonus + data.armorBonus - data.calledShot + ammoMod;
      const diceCount   = data.diceCount;
      const tierLabel   = diceCount === 1 ? "General" : diceCount === 2 ? "Core" : "Specialty";

      const roll        = new Roll(`${diceCount}d10`);
      await roll.evaluate();
      const diceResults = roll.dice[0].results.map(r => r.result);
      const lowestDie   = Math.min(...diceResults);
      const success     = lowestDie <= finalTN;
      const actionValue = finalTN - lowestDie;

      const calledShotNote = data.calledShot > 0
        ? `<div class="bp-chat-row"><span class="bp-label">CALLED SHOT</span><span class="bp-value">-${data.calledShot} TN / +${data.calledShot} to damage</span></div>`
        : "";
      const specialResult = actionValue >= 5
        ? `<div class="bp-chat-special bp-benefit">▲ BENEFIT</div>`
        : actionValue === 0 ? `<div class="bp-chat-special bp-complication">▼ COMPLICATION</div>`
        : actionValue <= -5 ? `<div class="bp-chat-special bp-consequence">▼ CONSEQUENCE</div>` : "";
      const tnBreakdown = `${data.attrLabel} +${data.attrValue} ${data.skillLabel} +${data.skillRank}${data.focusBonus ? ' Focus +'+data.focusBonus : ''}${data.situationMod ? ' Sit '+(data.situationMod>0?'+':'')+data.situationMod : ''}${data.strainBonus ? ' Strain +2' : ''}${woundPenalty < 0 ? ' Wounds '+woundPenalty : ''}${data.calledShot ? ' Called -'+data.calledShot : ''}${ammoMod ? ' Ammo '+(ammoMod>0?'+':'')+ammoMod : ''}`;

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="bp-chat-card">
            <div class="bp-chat-header">${data.weaponName} <span style="font-weight:400;font-size:0.85em;">(${tierLabel} Attack — Re-roll)</span></div>
            <div class="bp-chat-body">
              <div class="bp-chat-row"><span class="bp-label">TN</span><span class="bp-value">${finalTN} <span class="bp-tn-hint" data-tooltip="${tnBreakdown}">ⓘ</span></span></div>
              <div class="bp-chat-row"><span class="bp-label">DICE</span><span class="bp-value">${diceCount}d10 [${diceResults.join(', ')}] — lowest: ${lowestDie}</span></div>
              ${ammoMod ? `<div class="bp-chat-row"><span class="bp-label">AMMO</span><span class="bp-value">${ammoName} (${ammoMod > 0 ? '+' : ''}${ammoMod} to hit)</span></div>` : ""}
              <div class="bp-chat-row"><span class="bp-label">STRAIN</span><span class="bp-value">${strainType.charAt(0).toUpperCase()+strainType.slice(1)} spent (+2 TN)</span></div>
              ${calledShotNote}
              <div class="bp-chat-result ${success ? 'bp-success' : 'bp-failure'}">${success ? '● SUCCESS' : '✕ FAILURE'}<span class="bp-av">AV ${actionValue >= 0 ? '+' : ''}${actionValue}</span></div>
              ${specialResult}
            </div>
          </div>`,
        flags: { "blue-planet-recontact": { rollData: data } }
      });
    } else {
      const finalTN     = 5 + data.attrValue + data.focusBonus + data.situationMod + data.strainBonus + woundPenalty;
      const roll        = new Roll("1d10");
      await roll.evaluate();
      const dieResult   = roll.dice[0].results[0].result;
      const success     = dieResult <= finalTN;
      const actionValue = finalTN - dieResult;

      await sheet._postRollMessage({
        title: `${data.attrLabel}${data.focusName ? ' / ' + data.focusName : ''} Test (Re-roll)`,
        subtitle: null,
        finalTN, attrLabel: data.attrLabel, attrValue: data.attrValue, skillRank: 0, skillLabel: "",
        focusBonus: data.focusBonus, focusName: data.focusName,
        situationMod: data.situationMod, strainType,
        strainBonus: data.strainBonus, woundPenalty,
        diceResults: [dieResult], lowestDie: dieResult, diceCount: 1,
        success, actionValue,
        rollData: data
      });
    }
  };

  options.push(
    {
      name: "Spend Mental Strain — Re-roll",
      icon: '<i class="fas fa-brain"></i>',
      condition: li => getData(li) && hasStrain(li, "mental"),
      callback: li => doReroll(li, "mental")
    },
    {
      name: "Spend Physical Strain — Re-roll",
      icon: '<i class="fas fa-running"></i>',
      condition: li => getData(li) && hasStrain(li, "physical"),
      callback: li => doReroll(li, "physical")
    }
  );
});