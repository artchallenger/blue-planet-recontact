export class BluePlanetCharacterData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        const focusField = () => new fields.SchemaField({
            name: new fields.StringField({ initial: "" }),
            rank: new fields.NumberField({ initial: 0, integer: true })
        });

        const attributeField = (label) => new fields.SchemaField({
            value: new fields.NumberField({ initial: 0, integer: true }),
            label: new fields.StringField({ initial: label }),
            focus1: focusField(),
            focus2: focusField()
        });

        const skillSetField = (label) => new fields.SchemaField({
            label:     new fields.StringField({ initial: label }),
            rank:      new fields.NumberField({ initial: 0, integer: true }),
            general:   new fields.StringField({ initial: "" }),
            core:      new fields.StringField({ initial: "" }),
            specialty: new fields.StringField({ initial: "" })
        });

        const trackField = (label) => new fields.SchemaField({
            label: new fields.StringField({ initial: label }),
            value: new fields.NumberField({ initial: 3, integer: true, min: 1, max: 5 }),
            line5: new fields.StringField({ initial: "" }),
            line4: new fields.StringField({ initial: "" }),
            line3: new fields.StringField({ initial: "" }),
            line2: new fields.StringField({ initial: "" }),
            line1: new fields.StringField({ initial: "" })
        });

        return {
            details: new fields.SchemaField({
                concept:         new fields.SchemaField({ level: new fields.StringField({ initial: "everyday" }) }),
                motivation:      new fields.StringField({ initial: "" }),
                goal:            new fields.StringField({ initial: "" }),
                attitude:        new fields.StringField({ initial: "" }),
                generalStyle:    new fields.StringField({ initial: "" }),
                species:         new fields.StringField({ initial: "" }),
                pronouns:        new fields.StringField({ initial: "" }),
                apparentAge:     new fields.StringField({ initial: "" }),
                actualAge:       new fields.StringField({ initial: "" }),
                clothing:        new fields.StringField({ initial: "" }),
                height:          new fields.StringField({ initial: "" }),
                stature:         new fields.StringField({ initial: "" }),
                eyeColor:        new fields.StringField({ initial: "" }),
                hairColor:       new fields.StringField({ initial: "" }),
apparentBiomods: new fields.StringField({ initial: "" }),
                complexion:      new fields.StringField({ initial: "" }),
                biography:       new fields.StringField({ initial: "" })
            }),
            attributes: new fields.SchemaField({
                cognition:    attributeField("Cognition"),
                psyche:       attributeField("Psyche"),
                physique:     attributeField("Physique"),
                coordination: attributeField("Coordination")
            }),
            skillSets: new fields.SchemaField({
                origin:        skillSetField("Origin"),
                background:    skillSetField("Background"),
                occupation:    skillSetField("Occupation"),
                experiential:  skillSetField("Experiential"),
                developmental: skillSetField("Developmental"),
                exceptional:   skillSetField("Exceptional"),
                elite:         skillSetField("Elite"),
                advancement1:  skillSetField("Advancement"),
                advancement2:  skillSetField("Advancement"),
                advancement3:  skillSetField("Advancement")
            }),
            tracks: new fields.SchemaField({
                track1: trackField("TRACK 1"),
                track2: trackField("TRACK 2"),
                track3: trackField("TRACK 3")
            }),
            chips: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 25 }),
            reputation: new fields.SchemaField({
                value:  new fields.NumberField({ initial: 0, integer: true, min: 0, max: 25 }),
                label1: new fields.StringField({ initial: "Unknown" }),
                label2: new fields.StringField({ initial: "Rumored" }),
                label3: new fields.StringField({ initial: "Notable" }),
                label4: new fields.StringField({ initial: "(In)Famous" }),
                label5: new fields.StringField({ initial: "Renowned" })
            }),
            strain: new fields.SchemaField({
                physical: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 6 }) }),
                mental:   new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 4 }) })
            }),
            wounds: new fields.SchemaField({
                minor:  new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 5 }) }),
                major:  new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 4 }) }),
                mortal: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 3 }) })
            })
        };
    }
}

export class BluePlanetNPCData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            npcType: new fields.StringField({ initial: "" }),
            tier:    new fields.StringField({ initial: "" }),
            biomods: new fields.StringField({ initial: "" }),
            attitude:    new fields.StringField({ initial: "" }),
            motivation:  new fields.StringField({ initial: "" }),
            description: new fields.StringField({ initial: "" }),
            attributes: new fields.SchemaField({
                cognition:    new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }), label: new fields.StringField({ initial: "Cognition" }) }),
                psyche:       new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }), label: new fields.StringField({ initial: "Psyche" }) }),
                coordination: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }), label: new fields.StringField({ initial: "Coordination" }) }),
                physique:     new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }), label: new fields.StringField({ initial: "Physique" }) })
            }),
            skills: new fields.ArrayField(new fields.StringField()),
            attack: new fields.StringField({ initial: "" }),
            wounds: new fields.SchemaField({
                minor:  new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 5 }) }),
                major:  new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 4 }) }),
                mortal: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 3 }) })
            })
        };
    }
}

export class BluePlanetCreatureData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            scientificName: new fields.StringField({ initial: "" }),
            distribution:   new fields.StringField({ initial: "" }),
            size:           new fields.StringField({ initial: "" }),
            encounterRate:  new fields.StringField({ initial: "" }),
            resourceValue:  new fields.StringField({ initial: "" }),
            threatLevel:    new fields.StringField({ initial: "" }),
            attack:         new fields.StringField({ initial: "" }),
            attributeRaw:   new fields.StringField({ initial: "" }),
            description:    new fields.StringField({ initial: "" }),
            attributes: new fields.SchemaField({
                awareness:    new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }), label: new fields.StringField({ initial: "Awareness" }) }),
                coordination: new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }), label: new fields.StringField({ initial: "Coordination" }) }),
                physique:     new fields.SchemaField({ value: new fields.NumberField({ initial: 0, integer: true }), label: new fields.StringField({ initial: "Physique" }) })
            }),
            wounds: new fields.SchemaField({
                minor:  new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 5 }) }),
                major:  new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 4 }) }),
                mortal: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 3 }) })
            })
        };
    }
}

export class BluePlanetSimpleNPCData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            tier:  new fields.StringField({ initial: "everyday" }),   // everyday | exceptional | elite
            level: new fields.StringField({ initial: "average" }),    // below | average | above
            notes: new fields.StringField({ initial: "" }),
            wounds: new fields.SchemaField({
                minor:  new fields.BooleanField({ initial: false }),
                major:  new fields.BooleanField({ initial: false }),
                mortal: new fields.BooleanField({ initial: false })
            })
        };
    }
}