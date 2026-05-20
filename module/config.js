export const BLUEPLANET = {};

BLUEPLANET.featureCatalog = {
    // --- GENERAL FEATURES ---
    "concealable": {
        label: "Concealable",
        description: "<p>The size and design of this device provides a +2 bonus on tests to hide or disguise it.</p>",
        rule: "+2 to Hide/Disguise",
        testMod: 2,   // <--- RENAMED
        damageMod: 0
    },
    "hardened": {
        label: "Hardened",
        description: "<p>The item is reinforced to protect it in rugged applications. Any damage test against a hardened object is rolled twice, and the lower damage result is used.</p>",
        rule: "Roll Damage Twice (Take Lower)",
        testMod: 0,
        damageMod: 0
    },
    "cold": {
        label: "Cold",
        description: "<p>Describes devices with no digital contacts.</p>",
        testMod: 0, 
        damageMod: 0
    },
    "warm": {
        label: "Warm",
        description: "<p>Includes items with hardware and programming that suggest digital access, remote control, and wireless comms capability. These devices almost always require authentication codes.</p>",
        testMod: 0,
        damageMod: 0
    },
    "hot": {
        label: "Hot",
        description: "<p>Describes systems with substantial integration with neural interfaces, such as full-immersion suites. Includes content that interprets sight, sound, touch, and other senses fed through DNI. Hot devices always require authentication codes to use.</p>",
        rule: "+2 Target Number (Connected)",
        testMod: 2,
        damageMod: 0
    },
    "flat": {
        label: "Flat",
        description: "<p>These devices have no capacity to be operated remotely or to function independently.</p>",
        testMod: 0,
        damageMod: 0
    },
    "smart": {
        label: "Smart",
        description: "<p>Such devices are typically free to move and act independently performing complex tasks tuned specific to their specific design and programming contexts.</p>",
        testMod: 0,
        damageMod: 0
    },
    "gi": {
        label: "GI",
        description: "<p>Devices with General Intelligence processing appear sapient in their ability to interact with people, other digital systems, and their physical environments.</p>",
        testMod: 0,
        damageMod: 0
    },
    "manipulators": {
        label: "Manipulators",
        description: "<p>The device is equipped with mechanical or cybernetic appendages that allow it to physically interact with tools, people, environments, and otherwise use attachments.</p>",
        testMod: 0,
        damageMod: 0
    },
    "external": {
        label: "External",
        description: "<p>Includes external power sources e.g. power packs, fusion batteries, solar arrays, and fuel cells.</p>",
        testMod: 0,
        damageMod: 0
    },
    "integrated": {
        label: "Integrated",
        description: "<p>Includes fuel cells, solar collectors, nuclear batteries, and fusion reactors.</p>",
        testMod: 0,
        damageMod: 0
    },
    "kinetic": {
        label: "Kinetic",
        description: "<p>Uses integrated scavengers that reclaim bodily movement into electrical power.</p>",
        testMod: 0,
        damageMod: 0
    },
    "physiological": {
        label: "Physiological",
        description: "<p>Draws power from implants of electrochemical or system/bioconverters.</p>",
        testMod: 0,
        damageMod: 0
    },
    "rechargeable": {
        label: "Rechargeable",
        description: "<p>Uses integrated batteries that can be charged from a variety of sources.</p>",
        testMod: 0,
        damageMod: 0
    },
    "air-gapped": {
        label: "Air-Gapped",
        description: "<p>The device can’t be accessed via wireless comms sharing, environments, multifactor or authentication.</p>",
        testMod: 0,
        damageMod: 0
    },
    "damaged": {
        label: "Damaged",
        description: "<p>This item has suffered misuse or combat damage per the Durability Rules on page 283.</p>",
        testMod: 0,
        damageMod: 0
    },
    "drained": {
        label: "Drained",
        description: "<p>This item’s power source has been discharged and must be recharged or replaced before it can function.</p>",
        testMod: 0,
        damageMod: 0
    },
    "encrypted": {
        label: "Encrypted",
        description: "<p>Authentication and authorizations are required to use this item.</p>",
        testMod: 0,
        damageMod: 0
    },
    "handmade": {
        label: "Handmade",
        description: "<p>The item is constructed from salvage or valuable materials. It may have high aesthetic value, be bulkier, or be less reliable than similarly manufactured gear.</p>",
        testMod: 0,
        damageMod: 0
    },
    "junk": {
        label: "Junk",
        description: "<p>This item’s functions and Durability are reduced by a severe usage or age penalty.</p>",
        testMod: 0,
        damageMod: 0
    },
    "jury-rigged": {
        label: "Jury-Rigged",
        description: "<p>This item is prone to malfunction or failure, particularly when overused, stressed, or damaged.</p>",
        testMod: 0,
        damageMod: 0
    },
    "malfunctioning": {
        label: "Malfunctioning",
        description: "<p>When using this device, it fails to function properly a specific percentage of the time as determined by the moderator.</p>",
        testMod: 0,
        damageMod: 0
    },
    "premium": {
        label: "Premium",
        description: "<p>This item is expensive, high-end, custom-designed, and offers a +1 bonus to any task dependent on its use.</p>",
        rule: "+1 to Tests",
        testMod: 1,
        damageMod: 0
    },
    "upgraded": {
        label: "Upgraded",
        description: "<p>This item has enhanced functions or capabilities due to aftermarket modifications.</p>",
        testMod: 0,
        damageMod: 0
    },
    "waterlogged": {
        label: "Waterlogged",
        description: "<p>This item has suffered water infiltration and requires either repair or passing time to dry out before it can function properly again.</p>",
        testMod: 0,
        damageMod: 0
    },
    "responsive": {
        label: "Responsive",
        description: "<p>This device is constructed, at least in part, with smart materials that increase functionality.</p>",
        testMod: 0,
        damageMod: 0
    },
    "sealed": {
        label: "Sealed",
        description: "<p>The item has designs/materials that protect it against one or more common environmental hazards.</p>",
        testMod: 0,
        damageMod: 0
    },
    "sensors": {
        label: "Sensors",
        description: "<p>This device benefits added utility or integrated external or internal sensors.</p>",
        testMod: 0,
        damageMod: 0
    },
    "low capacity": {
        label: "Low Capacity",
        description: "<p>Running out of ammo has immediate consequences during combat.</p>",
        testMod: 0,
        damageMod: 0
    },
    "high capacity": {
        label: "High Capacity",
        description: "<p>The quantity of carried ammo is unlikely to run out during combat.</p>",
        testMod: 0,
        damageMod: 0
    },
    // Aliases
    "low": { label: "Low", description: "See Low Capacity", testMod: 0, damageMod: 0 },
    "high": { label: "High", description: "See High Capacity", testMod: 0, damageMod: 0 },

    // --- WEAPON & COMBAT FEATURES ---
    "antipersonnel": {
        label: "Antipersonnel",
        description: "<p>Shot or fléchette ammo increases the damage rating of the weapon by +2 when used against unarmored targets, but decreases it by 2 against armored targets.</p>",
        rule: "+2 Damage v +2/-4",
        testMod: 2, 
        damageMod: 2 
    },
    "armor-piercing": {
        label: "Armor-Piercing",
        description: "<p>Reduces the target's armor rating by 4 points (minimum 0).</p>",
        rule: "Target Armor -4 (min 0)",
        testMod: 0,
        damageMod: 0,
        armorPierce: 4
    },
    "he": {
        label: "High Explosive (HE)",
        description: "<p>High Explosive. Creates area damage radius/standard trauma.</p>",
        rule: "Damage Rating x2",
        testMod: 0,
        damageMod: 0 
    },
    "heap": {
        label: "HEAP",
        description: "<p>High Explosive Armor Piercing. Reduces target’s armor rating by half and increases damage rating by 50%.</p>",
        testMod: 0,
        damageMod: 0
    },
    "self-guided": {
        label: "Self-Guided",
        description: "<p>Provides a +2 Target Number to hit, and eliminates range penalties.</p>",
        rule: "+2 to Hit",
        testMod: 2,
        damageMod: 0
    },
    "self-propelled": {
        label: "Self-Propelled",
        description: "<p>Rocket/missile engines extend effective range.</p>",
        testMod: 0,
        damageMod: 0
    },
    "close combat": {
        label: "Close Combat",
        description: "<p>The weapon has no effective Attr/Skill base for hand range.</p>",
        testMod: 0,
        damageMod: 0
    },
    "indirect": {
        label: "Indirect",
        description: "<p>The weapon gains the self-guided feature and can effectively shoot over or around obstacles.</p>",
        testMod: 0,
        damageMod: 0
    },
    "optics": {
        label: "Optics",
        description: "<p>This feature provides the weapon with visual targeting systems that grant +2 Target number for hit rolls.</p>",
        rule: "+2 to Hit",
        testMod: 2,
        damageMod: 0
    },
    "single": {
        label: "Single",
        description: "<p>Single Shot. Fires one shot per action, with standard damage ratings for the weapon type.</p>",
        testMod: 0,
        damageMod: 0
    },
    "burst": {
        label: "Burst",
        description: "<p>Burst fire. Fires three rounds per action, providing +2 Damage Rating or the option to shoot at two close targets.</p>",
        rule: "+2 Damage Rating or Two Targets",
        testMod: 0,
        damageMod: 2
    },
    "full": {
        label: "Full Auto",
        description: "<p>Fires multiple bursts per action, providing +4 Damage Rating or the option to shoot at up to four close targets.</p>",
        rule: "+4 Damage Rating or Four Targets",
        testMod: 0,
        damageMod: 4
    },
    "sniper": {
        label: "Sniper",
        description: "<p>The weapon uses specialized barrel design, stabilizers, and sighting technologies that double the effective range.</p>",
        testMod: 0,
        damageMod: 0
    },
    "suppressed": {
        label: "Suppressed",
        description: "<p>Targets must win either a Listen awareness test or notice the weapon firing to spot a suppressed weapon.</p>",
        testMod: 0,
        damageMod: 0
    },
    "two-handed": {
        label: "Two-Handed",
        description: "<p>Both hands are required to effectively operate this weapon.</p>",
        testMod: 0,
        damageMod: 0
    }
};