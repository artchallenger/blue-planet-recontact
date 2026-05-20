/**
 * Extend the basic ItemSheet.
 * @extends {foundry.appv1.sheets.ItemSheet}
 */
export class BluePlanetItemSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blueplanet", "sheet", "item"],
      width: 600,
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    // FIX: Pointing to the SINGLE file you uploaded
    return `systems/blue-planet-recontact/templates/items/item-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = await super.getData();
    const itemData = this.item.toObject(false);

    context.system = itemData.system;
    context.flags = itemData.flags;
    context.config = CONFIG.BLUEPLANET;

    // Feature Parsing Logic
    if (context.system.features) {
        const rawList = context.system.features.split(',').map(s => s.trim()).filter(s => s);
        context.enrichedFeatures = rawList.map(key => {
            const configKey = key.toLowerCase();
            const configData = CONFIG.BLUEPLANET.featureCatalog ? CONFIG.BLUEPLANET.featureCatalog[configKey] : null;
            return {
                label: configData ? configData.label : key,
                found: !!configData,
                key: configKey,
                description: configData ? configData.description : "No description available."
            };
        });
    }

    // Available Features Word Cloud
    if (context.system.availableFeatures) {
        const catalog = CONFIG.BLUEPLANET.featureCatalog || {};
        const activeSet = new Set(
            (context.system.features || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s)
        );
        context.availableFeatureChips = context.system.availableFeatures
            .split(',').map(s => s.trim().toLowerCase()).filter(s => s)
            .map(key => {
                const entry = catalog[key];
                return {
                    key,
                    label: entry ? entry.label : key,
                    description: entry ? entry.description.replace(/<[^>]+>/g, '') : '',
                    active: activeSet.has(key)
                };
            });
    } else {
        context.availableFeatureChips = [];
    }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // FEATURE TOGGLE CHIPS
    html.find('.feature-toggle-chip').click(async (ev) => {
      const key = ev.currentTarget.dataset.key;
      const current = (this.item.system.features || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      let updated;
      if (current.includes(key)) {
        updated = current.filter(k => k !== key);
      } else {
        updated = [...current, key];
      }
      await this.item.update({ 'system.features': updated.join(', ') });
    });
  }
}