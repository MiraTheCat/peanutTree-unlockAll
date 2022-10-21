addLayer("c", {
    name: "Coins", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "C", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(1),
        total: new Decimal(0),
        best: new Decimal(0),
        auto: false,
    }},
    color: "#d5d900",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "coins", // Name of prestige currency
    baseResource: "peanuts", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1)

        if (hasUpgrade('c', 21)) mult = mult.times(upgradeEffect('c', 21));
        if (hasUpgrade("f", 11)) mult = mult.times(upgradeEffect("f", 11));
        if (hasUpgrade("t", 11)) mult = mult.times(upgradeEffect("t", 11));
        if (hasUpgrade("ms", 12)) mult = mult.times(tmp.ms.effect2);

        if (player.t.unlocked) mult = mult.times(tmp.t.effect);
        if (player.t.unlocked) mult = mult.times(tmp.t.buyables[11].effect.second);
        if (tmp.b.buyables[11].unlocked) mult = mult.times(tmp.b.buyables[11].effect);
        if (player.n.unlocked) mult = mult.times(tmp.n.clickables[14].effect);
        if (player.l.unlocked) mult = mult.times(tmp.l.buyables[12].effect);

        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(1);

        if (hasAchievement("a", 33)) exp = exp.times(1.1);

        return exp;
    },
    passiveGeneration() {
        return (hasMilestone("sg", 2)) ? new Decimal(1).times(tmp.ab.timeSpeed) : 0
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "c", description: "C: Perform a Coin reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true},
    
    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("f", 0) && resettingLayer == "f")
            keep.push("upgrades")
        if (hasMilestone("sg", 0) && resettingLayer == "sg")
            keep.push("upgrades")
        if (hasAchievement("a", 34))
            keep.push("upgrades")
        if (layers[resettingLayer].row > this.row)
            layerDataReset("c", keep)
    },

    upgrades: {
        11: {
            title: "Peanut Tree",
            description: "Farm 1 peanut/second",
            cost: new Decimal(1),
        },

        12: {
            title: "Increased Production",
            description: "Double your peanut production",
            cost: new Decimal(1),

            canAfford() {
                return hasUpgrade("c", 11);
            },
        },

        13: {
            title: "Higher Payment",
            description: "Peanut production increases based on the current amount of coins",
            cost: new Decimal(2),

            effect() {
                let eff = player.c.points.plus(1).pow(0.35);

                let capPow = new Decimal(1).div(upgradeEffect("c", 13).log(1e300).sub(11).max(1.666666));

                if (hasUpgrade("f", 11) && player.c.points.gt(0)) eff = eff.times(upgradeEffect("f", 11));
                if (hasUpgrade("c", 14) && player.c.points.gt(0)) eff = eff.pow(upgradeEffect("c", 14));

                if (player.b.unlocked) eff = eff.times(tmp.b.buyables[21].effect);

                eff = softcap(eff, new Decimal("e3800"), capPow);

                if (eff.gte("e10000")) eff = new Decimal("e10000");

                return eff.max(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" + ((upgradeEffect("c", 13).gte("e3800")) ? ((upgradeEffect("c", 13).gte("e10000")) ? " (hardcapped)" : " (softcapped)") : "") }, // Add formatting to the effect
        },

        14: {
            title: "Massive Payment",
            description: "Boost the upgrade to the left by the amount of Helium",
            cost: new Decimal("e7810"),

            effect() {
                let base = player.p.helium;

                let eff = base.add(1).log10().add(1).log10().max(1).sqrt();

                return eff;
            },
            effectDisplay() { return "^" +  format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },

        21: {
            title: "No Inflation",
            description: "Coin gain increases based on the current amount of peanuts",
            cost: new Decimal(5),

            effect() {
                let eff = player.points.add(1).pow(0.1);

                if (hasUpgrade("sg", 11)) eff = eff.times(upgradeEffect("sg", 11));
                if (hasUpgrade("n", 13)) eff = eff.times(player.points.pow(0.05));

                eff = softcap(eff, new Decimal("e20000", 0.2));

                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" + ((player.points.gte("e20000")) ? " (softcapped)" : "") }, // Add formatting to the effect
        },

        22: {
            title: "More Trees",
            description: "Peanut production is increased by 4x",
            cost: new Decimal(10),
        },

        23: {
            title: "Upgrade Power",
            description: "Peanut production is faster based on the amount of upgrades bought",
            cost: new Decimal(25),

            effect() {
                let eff = new Decimal(player.c.upgrades.length).add(1);

                if (hasUpgrade("c", 32)) eff = eff.pow(2);

                if (hasUpgrade("c", 24)) eff = eff.pow(upgradeEffect("c", 24));

                return eff;
                
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect
        },

        24: {
            title: "Upgrade Power ^3",
            description: "Boost the upgrade to the left by the amount of upgrades bought",
            cost: new Decimal("e7920"),

            effect() {
                let eff = new Decimal(player.c.upgrades.length).add(1);

                return eff;
            },
            effectDisplay() { return "^" +  format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },

        31: {
            title: "Peanut Seeds",
            description: "Peanut production increases based on the current amount of peanuts",
            cost: new Decimal("1e11"),

            effect() {
                let eff = player.points.add(1).log10().add(1);

                if (hasUpgrade("c", 34) && player.points.gt(0)) eff = eff.pow(upgradeEffect("c", 34));

                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect
        },

        32: {
            title: "Upgrade Power ^2",
            description: "Upgrade Power's effect is squared",
            cost: new Decimal("1e13"),
        },

        33: {
            title: "Reverse Boost",
            description: "Farm and Sapling Generator boost bases get boosted by total peanuts",
            cost: new Decimal("1e16"),

            effect() {
                return player.points.add(1).log10().add(1).log10().add(1).sqrt();
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect
        },

        34: {
            title: "Self Boost Again",
            description: "Boost the \"Peanut Seeds\" upgrade by the current amount of peanuts",
            cost: new Decimal("e8000"),

            effect() {
                let eff = player.points.add(1).log10().add(1).log(5).max(1);
                return eff;
            },
            effectDisplay() { return "^" +  format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
    },
})

addLayer("f", {
    name: "Farms", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "F", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        auto: false,
    }},
    color: "#009e05",
    requires() {
        return new Decimal(1500);
    }, // Can be a function that takes requirement increases into account
    resource: "farms", // Name of prestige currency
    baseResource: "peanuts", // Name of resource prestige is based on
    branches: ["c"],
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1.5, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1)
        if (hasUpgrade("f", 23)) mult = mult.div(upgradeEffect("f", 23));
        if (hasUpgrade("t", 13)) mult = mult.div(upgradeEffect("t", 13));

        if (inChallenge("b", 11)) mult = mult.div("1e10");

        return mult
    },
    canBuyMax() {
        return hasMilestone("f", 1)
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(1);

        return exp;
    },
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "f", description: "F: Perform a Farm reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true;
    },
    addToBase() {
        let base = new Decimal(0);

        if (hasUpgrade("f", 12)) base = base.plus(upgradeEffect("f", 12));
        if (hasUpgrade("f", 13)) base = base.plus(upgradeEffect("f", 13));
        
        return base;
    },
    effectBase() {
        let base = new Decimal(2);
        base = base.plus(tmp.f.addToBase);
        if (hasUpgrade("c", 33)) base = base.times(upgradeEffect("c", 33));
        if (hasUpgrade("t", 21)) base = base.times(upgradeEffect("t", 21));

        if (player.ms.unlocked) base = base.times(tmp.ms.buyables[11].effect.eff);
        if (player.t.unlocked) base = base.times(tmp.t.effect);

        if (tmp.b.buyables[13].unlocked) base = base.times(tmp.b.buyables[13].effect);
        if (player.n.unlocked) base = base.times(tmp.n.clickables[11].effect);
        if (player.l.unlocked) base = base.times(tmp.l.buyables[13].effect);
        if (player.ab.unlocked) base = base.times(tmp.ab.buyables[21].effect);

        return base;
    },
    power() {
        return new Decimal(1).div(player.f.points.sub(1100).div(44));
    },
    effect() {
        let pow = player.f.points.sqrt();

        if (inChallenge("b", 21)) pow = pow.add(1).log10();
        if (hasChallenge("b", 21)) pow = pow.times(1.2);

        let eff = Decimal.pow(tmp.f.effectBase, pow).max(0);

        if ((hasUpgrade("f", 21)) && player.f.points.gt(0)) eff = eff.times(4);

        if (hasAchievement("a", 23) && player.f.points.gte(7)) eff = eff.times(9);

        if (inChallenge("b", 32)) eff = new Decimal(1);
        
        return eff;
    },
    effectDescription() {
        return "which are boosting Peanut production by " + format(tmp.f.effect) + "x";
    },

    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("t", 0))
            keep.push("milestones")
        if (hasMilestone("t", 1))
            keep.push("upgrades")
        if (hasAchievement("a", 51) || player.n.unlocked)
            keep.push("milestones")
        keep.push("auto")
        if (layers[resettingLayer].row > this.row)
            layerDataReset("f", keep)
    },

    automate() {},
    resetsNothing() {
        return hasMilestone("t", 3)
    },

    autoPrestige() {
        return (player.f.auto && hasMilestone("t", 2))
    },

    milestones: {
        0: {
            requirementDescription: "7 Farms",
            done() {
                return player.f.best.gte(7)
            },
            effectDescription: "Keep Coin upgrades on reset",
        },
        1: {
            requirementDescription: "10 Farms",
            done() {
                return player.f.best.gte(10)
            },
            effectDescription: "You can buy max Farms",
        },
        2: {
            requirementDescription: "12 Farms",
            done() {
                return player.f.best.gte(12)
            },
            effectDescription: "Unlock more Coin upgrades",
        },
    },

    upgrades: {
        11: {
            title: "Farm Combo",
            description: "Best Farms boost Coin gain and Higher Payment's effect",
            cost: new Decimal(3),

            effect() {
                let ret = player.f.best.pow(0.8).plus(1);

                if (hasUpgrade("f", 31)) ret = ret.pow(upgradeEffect("f", 31));

                return ret;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect
        },

        12: {
            title: "Farm Generators",
            description: "Sapling Generators add to the Farm effect base",
            cost: new Decimal(6),

            effect() {
                let ret = player.sg.points.add(1).log10().add(1);

                if (hasUpgrade("f", 32)) ret = ret.pow(upgradeEffect("f", 32));

                return ret;
            },
            effectDisplay() { return "+" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },

        13: {
            title: "Farm Improvements",
            description: "Total Coins add to the Farm effect base",
            cost: new Decimal(8),

            effect() {
                let ret = player.c.total.add(1).log10().add(1).log(3).div(2);
                return ret
            },
            effectDisplay() { return "+" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },

        21: {
            title: "Farm Expansion",
            description: "Increase the Farm boost by 4x",
            cost: new Decimal(10),
        },

        22: {
            title: "Faster-Growing Saplings",
            description: "Triple the Sapling effect",
            cost: new Decimal(12),
        },

        23: {
            title: "Farm Discount",
            description: "Farms are cheaper based on your peanuts",
            cost: new Decimal(17),

            effect() {
                let ret = player.points.add(1).log10().add(1).pow(2);

                if (hasUpgrade("f", 33)) ret = ret.pow(upgradeEffect("f", 33));
                
                return ret;
            },
            effectDisplay() {return "/" + format(tmp.f.upgrades[23].effect)}, // Add formatting to the effect
        },

        31: {
            title: "Greater Combo",
            description: "Boost the Farm Combo upgrade by the amount of Farms",
            cost() {
                return (!hasUpgrade("sg", 31)) ? new Decimal(1128) : new Decimal(1236);
            },

            effect() {
                let ret = player.f.points.add(1).log10().add(1).pow(2);
                return ret;
            },
            effectDisplay() {return "^" + format(tmp.f.upgrades[this.id].effect)}, // Add formatting to the effect
        },

        32: {
            title: "Farm Production",
            description: "Boost the Farm Generators upgrade by the amount of Factories",
            cost() {
                return (!hasUpgrade("sg", 32)) ? new Decimal(1145) : new Decimal(1240);
            },

            effect() {
                let ret = player.fa.points.add(1).log10().add(1).pow(1.8);
                return ret;
            },
            effectDisplay() {return "^" + format(tmp.f.upgrades[this.id].effect)}, // Add formatting to the effect
        },

        33: {
            title: "Farm Sales",
            description: "Boost the Farm Discount upgrade by the amount of Coins, and boost The Bean's effect base by 2.7",
            cost() {
                return (!hasUpgrade("sg", 33)) ? new Decimal(1158) : new Decimal(1256);
            },

            effect() {
                let ret = player.c.points.add(1).log10().add(1).sqrt();
                return ret;
            },
            effectDisplay() {return "^" + format(tmp.f.upgrades[this.id].effect)}, // Add formatting to the effect
        },
    },
})

addLayer("sg", {
    name: "Sapling Generators", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "SG", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        saplings: new Decimal(0),
        auto: false,
    }},
    color: "#7e7e7e",
    requires() {
        return new Decimal(1500);
    },
    resource: "sapling generators", // Name of prestige currency
    baseResource: "peanuts", // Name of resource prestige is based on
    branches: ["c"],
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1.5, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1)
        if (hasUpgrade("sg", 23)) mult = mult.div(upgradeEffect("sg", 23));
        if (hasUpgrade("fa", 12)) mult = mult.div(upgradeEffect("fa", 12));

        if (inChallenge("b", 11)) mult = mult.div("1e10");
        return mult
    },
    canBuyMax() {
        return hasMilestone("sg", 1)
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "s", description: "S: Perform a Sapling Generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },

    // ======================================================

    addToBase() {
        let base = new Decimal(0);
        if (hasUpgrade("sg", 12))
            base = base.plus(upgradeEffect("sg", 12));
        return base;
    },
    effBase() {
        let base = new Decimal(2);
        base = base.plus(tmp.sg.addToBase);

        if (hasUpgrade("sg", 22)) base = base.times(upgradeEffect("sg", 22));
        if (hasUpgrade("c", 33)) base = base.times(upgradeEffect("c",33));
        if (hasUpgrade("t", 22)) base = base.times(upgradeEffect("t",22));
        if (hasUpgrade("t", 33)) base = base.times(upgradeEffect("t", 33));

        if (player.ms.unlocked) base = base.times(tmp.ms.buyables[12].effect.eff);

        if (player.n.unlocked) base = base.times(tmp.n.clickables[12].effect);
        if (tmp.b.buyables[13].unlocked) base = base.times(tmp.b.buyables[13].effect);
        if (player.ab.unlocked) base = base.times(tmp.ab.buyables[22].effect);

        return base;
    },
    effect() {
        if (!player.sg.unlocked) {
            return new Decimal(0)
        }
        if (!player.sg.points.gt(0)) {
            return new Decimal(0)
        }

        let eff = Decimal.pow(this.effBase(), player.sg.points.sqrt());

        if (hasUpgrade("sg", 21)) eff = eff.times(4);
        if (player.fa.unlocked) eff = eff.times(tmp.fa.workerEff);

        if (player.ab.unlocked) eff = eff.times(tmp.ab.timeSpeed);

        return eff;
    },
    effectDescription() {
        return "which are generating " + format(tmp.sg.effect) + " Saplings/sec";
    },
    update(diff) {
        if (player.sg.unlocked)
            player.sg.saplings = player.sg.saplings.plus(tmp.sg.effect.times(diff));
    },
    saplingExp() {
        let exp = (hasAchievement("a", 42))? new Decimal(1 / 2) : new Decimal(1 / 3);

        if (player.n.unlocked) exp = exp.times(tmp.n.clickables[22].effect);

        return exp;
    },
    saplingEff() {
        if (!player.sg.unlocked)
            return new Decimal(1);
        if (!player.sg.points.gt(0)) {
            return new Decimal(1)
        }

        let eff = player.sg.saplings.plus(1)
        
        eff = eff.pow(this.saplingExp());

        if (hasUpgrade("sg", 13)) eff = eff.times(upgradeEffect("sg", 13));
        if (hasAchievement("a", 23) && player.sg.points.gte(7)) eff = eff.times(9);
        if (hasUpgrade("f", 22)) eff = eff.times(3);

        if (player.l.unlocked) eff = eff.times(tmp.l.buyables[21].effect);

        if (inChallenge("b", 32)) eff = new Decimal(1);

        return eff;
    },

    // ======================================================

    doReset(resettingLayer) {
        let keep = [];
        player.sg.saplings = new Decimal(0);
        if (hasMilestone("fa", 0))
            keep.push("milestones")
        if (hasMilestone("fa", 1))
            keep.push("upgrades")
        if (hasAchievement("a", 51) || player.n.unlocked)
            keep.push("milestones")
        keep.push("auto")
        if (layers[resettingLayer].row > this.row)
            layerDataReset("sg", keep)
    },

    automate() {},
    resetsNothing() {
        return hasMilestone("fa", 3)
    },

    autoPrestige() {
        return (hasMilestone("fa", 2) && player.sg.auto)
    },

    tabFormat: ["main-display", "prestige-button", ["display-text", function() {
        return "You have " + formatWhole(player.points) + " peanuts"
    }
    , {}], "blank", ["display-text", function() {
        return 'You have ' + format(player.sg.saplings) + ' Saplings, which boosts Peanut production by ' + format(tmp.sg.saplingEff) + 'x'
    }
    , {}], "blank", ["display-text", function() {
        return 'Your best Sapling Generators is ' + formatWhole(player.sg.best) + '<br>You have made a total of ' + formatWhole(player.sg.total) + " Sapling Generators"
    }
    , {}], "blank", "milestones", "blank", "upgrades"],

    milestones: {
        0: {
            requirementDescription: "7 Sapling Generators",
            done() {
                return player.sg.best.gte(7)
            },
            effectDescription: "Keep Coin upgrades on reset",
        },
        1: {
            requirementDescription: "10 Sapling Generators",
            done() {
                return player.sg.best.gte(10)
            },
            effectDescription: "You can buy max Sapling Generators",
        },
        2: {
            requirementDescription: "15 Sapling Generators",
            done() {
                return player.sg.best.gte(15)
            },
            effectDescription: "You gain 100% of Coin gain every second",
        },
    },

    upgrades: {
        11: {
            title: "Gen Combo",
            description: "Best Sapling Generators boost Peanut production and No Inflation's effect",
            cost: new Decimal(3),

            effect() {
                let ret = player.sg.best.pow(0.8).plus(1);

                if (hasUpgrade("sg", 31)) ret = ret.pow(upgradeEffect("sg", 31));

                return ret
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect
        },

        12: {
            title: "Sapling Farms",
            description: "Farms add to the Sapling Generator base",
            cost: new Decimal(6),

            effect() {
                let ret = player.f.points.add(1).log10().add(1);

                if (hasUpgrade("sg", 32)) ret = ret.pow(upgradeEffect("sg", 32));

                return ret
            },
            effectDisplay() { return "+" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },

        13: {
            title: "Generator Improvements",
            description: "Total Coins boost the Sapling effect",
            cost: new Decimal(8),

            effect() {
                let ret = player.c.total.add(1).log10().add(1).log(1.5).add(1);
                return ret
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        21: {
            title: "More Saplings",
            description: "Increase Sapling generation by 4x",
            cost: new Decimal(10),
        },

        22: {
            title: "Exponential Growth",
            description: "Saplings boost their own generation",
            cost: new Decimal(10000),

            currencyDisplayName: "saplings",
            currencyInternalName: "saplings",
            currencyLayer: "sg",

            effect() {
                let ret = player.sg.saplings.add(1).log10().add(1);
                return ret;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        23: {
            title: "Gen Discount",
            description: "Sapling Generators are cheaper based on your peanuts",
            cost: new Decimal(17),

            effect() {
                let ret = player.points.add(1).log10().add(1).pow(2);

                if (hasUpgrade("sg", 33)) ret = ret.pow(upgradeEffect("sg", 33));

                return ret;
            },
            effectDisplay() {return "/" + format(upgradeEffect(this.layer, this.id))}, // Add formatting to the effect
        },

        31: {
            title: "Stronger Combo",
            description: "Boost the Gen Combo upgrade by the amount of Sapling Generators",
            cost() {
                return (!hasUpgrade("f", 31)) ? new Decimal(1128) : new Decimal(1230);
            },

            effect() {
                let ret = player.sg.points.add(1).log10().add(1).pow(2.5);
                return ret;
            },
            effectDisplay() {return "^" + format(tmp.sg.upgrades[this.id].effect)}, // Add formatting to the effect
        },

        32: {
            title: "Sapling Forests",
            description: "Boost the Sapling Farms upgrade by the amount of Towns",
            cost() {
                return (!hasUpgrade("f", 32)) ? new Decimal(1155) : new Decimal(1242);
            },

            effect() {
                let ret = player.t.points.add(1).log10().add(1).pow(2.2);
                return ret;
            },
            effectDisplay() {return "^" + format(tmp.sg.upgrades[this.id].effect)}, // Add formatting to the effect
        },

        33: {
            title: "Gen Sales",
            description: "Boost the Gen Discount upgrade by the amount of Coins, and boost The Machine's effect base by 4",
            cost() {
                return (!hasUpgrade("f", 33)) ? new Decimal(1180) : new Decimal(1262);
            },

            effect() {
                let ret = player.c.points.add(1).log(10).add(1).root(3);
                return ret;
            },
            effectDisplay() {return "^" + format(tmp.sg.upgrades[this.id].effect)}, // Add formatting to the effect
        },
    },
})

addLayer("t", {
    name: "Towns", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "T", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        auto: false,
        autoHouses: false,
    }},
    color: "#7d5700",
    requires() {
        return new Decimal(20)
    }, // Can be a function that takes requirement increases into account
    roundUpCost: true,
    resource: "towns", // Name of prestige currency
    baseResource: "farms", // Name of resource prestige is based on
    branches: ["f"],
    baseAmount() {return player.f.points}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1);

        if (hasAchievement("a", 104)) mult = mult.times(0.855);
        if (hasAchievement("a", 124)) mult = mult.times(0.98);
        if (hasAchievement("a", 132)) mult = mult.times(0.945);

        return mult;
    },

    automate() {},
    resetsNothing() {
        return hasMilestone("n", 4);
    },

    autoPrestige() {
        return player.t.auto && hasMilestone("n", 4);
    },

    base() {
        return new Decimal(1.1);
    },
    canBuyMax() {
        return hasMilestone("t", 3);
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1);
    },
    row: 2, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "t", description: "T: Perform a Town reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    addToBase() {
        let base = new Decimal(0);
        return base;
    },
    effectBase() {
        let base = new Decimal(2);
        base = base.plus(tmp.t.addToBase);
        base = base.times(tmp.t.buyables[11].effect.first);

        if (hasUpgrade("t", 12)) base = base.times(upgradeEffect("t", 12));
        if (hasUpgrade("t", 23)) base = base.times(upgradeEffect("t", 23));
        if (hasUpgrade("l", 11)) base = base.times(upgradeEffect("l", 11));

        if (player.l.unlocked) base = base.times(tmp.l.buyables[22].effect);

        if (player.n.unlocked) base = base.times(tmp.n.effect);

        return base.pow(tmp.t.power);
    },
    power() {
        let power = new Decimal(1);
        return power;
    },
    effect() {
        let eff = Decimal.pow(tmp.t.effectBase, player.t.points.pow(0.5));
        return eff;
    },
    effectDescription() {
        return "which are boosting the Farm effect base and Coin gain by " + format(tmp.t.effect) + "x"
    },
    update(diff) {
        if (player.t.autoHouses && hasMilestone("n", 3) && tmp.t.buyables[11].canAfford) {
            if (hasMilestone("l", 3)) {
                layers.t.buyables[11].buy100();
                layers.t.buyables[11].buy10();
            }

            tmp.t.buyables[11].buy();
        }
    },

    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("n", 0)) {
            keep.push("milestones")
        }
        if (hasMilestone("n", 2)) {
            keep.push("upgrades")
        }
        keep.push("auto");
        keep.push("autoHouses");
        if (layers[resettingLayer].row > this.row)
            layerDataReset("t", keep)
    },

    milestones: {
        0: {
            requirementDescription: "2 Towns",
            done() {
                return player.t.best.gte(2)
            },
            effectDescription: "Keep Farm milestones on all resets",
        },
        1: {
            requirementDescription: "4 Towns",
            done() {
                return player.t.best.gte(4)
            },
            effectDescription: "Keep Farm upgrades on all resets",
        },
        2: {
            requirementDescription: "6 Towns",
            done() {
                return player.t.best.gte(6)
            },
            effectDescription: "Unlock Auto-Farms",
            toggles: [["f", "auto"]],
        },
        3: {
            requirementDescription: "8 Towns",
            done() {
                return player.t.best.gte(8)
            },
            effectDescription: "Farms reset nothing and you can buy max Towns",
        },
    },

    upgrades: {
        11: {
            title: "Bank",
            description: "Increase Coin gain based on the current amount of Towns",
            
            cost() {
                return new Decimal("5e37")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let pow = player.t.points;
                let cap = new Decimal(20);

                if (hasUpgrade("t", 14)) cap = cap.add(upgradeEffect("t", 14));

                pow = softcap(pow, cap, 0.5);

                let eff = player.t.points.pow(pow).add(1);

                return eff;
            },
            effectDisplay() {
                let cap = new Decimal(20);

                if (hasUpgrade("t", 14)) cap = cap.add(upgradeEffect("t", 14));

                return format(upgradeEffect(this.layer, this.id)) + "x" + ((player.t.points.gte(cap) ? " (softcapped)" : ""))
            }, // Add formatting to the effect
        },

        12: {
            title: "Restaurant",
            description: "Town base is boosted by the current amount of Peanuts",
            
            cost() {
                return new Decimal("1e47")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let eff = player.points.add(1).log10().add(1).log10().add(1).sqrt();
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        13: {
            title: "Shop",
            description: "Farms are cheaper based on the current amount of Towns",
            
            cost() {
                return new Decimal("5e70")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let pow = player.t.points.div(1.2);
                let cap = new Decimal(20);

                if (hasUpgrade("t", 14)) cap = cap.add(upgradeEffect("t", 14));

                pow = softcap(pow, cap, 0.5);

                let eff = player.t.points.pow(pow).add(1);
                return eff;
            },
            effectDisplay() {
                let cap = new Decimal(20);

                if (hasUpgrade("t", 14)) cap = cap.add(upgradeEffect("t", 14));

                return "/" + format(upgradeEffect(this.layer, this.id)) + ((player.t.points.gte(cap) ? " (softcapped)" : ""))
            }, // Add formatting to the effect
        },

        14: {
            title: "Vault Improvements",
            description: "Removes the Bank and Shop softcaps",
            cost() {
                return new Decimal("e13900");
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                return new Decimal(9999);
            },
        },

        21: {
            title: "Library",
            description: "Farm base is boosted by the current amount of Sapling Generators",
            
            cost() {
                return new Decimal("2e87")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let eff = player.sg.points.sqrt().add(1);

                if (hasUpgrade("t", 24)) eff = eff.pow(upgradeEffect("t", 24));

                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        22: {
            title: "Park",
            description: "Sapling Generator base is boosted by the current amount of Farms",
            
            cost() {
                return new Decimal("2e101")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let eff = player.f.points.pow(0.8).add(1);

                if (hasUpgrade("t", 24)) eff = eff.pow(upgradeEffect("t", 24));
                
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        23: {
            title: "School",
            description: "Town and Farctory bases get boosted by the current amount of workers",
            
            cost() {
                return new Decimal("5e145");
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                return player.fa.workers.add(1).log10().add(1).log10().add(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        24: {
            title: "Even More Knowledge",
            description: "Boosts the Library and Park upgrades by the current amount of Towns",
            cost() {
                return new Decimal("e14000");
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                return player.t.points.add(1).root(5);
            },
            effectDisplay() {return "^" + format(tmp.t.upgrades[this.id].effect)}, // Add formatting to the effect
        },

        31: {
            title: "Hospital",
            description: "Peanuts boost MSPaintium effect",
            
            cost() {
                return new Decimal("e218")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let eff = player.points.add(1).log(5).add(1);
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        32: {
            title: "Museum",
            description: "Add to the MSPaintium effect base, based on the current amount of Towns",
            
            cost() {
                return new Decimal("e227")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let eff = player.t.points.add(1).log10().add(1);
                return eff;
            },
            effectDisplay() { return"+" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },

        33: {
            title: "Factory",
            description: "Sapling Generator base also get boosted based on the current amount of Towns",
            
            cost() {
                return new Decimal("e305")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let eff = player.t.points.add(1).ln().add(1);
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        34: {
            title: "Housing Estate",
            description: "Boosts the second effect of the House buyable by the amount of Houses bought",
            cost() {
                return new Decimal("e14400");
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                return player.t.buyables[11].add(1).root(2);
            },
            effectDisplay() {return "^" + format(tmp.t.upgrades[this.id].effect)}, // Add formatting to the effect
        },
    },

    buyables: {
        rows: 1,
        cols: 1,
        11: {
            title: "House",
            costScalingEnabled() {
                return true;
            },
            cost(x=player[this.layer].buyables[this.id]) {
                let cost = Decimal.pow(10, x /* First Softcap */ * ((x.gte(10))? x.pow(0.3) : 1) /* Second Softcap */ * ((x.gte(15))? x.sub(13).pow(0.5) : 1) /* Third Softcap */ * ((x.gte(28))? x.sub(26).pow(0.5) : 1) * 1.2).times("1e22")
                return cost.floor()
            },
            power() {
                let pow = new Decimal(1);
                return pow;
            },
            effect(x=player[this.layer].buyables[this.id]) {
                let power = tmp[this.layer].buyables[this.id].power
                if (!player.t.unlocked)
                    x = new Decimal(0);
                let eff = {}

                let pow1 = x.add(1);

                pow1 = softcap(pow1, new Decimal(28), 0.5);

                eff.first = Decimal.pow(1.2, pow1).sub(0.2)
                eff.second = x.add(1).pow(x.sqrt()).plus(x).pow((hasUpgrade("n", 12)) ? 2 : 1);

                if (hasUpgrade("t", 34)) eff.second = eff.second.pow(upgradeEffect("t", 34));

                return eff;
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                return ("Cost: " + formatWhole(data.cost) + " coins") + "\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id]) +"\n\
                    Boosts Town effect base by " + format(data.effect.first) + "x and increases Coin gain by " + format(data.effect.second) + "x"
            },
            canAfford() {
                return player.c.points.gte(tmp[this.layer].buyables[this.id].cost)
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.c.points = player.c.points.sub(cost)
                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.c.points.gte(cost)) {
                    player.c.points = player.c.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.c.points.gte(cost)) {
                    player.c.points = player.c.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px'
            },
        },
    },
})

addLayer("fa", {
    name: "Factories", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "FA", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        workers: new Decimal(0),
        auto: false,
    }},
    color: "#4a4a4a",
    requires() {
        return new Decimal(20)
    }, // Can be a function that takes requirement increases into account
    roundUpCost: true,
    resource: "factories", // Name of prestige currency
    baseResource: "sapling generators", // Name of resource prestige is based on
    branches: ["sg"],
    baseAmount() {return player.sg.points}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1)
        return mult
    },

    base() {
        return new Decimal(1.1)
    },

    canBuyMax() {
        return hasMilestone("fa", 3)
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 2, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "F", description: "Shift + F: Perform a Factory reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },

    // ======================================================

    workerLimitMult() {
        let mult = new Decimal(1);
        if (hasUpgrade("fa", 11)) mult = mult.times(upgradeEffect("fa", 11));
        if (hasUpgrade("fa", 22)) mult = mult.times(upgradeEffect("fa", 22));
        return mult;
    },
    workerGainMult() {
        let mult = new Decimal(1);

        if (hasUpgrade("fa", 21)) mult = mult.times(upgradeEffect("fa", 21))
        if (player.ab.unlocked) mult = mult.times(tmp.ab.timeSpeed);

        return mult;
    },
    effBaseMult() {
        let mult = new Decimal(1);

        if (hasUpgrade("t", 23)) mult = mult.times(upgradeEffect("t", 23));

        if (player.l.unlocked) mult = mult.times(tmp.l.buyables[23].effect);

        if (player.b.unlocked) mult = mult.times(tmp.b.effect);
        return mult;
    },
    effBasePow() {
        let exp = new Decimal(1);
        return exp;
    },
    effGainBaseMult() {
        let mult = new Decimal(1);
        return mult;
    },
    effLimBaseMult() {
        let mult = new Decimal(1);
        return mult;
    },
    gain() {
        if (!player.fa.unlocked || !player.fa.points.gt(0))
            return new Decimal(0)
        else
            return Decimal.pow(tmp.fa.effBaseMult.times(tmp.fa.effGainBaseMult).times(3).pow(tmp.fa.effBasePow), player.fa.points.pow(0.5)).sub(1).times(tmp.fa.workerGainMult)
    },
    limit() {
        if (!player.fa.unlocked || !player.fa.points.gt(0))
            return new Decimal(0)
        else
            return Decimal.pow(tmp.fa.effBaseMult.times(tmp.fa.effLimBaseMult).times(2).pow(tmp.fa.effBasePow), player.fa.points.pow(0.5)).sub(1).times(100).times(tmp.fa.workerLimitMult)
    },
    effectDescription() {
        return "which are recruiting " + format(tmp.fa.gain) + " Workers/sec, but with a limit of " + format(tmp.fa.limit) + " Workers"
    },
    workerEff() {
        if (!player.fa.unlocked || !player.fa.points.gt(0))
            return new Decimal(1);
        let eff = player.fa.workers.pow(0.4).plus(1);
        
        if (hasUpgrade("fa", 13)) eff = eff.times(upgradeEffect("fa", 13));
        if (player.s.unlocked) eff = eff.times(tmp.s.buyables[12].effect);

        return eff.max(1);
    },
    update(diff) {
        if (player.fa.unlocked)
            player.fa.workers = player.fa.workers.plus(tmp.fa.gain.times(diff)).min(tmp.fa.limit).max(0);
    },

    // ======================================================

    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("b", 0)) {
            keep.push("milestones")
        }
        if (hasMilestone("b", 2)) {
            keep.push("upgrades")
        }
        keep.push("auto");
        if (layers[resettingLayer].row > this.row)
            layerDataReset("fa", keep)
    },

    automate() {},
    resetsNothing() {
        return hasMilestone("b", 3);
    },

    autoPrestige() {
        return player.fa.auto && hasMilestone("b", 3);
    },

    tabFormat: ["main-display", "prestige-button", ["display-text", function() {
        return "You have " + formatWhole(player.sg.points) + " sapling generators "
    }
    , {}], "blank", ["display-text", function() {
        return 'You have ' + format(player.fa.workers) + ' Workers, which boosts the Sapling effect and Peanut production by ' + format(tmp.fa.workerEff) + 'x'
    }
    , {}], "blank", ["display-text", function() {
        return 'Your best Factories is ' + formatWhole(player.fa.best) + '<br>You have made a total of ' + formatWhole(player.fa.total) + " Factories"
    }
    , {}], "blank", "milestones", "blank", "upgrades"],

    milestones: {
        0: {
            requirementDescription: "2 Factories",
            done() {
                return player.fa.best.gte(2)
            },
            effectDescription: "Keep Sapling Generator milestones on all resets",
        },
        1: {
            requirementDescription: "4 Factories",
            done() {
                return player.fa.best.gte(4)
            },
            effectDescription: "Keep Sapling Generator upgrades on all resets",
        },
        2: {
            requirementDescription: "6 Factories",
            done() {
                return player.fa.best.gte(6)
            },
            effectDescription: "Unlock Auto-Sapling Generators",
            toggles: [["sg", "auto"]],
        },
        3: {
            requirementDescription: "8 Factories",
            done() {
                return player.fa.best.gte(8)
            },
            effectDescription: "Sapling Generators reset nothing and you can buy max Factories",
        },
    },

    upgrades: {
        11: {
            title: "More Space",
            description: "Increase the Worker space Limit based on the current amount of Sapling Generators",
            
            cost() {
                return new Decimal(5)
            },

            effect() {
                let eff = player.sg.points.pow(0.4).add(1);
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        12: {
            title: "Cheaper Gen Design",
            description: "Sapling Generators are cheaper based on the current amount of Factories",
            
            cost() {
                return new Decimal("2e70")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let pow = player.fa.points.div(1.2);
                let cap = new Decimal(20);

                if (hasUpgrade("fa", 14)) cap = new Decimal(9999);

                pow = softcap(pow, cap, 0.5);

                let eff = player.fa.points.pow(pow).add(1);
                return eff;
            },
            effectDisplay() {
                let cap = new Decimal(20);

                if (hasUpgrade("fa", 14)) cap = new Decimal(9999);

                return "/" + format(upgradeEffect(this.layer, this.id)) + ((player.fa.points.gte(cap) ? " (softcapped)" : ""))
            }, // Add formatting to the effect
        },

        13: {
            title: "Factory Cooperation",
            description: "The Worker effect is boosted by the current amount of Factories",
            
            cost() {
                return new Decimal(10)
            },

            effect() {
                let eff = player.fa.points.pow(2);

                if (hasUpgrade("fa", 14)) eff = eff.pow(upgradeEffect("fa", 14));

                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        14: {
            title: "General Improvements",
            description: "Removes the Cheaper Gen Design softcap and boosts the Factory Cooperation effect by the amount of workers",
            cost() {
                return new Decimal("e14760");
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                return player.fa.workers.add(1).log(10).add(1).root(2);
            },
            effectDisplay() {return "^" + format(tmp.fa.upgrades[this.id].effect)}, // Add formatting to the effect
        },

        21: {
            title: "Speed Recruitment",
            description: "The Worker Recruitment Speed gets boosted by the Worker Limit",
            
            cost() {
                return new Decimal("1e112")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let cap = new Decimal(1e20);
                let cap2 = (hasUpgrade("fa", 24)) ? upgradeEffect("fa", 24) : new Decimal(1e30);

                let eff = tmp.fa.limit.pow(0.75).add(1);

                eff = softcap(eff, cap, 0.5);

                return eff.min(cap2);
            },
            effectDisplay() {
                let cap1 = new Decimal(1e20);

                let cap2val = (hasUpgrade("fa", 24)) ? upgradeEffect("fa", 24) : new Decimal(1e30);

                let cap2 = upgradeEffect(this.layer, this.id).gte(cap2val);

                return format(upgradeEffect(this.layer, this.id)) + "x" + ((cap2) ? " (hardcapped)" : ((upgradeEffect("fa", 21).gte(cap1) ? " (softcapped)" : "")))
            }, // Add formatting to the effect
        },

        22: {
            title: "Expansion-Workers",
            description: "The Worker Limit gets boosted by the current amount of Workers",
            
            cost() {
                return new Decimal("5e112")
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                let cap = new Decimal(1e20);
                let cap2 = (hasUpgrade("fa", 24)) ? upgradeEffect("fa", 24) : new Decimal(1e30);

                let eff = player.fa.workers.pow(0.75).add(1);

                eff = softcap(eff, cap, 0.5);

                return eff.min(cap2);
            },
            effectDisplay() {
                let cap1 = new Decimal(1e20);
                let cap2val = (hasUpgrade("fa", 24)) ? upgradeEffect("fa", 24) : new Decimal(1e30);

                let cap2 = upgradeEffect(this.layer, this.id).gte(cap2val);

                return format(upgradeEffect(this.layer, this.id)) + "x" + ((cap2) ? " (hardcapped)" : ((upgradeEffect("fa", 21).gte(cap1) ? " (softcapped)" : "")))
            }, // Add formatting to the effect
        },

        23: {
            title: "Factory-produced Peanuts",
            description: "Peanut production is boosted by your current amount of Factories",
            
            cost() {
                return new Decimal(15)
            },

            effect() {
                let eff = player.fa.points.pow(player.fa.points.pow(0.8)).add(1);
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        
        24: {
            title: "No More Limits",
            description: "Removes the Speed Recruitment and Expansion-Workers hardcaps",
            cost() {
                return new Decimal("e14850");
            },

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",

            effect() {
                return new Decimal("e9999");
            },
        },
    },
})

addLayer("ms", {
    name: "MSPaintium", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "MS", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        autoBuyables: false,
        refined: new Decimal(0),
        unstable: new Decimal(0),
    }},
    color: "#00d4d0",
    requires() {
        return new Decimal("1e260")
    }, // Can be a function that takes requirement increases into account
    resource: "MSPaintium", // Name of prestige currency
    baseResource: "peanuts", // Name of resource prestige is based on
    branches: ["f", "sg"],
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type() {
        return "normal"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1);

        if (tmp.b.buyables[12].unlocked) mult = mult.times(tmp.b.buyables[12].effect);

        return mult;
    },

    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(0.018);

        if (inChallenge("b", 12)) exp = exp.div(3);

        return exp;
    },

    passiveGeneration() {
        return (hasMilestone("ms", 5)) ? new Decimal(1).times(tmp.ab.timeSpeed) : 0
    },

    row: 2, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "m", description: "M: Perform a MS Paintium reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    addToBase() {
        let base = new Decimal(0);
        if (hasUpgrade("ms", 11)) base = base.plus(upgradeEffect("ms", 11))
        if (hasUpgrade("t", 32)) base = base.plus(upgradeEffect("t", 32));
        return base;
    },
    effectBase() {
        let base = new Decimal(1.5);
        base = base.plus(tmp.ms.addToBase);

        return base.pow(tmp.ms.power);
    },
    power() {
        let power = new Decimal(1);
        return power;
    },
    effCap() {
        let cap = {};
        cap.first = new Decimal(30000);
        cap.second = new Decimal(1e9);
        cap.third = new Decimal("e10000");

        if (hasUpgrade("b", 31)) cap.second = cap.second.times(upgradeEffect("b", 31));
        if (hasUpgrade("o", 32)) cap.second = cap.second.times(upgradeEffect("o", 32));
        if (player.n.unlocked) cap.second = cap.second.times(tmp.n.clickables[23].effect);
        if (player.s.unlocked) cap.second = cap.second.times(tmp.s.buyables[11].effect);
        if (player.l.unlocked) cap.second = cap.second.times(tmp.l.effect);

        if (hasUpgrade("b", 14)) cap.first = cap.first.times(upgradeEffect("b", 14));
        if (player.n.unlocked) cap.first = cap.first.times(tmp.n.clickables[13].effect);
        
        if (cap.first.gt(cap.second)) cap.first = cap.second;

        return cap;
    },
    effect() {
        let pow = player.ms.points.pow(0.3);
        let cap = tmp.ms.effCap.first;
        let cap2 = tmp.ms.effCap.second;

        if (player.ms.points.gte(cap2)) pow = cap2.pow(0.3);

        pow = softcap(pow, cap.pow(0.3), 0.1);

        let eff = Decimal.pow(tmp.ms.effectBase, pow).max(0).plus(player.ms.points.times(player.ms.points.add(1).ln()).min(1e9));

        if (hasUpgrade("t", 31) && player.ms.points.gt(0)) eff = eff.times(upgradeEffect("t", 31));

        if (inChallenge("b", 31)) eff = new Decimal(1);
        
        return eff;
    },

    effect2() {
        let eff = tmp.ms.effect.pow(0.9);
        return eff;
    },
    effectDescription() {
        let cap = tmp.ms.effCap.first;
        let cap2 = tmp.ms.effCap.second;

        let desc = "which is boosting Peanut production by " + format(tmp.ms.effect) + "x";
        
        if (hasUpgrade("ms", 12)) {
            desc += " and Coin gain by " + format(tmp.ms.effect2) + "x";
        }

        if (player.ms.points.gte(cap2)) {
            desc += " (hardcapped)";
        } else if (player.ms.points.gte(cap)) {
            desc += " (softcapped)";
        }

        return desc;
    },

    update(diff) {
        if (player.ms.autoBuyables && hasMilestone("n", 3) && tmp.ms.buyables[11].canAfford) {
            if (hasMilestone("l", 3)) {
                layers.ms.buyables[11].buy100();
                layers.ms.buyables[11].buy10();
            }

            tmp.ms.buyables[11].buy();
        }
        if (player.ms.autoBuyables && hasMilestone("n", 3) && tmp.ms.buyables[12].canAfford) {
            if (hasMilestone("l", 3)) {
                layers.ms.buyables[12].buy100();
                layers.ms.buyables[12].buy10();
            }
            
            tmp.ms.buyables[12].buy();
        }

        if (hasMilestone("ms", 6) && hasUpgrade("ms", 21)) player.ms.refined = player.ms.refined.add(tmp.ms.clickables[11].gain.times(diff).times(tmp.ab.timeSpeed));
        if (hasMilestone("ms", 6) && hasUpgrade("ms", 23)) player.ms.unstable = player.ms.unstable.add(tmp.ms.clickables[12].gain.times(diff).times(tmp.ab.timeSpeed));

        if (player.ms.refined.gte(tmp.ms.clickables[11].newSpellReq) && player.s.spellsUnl.refined < 2) player.s.spellsUnl.refined += 1;
        if (player.ms.unstable.gte(tmp.ms.clickables[12].newSpellReq) && player.s.spellsUnl.unstable < 2) player.s.spellsUnl.unstable += 1;
    },


    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("n", 1)) {
            keep.push("milestones")
        }
        if (hasMilestone("n", 3)) {
            keep.push("upgrades");

            if (layers[resettingLayer].row <= layers.b.row) {
                keep.push("refined");
                keep.push("unstable");
            }
        }
        keep.push("autoBuyables");

        if (layers[resettingLayer].row > this.row)
            layerDataReset("ms", keep)
    },

    tabFormat: {
        "Milestones": {
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.points) + " peanuts "
            }
            , {}], "blank", ["display-text", function() {
                return 'Your best MSPaintium is ' + formatWhole(player.ms.best) + '<br>You have made a total of ' + formatWhole(player.ms.total) + " MSPaintium"
            }
            , {}], "blank", "milestones"],
        },
        "Upgrades": {
            unlocked() {
                return true;
            },
            content: ["main-display", ["display-text", function() {
                return ((hasUpgrade("ms", 21)) ? "You have " + formatWhole(player.ms.refined) + " Refined MSPaintium" : "") + ((hasUpgrade("ms", 23)) ? " and " + formatWhole(player.ms.unstable) + " Unstable MSPaintium" : "")
            }
            , {}], "blank", "clickables", "blank", "buyables", "blank", "upgrades",],
        },
    },

    milestones: {
        0: {
            requirementDescription: "1 MSPaintium",
            done() {
                return player.ms.best.gte(1)
            },
            effectDescription: "Unlock an MSPaintium upgrade",
        },

        1: {
            requirementDescription: "5 MSPaintium",
            done() {
                return player.ms.best.gte(5)
            },
            effectDescription: "Unlock the first MSPaintium buyable",
        },

        2: {
            requirementDescription: "20 MSPaintium",
            done() {
                return player.ms.best.gte(20)
            },
            effectDescription: "Unlock more Town upgrades",
        },

        3: {
            requirementDescription: "50 MSPaintium",
            done() {
                return player.ms.best.gte(50)
            },
            effectDescription: "Unlock 2 more MSPaintium upgrades",
        },

        4: {
            requirementDescription: "500 MSPaintium",
            done() {
                return player.ms.best.gte(500)
            },
            effectDescription: "Get a free level on both buyables for every MSPaintium upgrade bought",
        },

        5: {
            requirementDescription: "1500 MSPaintium",
            done() {
                return player.ms.best.gte(1500)
            },
            effectDescription() {
                return `You gain ${format(tmp.ab.timeSpeed.times(100))}% of MSPaintium gain every second and MSPaintium buyables don't cost anything`;
            },
        },

        6: {
            requirementDescription: "1e100 MSPaintium",
            done() {
                return player.ms.best.gte(1e100)
            },
            unlocked() {
                return hasUpgrade("ms", 23);
            },
            effectDescription() {
                return `Gain ${format(tmp.ab.timeSpeed.times(100))}% of Refined and Unstable MSPaintium gain every second`;
            },
        },
    },

    upgrades: {

        11: {
            title: "This Boost is Terrible!",
            description: "Add 0.5 to the MSPaintium boost base",
            cost: new Decimal(2),

            effect() {
                return new Decimal(0.5);
            },
        },

        12: {
            title: "Still Bad",
            description: "The MSPaintium boost also boosts Coin gain",
            cost: new Decimal(60),
        },

        13: {
            title: "Enrichments",
            description: "Unlock the second MSPaintium buyable",
            cost: new Decimal(75),
        },
        14: {
            title: "Brewing Stands",
            description: "Double the Spell effect bases",
            cost: new Decimal(1e30),
        },
        21: {
            title: "Refinements",
            description: "Unlock Refined MSPaintium",
            cost: new Decimal(1e31),
        },
        22: {
            title: "Mass-Crushing",
            description: "Double the MSPaintium Dust gain",
            cost: new Decimal(1e33),

            effect() {
                return new Decimal(2);
            },
        },
        23: {
            title: "Unstable Reactions",
            description: "Unlock Unstable MSPaintium",
            cost: new Decimal(2e36),

            effect() {
                return new Decimal(2);
            },
        },
        24: {
            title: "Astral Star",
            description: "Upgrade THE BOT with the Astral Star",
            cost: new Decimal(1e105),

            effect() {
                return new Decimal(2);
            },
        },
    },

    buyables: {
        rows: 1,
        cols: 2,
        11: {
            title: "Tool Enhancements",
            costScalingEnabled() {
                return true;
            },
            cost(x=player[this.layer].buyables[this.id]) {
                let cost = Decimal.pow(5, x).times(5)

                if (x.gte(9)) cost = cost.times(x.sub(7));
                if (x.gte(50)) cost = cost.times(new Decimal(2).pow(x.sub(45)));

                return cost.floor()
            },
            power() {
                let pow = new Decimal(1);
                return pow;
            },
            effect(x=player[this.layer].buyables[this.id]) {
                let power = tmp[this.layer].buyables[this.id].power
                if (!player.t.unlocked)
                    x = new Decimal(1);
                let eff = {}

                let y = (hasMilestone("ms", 4))? upgradeCount("ms") : 0

                eff.eff = Decimal.pow(x.plus(y), 2).add(1).ln().add(1).add(x/2)
                eff.percent = Decimal.div(x.plus(y), x.add(10)).times(100)

                return eff;
            },
            display() {
                let y = upgradeCount("ms")
                let data = tmp[this.layer].buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " MSPaintium" + "\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id]) + ((hasMilestone("ms", 4))? " + " + y : "") +"\n\
                    Enhances the tools used at your Farms and turns them into " +
                format(data.effect.percent) + "% MSPaintium!" + "\n\ This boosts Farm effect base by " + format(data.effect.eff) + "x"
            },
            unlocked() {
                return true
            },
            canAfford() {
                return player.ms.points.gte(tmp[this.layer].buyables[this.id].cost)
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost

                if (!hasMilestone("ms", 5)) player.ms.points = player.ms.points.sub(cost)

                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.ms.points.gte(cost)) {
                    if (!hasMilestone("ms", 5)) player.ms.points = player.ms.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.ms.points.gte(cost)) {
                    if (!hasMilestone("ms", 5)) player.ms.points = player.ms.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px'
            },
        },

        12: {
            title: "Sapling Enrichments",
            costScalingEnabled() {
                return true;
            },
            cost(x=player[this.layer].buyables[this.id]) {
                let cost = Decimal.pow(5, x).times(5)

                if (x.gte(9)) cost = cost.times(x.sub(7));
                if (x.gte(50)) cost = cost.times(new Decimal(2).pow(x.sub(45)));

                return cost.floor()
            },
            power() {
                let pow = new Decimal(1);
                return pow;
            },
            effect(x=player[this.layer].buyables[this.id]) {
                let power = tmp[this.layer].buyables[this.id].power
                if (!player.fa.unlocked)
                    x = new Decimal(1);
                let eff = {}
                if (hasMilestone("ms", 4)) {
                    let y = upgradeCount("ms")
                }

                let y = (hasMilestone("ms", 4))? upgradeCount("ms") : 0

                eff.eff = Decimal.pow(x.plus(y), 2).add(1).ln().add(1).add(x/2)
                eff.percent = Decimal.div(x.plus(y), x.add(10)).times(100)

                return eff;
            },
            display() {
                let y = upgradeCount("ms")
                let data = tmp[this.layer].buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " MSPaintium" + "\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id]) + ((hasMilestone("ms", 4))? " + " + y : "") + "\n\
                    Enriches the saplings produced by your generators and turns them into " +
                format(data.effect.percent) + "% MSPaintium!" + "\n\ This boosts Sapling Generator effect base by " + format(data.effect.eff) + "x"
            },
            unlocked() {
                return true
            },
            canAfford() {
                return player.ms.points.gte(tmp[this.layer].buyables[this.id].cost)
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost

                if (!hasMilestone("ms", 5)) player.ms.points = player.ms.points.sub(cost)

                player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.ms.points.gte(cost)) {
                    if (!hasMilestone("ms", 5)) player.ms.points = player.ms.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.ms.points.gte(cost)) {
                    if (!hasMilestone("ms", 5)) player.ms.points = player.ms.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px'
            },
        },
    },

    clickables: {
        cols: 2,
        rows: 1,
        11: {
            title: "Refined MSPaintium",
            display() {
                return "Click to turn 10% of your MSPaintium into " + formatWhole(tmp.ms.clickables[this.id].gain) + " Refined MSPaintium <br>" +
                "Next at " + format(new Decimal(5e28).times(new Decimal(20).pow(tmp.ms.clickables[this.id].gain.div(tmp.ms.clickables[this.id].gainMult)))) + " MSPaintium" + "<br> <br>" +
                ((player.s.spellsUnl.refined < 2) ? "Reach " + formatWhole(tmp.ms.clickables[this.id].newSpellReq) + " Refined MSPaintium to unlock a new Spell" : "");
            },
            gainMult() {
                let mult = new Decimal(1);

                if (hasUpgrade("n", 21)) mult = mult.times(upgradeEffect("n", 21));
                if (hasUpgrade("l", 21)) mult = mult.times(upgradeEffect("l", 21));
                if (hasUpgrade("ab", 12)) mult = mult.times(upgradeEffect("ab", 12));
                if (hasUpgrade("ab", 35)) mult = mult.times(upgradeEffect("ab", 35));

                return mult;
            },
            gain() {
                let reqMult = new Decimal(20);
                let minReq = new Decimal(1e30).div(reqMult);

                let gain = player.ms.points.add(1).div(minReq).log(reqMult).max(0).times(tmp.ms.clickables[this.id].gainMult).floor();

                return gain;
            },
            unlocked() {
                return true;
            },
            canClick() {
                return tmp.ms.clickables[this.id].gain.gte(1);
            },
            onClick() {
                player.ms.points = player.ms.points.sub(player.ms.points.div(10));
                player.ms.refined = player.ms.refined.add(tmp.ms.clickables[this.id].gain);
            },
            newSpellReq() {
                let base = new Decimal(10);
                let pow = player.s.spellsUnl.refined + 1;

                let req = base.pow(pow);

                return req;
            },
            style: {
                "background-color"() {
                    return (!tmp.ms.clickables[11].canClick) ? "#666666" : "#00d4d0"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        12: {
            title: "Unstable MSPaintium",
            display() {
                return "Click to turn 10% of your MSPaintium into " + formatWhole(tmp.ms.clickables[this.id].gain) + " Unstable MSPaintium <br>" +
                "Next at " + format(new Decimal(5e28).times(new Decimal(20).pow(tmp.ms.clickables[this.id].gain.div(tmp.ms.clickables[this.id].gainMult)))) + " MSPaintium" + "<br> <br>" +
                ((player.s.spellsUnl.unstable < 2) ? "Reach " + formatWhole(tmp.ms.clickables[this.id].newSpellReq) + " Unstable MSPaintium to unlock a new Spell" : "");
            },
            gainMult() {
                let mult = new Decimal(1);

                if (hasUpgrade("n", 21)) mult = mult.times(upgradeEffect("n", 21));
                if (hasUpgrade("l", 21)) mult = mult.times(upgradeEffect("l", 21));
                if (hasUpgrade("ab", 12)) mult = mult.times(upgradeEffect("ab", 12));
                if (hasUpgrade("ab", 35)) mult = mult.times(upgradeEffect("ab", 35));

                return mult;
            },
            gain() {
                let reqMult = new Decimal(20);
                let minReq = new Decimal(1e30).div(reqMult);

                let gain = player.ms.points.add(1).div(minReq).log(reqMult).max(0).times(tmp.ms.clickables[this.id].gainMult).floor();

                return gain;
            },
            unlocked() {
                return true;
            },
            canClick() {
                return tmp.ms.clickables[this.id].gain.gte(1);
            },
            onClick() {
                player.ms.points = player.ms.points.sub(player.ms.points.div(10));
                player.ms.unstable = player.ms.unstable.add(tmp.ms.clickables[this.id].gain);
            },
            newSpellReq() {
                let base = new Decimal(10);
                let pow = player.s.spellsUnl.unstable + 2;

                let req = base.pow(pow);

                return req;
            },
            style: {
                "background-color"() {
                    return (!tmp.ms.clickables[11].canClick) ? "#666666" : "#00d4d0"
                },
                'height': '150px',
                'width': '150px',
            },
        },
    },
})

addLayer("n", {
    name: "Nations", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "N", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        researchers: new Decimal(0),
        usedResearchers: new Decimal(0),
        researcherTimes: {
            11: new Decimal(0),
            12: new Decimal(0),
            13: new Decimal(0),
            14: new Decimal(0),
            21: new Decimal(0),
            22: new Decimal(0),
            23: new Decimal(0),
            24: new Decimal(0),
            31: new Decimal(0),
            32: new Decimal(0),
            33: new Decimal(0),
            34: new Decimal(0),
            41: new Decimal(0),
            42: new Decimal(0),
            43: new Decimal(0),
            44: new Decimal(0),
            51: new Decimal(0),
            52: new Decimal(0),
            53: new Decimal(0),
            54: new Decimal(0),
        },
        currentlyResearched: {
            11: false,
            12: false,
            13: false,
            14: false,
            21: false,
            22: false,
            23: false,
            24: false,
            31: false,
            32: false,
            33: false,
            34: false,
            41: false,
            42: false,
            43: false,
            44: false,
            51: false,
            52: false,
            53: false,
            54: false,
        },
        zoneTravels: {
            11: new Decimal(0),
            12: new Decimal(0),
            13: new Decimal(0),
            14: new Decimal(0),
            21: new Decimal(0),
            22: new Decimal(0),
            23: new Decimal(0),
            24: new Decimal(0),
            31: new Decimal(0),
            32: new Decimal(0),
            33: new Decimal(0),
            34: new Decimal(0),
            51: new Decimal(0),
            52: new Decimal(0),
            53: new Decimal(0),
            54: new Decimal(0),
        },
        upgradeLevels: {
            41: new Decimal(0),
            42: new Decimal(0),
            43: new Decimal(0),
            44: new Decimal(0),
        },
        auto: false,
        autoZones: false,
        autoSpaceships: false,
    }},
    color: "#00ab2d",
    requires() {
        return new Decimal(20);
    }, // Can be a function that takes requirement increases into account
    roundUpCost: true,
    resource: "nations", // Name of prestige currency
    baseResource: "towns", // Name of resource prestige is based on
    branches: ["t", "ms"],
    baseAmount() {return player.t.points}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1);

        if (hasUpgrade("b", 24)) mult = mult.div(upgradeEffect("b", 24));
        if (hasUpgrade("ab", 22)) mult = mult.div(upgradeEffect("ab", 22));

        if (player.n.points.gte(12) && !hasAchievement("a", 121)) mult = mult.times(1.03);

        return mult;
    },

    automate() {},
    resetsNothing() {
        return hasMilestone("p", 5);
    },

    autoPrestige() {
        return player.n.auto && hasMilestone("p", 5);
    },

    base() {
        let base = new Decimal(1.18);

        if (hasAchievement("a", 134)) base = base.div(1.005);

        return base;
    },
    canBuyMax() {
        return hasMilestone("n", 5)
    },
    milestonePopups: true,
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1.8)
    },
    row: 3, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "n", description: "N: Perform a Nation reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    addToBase() {
        let base = new Decimal(0);

        if (hasUpgrade("n", 11)) base = base.add(upgradeEffect("n", 11));

        return base;
    },
    effectBase() {
        let base = new Decimal(2);
        base = base.plus(tmp.n.addToBase);

        if (player.p.unlocked) base = base.times(tmp.p.effect);
        if (tmp.l.buyables[31].unlocked) base = base.times(tmp.l.buyables[31].effect);
        if (player.ab.unlocked) base = base.times(tmp.ab.buyables[61].effect);

        return base.pow(tmp.n.power);
    },
    power() {
        let power = new Decimal(1);
        return power;
    },
    effect() {
        let eff = Decimal.pow(tmp.n.effectBase, player.n.points.sqrt());
        return eff;
    },
    effectDescription() {
        return "which are boosting the Town base by " + format(tmp.n.effect) + "x"
    },
    
    researcherAmount() {
        let base = new Decimal(0);

        base = base.add(player.n.best.div(2)).floor();

        if (player.n.unlocked) base = base.add(tmp.n.clickables[43].effect);

        if (hasMilestone("l", 3)) base = base.max(18);

        return base;
    },

    researcherTime() {
        let time = {
            11: new Decimal(4),
            12: new Decimal(4),
            13: new Decimal(8),
            14: new Decimal(8),
            21: new Decimal(10),
            22: new Decimal(10),
            23: new Decimal(12),
            24: new Decimal(12),
            31: new Decimal(15),
            32: new Decimal(15),
            33: new Decimal(20),
            34: new Decimal(20),
            51: new Decimal(1000),
            52: new Decimal(1500),
            53: new Decimal(2000),
            54: new Decimal(3000),

            41: new Decimal(40),
            42: new Decimal(50),
            43: new Decimal(60),
            44: new Decimal(80),
        };
        return time;
    },

    baseRequirements() {
        let base = {
            11: new Decimal(150),
            12: new Decimal(10),
            13: new Decimal(100000000),
            14: new Decimal("1e500"),
            21: new Decimal("1e110"),
            22: new Decimal("1e800"),
            23: new Decimal(1),
            24: new Decimal(10),
            31: new Decimal(10),
            32: new Decimal(12),
            33: new Decimal(1),
            34: new Decimal(100),
            51: new Decimal(1.1),
            52: new Decimal(1),
            53: new Decimal(5),
            54: new Decimal(100),

            41: new Decimal("1e650"),
            42: new Decimal("1e680"),
            43: new Decimal("1e710"),
            44: new Decimal("1e720"),
        };
        return base;
    },

    requirementSub() {
        let sub = new Decimal(0);

        if (player.n.unlocked) sub = sub.add(tmp.n.clickables[42].effect);

        if (hasChallenge("b", 22)) sub = sub.add(1);

        if (hasUpgrade("n", 22)) sub = sub.add(1);

        return sub;
    },

    researcherTimeMult() {
        let mult = new Decimal(1);

        if (hasAchievement("a", 61)) mult = mult.times(1.25);
        if (hasAchievement("a", 91)) mult = mult.times(10);
        if (hasAchievement("a", 101)) mult = mult.times(10);
        
        if (player.n.unlocked) mult = mult.times(tmp.n.clickables[41].effect);
        if (player.n.unlocked) mult = mult.times(tmp.n.clickables[31].effect.second);

        if (player.s.unlocked) mult = mult.times(tmp.s.buyables[22].effect);

        if (player.ab.unlocked) mult = mult.times(tmp.ab.timeSpeed);

        return new Decimal(1).div(mult);
    },

    researcherBaseMult() {
        let mult = new Decimal(1);

        if (hasAchievement("a", 62)) mult = mult.times(player.n.researchers.times(0.1).add(1));

        if (player.n.unlocked) mult = mult.times(tmp.n.clickables[33].effect);

        return mult;
    },

    update(diff) {
        if (!player.n.unlocked)
            return;
        for (let i = 11; i <= 34; ((i % 10 == 4) ? i += 7 : i++)) {
            if (player.n.researcherTimes[i].gt(0)) {
                player.n.researcherTimes[i] = player.n.researcherTimes[i].sub(diff).max(0);
            } else if (player.n.currentlyResearched[i]) {
                player.n.zoneTravels[i] = player.n.zoneTravels[i].plus(1);
                player.n.currentlyResearched[i] = false;
                player.n.usedResearchers = player.n.usedResearchers.sub(1);
            }

            if (player.n.autoZones && tmp.n.clickables[i].canClick && hasMilestone("n", 6) && tmp.n.clickables[i].unlocked && !player.n.usedResearchers.gte(player.n.researchers)) {
                tmp.n.clickables[i].onClick();
            }
        }
        for (let i = 51; i <= 52; i++) {
            if (player.n.researcherTimes[i].gt(0)) {
                player.n.researcherTimes[i] = player.n.researcherTimes[i].sub(diff).max(0);
            } else if (player.n.currentlyResearched[i]) {
                player.n.zoneTravels[i] = player.n.zoneTravels[i].plus(1);
                player.n.currentlyResearched[i] = false;
                player.n.usedResearchers = player.n.usedResearchers.sub(1);
            }

            if (player.n.autoZones && tmp.n.clickables[i].canClick && hasMilestone("n", 6) && tmp.n.clickables[i].unlocked && !player.n.usedResearchers.gte(player.n.researchers)) {
                tmp.n.clickables[i].onClick();
            }
        }
        for (let i = 41; i <= 44; i++) {
            if (player.n.researcherTimes[i].gt(0)) {
                player.n.researcherTimes[i] = player.n.researcherTimes[i].sub(diff).max(0);7
            } else if (player.n.currentlyResearched[i]) {
                player.n.upgradeLevels[i] = player.n.upgradeLevels[i].plus(1);
                player.n.currentlyResearched[i] = false;
                player.n.usedResearchers = player.n.usedResearchers.sub(1);
            }

            if (player.n.autoZones && tmp.n.clickables[i].canClick && hasMilestone("n", 6) && tmp.n.clickables[i].unlocked && !player.n.usedResearchers.gte(player.n.researchers) && !player.n.upgradeLevels[i].gte(tmp.n.clickables[i].maxLevel)) {
                tmp.n.clickables[i].onClick();
            }
        }

        player.n.researchers = tmp.n.researcherAmount;

        if (player.n.autoSpaceships && tmp.n.buyables[11].canAfford && hasMilestone("l", 2)) {
            tmp.n.buyables[11].buy();
        }

        if (player.n.resetTime < 1.5 && player.n.points.gte(14)) {
            console.log("Total: " + format(getPointGen()));
            console.log("Higher Payment Coin Upgrade: " + format(upgradeEffect('c', 13)) + "x");
            console.log("Massive Payment Coin Upgrade: " + "^" + format(upgradeEffect('c', 14)));
            console.log("Farm Combo Upgrade: " + format(upgradeEffect("f", 11)) + "x");
            console.log("Bot v4 Effect: " + format(tmp.b.buyables[21].effect) + "x");
            console.log("Coins: " + format(player.c.points));
            console.log("\n");
        }
    },

    doReset(resettingLayer) {
        let keep = [];
        keep.push("auto");
        keep.push("autoZones");
        keep.push("autoSpaceships");

        if (hasMilestone("p", 3)) {
            keep.push("upgrades");
        }

        if (hasMilestone("o", 3)) {
            keep.push("buyables");
        }

        if (layers[resettingLayer].row > this.row) layerDataReset("n", keep);

        player.n.milestonePopups = false;

        player.n.milestones.push("0");
        player.n.milestones.push("1");

        if (player.p.resets.gte(1)) {
            player.n.milestones.push("2");
            player.n.milestones.push("3");
        }
        if (player.p.resets.gte(2)) {
            player.n.milestones.push("4");
            player.n.milestones.push("5");
        }
        if (player.p.resets.gte(3)) {
            player.n.milestones.push("6");
        }

        player.n.milestonePopups = true;

        if (resettingLayer == "l" && !hasMilestone("o", 3)) player.n.buyables[11] = new Decimal(0);
    },

    tabFormat: {
        "Milestones": {
            unlocked() {
                return true
            },
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.t.points) + " towns "
            }
            , {}], "blank", ["display-text", function() {
                return 'Your best Nations is ' + formatWhole(player.n.best) + '<br>You have founded a total of ' + formatWhole(player.n.total) + " Nations"
            }
            , {}], "blank", "milestones",],
        },
        "Upgrades": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'Your best Nations is ' + formatWhole(player.n.best) + '<br>You have founded a total of ' + formatWhole(player.n.total) + " Nations"
            }
            , {}], "blank", "upgrades", "blank", "buyables",],
        },
        "Researchers": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'Your best amount of Nations gives you ' + formatWhole(player.n.researchers) + ' Researchers <br>' + formatWhole(player.n.researchers.sub(player.n.usedResearchers)) + " of these are not busy"
            }
            , {}], "blank", ["infobox", "lore"], "blank", ["clickables", [1,2,3,5]], "blank", ["clickables", [4]],],
        },
    },

    milestones: {
        0: {
            requirementDescription: "2 Nations",
            done() {
                return player.n.best.gte(2);
            },
            effectDescription: "Keep Town milestones on all resets",
        },
        1: {
            requirementDescription: "3 Nations",
            done() {
                return player.n.best.gte(3);
            },
            effectDescription: "Keep MSPaintium milestones on all resets and unlock Nation upgrades",
        },
        2: {
            requirementDescription: "4 Nations",
            done() {
                return player.n.best.gte(4);
            },
            effectDescription: "Keep Town upgrades on all resets and unlock Researcher upgrades",
        },
        3: {
            requirementDescription: "5 Nations",
            done() {
                return player.n.best.gte(5);
            },
            effectDescription: "Keep MSPaintium upgrades on all resets and Autobuy Houses and MSPaintium buyables",
            toggles: [["t", "autoHouses"], ["ms", "autoBuyables"]],
        },
        4: {
            requirementDescription: "6 Nations",
            done() {
                return player.n.best.gte(6);
            },
            effectDescription: "Autobuy Towns and Towns reset nothing",
            toggles: [["t", "auto"]],
        },
        5: {
            requirementDescription: "7 Nations",
            done() {
                return player.n.best.gte(7);
            },
            effectDescription: "You can buy max Nations",
        },
        6: {
            requirementDescription: "9 Nations",
            done() {
                return player.n.best.gte(9);
            },
            effectDescription: "Auto-Travel to Zones",
            toggles: [["n", "autoZones"]],
        },
    },

    upgrades: {
        11: {
            title: "Boosted Economy",
            description: "Add 0.5 to the Nation boost base",
            cost: new Decimal(1),

            effect() {
                return 0.5;
            },
        },
        12: {
            title: "Increased Property Value",
            description: "Square the second effect of the House buyable",
            cost: new Decimal(2),

            effect() {
                return 2;
            },
        },
        13: {
            title: "There is No Inflation",
            description: "Improves the No Inflation effect formula",
            cost: new Decimal(2),
        },
        14: {
            title: "Science",
            description: "Unlock Researchers",
            cost: new Decimal(3),
        },

        21: {
            title: "Mining Expertise",
            description: "Boost Refined and Unstable MSPaintium gain by the current amount of Nations",
            cost: new Decimal(6),

            effect() {
                return player.n.points.max(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        22: {
            title: "New Roads",
            description: "Researching requirements are decreased by 1 visit",
            cost: new Decimal(6),
        },
        23: {
            title: "Space Travel",
            description: "Unlock Spaceships",
            cost: new Decimal(7),
        },
        24: {
            title: "To the Moon!",
            description: "Unlock Lunar Colonies",
            cost: new Decimal(8),
        },
    },

    infoboxes: {
        lore: {
            title: "Researchers & Zones",
            body: "The main mechanic of the Nations layer is Researchers and Zones. <br>" +
            "<br> Researchers are gained from your best amount of Nations and from Researcher upgrades. " +
            "They can be used to travel to different zones to discover buffs for your peanut farming. " +
            "Just remember that one researcher can't be in two zones at the same time and some zones take longer to travel to than others. <br>" +
            "<br> New zones can be unlocked from milestones or Researcher upgrades, " +
            "and they require different amounts of items to travel to.",
        }
    },

    clickables: {
        cols: 4,
        rows: 4,
        11: {
            title: "Farms",
            display() {
                return "Send a Researcher to your Farms to find improved ways to farm peanuts <br>" +
                ((player.n.researcherTimes[11].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts Farm base by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Farms <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.1).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.02);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));

                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[61].effect);

                if (inChallenge("b", 22)) eff = new Decimal(1);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[11].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.f.points.gte(tmp.n.clickables[11].requirement);
            },
            onClick() {
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
            },
            requirement() {
                let base = tmp.n.baseRequirements[11];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(300).div(new Decimal(0.98).pow(x)))).floor();
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[11].gt(0) ? "#666666" : "#009e05"
                },
                "filter"() {
                    return !tmp.n.clickables[11].canClick && !player.n.researcherTimes[11].gt(0) ? "saturate(20%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        12: {
            title: "Factories",
            display() {
                return "Send a Researcher to your Factories to come up with new Sapling Generator designs <br>" +
                ((player.n.researcherTimes[12].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts Sapling Generator base by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Factories <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.3).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.02);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));
                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[41].effect);

                if (inChallenge("b", 22)) eff = new Decimal(1);

                

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[12].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.fa.points.gte(tmp.n.clickables[12].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[12];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(20).div(new Decimal(0.98).pow(x)))).floor();
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[12].gt(0) ? "#666666" : "#4a4a4a"
                },
                "filter"() {
                    return !tmp.n.clickables[12].canClick && !player.n.researcherTimes[12].gt(0) ? "brightness(70%)" : "brightness(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        13: {
            title: "Mines",
            display() {
                return "Send a Researcher to the MSPaintium mines to find better ways to process the ores <br>" +
                ((player.n.researcherTimes[13].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Increases MSPaintium effect Softcap start by " + format(tmp.n.clickables[this.id].effect) + "x (Currently: " + format(tmp.ms.effCap.first) + ")" +
                "<br> Requirement: " + format(tmp.n.clickables[this.id].requirement) + " MSPaintium <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.1).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.01);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));

                if (inChallenge("b", 22)) eff = new Decimal(1);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[13].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.ms.points.gte(tmp.n.clickables[13].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[13];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(100).div(new Decimal(0.85).pow(x)))).floor();
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[13].gt(0) ? "#666666" : "#00d4d0"
                },
                "filter"() {
                    return !tmp.n.clickables[13].canClick && !player.n.researcherTimes[13].gt(0) ? "saturate(20%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        14: {
            title: "Jungle",
            display() {
                return "Send a Researcher to the jungles to find exotic and more valuable peanuts <br>" +
                ((player.n.researcherTimes[14].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Increases Coin gain by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + format(tmp.n.clickables[this.id].requirement) + " Coins <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(15).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.05);

                let eff = new Decimal(1).add(base.pow(x.pow(pow)));
                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[21].effect);

                if (inChallenge("b", 22)) eff = new Decimal(1);

                

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[14].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.c.points.gte(tmp.n.clickables[14].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[14];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(100).div(new Decimal(0.9).pow(x))));
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[14].gt(0) ? "#666666" : "#008523"
                },
                "filter"() {
                    return !tmp.n.clickables[14].canClick && !player.n.researcherTimes[14].gt(0) ? "saturate(20%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },

        21: {
            title: "North Pole",
            display() {
                return "Send a Researcher to the North Pole to find more resilient peanuts to be grown in harsher environments <br>" +
                ((player.n.researcherTimes[21].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Increases Peanut production by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + format(tmp.n.clickables[this.id].requirement) + " Saplings <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(15).times(tmp.n.researcherBaseMult);

                if (player.p.unlocked) base = base.times(tmp.p.clickables[91].effect);

                let pow = new Decimal(1.05);

                let eff = new Decimal(1).add(base.pow(x.pow(pow)));

                if (inChallenge("b", 22)) eff = new Decimal(1);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[21].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.sg.saplings.gte(tmp.n.clickables[21].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[21];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(100).div(new Decimal(0.9).pow(x))));
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[21].gt(0) ? "#666666" : "#FFFFFF"
                },
                "filter"() {
                    return !tmp.n.clickables[21].canClick && !player.n.researcherTimes[21].gt(0) ? "brightness(70%)" : "brightness(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        22: {
            title: "Tropical Island",
            display() {
                return "Send a Researcher to a tropical island to find better Sapling types for your Sapling Generators <br>" +
                ((player.n.researcherTimes[22].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts the Sapling effect exponent by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + format(tmp.n.clickables[this.id].requirement) + " Peanuts <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.01).times(tmp.n.researcherBaseMult);

                let eff = new Decimal(1).add(base.times(x));

                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[81].effect);

                if (inChallenge("b", 22)) eff = new Decimal(1);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[22].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.points.gte(tmp.n.clickables[22].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[22];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(50).div(new Decimal(0.8).pow(x))));
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[22].gt(0) ? "#666666" : "#00ff6a"
                },
                "filter"() {
                    return !tmp.n.clickables[22].canClick && !player.n.researcherTimes[22].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        23: {
            title: "Cliffs",
            display() {
                return "Send a Researcher to the Cliffs to find new MSPaintium veins <br>" +
                ((player.n.researcherTimes[23].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Increases MSPaintium effect Hardcap start by " + format(tmp.n.clickables[this.id].effect) + "x" + ((tmp.n.clickables[this.id].effect.gte(1e52)) ? " (softcapped)" : "") + " (Currently: " + format(tmp.ms.effCap.second) + ")" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Nations <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.5).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.2);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));
                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[11].effect);

                if (inChallenge("b", 22)) eff = new Decimal(1);
                
                eff = softcap(eff, new Decimal(1e52), 0.2);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[23].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.n.points.gte(tmp.n.clickables[23].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[23];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.plus(base.times(x.pow(0.8))).floor();
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[23].gt(0) ? "#666666" : "#00a6a4"
                },
                "filter"() {
                    return !tmp.n.clickables[23].canClick && !player.n.researcherTimes[23].gt(0) ? "brightness(80%)" : "brightness(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        24: {
            title: "Las Stickgas",
            display() {
                return "Send a Researcher to Las Stickgas to find improved ways to produce Bot Parts <br>" +
                ((player.n.researcherTimes[24].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Increases Bot Part gain by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Bot Parts <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.05).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.05);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));

                if (inChallenge("b", 22)) eff = new Decimal(1);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[24].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.b.points.gte(tmp.n.clickables[24].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[24];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(25).div(new Decimal(0.8).pow(x))));
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[24].gt(0) ? "#666666" : "#1f4f2c"
                },
                "filter"() {
                    return !tmp.n.clickables[24].canClick && !player.n.researcherTimes[24].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },

        31: {
            title: "Pyramids",
            display() {
                return "Send a Researcher to the Pyramids to discover ancient ways of boosting your Peanut production <br>" +
                ((player.n.researcherTimes[31].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Unlocks " + formatWhole(tmp.n.clickables[this.id].effect.first) + " new MSPaintium upgrades and boosts Researching speed by " + format(tmp.n.clickables[this.id].effect.second.sub(1).times(100)) + "%" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Towns <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                let eff = {};

                if (!x.gt(0)) return {first: 0, second: new Decimal(1)};

                let base = new Decimal(0.02).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.02);

                eff.first = 0;
                eff.second = new Decimal(1).add(base.times(x.pow(pow)));

                if (inChallenge("b", 22)) eff.second = new Decimal(1);

                if (x.gte(6)) eff.first += 1;
                if (x.gte(12)) eff.first += 1;
                if (x.gte(16)) eff.first += 1;
                if (x.gte(20)) eff.first += 1;
                if (x.gte(23)) eff.first += 1;

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[31].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.t.points.gte(tmp.n.clickables[31].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[12];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(20).div(new Decimal(0.98).pow(x)))).floor();
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[31].gt(0) ? "#666666" : "#aba957"
                },
                "filter"() {
                    return !tmp.n.clickables[31].canClick && !player.n.researcherTimes[31].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        32: {
            title: "Mr.Sheep's Castle",
            display() {
                return "Send a Researcher to Mr. Sheep's Castle to learn how to make Bots cheaper <br>" +
                ((player.n.researcherTimes[32].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Divides the Bot prices by " + format(tmp.n.clickables[this.id].effect) +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Bot Parts <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.1).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1.05);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));
                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[41].effect);

                if (inChallenge("b", 22)) eff = new Decimal(1);
                

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[32].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.b.points.gte(tmp.n.clickables[32].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[32];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(25).div(new Decimal(0.8).pow(x))));
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[32].gt(0) ? "#666666" : "#ff0000"
                },
                "filter"() {
                    return !tmp.n.clickables[32].canClick && !player.n.researcherTimes[32].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        33: {
            title: "Cloud City",
            display() {
                return "Send a Researcher to the Cloud City for them to come help solve all your problems <br>" +
                ((player.n.researcherTimes[33].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts the effect bases of all previous Zones by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " visits on all previous Zones <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.02);

                let eff = new Decimal(1).add(base.times(x));

                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[51].effect);

                if (inChallenge("b", 22)) eff = new Decimal(1);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[33].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && tmp.n.clickables[33].leastPreviousZoneVisits.gte(tmp.n.clickables[33].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            leastPreviousZoneVisits() {
                let least = player.n.zoneTravels[11];

                for (let i = 11; i <= 32; ((i % 10 == 4) ? i += 7 : i++)) {
                    let x = player.n.zoneTravels[i];
                    
                    if (least.gt(x)) least = x;
                }

                return least
            },
            requirement() {
                let base = tmp.n.baseRequirements[33];
                let x = player.n.zoneTravels[this.id];

                let req = base.add(x);
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[33].gt(0) ? "#666666" : "#d4c600"
                },
                "filter"() {
                    return !tmp.n.clickables[33].canClick && !player.n.researcherTimes[33].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        34: {
            title: "MSPaintium Shrine",
            display() {
                return "Send a Researcher to the MSPaintium Shrine, located deep inside the jungle <br>" +
                ((player.n.researcherTimes[34].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts the Spell effect bases by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " MSPaintium Dust <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.02);

                let eff = new Decimal(1).add(base.times(x));

                if (inChallenge("b", 22)) eff = new Decimal(1);

                if (player.p.unlocked) eff = eff.times(tmp.p.clickables[71].effect);

                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[34].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.s.points.gte(tmp.n.clickables[34].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[34];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.times(base.pow(x.div(25).div(new Decimal(0.8).pow(x))));
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[34].gt(0) ? "#666666" : "#006c78"
                },
                "filter"() {
                    return !tmp.n.clickables[34].canClick && !player.n.researcherTimes[34].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },

        41: {
            title: "Laboratories",
            display() {
                return "Build Laboratories to increase your Researching speed <br>" +
                ((player.n.researcherTimes[41].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to upgrade: " + formatTime(tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts Researching speed by " + format(tmp.n.clickables[this.id].effect.sub(1).times(100)) + "%" +
                "<br> Cost: " + format(tmp.n.clickables[this.id].cost) + " Coins <br> Level: " + formatWhole(player.n.upgradeLevels[this.id]) + "/" + formatWhole(tmp.n.clickables[this.id].maxLevel);
            },
            effect() {
                let x = player.n.upgradeLevels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.05);

                let eff = new Decimal(1).add(base.times(x));

                return eff;
            },
            maxLevel() {
                let max = new Decimal(10);

                if (hasMilestone("s", 2)) max = max.add(5);

                return max;
            },
            canClick() {
                return !player.n.researcherTimes[41].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.c.points.gte(tmp.n.clickables[41].cost) && !player.n.upgradeLevels[this.id].gte(tmp.n.clickables[this.id].maxLevel);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            upgradeTime() {
                let x = player.n.upgradeLevels[this.id];
                let base = tmp.n.researcherTime[this.id];

                base = base.times(x.div(5).add(1));

                return base;
            },
            cost() {
                let base = tmp.n.baseRequirements[41];
                let x = player.n.upgradeLevels[this.id];

                let req = base.times(base.pow(x.div(100).div(new Decimal(0.85).pow(x))));
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[41].gt(0) || player.n.upgradeLevels[41].gte(tmp.n.clickables[41].maxLevel) ? "#666666" : "#00ab2d"
                },
                "filter"() {
                    return !tmp.n.clickables[41].canClick && !player.n.researcherTimes[41].gt(0) && !player.n.upgradeLevels[41].gte(tmp.n.clickables[41].maxLevel) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        42: {
            title: "Supply Lines",
            display() {
                return "Create Supply Lines through the different zones to make Researching cheaper <br>" +
                ((player.n.researcherTimes[42].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to upgrade: " + formatTime(tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult)))) +
                "<br> Decreases Researching requirement by " + formatWhole(tmp.n.clickables[this.id].effect) + " visits" +
                "<br> Cost: " + format(tmp.n.clickables[this.id].cost) + " Coins <br> Level: " + formatWhole(player.n.upgradeLevels[this.id]) + "/" + formatWhole(tmp.n.clickables[this.id].maxLevel);
            },
            effect() {
                let x = player.n.upgradeLevels[this.id];

                if (!x.gt(0)) return new Decimal(0);

                let base = new Decimal(1);

                let eff = base.times(x).add(base.times(x.div(4).add(1).floor())).sub(1);

                return eff;
            },
            maxLevel() {
                let max = new Decimal(8);

                if (hasMilestone("s", 2)) max = max.add(2);

                return max;
            },
            canClick() {
                return !player.n.researcherTimes[42].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.c.points.gte(tmp.n.clickables[42].cost) && !player.n.upgradeLevels[this.id].gte(tmp.n.clickables[this.id].maxLevel);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            upgradeTime() {
                let x = player.n.upgradeLevels[this.id];
                let base = tmp.n.researcherTime[this.id];

                base = base.times(x.div(5).add(1));

                return base;
            },
            cost() {
                let base = tmp.n.baseRequirements[42];
                let x = player.n.upgradeLevels[this.id];

                let req = base.times(base.pow(x.div(100).div(new Decimal(0.9).pow(x))));

                if (x.gte(6)) req = req.times(x.sub(5)).times("1e30")
                if (x.gte(8)) req = req.times("1e740");
                if (x.gte(9)) req = req.times("1e860");

                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[42].gt(0) || player.n.upgradeLevels[42].gte(tmp.n.clickables[42].maxLevel) ? "#666666" : "#00ab2d"
                },
                "filter"() {
                    return !tmp.n.clickables[42].canClick && !player.n.researcherTimes[42].gt(0) && !player.n.upgradeLevels[42].gte(tmp.n.clickables[42].maxLevel) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        43: {
            title: "Universities",
            display() {
                return "Build Universities to educate more Researchers <br>" +
                ((player.n.researcherTimes[43].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to upgrade: " + formatTime(tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult)))) +
                "<br> Adds a total of " + formatWhole(tmp.n.clickables[this.id].effect) + " Researchers" +
                "<br> Cost: " + format(tmp.n.clickables[this.id].cost) + " Coins <br> Level: " + formatWhole(player.n.upgradeLevels[this.id]) + "/" + formatWhole(tmp.n.clickables[this.id].maxLevel);
            },
            effect() {
                let x = player.n.upgradeLevels[this.id];

                if (!x.gt(0)) return new Decimal(0);

                let base = new Decimal(1);

                let eff = base.times(x);

                return eff;
            },
            maxLevel() {
                let max = new Decimal(5);

                if (hasMilestone("s", 2)) max = max.add(1);

                return max;
            },
            canClick() {
                return !player.n.researcherTimes[43].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.c.points.gte(tmp.n.clickables[43].cost) && !player.n.upgradeLevels[this.id].gte(tmp.n.clickables[this.id].maxLevel);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            upgradeTime() {
                let x = player.n.upgradeLevels[this.id];
                let base = tmp.n.researcherTime[this.id];

                base = base.times(x.div(5).add(1));

                return base;
            },
            cost() {
                let base = tmp.n.baseRequirements[43];
                let x = player.n.upgradeLevels[this.id];

                let req = base.times(base.pow(x.div(20).div(new Decimal(0.9).pow(x))));
                if (x.gte(5)) req = req.times("1e550");
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[43].gt(0) || player.n.upgradeLevels[43].gte(tmp.n.clickables[43].maxLevel) ? "#666666" : "#00ab2d"
                },
                "filter"() {
                    return !tmp.n.clickables[43].canClick && !player.n.researcherTimes[43].gt(0) && !player.n.upgradeLevels[43].gte(tmp.n.clickables[43].maxLevel) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        44: {
            title: "Exploration",
            display() {
                return "Send Researchers to explore the world <br>" +
                ((player.n.researcherTimes[44].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to upgrade: " + formatTime(tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult)))) +
                "<br> Unlocks " + formatWhole(tmp.n.clickables[this.id].effect) + " new Zones" +
                "<br> Cost: " + format(tmp.n.clickables[this.id].cost) + " Coins <br> Level: " + formatWhole(player.n.upgradeLevels[this.id]) + "/" + formatWhole(tmp.n.clickables[this.id].maxLevel);
            },
            effect() {
                let x = player.n.upgradeLevels[this.id];

                if (!x.gt(0)) return new Decimal(0);

                let base = new Decimal(1);

                let eff = base.times(x);

                return eff;
            },
            maxLevel() {
                let max = new Decimal(4);

                if (hasMilestone("s", 2)) max = max.add(2);

                return max;
            },
            canClick() {
                return !player.n.researcherTimes[44].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.c.points.gte(tmp.n.clickables[44].cost) && !player.n.upgradeLevels[this.id].gte(tmp.n.clickables[this.id].maxLevel);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.clickables[this.id].upgradeTime.times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            upgradeTime() {
                let x = player.n.upgradeLevels[this.id];
                let base = tmp.n.researcherTime[this.id];

                base = base.times(x.div(5).add(1));

                return base;
            },
            cost() {
                let base = tmp.n.baseRequirements[44];
                let x = player.n.upgradeLevels[this.id];

                let req = base.times(base.pow(x.div(14).div(new Decimal(0.85).pow(x))));

                if (x.gte(2)) req = new Decimal("1e834");
                if (x.gte(3)) req = new Decimal("1e864");
                if (x.gte(4)) req = new Decimal("1e1630");
                if (x.gte(5)) req = new Decimal("1e2080");

                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[44].gt(0) || player.n.upgradeLevels[44].gte(tmp.n.clickables[44].maxLevel) ? "#666666" : "#00ab2d"
                },
                "filter"() {
                    return !tmp.n.clickables[44].canClick && !player.n.researcherTimes[44].gt(0) && !player.n.upgradeLevels[44].gte(tmp.n.clickables[44].maxLevel) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },

        51: {
            title: "Asteroid Belt",
            display() {
                return "Send a Researcher to the Asteroid Belt to allow for further terraforming of the Solar System <br>" +
                ((player.n.researcherTimes[51].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts the Planet base by " + format(tmp.n.clickables[this.id].effect) + "x" +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Planets <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.005).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));

                if (inChallenge("b", 22)) eff = new Decimal(1);
                
                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[51].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.p.points.gte(tmp.n.clickables[51].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[52];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.plus(base.times(x.pow(0.8))).floor();
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[51].gt(0) ? "#666666" : "#8f8f8f"
                },
                "filter"() {
                    return !tmp.n.clickables[51].canClick && !player.n.researcherTimes[51].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
        52: {
            title: "Ocean Floor",
            display() {
                return "Send a Researcher to the Ocean Floor to improve your underwater peanut production <br>" +
                ((player.n.researcherTimes[52].gt(0)) ? ("Time until done: " + formatTime(player.n.researcherTimes[this.id] || 0)) : ("Time to travel: " + formatTime(tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult)))) +
                "<br> Boosts the Ocean base by ^" + format(tmp.n.clickables[this.id].effect) +
                "<br> Requirement: " + formatWhole(tmp.n.clickables[this.id].requirement) + " Knowledge of the Ocean <br> Visits: " + formatWhole(player.n.zoneTravels[this.id]);
            },
            effect() {
                let x = player.n.zoneTravels[this.id];

                if (!x.gt(0)) return new Decimal(1);

                let base = new Decimal(0.005).times(tmp.n.researcherBaseMult);
                let pow = new Decimal(1);

                let eff = new Decimal(1).add(base.times(x.pow(pow)));

                if (inChallenge("b", 22)) eff = new Decimal(1);
                
                return eff;
            },
            canClick() {
                return !player.n.researcherTimes[52].gt(0) && !player.n.usedResearchers.gte(player.n.researchers) && player.o.points.gte(tmp.n.clickables[52].requirement);
            },
            onClick() {
                player.n.currentlyResearched[this.id] = true;
                player.n.researcherTimes[this.id] = tmp.n.researcherTime[this.id].times(tmp.n.researcherTimeMult);
                player.n.usedResearchers = player.n.usedResearchers.plus(1);
            },
            requirement() {
                let base = tmp.n.baseRequirements[52];
                let x = player.n.zoneTravels[this.id].sub(tmp.n.requirementSub).max(0);

                let req = base.plus(base.times(x.pow(0.8))).floor();
                return req;
            },
            style: {
                "background-color"() {
                    return player.n.researcherTimes[52].gt(0) ? "#666666" : "#3b38ff"
                },
                "filter"() {
                    return !tmp.n.clickables[52].canClick && !player.n.researcherTimes[52].gt(0) ? "saturate(50%)" : "saturate(100%)"
                },
                'height': '150px',
                'width': '150px',
            },
        },
    },

    buyables: {
        rows: 1,
        cols: 1,

        11: {
            title: "Spaceship",
            cost(x = player.n.buyables[11]) {
                let base1 = new Decimal(3e15);

                let base2 = new Decimal(20000);

                let base3 = new Decimal("1e2760");

                let cost = {};
                
                cost.first = base1.times(base1.pow(x.div(15).div(new Decimal(0.9).pow(x)))).floor();
                cost.second = base2.times(base2.pow(x.div(20).div(new Decimal(0.9).pow(x)))).floor();
                if (hasUpgrade("b", 31)) {
                    cost.third = base3.times(base3.pow(x.div(15).div(new Decimal(0.9).pow(x)))).floor();
                } else {
                    cost.third = base3.times(base3.pow(x.div(10).div(new Decimal(0.9).pow(x)))).floor();
                }
                
                return cost;
            },
            freeLevels() {
                let levels = new Decimal(0);

                if (hasAchievement("a", 82)) levels = levels.add(1);
                if (hasUpgrade("l", 33)) levels = levels.add(1);

                return levels;
            },
            display() {
                let data = tmp.n.buyables[11];
                return "Cost: <br>" +
                " - " + formatWhole(data.cost.first) + " Bot Parts as building materials <br>" +
                " - " + formatWhole(data.cost.second) + " Unstable MSPaintium as fuel <br>" +
                " - " + formatWhole(data.cost.third) + " Coins for the rest of the costs <br>" +
                "Amount: " + formatWhole(player.n.buyables[11]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "<br>" +
                ""
            },
            canAfford() {
                return player.b.points.gte(tmp.n.buyables[11].cost.first) && player.ms.unstable.gte(tmp.n.buyables[11].cost.second) && player.c.points.gte(tmp.n.buyables[11].cost.third);
            },
            buy() {
                cost = tmp.n.buyables[11].cost;

                player.n.buyables[11] = player.n.buyables[11].add(1);

                if (!hasMilestone("l", 2)) {
                    player.b.points = player.b.points.sub(cost.first);
                    player.ms.unstable = player.ms.unstable.sub(cost.second);
                    player.c.points = player.c.points.sub(cost.third);
                }
                
            },
            style: {
                'height': '150px',
                'width': '300px',
                "background-color"() {
                    return (!tmp.n.buyables[11].canAfford) ? "#aaaaaa" : "#ffffff"
                },
            },
        },
    },
})

addLayer("b", {
    name: "Bots", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "B", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        auto: false,
        autoBots: false,
    }},
    color: "#486b51",
    requires() {
        return new Decimal(20)
    }, // Can be a function that takes requirement increases into account
    resource: "bot parts", // Name of prestige currency
    baseResource: "factories", // Name of resource prestige is based on
    roundUpCost: true,
    branches: ["ms", "fa"],
    baseAmount() {return player.fa.points}, // Get the current amount of baseResource
    type() {
        return "normal"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1.9)

        if (hasUpgrade("b", 51)) mult = mult.times(upgradeEffect("b", 51));
        if (hasUpgrade("b", 13)) mult = mult.times(upgradeEffect("b", 13));
        if (hasUpgrade("b", 23)) mult = mult.times(upgradeEffect("b", 23));
        if (hasUpgrade("b", 53)) mult = mult.times(upgradeEffect("b", 53));
        if (hasUpgrade("l", 32)) mult = mult.times(upgradeEffect("l", 32));
        if (hasUpgrade("ab", 23)) mult = mult.times(upgradeEffect("ab", 23));

        if (hasChallenge("b", 12)) mult = mult.times(challengeCompletions("b"));

        if (tmp.b.buyables[22].unlocked) mult = mult.times(tmp.b.buyables[22].effect);

        if (player.n.unlocked) mult = mult.times(tmp.n.clickables[24].effect);

        return mult
    },

    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },

    passiveGeneration() {
        return (hasMilestone("b", 4)) ? new Decimal(0.1).times(tmp.ab.timeSpeed) : 0
    },

    milestonePopups: true,

    row: 3, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "b", description: "B: Perform a Bot reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    effectBase() {
        let base = new Decimal(1.5);

        if (hasUpgrade("b", 11)) base = base.times(upgradeEffect("b", 11));

        return base;
    },
    effect() {
        let base = tmp.b.effectBase;
        let pow = player.b.points.add(1).log(5);

        pow = softcap(pow, new Decimal(1e10).log(5), 0.2);

        let eff = Decimal.pow(base, pow).add(new Decimal(0.2).times(player.b.points).min(10));

        if (tmp.b.buyables[22].unlocked && hasUpgrade("ms", 24)) eff = eff.times(tmp.b.buyables[22].effect.add(1).log(3).add(1));

        return eff;
    },

    effectDescription() {
        let desc = "which are boosting the Factory base by " + format(tmp.b.effect) + "x" + ((player.b.points.gte(1e10)) ? " (softcapped)" : "");
        return desc;
    },

    // ======================================================

    freeBots() {
        let x = new Decimal(0);

        if (hasUpgrade("b", 41)) x = x.add(upgradeEffect("b", 41));

        return x;
    },

    botBaseRoot() {
        let root = new Decimal(1);
        return root;
    },

    botBaseCosts() {
        let rt = tmp.b.botBaseRoot;
        return {
            11: new Decimal(1.5).root(rt),
            12: new Decimal(3).root(rt),
            13: new Decimal(10).root(rt),
            21: new Decimal(25).root(rt),
            22: new Decimal(100).root(rt),
            23: new Decimal(1000).root(rt),
        }
    },

    botBaseEffects() {
        return {
            11: new Decimal(350),
            12: new Decimal(8),
            13: new Decimal(1.5),
            21: new Decimal(120),
            22: new Decimal(1.2),
            23: new Decimal(0.1),
        }
    },

    botPower() {
        if (!player.b.unlocked)
            return new Decimal(0);
        let pow = new Decimal(1);
        return pow;
    },

    divBotCosts() {
        let div = new Decimal(1);

        if (hasUpgrade("b", 22)) div = div.times(upgradeEffect("b", 22));
        if (player.n.unlocked) div = div.times(tmp.n.clickables[32].effect);
        
        return div;
    },
    botScalePower() {
        let scale = new Decimal(1);
        return scale;
    },
    botBaseMult() {
        let mult = new Decimal(1);

        if (player.s.unlocked) mult = mult.times(tmp.s.buyables[21].effect);

        if (player.ab.unlocked) mult = mult.times(tmp.ab.effect);

        if (player.ab.unlocked) mult = mult.times(tmp.ab.buyables[31].effect);

        if (player.o.unlocked) mult = mult.times(tmp.b.buyables[23].effect);

        if (tmp.l.buyables[33].unlocked) mult = mult.times(tmp.l.buyables[33].effect);

        return mult;
    },

    botCostNothing() {
        return hasChallenge("b", 32) || hasMilestone("ab", 1);
    },

    update(diff) {
        if (player.b.autoBots && hasMilestone("b", 4)) {
            for (let i = 11; i <= 23; ((i % 10 == 3) ? i += 8 : i++)) {
                if (tmp.b.buyables[i].canAfford && tmp.b.buyables[i].unlocked) {
                    if (hasMilestone("l", 3)) {
                        layers.b.buyables[i].buy100();
                        layers.b.buyables[i].buy10();
                    }
                    
                    tmp.b.buyables[i].buy();
                }
            }
        }
    },

    // ======================================================

    doReset(resettingLayer) {
        let keep = [];
        keep.push("auto");
        keep.push("autoBots");

        if (hasMilestone("ab", 3)) {
            keep.push("upgrades");
            keep.push("challenges");
        }

        if (layers[resettingLayer].row > this.row)
        {
            layerDataReset("b", keep)
        }
            
        player.b.milestonePopups = false;

        player.b.milestones.push("0");
        player.b.milestones.push("1");

        if (player.ab.resets.gte(1)) {
            player.b.milestones.push("2");
        }
        if (player.ab.resets.gte(2)) {
            player.b.milestones.push("3");
        }
        if (player.ab.resets.gte(3)) {
            player.b.milestones.push("4");
        }

        player.b.milestonePopups = true;
    },

    tabFormat: {
        "Milestones": {
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.fa.points) + " factories "
            }
            , {}], "blank", ["display-text", function() {
                return 'Your best Bot Parts is ' + formatWhole(player.b.best) + '<br>You have made a total of ' + formatWhole(player.b.total) + " Bot Parts"
            }
            , {}], "blank", "milestones",],
        },
        "Bots": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'Your best Bot Parts is ' + formatWhole(player.b.best) + '<br>You have made a total of ' + formatWhole(player.b.total) + " Bot Parts"
            }
            , {}], "blank", "buyables", "blank", "upgrades",],
        },
        "Challenges": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'Your best Bot Parts is ' + formatWhole(player.b.best) + '<br>You have made a total of ' + formatWhole(player.b.total) + " Bot Parts"
            }
            , {}], "blank", "challenges",],
        },
    },

    milestones: {
        0: {
            requirementDescription: "2 Bot Parts",
            done() {
                return player.b.points.gte(2)
            },
            effectDescription: "Keep Factory milestones on all resets and unlock the first Bot",
        },
        1: {
            requirementDescription: "4 Bot Parts",
            done() {
                return player.b.points.gte(4)
            },
            effectDescription: "Unlock Bot Part upgrades",
        },
        2: {
            requirementDescription: "50 Bot Parts",
            done() {
                return player.b.points.gte(50)
            },
            effectDescription: "Keep Factory upgrades on all resets",
        },
        3: {
            requirementDescription: "1000 Bot Parts",
            done() {
                return player.b.points.gte(1000)
            },
            effectDescription: "Autobuy Factories and Factories reset nothing",
            toggles: [["fa", "auto"]],
        },
        4: {
            requirementDescription: "25 000 Bot Parts",
            done() {
                return player.b.points.gte(25000)
            },
            effectDescription() {
                return `Autobuy Bots and gain ${format(tmp.ab.timeSpeed.times(10))}% of Bot Part gain per second`;
            },
            toggles: [["b", "autoBots"]],
        },
    },

    upgrades: {
        11: {
            title: "High-Quality Parts",
            description: "Multiply the Bot Part effect base by 1.5",
            
            cost() {
                return new Decimal(2);
            },

            effect() {
                let eff = new Decimal(1.5);
                return eff;
            },
        },
        12: {
            title: "Bot Improvements",
            description: "Square the effect base of BotV1",
            
            cost() {
                return new Decimal(3);
            },
            effect() {
                let eff = new Decimal(2);
                return eff;
            },
        },
        13: {
            title: "Efficient Production",
            description: "Multiply Bot Part gain by 1.5",
            
            cost() {
                return new Decimal(3);
            },

            effect() {
                let eff = new Decimal(1.5);
                return eff;
            },
        },
        14: {
            title: "Ore Refinements",
            description: "Increase the MSPaintium effect Softcap start by 15x (30k -> 450k)",
            
            cost() {
                return new Decimal(4);
            },
            effect() {
                let eff = new Decimal(15);
                return eff;
            },
        },
        21: {
            title: "Production Challenges",
            description: "Unlock two Bot Part Challenges",
            
            cost() {
                return new Decimal(6);
            },
        },
        22: {
            title: "Innovative Bot Design",
            description: "Divide Bot prices by the amount of Bot Part upgrades bought",
            
            cost() {
                return new Decimal(10);
            },

            effect() {
                let eff = new Decimal(player.b.upgrades.length);
                return eff;
            },
            effectDisplay() { return "/" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
        23: {
            title: "Mass-Production",
            description: "Double Bot Part gain",
            
            cost() {
                return new Decimal(12);
            },

            effect() {
                let eff = new Decimal(2);
                return eff;
            },
        },
        24: {
            title: "Budget Nations",
            description: "Divide the Nation price by 1.13",
            
            cost() {
                return new Decimal(20);
            },

            effect() {
                let eff = new Decimal(1.13);
                return eff;
            },
        },
        31: {
            title: "Miner Bots",
            description: "Increase the MSPaintium effect Hardcap start by 10x (1e9 -> 1e10)",
            
            cost() {
                return new Decimal(50);
            },

            effect() {
                let eff = new Decimal(10);
                return eff;
            },
        },
        32: {
            title: "Miner Bots V2",
            description: "Double the effect base of BotV2",
            
            cost() {
                return new Decimal(60);
            },

            effect() {
                let eff = new Decimal(2);
                return eff;
            },
        },
        33: {
            title: "Production Issues",
            description: "Unlock two more Bot Part Challenges",
            
            cost() {
                return new Decimal(70);
            },

        },
        34: {
            title: "More Bots!",
            description: "Unlock BotV3",
            
            cost() {
                return new Decimal(150);
            },

        },
        41: {
            title: "Free Sample",
            description: "Get a Free level on every Bot for every upgrade in this row",
            
            cost() {
                return new Decimal(180);
            },

            effect() {
                let eff = new Decimal(0);

                if (hasUpgrade("b", 41)) eff = eff.add(1);
                if (hasUpgrade("b", 42)) eff = eff.add(1);
                if (hasUpgrade("b", 43)) eff = eff.add(1);
                if (hasUpgrade("b", 44)) eff = eff.add(1);

                return eff;
            },
            effectDisplay() { return formatWhole(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
        42: {
            title: "Crusher",
            description: "Build a Crusher to crush MSPaintium into MSPaintium Dust and unlock Spells",
            
            cost() {
                return new Decimal(200);
            },

        },
        43: {
            title: "Precise Crushing",
            description: "Double MSPaintium Dust gain",
            
            cost() {
                return new Decimal(250);
            },

            effect() {
                let eff = new Decimal(2).pow(20);
                return eff;
            },
        },
        44: {
            title: "Production Hindrances",
            description: "Unlock the last two Bot Part Challenges",
            
            cost() {
                return new Decimal(300);
            },
        },
        51: {
            title: "Production Expansion",
            description: "Double both Bot Part and MSPaintium Dust gain",
            
            cost() {
                return new Decimal(400);
            },
            effect() {
                let eff = new Decimal(2);
                return eff;
            },
        },
        52: {
            title: "Automated Travel",
            description: "Unlock two more Zones",
            
            cost() {
                return new Decimal(900);
            },
        },
        53: {
            title: "Bot Part Industry",
            description: "Triple Bot Part gain",
            
            cost() {
                return new Decimal(1200);
            },

            effect() {
                let eff = new Decimal(3);
                return eff;
            },
        },
        54: {
            title: "The True Bot",
            description: "Unlock THE BOT",
            
            cost() {
                return new Decimal(5000);
            },
        },
    },

    challenges: {
        rows: 3,
        cols: 2,
        11: {
            name: "Drought",
            completionLimit: 1,
            challengeDescription: "Peanut production is square-rooted, but Farms and Sapling Generators are also a lot cheaper",
            goal() {
                return new Decimal("1e25")
            },
            currencyDisplayName: "peanuts",
            currencyInternalName: "points",
            rewardDescription() {
                return "Unlock a new Bot"
            },
        },
        12: {
            name: "Material Shortage",
            completionLimit: 1,
            challengeDescription: "MSPaintium gain is cube-rooted",
            goal() {
                return new Decimal(500)
            },
            currencyDisplayName: "MSPaintium",
            currencyInternalName: "points",
            currencyLayer: "ms",
            rewardDescription() {
                return "Multiply Bot Part gain by the amount of Challenges you have completed and unlock more Bot Part upgrades <br> Currently: " + format(challengeCompletions("b")) + "x"
            },
        },
        21: {
            name: "Farm Strikes",
            completionLimit: 1,
            challengeDescription: "The Farm effect exponent is log10'd",
            goal() {
                return new Decimal("1e285");
            },
            currencyDisplayName: "peanuts",
            currencyInternalName: "points",
            rewardDescription() {
                return "Multiply the Farm effect exponent by 1.2"
            },
        },
        22: {
            name: "Travelling Restrictions",
            completionLimit: 1,
            challengeDescription: "All Zone effects are set to 1",
            goal() {
                return new Decimal("1e760");
            },
            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",
            rewardDescription() {
                return "Decrease all Zone requirements by 1 visit and unlock more Bot Part upgrades"
            },
        },
        31: {
            name: "Fake Ores",
            completionLimit: 1,
            challengeDescription: "The MSPaintium effect is set to 1",
            goal() {
                return new Decimal("1e1036");
            },
            currencyDisplayName: "peanuts",
            currencyInternalName: "points",
            rewardDescription() {
                return "Unlock BotV4"
            },
        },

        32: {
            name: "Complete Breakdown",
            completionLimit: 1,
            challengeDescription: "Both Row 2 effects are set to 1",
            goal() {
                return new Decimal("1e214");
            },
            currencyDisplayName: "peanuts",
            currencyInternalName: "points",
            rewardDescription() {
                return "Bots don't cost anything and unlock more Bot Part upgrades"
            },
        },
    },

    buyables: {
        rows: 2,
        cols: 3,

        11: {
            title: "Bot v1",
            costExp() {
                let exp = 2.5;
                return exp;
            },
            cost(x = player.b.buyables[11]) {
                let base = tmp.b.botBaseCosts[11];

                let cap1 = (x.gte(20)) ? x.sub(16).div(4) : new Decimal(1);
                let cap2 = (x.gte(30)) ? new Decimal(1.1).pow(x.sub(28)) : new Decimal(1);

                let cap3 = (x.gte(150)) ? x.sub(145).pow(x.sub(145).div(20).div(new Decimal(0.9).pow(x.sub(145)))).floor() : new Decimal(1);

                let cap = cap1.times(cap2).times(cap3);
                
                let cost = base.times(x.times(cap).add(1).pow(tmp.b.buyables[11].costExp)).div(tmp.b.divBotCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.b.freeBots;
                return levels;
            },
            effect(x = player.b.buyables[11]) {
                if (!x.plus(tmp.b.freeBots).gt(0)) {
                    return new Decimal(1);
                }

                let base = tmp.b.botBaseEffects[11].times(tmp.b.botBaseMult);
                let pow = x.plus(tmp.b.freeBots).pow(0.5).times(tmp.b.botPower);

                if (hasUpgrade("b", 12)) pow = pow.times(upgradeEffect("b", 12));

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.b.buyables[11]
                return "Cost: " + formatWhole(data.cost) + " Bot Parts" + "\n\
                    Amount: " + formatWhole(player.b.buyables[11]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts Peanut production & Coin gain by " + format(data.effect) + "x"
            },
            canAfford() {
                return player.b.points.gte(tmp.b.buyables[11].cost);
            },
            buy() {
                cost = tmp.b.buyables[11].cost

                if (!tmp.b.botCostNothing) {
                    player.b.points = player.b.points.sub(cost)
                }

                player.b.buyables[11] = player.b.buyables[11].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            target() {
                return player.b.points.times(tmp.b.divBotCosts).div(tmp.b.botBaseCosts[this.id]).max(1).log(tmp.b.botBaseCosts[this.id]).root(tmp.b.buyables[11].costExp).div(tmp.b.botScalePower).plus(1).floor().min(player.b.buyables[11])
            },
            buyMax() {
                if (!this.canAfford() || !this.unlocked())
                    return;
                let target = this.target();
                player.b.buyables[11] = player.b.buyables[11].max(target);
            },
            style: {
                'height': '100px'
            },
            autoed() {
                return false;
            },
        },
        12: {
            title: "Bot v2",
            costExp() {
                let exp = 2.5;
                return exp;
            },
            cost(x = player.b.buyables[12]) {
                let base = tmp.b.botBaseCosts[12];

                let cap1 = (x.gte(20)) ? x.sub(16).div(4) : new Decimal(1);
                let cap2 = (x.gte(30)) ? new Decimal(1.1).pow(x.sub(28)) : new Decimal(1);

                let cap3 = (x.gte(150)) ? x.sub(145).pow(x.sub(145).div(20).div(new Decimal(0.9).pow(x.sub(145)))).floor() : new Decimal(1);

                let cap = cap1.times(cap2).times(cap3);

                let cost = base.times(x.times(cap).add(1).pow(tmp.b.buyables[12].costExp)).div(tmp.b.divBotCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.b.freeBots;
                return levels;
            },
            effect(x = player.b.buyables[12]) {
                if (!x.plus(tmp.b.freeBots).gt(0)) {
                    return new Decimal(1);
                }

                let base = tmp.b.botBaseEffects[12].times(tmp.b.botBaseMult);
                let pow = x.plus(tmp.b.freeBots).pow(1.8).times(tmp.b.botPower);

                if (hasUpgrade("b", 32)) base = base.times(upgradeEffect("b", 32));

                pow = softcap(pow, new Decimal(40).pow(1.8), 0.5);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.b.buyables[12];
                return "Cost: " + formatWhole(data.cost) + " Bot Parts" + "\n\
                    Amount: " + formatWhole(player.b.buyables[12]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts MSPaintium gain by " + format(data.effect.pow(0.018)) + "x"
            },
            canAfford() {
                return player.b.points.gte(tmp.b.buyables[12].cost);
            },
            buy() {
                cost = tmp.b.buyables[12].cost
                
                if (!tmp.b.botCostNothing) {
                    player.b.points = player.b.points.sub(cost)
                }

                player.b.buyables[12] = player.b.buyables[12].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            target() {
                return player.b.points.times(tmp.b.divBotCosts).div(tmp.b.botBaseCosts[this.id]).max(1).log(tmp.b.botBaseCosts[this.id]).root(tmp.b.buyables[12].costExp).div(tmp.b.botScalePower).plus(1).floor().min(player.b.buyables[12])
            },
            buyMax() {
                if (!this.canAfford() || !this.unlocked())
                    return;
                let target = this.target();
                player.b.buyables[12] = player.b.buyables[12].max(target);
            },
            style: {
                'height': '100px'
            },
            autoed() {
                return false;
            },
        },
        13: {
            title: "Bot v3",
            costExp() {
                let exp = 2.5;
                return exp;
            },
            cost(x = player.b.buyables[13]) {
                let base = tmp.b.botBaseCosts[13];

                let cap1 = (x.gte(10)) ? x.sub(6).div(4) : new Decimal(1);
                let cap2 = (x.gte(20)) ? new Decimal(1.1).pow(x.sub(18)) : new Decimal(1);

                let cap3 = (x.gte(150)) ? x.sub(145).pow(x.sub(145).div(20).div(new Decimal(0.9).pow(x.sub(145)))).floor() : new Decimal(1);

                let cap = cap1.times(cap2).times(cap3);

                let cost = base.times(x.times(cap).add(1).pow(tmp.b.buyables[13].costExp)).div(tmp.b.divBotCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.b.freeBots;
                return levels;
            },
            effect(x = player.b.buyables[13]) {
                if (!x.plus(tmp.b.freeBots).gt(0)) {
                    return new Decimal(1);
                }

                let base = tmp.b.botBaseEffects[13].times(tmp.b.botBaseMult);
                let pow = x.plus(tmp.b.freeBots).pow(0.8).times(tmp.b.botPower);

                pow = softcap(pow, new Decimal(30).pow(0.8), 0.5);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.b.buyables[13];
                return "Cost: " + formatWhole(data.cost) + " Bot Parts" + "\n\
                    Amount: " + formatWhole(player.b.buyables[13]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts Farm and Sapling Generator bases by " + format(data.effect) + "x"
            },
            canAfford() {
                return player.b.points.gte(tmp.b.buyables[13].cost);
            },
            buy() {
                cost = tmp.b.buyables[13].cost;
                
                if (!tmp.b.botCostNothing) {
                    player.b.points = player.b.points.sub(cost)
                }
                
                player.b.buyables[13] = player.b.buyables[13].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            target() {
                return player.b.points.times(tmp.b.divBotCosts).div(tmp.b.botBaseCosts[this.id]).max(1).log(tmp.b.botBaseCosts[this.id]).root(tmp.b.buyables[13].costExp).div(tmp.b.botScalePower).plus(1).floor().min(player.b.buyables[13])
            },
            buyMax() {
                if (!this.canAfford() || !this.unlocked())
                    return;
                let target = this.target();
                player.b.buyables[13] = player.b.buyables[13].max(target);
            },
            style: {
                'height': '100px'
            },
            autoed() {
                return false;
            },
        },
        21: {
            title: "Bot v4",
            costExp() {
                let exp = 2.5;
                return exp;
            },
            cost(x = player.b.buyables[this.id]) {
                let base = tmp.b.botBaseCosts[this.id];

                let cap1 = (x.gte(10)) ? x.sub(6).div(4) : new Decimal(1);
                let cap2 = (x.gte(20)) ? new Decimal(1.1).pow(x.sub(18)) : new Decimal(1);

                let cap3 = (x.gte(150)) ? x.sub(145).pow(x.sub(145).div(20).div(new Decimal(0.9).pow(x.sub(145)))).floor() : new Decimal(1);

                let cap = cap1.times(cap2).times(cap3);

                let cost = base.times(x.times(cap).add(1).pow(tmp.b.buyables[this.id].costExp)).div(tmp.b.divBotCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.b.freeBots;
                return levels;
            },
            effect(x = player.b.buyables[this.id]) {
                if (!x.plus(tmp.b.freeBots).gt(0)) {
                    return new Decimal(1);
                }

                let base = tmp.b.botBaseEffects[this.id].times(tmp.b.botBaseMult);
                let pow = x.plus(tmp.b.freeBots).pow(0.8).times(tmp.b.botPower);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.b.buyables[this.id];
                return "Cost: " + formatWhole(data.cost) + " Bot Parts" + "\n\
                    Amount: " + formatWhole(player.b.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts Higher Payment's effect by " + format(data.effect) + "x"
            },
            canAfford() {
                return player.b.points.gte(tmp.b.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.b.buyables[this.id].cost;
                
                if (!tmp.b.botCostNothing) {
                    player.b.points = player.b.points.sub(cost)
                }
                
                player.b.buyables[this.id] = player.b.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            target() {
                return player.b.points.times(tmp.b.divBotCosts).div(tmp.b.botBaseCosts[this.id]).max(1).log(tmp.b.botBaseCosts[this.id]).root(tmp.b.buyables[this.id].costExp).div(tmp.b.botScalePower).plus(1).floor().min(player.b.buyables[this.id])
            },
            buyMax() {
                if (!this.canAfford() || !this.unlocked())
                    return;
                let target = this.target();
                player.b.buyables[this.id] = player.b.buyables[this.id].max(target);
            },
            style: {
                'height': '100px'
            },
            autoed() {
                return false;
            },
        },
        22: {
            title: "THE BOT",
            costExp() {
                let exp = 2.5;
                return exp;
            },
            cost(x = player.b.buyables[this.id]) {
                let base = tmp.b.botBaseCosts[this.id];

                let cap1 = (x.gte(10)) ? x.sub(6).div(4) : new Decimal(1);
                let cap2 = (x.gte(20)) ? new Decimal(1.1).pow(x.sub(18)) : new Decimal(1);

                let cap3 = (x.gte(150)) ? x.sub(145).pow(x.sub(145).div(20).div(new Decimal(0.9).pow(x.sub(145)))).floor() : new Decimal(1);

                let cap = cap1.times(cap2).times(cap3);

                let cost = base.times(x.times(cap).add(1).pow(tmp.b.buyables[this.id].costExp)).div(tmp.b.divBotCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.b.freeBots;
                return levels;
            },
            effect(x = player.b.buyables[this.id]) {
                if (!x.plus(tmp.b.freeBots).gt(0)) {
                    return new Decimal(1);
                }

                let base = tmp.b.botBaseEffects[this.id].times(tmp.b.botBaseMult);
                let pow = x.plus(tmp.b.freeBots).pow(0.8).times(tmp.b.botPower);

                pow = softcap(pow, new Decimal(30).pow(0.8), 0.5);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.b.buyables[this.id];
                return "Cost: " + formatWhole(data.cost) + " Bot Parts" + "\n\
                    Amount: " + formatWhole(player.b.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts Bot Part gain by " + format(data.effect) + "x" +
                   ((hasUpgrade("ms", 24)) ? " and the Bot Part effect by " + format(data.effect.add(1).log(3).add(1)) + "x" : "")
            },
            canAfford() {
                return player.b.points.gte(tmp.b.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.b.buyables[this.id].cost;
                
                if (!tmp.b.botCostNothing) {
                    player.b.points = player.b.points.sub(cost)
                }
                
                player.b.buyables[this.id] = player.b.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            target() {
                return player.b.points.times(tmp.b.divBotCosts).div(tmp.b.botBaseCosts[this.id]).max(1).log(tmp.b.botBaseCosts[this.id]).root(tmp.b.buyables[this.id].costExp).div(tmp.b.botScalePower).plus(1).floor().min(player.b.buyables[this.id])
            },
            buyMax() {
                if (!this.canAfford() || !this.unlocked())
                    return;
                let target = this.target();
                player.b.buyables[this.id] = player.b.buyables[this.id].max(target);
            },
            style: {
                'height': '100px'
            },
            autoed() {
                return false;
            },
        },
        23: {
            title: "THE DESTROYER",
            costExp() {
                let exp = 2.5;
                return exp;
            },
            cost(x = player.b.buyables[this.id]) {
                let base = tmp.b.botBaseCosts[this.id];

                let cap1 = (x.gte(10)) ? x.sub(6).div(4) : new Decimal(1);
                let cap2 = (x.gte(20)) ? new Decimal(1.1).pow(x.sub(18)) : new Decimal(1);

                let cap3 = (x.gte(150)) ? x.sub(145).pow(x.sub(145).div(20).div(new Decimal(0.9).pow(x.sub(145)))).floor() : new Decimal(1);

                let cap = cap1.times(cap2).times(cap3);

                let cost = base.times(x.times(cap).add(1).pow(tmp.b.buyables[this.id].costExp)).div(tmp.b.divBotCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.b.freeBots;
                return levels;
            },
            effect(x = player.b.buyables[this.id]) {
                if (!x.plus(tmp.b.freeBots).gt(0)) {
                    return new Decimal(1);
                }

                let base = tmp.b.botBaseEffects[this.id].add(1);

                let pow = x.plus(tmp.b.freeBots).root(3).times(tmp.b.botPower);

                // pow = softcap(pow, new Decimal(30).pow(0.8), 0.5);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.b.buyables[this.id];
                return "Cost: " + formatWhole(data.cost) + " Bot Parts" + "\n\
                    Amount: " + formatWhole(player.b.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts previous bot bases by " + format(data.effect) + "x";
            },
            canAfford() {
                return player.b.points.gte(tmp.b.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.b.buyables[this.id].cost;
                
                if (!tmp.b.botCostNothing) {
                    player.b.points = player.b.points.sub(cost)
                }
                
                player.b.buyables[this.id] = player.b.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.b.botCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            target() {
                return player.b.points.times(tmp.b.divBotCosts).div(tmp.b.botBaseCosts[this.id]).max(1).log(tmp.b.botBaseCosts[this.id]).root(tmp.b.buyables[this.id].costExp).div(tmp.b.botScalePower).plus(1).floor().min(player.b.buyables[this.id])
            },
            buyMax() {
                if (!this.canAfford() || !this.unlocked())
                    return;
                let target = this.target();
                player.b.buyables[this.id] = player.b.buyables[this.id].max(target);
            },
            style: {
                'height': '100px'
            },
            autoed() {
                return false;
            },
        },
    },
})

addLayer("s", {
    name: "Spells", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "S", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        spellInput: "1",
        spellTimes: {
            11: new Decimal(0),
            12: new Decimal(0),
            13: new Decimal(0),
            21: new Decimal(0),
            22: new Decimal(0),
            23: new Decimal(0),
            31: new Decimal(0),
            32: new Decimal(0),
        },
        spellInputs: {
            11: new Decimal(1),
            12: new Decimal(1),
            13: new Decimal(1),
            21: new Decimal(1),
            22: new Decimal(1),
            23: new Decimal(1),
            31: new Decimal(1),
            32: new Decimal(1),
        },
        spellsUnl: {
            refined: 0,
            unstable: 0,
        },
        auto: false,
        autoSpells: false,
    }},
    color: "#006c78",
    requires() {
        return new Decimal("1e19")
    }, // Can be a function that takes requirement increases into account
    resource: "MSPaintium Dust", // Name of prestige currency
    baseResource: "mspaintium", // Name of resource prestige is based on
    branches: ["b", "ms"],
    baseAmount() {return player.ms.points}, // Get the current amount of baseResource
    type() {
        return "normal"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1);

        if (hasUpgrade("b", 43)) mult = mult.times(upgradeEffect("b", 43));
        if (hasUpgrade("b", 51)) mult = mult.times(upgradeEffect("b", 51).pow(20));
        if (hasUpgrade("ms", 22)) mult = mult.times(upgradeEffect("ms", 22).pow(20));
        if (hasUpgrade("l", 14)) mult = mult.times(upgradeEffect("l", 14).pow(20));

        return mult;
    },

    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(0.05);

        return exp;
    },

    passiveGeneration() {
        return (hasMilestone("s", 4)) ? new Decimal(0.1).times(tmp.ab.timeSpeed) : 0;
    },

    row: 3, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "S", description: "Shift + S: Perform a Spell reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },

    update(diff) {
        if (!player.s.unlocked)
            return;
        for (let i = 11; i <= 32; ((i % 10 == 3) ? i += 8 : i++)) {
            if (tmp.s.buyables[i].unlocked && hasMilestone("s", 5) && player.s.autoSpells) {
                tmp.s.buyables[i].buy()
            } else if (player.s.spellTimes[i].gt(0))
                player.s.spellTimes[i] = player.s.spellTimes[i].sub(diff).max(0);
        }
    },
    // =====================================
    
    spellTime() {
        let time = {
            dust: new Decimal(60),
            refined: new Decimal(60),
            unstable: new Decimal(60),
        };

        if (hasMilestone("s", 3)) {
            time.dust = time.dust.times(tmp.s.dustInputAmt.div(100).plus(1).log10().plus(1));
            time.refined = time.refined.times(tmp.s.refinedInputAmt.div(100).plus(1).log10().plus(1));
            time.unstable = time.unstable.times(tmp.s.unstableInputAmt.div(100).plus(1).log10().plus(1));
        }
        
        return time;
    },
    spellPower() {
        if (!player.s.unlocked)
            return new Decimal(0);
        let power = new Decimal(1);
        return power;
    },
    spellBaseMult() {
        let mult = new Decimal(1);

        if (hasUpgrade("ms", 14)) mult = mult.times(2);
        if (hasUpgrade("ab", 13)) mult = mult.times(upgradeEffect("ab", 13));

        if (player.n.unlocked) mult = mult.times(tmp.n.clickables[34].effect);
        if (player.s.unlocked) mult = mult.times(tmp.s.buyables[23].effect);

        if (tmp.l.buyables[32].unlocked) mult = mult.times(tmp.l.buyables[32].effect);
        if (player.ab.unlocked) mult = mult.times(tmp.ab.buyables[62].effect);

        return mult;
    },
    dustInputAmt() {
        if (hasMilestone("s", 3) && player.s.spellInput != "1") {
            let factor = new Decimal(player.s.spellInput.split("%")[0]).div(100);
            return player.s.points.times(factor.max(0.01)).floor().max(1);
        } else
            return new Decimal(1);
    },
    refinedInputAmt() {
        if (hasMilestone("s", 3) && player.s.spellInput != "1") {
            let factor = new Decimal(player.s.spellInput.split("%")[0]).div(100);
            return player.ms.refined.times(factor.max(0.01)).floor().max(1);
        } else
            return new Decimal(1);
    },
    unstableInputAmt() {
        if (hasMilestone("s", 3) && player.s.spellInput != "1") {
            let factor = new Decimal(player.s.spellInput.split("%")[0]).div(100);
            return player.ms.unstable.times(factor.max(0.01)).floor().max(1);
        } else
            return new Decimal(1);
    },
    abomInputAmt() {
        if (hasMilestone("s", 3) && player.s.spellInput != "1") {
            let factor = new Decimal(player.s.spellInput.split("%")[0]).div(100);
            return player.ab.points.times(factor.max(0.01)).floor().max(1);
        } else
            return new Decimal(1);
    },

    // =====================================

    doReset(resettingLayer) {
        let keep = [];
        keep.push("auto");
        keep.push("autoSpells");

        if (hasMilestone("ab", 2)) {
            keep.push("milestones");
            keep.push("spellInput");
        }

        if (layers[resettingLayer].row > this.row)
            layerDataReset("s", keep)
    },

    tabFormat: {
        "Milestones": {
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.ms.points) + " mspaintium "
            }
            , {}], "blank", ["display-text", function() {
                return 'Your best MSPaintium Dust is ' + formatWhole(player.s.best) + '<br>You have made a total of ' + formatWhole(player.s.total) + " MSPaintium Dust"
            }
            , {}], "blank", "milestones",],
        },
        "Spells": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return ((hasUpgrade("ms", 21)) ? "You have " + formatWhole(player.ms.refined) + " Refined MSPaintium" : "") + ((hasUpgrade("ms", 23)) ? " and " + formatWhole(player.ms.unstable) + " Unstable MSPaintium" : "")
            }
            , {}], "blank", "buyables", "blank", "clickables",],
        },
    },

    milestones: {
        0: {
            requirementDescription: "1 Total MSPaintium Dust",
            done() {
                return player.s.total.gte(1)
            },
            effectDescription: "Unlock Spells",
        },
        1: {
            requirementDescription: "5 Total MSPaintium Dust",
            done() {
                return player.s.total.gte(5)
            },
            effectDescription: "Unlock more Bot Part upgrades",
        },
        2: {
            requirementDescription: "250 MSPaintium Dust",
            done() {
                return player.s.best.gte(250)
            },
            effectDescription: "Unlocks more Researcher upgrade levels",
        },
        3: {
            requirementDescription: "3000 MSPaintium Dust",
            done() {
                return player.s.best.gte(3000)
            },
            effectDescription: "Unlock the ability to spend more MSPaintium on each Spell to make them stronger",
        },
        4: {
            requirementDescription: "250 000 MSPaintium Dust",
            done() {
                return player.s.best.gte(250000)
            },
            effectDescription() {
                return `You gain ${format(tmp.ab.timeSpeed.times(10))}% of MSPaintium Dust gain every second`;
            },
        },
        5: {
            requirementDescription: "50 000 000 MSPaintium Dust",
            done() {
                return player.s.best.gte(50000000)
            },
            effectDescription: "Autobuy Spells and Spells cost nothing",
            toggles: [["s", "autoSpells"]],
        },
    },

    buyables: {
        rows: 3,
        cols: 3,
        11: {
            title: "MSPaintium Purification",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.dustInputAmt;
            },
            effect() {
                let pow = tmp.s.spellPower;
                let base = new Decimal(50).times(tmp.s.spellBaseMult).times(player.s.spellInputs[this.id].max(1).log10().plus(1));
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Increases the MSPaintium Hardcap start by " + format(data.effect) + "x (Currently: " + format(tmp.ms.effCap.second) + ")" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.dustInputAmt) + " MSPaintium Dust";
                return display;
            },
            canAfford() {
                return player.s.points.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.dustInputAmt) : tmp.s.dustInputAmt);
                if (!hasMilestone("s", 5)) player.s.points = player.s.points.sub(cost)
                player.s.spellTimes[this.id] = tmp.s.spellTime.dust;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },
        12: {
            title: "Worker Perfection",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.dustInputAmt;
            },
            effect() {
                let pow = tmp.s.spellPower;
                let base = new Decimal(10000).times(tmp.s.spellBaseMult).times(player.s.spellInputs[this.id].max(1).log10().plus(1));
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Boosts the Worker effect by " + format(data.effect) + "x" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.dustInputAmt) + " MSPaintium Dust";
                return display;
            },
            canAfford() {
                return player.s.points.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.dustInputAmt) : tmp.s.dustInputAmt);
                if (!hasMilestone("s", 5)) player.s.points = player.s.points.sub(cost)
                player.s.spellTimes[this.id] = tmp.s.spellTime.dust;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },
        13: {
            title: "Peanut Multiplication",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.refinedInputAmt;
            },
            effect() {
                let pow = tmp.s.spellPower.times(player.s.spellInputs[this.id].max(1).log10().plus(1).log(10).plus(1));
                let base = new Decimal(5e49).times(tmp.s.spellBaseMult);
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Boosts Peanut production by " + format(data.effect) + "x" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.refinedInputAmt) + " Refined MSPaintium";
                return display;
            },
            canAfford() {
                return player.ms.refined.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.refinedInputAmt) : tmp.s.refinedInputAmt);
                if (!hasMilestone("s", 5)) player.ms.refined = player.ms.refined.sub(cost)
                player.s.spellTimes[this.id] = tmp.s.spellTime.refined;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },

        21: {
            title: "Bot Augmentation",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.refinedInputAmt;
            },
            effect() {
                let pow = tmp.s.spellPower;
                let base = new Decimal(0.085).times(tmp.s.spellBaseMult).times(player.s.spellInputs[this.id].max(1).log10().plus(1));
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.add(1).pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Boosts Bot bases by " + format(data.effect) + "x" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.refinedInputAmt) + " Refined MSPaintium";
                return display;
            },
            canAfford() {
                return player.ms.refined.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.refinedInputAmt) : tmp.s.refinedInputAmt);
                if (!hasMilestone("s", 5)) player.ms.refined = player.ms.refined.sub(cost)
                player.s.spellTimes[this.id] = tmp.s.spellTime.refined;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },
        22: {
            title: "Instant Researching",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.unstableInputAmt;
            },
            effect() {
                let pow = tmp.s.spellPower;
                let base = new Decimal(5).times(tmp.s.spellBaseMult).times(player.s.spellInputs[this.id].max(1).log10().plus(1));
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Boosts Researching speed by " + format(data.effect) + "x" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.unstableInputAmt) + " Unstable MSPaintium";
                return display;
            },
            canAfford() {
                return player.ms.unstable.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.unstableInputAmt) : tmp.s.unstableInputAmt);
                if (!hasMilestone("s", 5)) player.ms.unstable = player.ms.unstable.sub(cost)
                player.s.spellTimes[this.id] = tmp.s.spellTime.unstable;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },
        23: {
            title: "Total Boost",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.unstableInputAmt;
            },
            effect() {
                let pow = new Decimal(1);
                let base = new Decimal(0.05).times(player.s.spellInputs[this.id].max(1).log10().plus(1));
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.add(1).pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Boosts all previous Spell's bases by " + format(data.effect) + "x" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.unstableInputAmt) + " Unstable MSPaintium";
                return display;
            },
            canAfford() {
                return player.ms.unstable.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.unstableInputAmt) : tmp.s.unstableInputAmt);
                if (!hasMilestone("s", 5)) player.ms.unstable = player.ms.unstable.sub(cost)
                player.s.spellTimes[this.id] = tmp.s.spellTime.unstable;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },

        31: {
            title: "Planet Transformation",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.abomInputAmt;
            },
            effect() {
                let pow = tmp.s.spellPower;
                let base = new Decimal(0.125).times(player.s.spellInputs[this.id].max(1).log10().plus(1));
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.add(1).pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Boosts the Planet effect base by " + format(data.effect) + "x" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.abomInputAmt) + " Abominatium";
                return display;
            },
            unlocked() {
                return player.ab.buyables[11].gte(1);
            },
            canAfford() {
                return player.ab.points.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.abomInputAmt) : tmp.s.abomInputAmt);
                player.s.spellTimes[this.id] = tmp.s.spellTime.refined;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },
        32: {
            title: "Abomination Strengthening",
            cost(x=player[this.layer].buyables[this.id]) {
                return tmp.s.abomInputAmt;
            },
            effect() {
                let pow = tmp.s.spellPower;
                let base = new Decimal(0.1).times(player.s.spellInputs[this.id].max(1).log10().plus(1));
                if (player.s.spellTimes[this.id].eq(0))
                    pow = new Decimal(0);
                let eff = base.add(1).pow(pow);
                return eff.max(1);
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                let display = "Boosts the Abominatium effect base by " + format(data.effect) + "x" + "\n\
					Time left: " + formatTime(player.s.spellTimes[this.id] || 0);
                display += "\n " + "Cost: " + formatWhole(tmp.s.abomInputAmt) + " Abominatium";
                return display;
            },
            unlocked() {
                return player.ab.buyables[11].gte(1);
            },
            canAfford() {
                return player.ab.points.gte(tmp[this.layer].buyables[this.id].cost);
            },
            buy() {
                cost = tmp[this.layer].buyables[this.id].cost
                player.s.spellInputs[this.id] = (player.s.spellTimes[this.id].gt(0) ? player.s.spellInputs[this.id].max(tmp.s.abomInputAmt) : tmp.s.abomInputAmt);
                player.s.spellTimes[this.id] = tmp.s.spellTime.refined;
            },
            buyMax() {},
            style: {
                'height': '180px',
                'width': '180px'
            },
        },
    },

    clickables: {
        11: {
            title: "Spell Input",
            display() {
                return player.s.spellInput;
            },
            unlocked() {
                return hasMilestone("s", 3);
            },
            canClick() {
                return hasMilestone("s", 3);
            },
            onClick() {
                if (player.s.spellInput == "1") {
                    player.s.spellInput = "10%"
                } else if (player.s.spellInput == "10%") {
                    player.s.spellInput = "50%"
                } else if (player.s.spellInput == "50%") {
                    player.s.spellInput = "100%"
                } else if (player.s.spellInput == "100%") {
                    player.s.spellInput = "1"
                }
            },
            style: {
                "background-color": "#213c4a",
                'height': '120px',
                'width': '120px',
            },
        },
    },
})

addLayer("l", {
    name: "Lunar Colonies", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "L", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        auto: false,
        autoBuyables: false,
    }},
    color: "#77f7ef",
    requires() {
        return new Decimal(1)
    }, // Can be a function that takes requirement increases into account
    roundUpCost: true,
    resource: "lunar colonies", // Name of prestige currency
    baseResource: "spaceships", // Name of resource prestige is based on
    branches: ["ms", "n"],
    baseAmount() {return player.n.buyables[11].add(tmp.n.buyables[11].freeLevels)}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1)
        return mult;
    },

    automate() {},
    resetsNothing() {
        return hasMilestone("o", 3);
    },

    autoPrestige() {
        return player.l.auto && hasMilestone("o", 3);
    },

    base() {
        return new Decimal(2.5)
    },
    canBuyMax() {
        return hasMilestone("l", 1);
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 3, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "l", description: "L: Perform a Lunar Colony reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    addToBase() {
        let base = new Decimal(0);
        return base;
    },
    effectBase() {
        let base = new Decimal(1000).pow(tmp.l.power);

        if (player.ab.unlocked) base = base.times(tmp.ab.buyables[32].effect);

        return base;
    },
    power() {
        let power = new Decimal(1);
        return power;
    },
    effect() {
        let eff = tmp.l.effectBase.pow(player.l.points.sqrt());

        return eff;
    },
    effectDescription() {
        return "which are boosting the MSPaintium Hardcap by " + format(tmp.l.effect) + "x (Currently: " + format(tmp.ms.effCap.second) + ")";
    },

    // =================================

    buyableBaseCosts() {
        let cost = {
            11: new Decimal("1e3500"),
            12: new Decimal("1e3000"),
            13: new Decimal(540),
            21: new Decimal("1e750"),
            22: new Decimal(35),
            23: new Decimal(35),
            31: new Decimal(8),
            32: new Decimal(1e25),
            33: new Decimal(1e40),
        };

        return cost;
    },

    freeLevels() {
        levels = new Decimal(0);

        if (hasUpgrade("l", 24)) levels = levels.add(1);

        return levels;
    },

    buyablesCostNothing() {
        return hasAchievement("a", 83);
    },

    // =================================

    update(diff) {
        if (player.l.autoBuyables && hasMilestone("o", 1)) {
            for (let i = 11; i <= 33; ((i % 10 == 3) ? i += 8 : i++)) {
                if (tmp.l.buyables[i].canAfford && tmp.l.buyables[i].unlocked) {
                    if (hasMilestone("l", 3)) {
                        layers.l.buyables[i].buy100();
                        layers.l.buyables[i].buy10();
                    }
                    
                    tmp.l.buyables[i].buy();
                }
            }
        }
    },

    doReset(resettingLayer) {
        let keep = [];
        keep.push("auto");
        keep.push("autoBuyables");

        if (hasMilestone("p", 2)) keep.push("milestones");
        
        if (hasMilestone("p", 4)) keep.push("upgrades");

        if (layers[resettingLayer].row > this.row)
            layerDataReset("l", keep)
    },

    tabFormat: {
        "Milestones": {
            unlocked() {
                return true
            },
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.n.buyables[11].add(tmp.n.buyables[11].freeLevels)) + " spaceships "
            }
            , {}], "blank", ["display-text", function() {
                return 'Your best Lunar Colonies is ' + formatWhole(player.l.best) + '<br>You have started a total of ' + formatWhole(player.l.total) + " Lunar Colonies"
            }
            , {}], "blank", "milestones",],
        },
        "Upgrades": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'Your best Lunar Colonies is ' + formatWhole(player.l.best) + '<br>You have started a total of ' + formatWhole(player.l.total) + " Lunar Colonies"
            }
            , {}], "blank", "upgrades", "blank", "buyables", "blank"],
        },
    },

    milestones: {
        0: {
            requirementDescription: "1 Lunar Colony",
            done() {
                return player.l.best.gte(1)
            },
            effectDescription: "Unlock Lunar Colony upgrades",
        },
        1: {
            requirementDescription: "2 Lunar Colonies",
            done() {
                return player.l.best.gte(2)
            },
            effectDescription: "Unlock more Lunar Colony upgrades and you can buy max Lunar Colonies",
        },
        2: {
            requirementDescription: "3 Lunar Colonies",
            done() {
                return player.l.best.gte(3)
            },
            effectDescription: "Autobuy Spaceships and Spaceships cost nothing",
            toggles: [["n", "autoSpaceships"]],
        },
        3: {
            requirementDescription: "4 Lunar Colonies",
            done() {
                return player.l.best.gte(4)
            },
            effectDescription: "All Row 3 and 4 buyable autobuyers will now bulk and you will now always have at least 18 researchers",
        },
    },

    upgrades: {
        11: {
            title: "Home Base",
            description: "Build the home base on the Moon, which boosts the Town base by the amount of Lunar Colonies",
            cost: new Decimal(1),

            effect() {
                return player.l.points.add(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        12: {
            title: "Moon-Grown Peanuts",
            description: "Unlock the first Lunar Colony buyable",
            cost: new Decimal("1e3600"),

            currencyDisplayName: "peanuts",
            currencyInternalName: "points",
        },
        13: {
            title: "Marketing",
            description: "Unlock the second Lunar Colony buyable",
            cost: new Decimal("1e3100"),

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",
        },
        14: {
            title: "Lunar Crushers",
            description: "Boost MSPaintium Dust gain by the level of the first Lunar Colony buyable",
            cost: new Decimal("1e3800"),

            currencyDisplayName: "peanuts",
            currencyInternalName: "points",

            effect() {
                return player.l.buyables[11].max(1).log(1.5).max(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        15: {
            title: "Lunar Farms",
            description: "Unlock the third Lunar Colony buyable",
            cost: new Decimal("1e3230"),

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",
        },
        21: {
            title: "This is a Pain",
            description: "Boost Refined and Unstable MSPaintium gain by the amount of Spaceships",
            cost: new Decimal("1e4400"),

            currencyDisplayName: "peanuts",
            currencyInternalName: "points",

            effect() {
                return player.n.buyables[11].add(1).log(1.3).add(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        22: {
            title: "Lunar Saplings",
            description: "Unlock the fourth Lunar Colony buyable",
            cost: new Decimal("1e760"),

            currencyDisplayName: "saplings",
            currencyInternalName: "saplings",
            currencyLayer: "sg",
        },
        23: {
            title: "Actual Colonies",
            description: "Unlock the fifth Lunar Colony buyable",
            cost: new Decimal(37),

            currencyDisplayName: "towns",
            currencyInternalName: "points",
            currencyLayer: "t",
        },
        24: {
            title: "Production Boost",
            description: "Get a free level on all buyables",
            cost: new Decimal("1e5030"),

            currencyDisplayName: "peanuts",
            currencyInternalName: "points",
        },
        25: {
            title: "Factories!",
            description: "Unlock the sixth Lunar Colony buyable",
            cost: new Decimal(665),

            currencyDisplayName: "sapling generators",
            currencyInternalName: "points",
            currencyLayer: "sg",
        },
        31: {
            title: "Budget Spaceships",
            description: "The Coin cost scaling of Spaceships is better",
            cost: new Decimal("1e4230"),

            currencyDisplayName: "coins",
            currencyInternalName: "points",
            currencyLayer: "c",
        },
        32: {
            title: "Reusable Parts",
            description: "The amount of Spaceships boosts Bot Part gain",
            cost: new Decimal("3e21"),

            currencyDisplayName: "bot parts",
            currencyInternalName: "points",
            currencyLayer: "b",

            effect() {
                return player.l.buyables[11].max(1).log(1.5);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        33: {
            title: "Unknown Sponsor",
            description: "Get a free Spaceship",
            cost: new Decimal(675),

            currencyDisplayName: "farms",
            currencyInternalName: "points",
            currencyLayer: "f",
        },
    },

    buyables: {
        rows: 3,
        cols: 3,

        11: {
            title: "Small-Scale Terraforming",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(100).div(new Decimal(0.9).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(1e30);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Begin growing Peanuts on the Moon" +
                "<br> Boosts Peanut production by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Peanuts" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.points = player.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.points = player.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.points = player.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[11].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },
        12: {
            title: "New Market",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(50).div(new Decimal(0.9).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(1e20);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Sell your Moon-grown Peanuts for high prices back on Earth" +
                "<br> Boosts Coin gain by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Coins" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.c.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.c.points = player.c.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.c.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.c.points = player.c.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.c.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.c.points = player.c.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[12].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },
        13: {
            title: "Farm Establishments",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(100).div(new Decimal(0.95).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(10);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Establish Farms on the Moon" +
                "<br> Boosts the Farm effect base by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Farms" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.f.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.f.points = player.f.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.f.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.f.points = player.f.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.f.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.f.points = player.f.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[13].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },

        21: {
            title: "Sapling Domes",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(100).div(new Decimal(0.95).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(1e10);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Build domes on the Moon for growing Saplings" +
                "<br> Boosts the Sapling effect by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Saplings" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.sg.saplings.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.sg.saplings = player.sg.saplings.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.sg.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.sg.points = player.sg.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.sg.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.sg.points = player.sg.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[21].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },
        22: {
            title: "Colonization",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(200).div(new Decimal(0.98).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(1.8);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Colonize the Moon" +
                "<br> Boosts the Town effect base by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Towns" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.t.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.t.points = player.t.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.t.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.t.points = player.t.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.t.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.t.points = player.t.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[22].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },
        23: {
            title: "Production Amplification",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(200).div(new Decimal(0.98).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(5);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Build Factories on the Moon" +
                "<br> Boosts the Factory effect base by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Factories" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.fa.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.fa.points = player.fa.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.fa.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.fa.points = player.fa.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.fa.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.fa.points = player.fa.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[23].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },

        31: {
            title: "Lunar Nations",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(100).div(new Decimal(0.95).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(1.1);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Found Nations on the Moon to further boost your peanut production" +
                "<br> Boosts the Nation effect base by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Nations" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.n.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.n.points = player.n.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.n.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.n.points = player.n.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.n.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.n.points = player.n.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[31].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },
        32: {
            title: "Lunar Breweries",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(75).div(new Decimal(0.95).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(1.04);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Build Spell Breweries on the Moon to help improve the Spell effects" +
                "<br> Boosts the Spell bases by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " MSPaintium Dust" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.s.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.s.points = player.s.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.s.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.s.points = player.s.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.s.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.s.points = player.s.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[32].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },
        33: {
            title: "Lunar Automation",
            cost(x=player.l.buyables[this.id]) {

                let base = tmp.l.buyableBaseCosts[this.id]

                let cost = base.times(base.pow(x.div(20).div(new Decimal(0.92).pow(x)))).floor();

                return cost;
            },
            effect(x=player.l.buyables[this.id]) {
                if (!player.l.unlocked) x = new Decimal(0);

                let base = new Decimal(1.1);
                let y = tmp.l.freeLevels;

                eff = base.pow(x.plus(y).sqrt());

                return eff;
            },
            display() {
                let y = tmp.l.freeLevels;
                let data = tmp.l.buyables[this.id]
                return "Build Bots on the Moon to automate your lunar factories" +
                "<br> Boosts the Bot bases by " + format(data.effect) + "x" +
                "<br> Cost: " + formatWhole(data.cost) + " Bot Parts" +
                "<br> Level: " + formatWhole(player.l.buyables[this.id]) + ((y.gte(1)) ? " + " + formatWhole(y) : "")
            },
            canAfford() {
                return player.b.points.gte(tmp.l.buyables[this.id].cost)
            },
            buy() {
                cost = tmp.l.buyables[this.id].cost

                if (!tmp.l.buyablesCostNothing) player.b.points = player.b.points.sub(cost)

                player.l.buyables[this.id] = player.l.buyables[this.id].add(1)
            },
            buy10() {
                let x = player[this.layer].buyables[this.id].add(9);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(10);
                }
            },
            buy100() {
                let x = player[this.layer].buyables[this.id].add(99);
                let cost = layers[this.layer].buyables[this.id].cost(x);

                if (player.b.points.gte(cost)) {
                    if (!tmp.l.buyablesCostNothing) player.b.points = player.b.points.sub(cost);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(100);
                }
            },
            style: {
                'height': '200px',
                "background-color"() {
                    return (!tmp.l.buyables[33].canAfford) ? "#777777" : "#77f7ef"
                },
            },
        },
    },
})

addLayer("p", {
    name: "Planets", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        resets: new Decimal(0),
        helium: new Decimal(0),
        planetsBought: {
            11: false,
            21: false,
            41: false,
            51: false,
            61: false,
            71: false,
            81: false,
            91: false,
        },
        auto: false,
        autoSun: false,
    }},
    color: "#de9a57",
    requires() {
        return new Decimal(9);
    }, // Can be a function that takes requirement increases into account
    roundUpCost: true,
    resource: "planets", // Name of prestige currency
    baseResource: "nations", // Name of resource prestige is based on
    branches: ["n", "l"],
    baseAmount() {return player.n.points}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1);

        if (hasAchievement("a", 132)) mult = mult.times(0.95);
        if (hasUpgrade("p", 34)) mult = mult.times(0.95);

        return mult;
    },

    base() {
        return new Decimal(1.2);
    },
    canBuyMax() {
        return hasMilestone("p", 6);
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1.75)
    },
    row: 4, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "p", description: "P: Perform a Planet reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    addToBase() {
        let base = new Decimal(0);

        return base;
    },
    effectBase() {
        let base = new Decimal(2);
        base = base.plus(tmp.p.addToBase);

        if (hasUpgrade("p", 11)) base = base.times(upgradeEffect("p", 11));
        if (hasUpgrade("p", 34)) base = base.times(upgradeEffect("p", 34));
        
        base = base.times(tmp.s.buyables[31].effect);
        base = base.times(tmp.ab.buyables[63].effect);

        base = base.times(tmp.n.clickables[51].effect);

        return base.pow(tmp.p.power);
    },
    power() {
        let power = new Decimal(1);
        return power;
    },
    effect() {
        let eff = Decimal.pow(tmp.p.effectBase, player.p.points.sqrt());
        return eff;
    },
    effectDescription() {
        return "which are boosting the Nation base by " + format(tmp.p.effect) + "x"
    },

    // =================================

    heliumGain() {
        let base = tmp.p.buyables[11].effect;

        return base;
    },

    // =================================
    
    update(diff) {
        if (!player.p.unlocked) return;

        player.p.helium = player.p.helium.add(tmp.p.heliumGain.times(diff));

        if (player.p.autoSun && hasMilestone("p", 7) && tmp.p.buyables[11].canAfford) {
            tmp.p.buyables[11].buy();
        }
    },

    doReset(resettingLayer) {
        let keep = [];
        keep.push("auto");
        keep.push("autoSun");

        if (resettingLayer == "p") player.p.resets = player.p.resets.add(1);

        if (layers[resettingLayer].row > this.row) layerDataReset("p", keep);
    },

    tabFormat: {
        "Milestones": {
            unlocked() {
                return true
            },
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.p.points) + " planets "
            }
            , {}], "blank", ["display-text", function() {
                return 'Your best Planets is ' + formatWhole(player.p.best) + '<br>You have made a total of ' + formatWhole(player.p.total) + " Planets"
            }
            , {}], "blank", "milestones",],
        },
        "Upgrades": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'Your best Planets is ' + formatWhole(player.p.best) + '<br>You have made a total of ' + formatWhole(player.p.total) + " Planets"
            }
            , {}], "blank", "upgrades",],
        },
        "Solar System": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'You have ' + format(player.p.helium) + ' helium, and you\'re generating ' + format(tmp.p.heliumGain) + " helium/second"
            }
            , {}], "blank", "buyables", "blank", ["clickables", [1]], "blank", ["clickables", [2]], "blank",
            ["clickables", [3]], "blank", ["clickables", [4]], "blank", ["clickables", [5]], "blank",
            ["clickables", [6]], "blank", ["clickables", [7]], "blank", ["clickables", [8]], "blank", ["clickables", [9]], "blank"],
        },
    },

    milestones: {
        0: {
            requirementDescription: "1 Planet",
            done() {
                return player.p.best.gte(1)
            },
            effectDescription()  {
                return "Keep +2 Nation milestones per Planet reset <br> Currently: " + player.p.resets.times(2).min(5).add(2);
            },
        },
        1: {
            requirementDescription: "2 Planets",
            done() {
                return player.p.best.gte(2)
            },
            effectDescription: "Unlock the Solar System",
        },
        2: {
            requirementDescription: "3 Planets",
            done() {
                return player.p.best.gte(3)
            },
            effectDescription: "Keep Lunar Colony milestones on all resets",
        },
        3: {
            requirementDescription: "4 Planets",
            done() {
                return player.p.best.gte(4)
            },
            effectDescription: "Keep Nation upgrades on all resets",
        },
        4: {
            requirementDescription: "5 Planets",
            done() {
                return player.p.best.gte(5)
            },
            effectDescription: "Keep Lunar Colony upgrades on all resets",
        },
        5: {
            requirementDescription: "6 Planets",
            done() {
                return player.p.best.gte(6)
            },
            effectDescription: "Autobuy Nations and Nations reset nothing",
            toggles: [["n", "auto"]],
        },
        6: {
            requirementDescription: "7 Planets",
            done() {
                return player.p.best.gte(7)
            },
            effectDescription: "You can buy max Planets",
        },
        7: {
            requirementDescription: "8 Planets",
            done() {
                return player.p.best.gte(8)
            },
            effectDescription: "Autobuy The Sun buyable",
            toggles: [["p", "autoSun"]],
        },
    },

    upgrades: {
        11: {
            title: "Planet Colonization",
            description: "The Planet effect base is doubled",
            
            cost() {
                return new Decimal(2);
            },

            effect() {
                let eff = new Decimal(2);
                return eff;
            }
        },
        12: {
            title: "Hot Tourist Destinations",
            description: "Square Mercury's and Venus' effects",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                let eff = new Decimal(2);
                return eff;
            },
        },
        13: {
            title: "Fusion Boost",
            description: "Multiply The Sun's effect exponent by 1.5",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                let eff = new Decimal(1.5);
                return eff;
            },
        },
        14: {
            title: "Underwater Exploration",
            description: "Unlock the Ocean",
            
            cost() {
                return new Decimal(2);
            },
        },

        21: {
            title: "Martial Base Preparations",
            description: "Square Mars' effect base",
            
            cost() {
                return new Decimal(3);
            },

            effect() {
                let eff = new Decimal(2);
                return eff;
            }
        },
        22: {
            title: "Gas Trades",
            description: "Boost Jupiter's effect base by 1.2x",
            
            cost() {
                return new Decimal(3);
            },

            effect() {
                let eff = new Decimal(1.2);
                return eff;
            }
        },
        23: {
            title: "Ring Visitors",
            description: "Improve Saturn's effect formula",
            
            cost() {
                return new Decimal(4);
            },

            effect() {
                let eff = new Decimal(4);
                return eff;
            }
        },
        24: {
            title: "Abominatium Asteroids",
            description: "Mine Abominatium Asteroids to double your Abominatium gain",
            
            cost() {
                return new Decimal(5);
            },

            effect() {
                let eff = new Decimal(2);
                return eff;
            }
        },

        31: {
            title: "Freezing Labs",
            description: "Boost Uranus' effect base by 1.5x",
            
            cost() {
                return new Decimal(6);
            },

            effect() {
                let eff = new Decimal(1.5);
                return eff;
            }
        },
        32: {
            title: "Even Faster Winds",
            description: "Boost Neptune' effect base by 1.18x",
            
            cost() {
                return new Decimal(6);
            },

            effect() {
                let eff = new Decimal(1.18);
                return eff;
            }
        },
        33: {
            title: "Fusion Magnification",
            description: "Boost The Sun's effect base by 1.8x",
            
            cost() {
                return new Decimal(7);
            },

            effect() {
                let eff = new Decimal(1.8);
                return eff;
            }
        },
        34: {
            title: "Alien Civilizations",
            description: "Planets are cheaper and boost the Planet effect base by 2x",
            
            cost() {
                return new Decimal(7);
            },

            effect() {
                let eff = new Decimal(2);
                return eff;
            }
        },
    },

    /* Planet Ideas:
     - The Sun - Generates Helium, which is the base of all Planet boosts - X

     - Mercury - Boost Cliffs Zone - X
     - Venus - Boost Jungle Zone - X
     - Mars - Boost Factories & Mr. Sheep's Castle Zones - X
     - Jupiter - Boost Cloud City Zone - X
     - Saturn - Boost Farms Zone - X
     - Uranus - Boost MSPaintium Shrine Zone - X
     - Neptune - Boost Tropical Island Zone - X
     - Pluto - Boost North Pole Zone - X
    */

    clickables: {
        11: {
            title: "Mercury",
            display() {
                let x = tmp.p.clickables[this.id];
                
                return "Boosts the \"Cliffs\" Zone by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x " + (x.effect.gte(x.cap) ? "(softcapped)" : "") + "<br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            cap() {
                return new Decimal(1e41);
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base = player.p.helium.sqrt().add(1);
                let mult = new Decimal(1);
                let pow = new Decimal(1);

                let cap = tmp.p.clickables[this.id].cap;

                if (hasUpgrade("p", 12)) pow = pow.times(upgradeEffect("p", 12));

                let eff = base.times(mult).pow(pow);

                eff = softcap(eff, cap, 0.3);

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(1);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[11].canClick ? "#34eb6b" : (!player.p.planetsBought[11] ? "#c4afaf" : "#adadad");
                },
                'height': '130px',
                'width': '130px',
            },
        },
        21: {
            title: "Venus",
            display() {
                return "Boosts the \"Jungle\" Zone by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x <br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base = player.p.helium.add(1);
                let mult = new Decimal(1);
                let pow = new Decimal(5);

                if (hasUpgrade("p", 12)) pow = pow.times(upgradeEffect("p", 12));

                let eff = base.pow(pow).times(mult);

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(2);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[21].canClick ? "#34eb6b" : (!player.p.planetsBought[21] ? "#c4afaf" : "#cc801d");
                },
                'height': '160px',
                'width': '160px',
            },
        },
        // Placeholder to make Earth stay in the center
        31: {
            style: {
                "background-color"() {
                    return "inherit";
                },
                'height': '120px',
                'width': '120px',
                'border': 'transparent',
            },
        },
        32: {
            title: "Earth",
            display() {
                return "Current Peanut Production: " + format(getPointGen()) + "/sec";
            },
            canClick() {
                return false;
            },
            onClick() {
                
            },
            style: {
                "background-color"() {
                    return "#263fd1";
                },
                'height': '160px',
                'width': '160px',
            },
        },
        33: {
            title: "Moon",
            display() {
                return "Current amount of Spaceships: " + formatWhole(player.n.buyables[11].add(tmp.n.buyables[11].freeLevels));
            },
            canClick() {
                return false;
            },
            onClick() {
                
            },
            style: {
                "background-color"() {
                    return "#d4d4d4";
                },
                'height': '120px',
                'width': '120px',
            },
        },
        41: {
            title: "Mars",
            display() {
                return "Boosts the \"Factories\" and \"Mr. Sheep's Castle\" Zones by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x <br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base = player.p.helium.root(4).add(1);
                let mult = new Decimal(1);

                let eff = base.times(mult);

                if (hasUpgrade("p", 21)) eff = eff.pow(upgradeEffect("p", 21));

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(3);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[41].canClick ? "#34eb6b" : (!player.p.planetsBought[41] ? "#c4afaf" : "#e66d45");
                },
                'height': '140px',
                'width': '140px',
            },
        },
        51: {
            title: "Jupiter",
            display() {
                return "Boosts the \"Cloud City\" Zone by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x <br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base = player.p.helium.add(1).log10().add(1).log10().add(1).root(7);
                let mult = new Decimal(1);

                let eff = base.times(mult);

                if (hasUpgrade("p", 22)) eff = eff.times(upgradeEffect("p", 22));

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(4);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[51].canClick ? "#34eb6b" : (!player.p.planetsBought[51] ? "#c4afaf" : "#c79d61");
                },
                'height': '220px',
                'width': '220px',
            },
        },
        61: {
            title: "Saturn",
            display() {
                return "Boosts the \"Farms\" Zone by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x <br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base;
                let mult = new Decimal(1);

                if (hasUpgrade("p", 23)) {
                    base = player.p.helium.add(1).root(3);
                } else {
                    base = player.p.helium.add(1).log(10).add(1);
                }

                let eff = base.times(mult);

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(5);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[61].canClick ? "#34eb6b" : (!player.p.planetsBought[61] ? "#c4afaf" : "#c2bf7a");
                },
                'height': '200px',
                'width': '200px',
            },
        },
        71: {
            title: "Uranus",
            display() {
                return "Boosts the \"MSPaintium Shrine\" Zone by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x <br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base = player.p.helium.add(1).log10().add(1).log10().add(1).root(3);
                let mult = new Decimal(1);

                if (hasUpgrade("p", 31)) base = base.times(upgradeEffect("p", 31));

                let eff = base.times(mult);

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(6);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[71].canClick ? "#34eb6b" : (!player.p.planetsBought[71] ? "#c4afaf" : "#b6c2d1");
                },
                'height': '180px',
                'width': '180px',
            },
        },
        81: {
            title: "Neptune",
            display() {
                return "Boosts the \"Tropical Island\" Zone by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x <br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base = player.p.helium.add(1).log10().add(1).log10().add(1).root(6);
                let mult = new Decimal(1);

                if (hasUpgrade("p", 32)) base = base.times(upgradeEffect("p", 32));

                let eff = base.times(mult);

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(7);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[81].canClick ? "#34eb6b" : (!player.p.planetsBought[81] ? "#c4afaf" : "#3f54ba");
                },
                'height': '180px',
                'width': '180px',
            },
        },
        91: {
            title: "Pluto",
            display() {
                return "Boosts the \"North Pole\" Zone base by the amount of Helium <br>" +
                "Currently: " + format(tmp.p.clickables[this.id].effect) + "x <br> <br>" +
                "Cost: " + format(tmp.p.clickables[this.id].cost) + " planets";
            },
            effect() {
                if (!player.p.planetsBought[this.id]) {
                    return new Decimal(1);
                }

                let base = player.p.helium.add(1).root(2);
                let mult = new Decimal(1);

                let eff = base.times(mult);

                return eff;
            },
            canClick() {
                return player.p.points.gte(tmp.p.clickables[this.id].cost) && !player.p.planetsBought[this.id];
            },
            onClick() {
                player.p.planetsBought[this.id] = true;
                player.p.points = player.p.points.sub(tmp.p.clickables[this.id].cost);
            },
            cost() {
                return new Decimal(8);
            },
            style: {
                "background-color"() {
                    return tmp.p.clickables[91].canClick ? "#34eb6b" : (!player.p.planetsBought[91] ? "#c4afaf" : "#bfa77c");
                },
                'height': '120px',
                'width': '120px',
            },
        },
    },

    buyables: {
        11: {
            title: "The Sun",
            cost(x = player.ab.buyables[this.id]) {
                let base = new Decimal("1e6300");
                let pow = x.times(0.08).add(1);

                if (x.gte(32)) pow = pow.pow(x.sub(30).times(0.02).add(1));

                let cost = base.pow(pow);

                if (x.eq(0)) cost = new Decimal("1e6000");

                return cost;
            },
            freeLevels() {
                let levels = new Decimal(0);
                return levels;
            },
            effect(x = player.p.buyables[this.id]) {
                if (!x.plus(tmp.p.buyables[this.id].freeLevels).gt(0)) {
                    return new Decimal(0);
                }

                let base = new Decimal(15);
                let pow = x.pow(0.8);

                if (hasUpgrade("p", 13)) pow = pow.times(upgradeEffect("p", 13));
                if (hasUpgrade("ab", 43)) base = base.add(upgradeEffect("ab", 43));
                if (hasUpgrade("p", 33)) base = base.times(upgradeEffect("p", 33));

                let eff = base.pow(pow);

                eff = eff.times(tmp.ab.timeSpeed);

                return eff;
            },
            display() {
                let data = tmp.p.buyables[this.id];
                return "Cost: " + formatWhole(data.cost) + " peanuts" + "\n\
                    Level: " + formatWhole(player.p.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Generates " + format(data.effect) + " helium/second"
            },
            canAfford() {
                return player.points.gte(tmp.p.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.p.buyables[this.id].cost

                if (!false) {
                    player.points = player.points.sub(cost);
                }

                player.p.buyables[this.id] = player.p.buyables[this.id].add(1)
            },
            style: {
                'height': '300px',
                'width': '300px',
                'background-color': '#e1ff1f',
            },
        },
    },
})

addLayer("ab", {
    name: "Abominatium", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "AB", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        resets: new Decimal(0),
        davzatium: new Decimal(2),
        auto: false,
        autoAbominations: false,
    }},
    color: "#00661a",
    requires() {
        return new Decimal(5e22)
    }, // Can be a function that takes requirement increases into account
    resource: "abominatium", // Name of prestige currency
    baseResource: "bot parts", // Name of resource prestige is based on
    roundUpCost: true,
    branches: ["b", "s"],
    baseAmount() {return player.b.points}, // Get the current amount of baseResource
    type() {
        return "normal"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1);

        mult = mult.times(tmp.ab.buyables[12].effect);
        if (hasUpgrade("ab", 32)) mult = mult.times(upgradeEffect("ab", 32))
        if (hasUpgrade("p", 24)) mult = mult.times(upgradeEffect("p", 24).pow(25))

        return mult;
    },

    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(0.04);

        return exp;
    },

    passiveGeneration() {
        return (hasMilestone("ab", 5)) ? new Decimal(0.01).times(tmp.ab.timeSpeed) : 0
    },

    row: 4, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "a", description: "A: Perform an Abominatium reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    effectPow() {
        let base = new Decimal(1);

        return base;
    },
    effect() {
        let pow = tmp.ab.effectPow;
        let base = player.ab.points.add(1).log(10).add(1).log(10).add(1);

        if (hasUpgrade("ab", 41)) base = base.add(upgradeEffect("ab", 41));
        if (hasUpgrade("ab", 51)) base = base.add(upgradeEffect("ab", 51));

        base = base.times(tmp.ab.buyables[42].effect);
        base = base.times(tmp.s.buyables[32].effect);

        let eff = Decimal.pow(base, pow);

        if (hasUpgrade("ab", 11)) eff = eff.times(upgradeEffect("ab", 11));

        if (!player.ab.points.gt(0)) eff = new Decimal(1);

        return eff;
    },

    effectDescription() {
        let desc = "which are boosting Bot effect bases by " + format(tmp.ab.effect) + "x";
        return desc;
    },

    timeSpeed() {
        let speed = new Decimal(1);

        speed = speed.times(tmp.ab.buyables[51].effect);

        return speed;
    },

    // ======================================================

    freeAbominations() {
        let x = new Decimal(0);

        if (hasUpgrade("ab", 53)) x = x.add(upgradeEffect("ab", 53));

        return x;
    },

    abominationBaseCosts() {
        return {
            11: new Decimal(2),
            12: new Decimal(5),
            13: new Decimal(200),
            21: new Decimal(25),
            22: new Decimal(25),
            31: new Decimal(100),
            32: new Decimal(150),
            41: new Decimal(250),
            42: new Decimal(350),
            51: new Decimal(750),
            52: new Decimal(1000),
            61: new Decimal(3000),
            62: new Decimal(8000),
            63: new Decimal(15000),
        }
    },

    abominationBaseEffects() {
        return {
            11: new Decimal(1.5),
            12: new Decimal(2.2),
            13: new Decimal(0.2),
            21: new Decimal(2.5),
            22: new Decimal(3),
            31: new Decimal(0.1),
            32: new Decimal(2.5),
            41: new Decimal(1e15),
            42: new Decimal(0.05),
            51: new Decimal(0.35),
            52: new Decimal(1),
            61: new Decimal(0.28),
            62: new Decimal(0.14),
            63: new Decimal(0.23),
        }
    },

    divAbominationCosts() {
        let div = new Decimal(1);

        if (hasUpgrade("ab", 31)) div = div.times(upgradeEffect("ab", 31));

        return div;
    },

    abominationBaseMult() {
        let mult = new Decimal(1);
        return mult;
    },

    abominationsCostNothing() {
        return hasMilestone("ab", 4);
    },

    davzatiumGain() {
        let eff = new Decimal(0);

        eff = eff.add(tmp.ab.buyables[11].effect);

        return eff;
    },

    update(diff) {
        if (hasUpgrade("ab", 14)) player.ab.davzatium = player.ab.davzatium.plus(tmp.ab.davzatiumGain.times(diff));

        if (player.ab.autoAbominations && hasMilestone("ab", 4)) {
            for (let i in tmp.ab.buyables) {
                if (tmp.ab.buyables[i].canAfford && tmp.ab.buyables[i].unlocked) tmp.ab.buyables[i].buy();
            }
        }
    },

    // ======================================================

    doReset(resettingLayer) {
        let keep = [];
        keep.push("auto");
        keep.push("autoAbominations");

        if (resettingLayer == "ab") player.ab.resets = player.ab.resets.add(1);

        if (layers[resettingLayer].row > this.row)
            layerDataReset("ab", keep)
    },

    tabFormat: {
        "Milestones": {
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.b.points) + " bot parts "
            }
            , {}], "blank", ["display-text", function() {
                return 'Your best Abominatium is ' + formatWhole(player.ab.best) + '<br>You have made a total of ' + formatWhole(player.ab.total) + " Abominatium"
            }
            , {}], "blank", "milestones",],
        },
        "Upgrades": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'Your best Abominatium is ' + formatWhole(player.ab.best) + '<br>You have made a total of ' + formatWhole(player.ab.total) + " Abominatium"
            }
            , {}], "blank", ["upgrades", [1, 2, 3, 4, 5, 6, 7, 8, 9]],],
        },
        "Abominations": {
            unlocked() {
                return true
            },
            content: [
                "main-display", "blank", ["display-text", function() {
                    return "You have " + format(player.ab.davzatium) + " davzatium and you're generating " + format(tmp.ab.davzatiumGain) + " davzatium per second";
                }, {}], "blank", ["buyables", [1]], "blank", ["upgrades", [11]], ["buyables", [2]], "blank", ["upgrades", [12]],
                ["buyables", [3]], "blank", ["upgrades", [13]], ["buyables", [4]], "blank", ["upgrades", [14]],
                ["buyables", [5]], "blank", ["buyables", [6]], "blank",
            ],
        },
    },

    milestones: {
        0: {
            requirementDescription: "1 Total Abominatium",
            done() {
                return player.ab.total.gte(1)
            },
            effectDescription()  {
                return "Keep +1 Bot Part milestone per Abominatium reset <br> Currently: " + player.ab.resets.min(3).add(2);
            },
        },
        1: {
            requirementDescription: "2 Total Abominatium",
            done() {
                return player.ab.total.gte(2)
            },
            effectDescription: "Unlock Abominatium upgrades and Bots cost nothing",
        },
        2: {
            requirementDescription: "5 Total Abominatium",
            done() {
                return player.ab.total.gte(5)
            },
            effectDescription: "Keep Spell milestones on all resets",
        },
        3: {
            requirementDescription: "100 Abominatium",
            done() {
                return player.ab.points.gte(100)
            },
            effectDescription: "Keep Bot Part upgrades and challenges on all resets",
        },
        4: {
            requirementDescription: "5000 Abominatium",
            done() {
                return player.ab.points.gte(5000)
            },
            toggles: [["ab", "autoAbominations"]],
            effectDescription: "Autobuy Abominations and abominations cost nothing",
        },
        5: {
            requirementDescription: "1 000 000 Abominatium",
            done() {
                return player.ab.points.gte(1000000)
            },
            effectDescription() {
                return `Gain ${format(tmp.ab.timeSpeed.times(1))}% of Abominatium gain every second`;
            },
            // And bot parts, mspaintium & mspaintium dust reset nothing
        },
    },

    upgrades: {
        11: {
            title: "First Tests",
            description: "Begin experimenting with Abominatium to find out what it could be used for. Boosts Abominatium effect by 20%",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                let eff = new Decimal(1.2);
                return eff;
            },
        },
        12: {
            title: "Link to MSPaintium",
            description: "Boost Refined and Unstable MSPaintium gain by the best amount of Abominatium",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                let eff = player.ab.best.sqrt().add(1);
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        13: {
            title: "Abnormal Spells",
            description: "Boost all Spell effect bases by 20%",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                let eff = new Decimal(1.2);
                return eff;
            },
        },
        14: {
            title: "Chocolate Potato?",
            description: "Unlock the first Abomination!",
            
            cost() {
                return new Decimal(1);
            },
        },
        15: {
            title: "Abomination Inflation",
            description: "Boosts the Budget Abominations upgrade by the amount of Helium",
            
            cost() {
                return new Decimal(10000);
            },
            effect() {
                let eff = player.p.helium.add(1).log10().max(1);

                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        21: {
            title: "Link to Davzatium",
            description: "Triple Davzatium gain",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                return new Decimal(3);
            },
        },
        22: {
            title: "More Nations!",
            description: "Divide the Nation price by 1.13",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                return new Decimal(1.13);
            },
        },
        23: {
            title: "Link to Bots",
            description: "Boosts Bot Part Gain by the best amount of Abominatium",
            
            cost() {
                return new Decimal(1);
            },

            effect() {
                let eff = player.ab.best.pow(0.9).add(1);
                return eff;
            },
            effectDisplay() { return + format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        24: {
            title: "Beans!",
            description: "Unlock the third Abomination",
            
            cost() {
                return new Decimal(1);
            },
        },
        25: {
            title: "Filled With Knowledge",
            description: "Unlock the eleventh Abomination",
            
            cost() {
                return new Decimal(30000);
            },
        },

        31: {
            title: "Budget Abominations",
            description: "Abomination costs are decreased based on the amount of Davzatium",
            
            cost() {
                return new Decimal(2);
            },
            effect() {
                let eff = player.ab.davzatium.add(1).log(1.5).add(1);

                if (hasUpgrade("ab", 33)) eff = eff.times(upgradeEffect("ab", 33));
                if (hasUpgrade("ab", 15)) eff = eff.times(upgradeEffect("ab", 15));

                return eff;
            },
            effectDisplay() { return "/" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
        32: {
            title: "Mining Improvements",
            description: "Double Abominatium gain",
            
            cost() {
                return new Decimal(3);
            },

            effect() {
                let eff = new Decimal(2).root(0.04);
                return eff;
            },
        },
        33: {
            title: "Abomination Sales",
            description: "Boosts the Budget Abominations upgrade based on the amount of Abominatium",
            
            cost() {
                return new Decimal(8);
            },

            effect() {
                let eff = player.ab.points.add(1).log(1.5).add(1);
                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },
        34: {
            title: "Blob of Honey?",
            description: "Unlock the fifth Abomination",
            
            cost() {
                return new Decimal(10);
            },
        },
        35: {
            title: "Unstable Refinements",
            description: "Boosts Refined and Unstable MSPaintium gain by the best amount of Abominatium",
            
            cost() {
                return new Decimal(120000);
            },

            effect() {
                let eff = player.ab.best.add(1).log(1.5).add(1).times(player.ab.best.min(1000));

                return eff;
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect
        },

        41: {
            title: "Self Boost",
            description: "Boosts the Abominatium effect base by the current amount of Abominatium",
            
            cost() {
                return new Decimal(15);
            },

            effect() {
                let eff = (player.ab.points.gte(20)) ? player.ab.points.sub(10).log10().cbrt().sub(0.7) : new Decimal(0.3);

                return eff;
            },
            effectDisplay() { return "+" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
        42: {
            title: "Say CHEESE",
            description: "Unlock the sixth Abomination",
            
            cost() {
                return new Decimal(25);
            },
        },
        43: {
            title: "Link to The Sun",
            description: "Boosts The Sun's effect base by the best amount of Abominatium",
            
            cost() {
                return new Decimal(50);
            },

            effect() {
                let eff = player.ab.best.add(1).root(4);

                return eff;
            },
            effectDisplay() { return "+" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
        44: {
            title: "We Need More",
            description: "Unlock the seventh Abomination and unlock more Davzatium upgrades",
            
            cost() {
                return new Decimal(60);
            },
        },
        45: {
            title: "Pea-Nut?",
            description: "Unlock the twelfth Abomination",
            
            cost() {
                return new Decimal(250000);
            },
        },

        51: {
            title: "Abominatium Automation",
            description: "Boosts the Abominatium effect base by the current amount of Bot Parts",
            
            cost() {
                return new Decimal(150);
            },
            effect() {
                let eff = player.b.points.add(1).log10().add(1).log10().div(4);

                return eff;
            },
            effectDisplay() { return "+" + format(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
        52: {
            title: "A Friend of the King",
            description: "Unlock the ninth Abomination",
            
            cost() {
                return new Decimal(250);
            },
        },
        53: {
            title: "Abomination Training",
            description: "Gives 1 free level to every Abomination for every upgrade in this row",
            
            cost() {
                return new Decimal(3000);
            },
            effect() {
                let eff = new Decimal(0);

                if (hasUpgrade("ab", 51)) eff = eff.add(1);
                if (hasUpgrade("ab", 52)) eff = eff.add(1);
                if (hasUpgrade("ab", 53)) eff = eff.add(1);
                if (hasUpgrade("ab", 54)) eff = eff.add(1);

                return eff;
            },
            effectDisplay() { return "+" + formatWhole(upgradeEffect(this.layer, this.id)) }, // Add formatting to the effect
        },
        54: {
            title: "Wait, Is This Time Travel?",
            description: "Unlock the tenth Abomination",
            
            cost() {
                return new Decimal(6500);
            },
        },
        55: {
            title: "Link to Beyond",
            description: "Unlock the last two Abominations",
            
            cost() {
                return new Decimal(1000000);
            },
        },

        // ====================================

        111: {
            title: "Strawberry Fluff?",
            description: "Unlock the second Abomination",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(50);
            },
        },
        112: {
            title: "Tiny Armor",
            description: "Shnilli gets some armor, boosting his effect base by 1.5x",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(150);
            },

            effect() {
                return new Decimal(1.5);
            },
        },
        113: {
            title: "Obtain Divinity",
            description: "Shnilli transforms into Divine Shnilli, boosting his effect base by 1.5x",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(2e10);
            },

            effect() {
                return new Decimal(1.5);
            },
        },
        114: {
            title: "Day of Reckoning",
            description: "Littina grows dark blades, tripling her effect base",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(1e12);
            },

            effect() {
                return new Decimal(3);
            },
        },

        121: {
            title: "Inner Bean",
            description: "The Bean harnesses the power of beans, doubling his effect exponent",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(200000);
            },
        },
        122: {
            title: "Living Factory?",
            description: "Unlock the fourth Abomination",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(400000);
            },
        },
        123: {
            title: "Overclocked",
            description: "The Machine is overclocked, doubling its effect exponent",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(600000);
            },
        },

        131: {
            title: "HoneyBot",
            description: "The Honey builds a stickbot, which helps boost its effect exponent by 1.3x",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(2000000);
            },
            effect() {
                return new Decimal(1.3);
            },
        },
        132: {
            title: "King of Peanuts",
            description: "Unlock the eight Abomination",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(1500000);
            },
        },

        141: {
            title: "Advanced Robotics",
            description: "GHP transforms into Giant Robotic Peanut, boosting his effect exponent by 1.8x",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(3000000);
            },
            effect() {
                return new Decimal(1.8);
            },
        },
        142: {
            title: "A Twisted Personality",
            description: "The Pickle becomes twisted, doubling his effect base",

            currencyDisplayName: "davzatium",
            currencyInternalName: "davzatium",
            currencyLayer: "ab",
            
            cost() {
                return new Decimal(4000000);
            },
            effect() {
                return new Decimal(2);
            },
        },
    },

    /* Abominations (Total: 14):
    
     - Shnilli (Davz) - Boost Davzatium gain - Shnilli with Armor (X) & Divine Shnilli (X) - 1
     - Littina (Davz) - Boost Abominatium gain - Reckoning-Bringer Littina (X) - 2
     - Little Man (Davz) - Boost the bases of the above two Abominations - 7
    
     - The Bean (Starry) - Boost Farms - Inner Bean (X) - 3
     - The Machine (Boss) - Boost Sapling Generators - Overclocked (X) - 4

     - Honey (Goodnerwus) - Boost Bots - HoneyBot (X) - 5
     - The Cheese (Tribot) - Boost Lunar Colonies - Lunar/Moon Cheese? - 6
    
     - GHP (Davz) - Boost Peanuts - GRP (X) - 8
     - The Pickle (Davz) - Boost Abominatium effect - Twisted Pickle (X) - 9
    
     - The Clock (Mira) - Boost Time Speed (Everything goes faster) - 10
     - The Spreadsheet (Mira) - Add extra levels to the previous Abominations - 11

     - The Pea (Davz) - Boost Nations - 12
     - The Macrophage (UMM) - Boost Spells
     - The Planet (Mira) - Boost Planets

    */

    buyables: {
        rows: 4,
        cols: 3,
        11: {
            title() {
                if (hasUpgrade("ab", 113)) {
                    return "Divine Shnilli";
                }

                if (hasUpgrade("ab", 112)) {
                    return "Shnilli with Armor";
                }

                return "Shnilli";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(3).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;
                
                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(0);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);

                base = base.times(tmp.ab.buyables[13].effect.first);

                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.5);

                if (hasUpgrade("ab", 112)) base = base.times(upgradeEffect("ab", 112));
                if (hasUpgrade("ab", 113)) base = base.times(upgradeEffect("ab", 113));

                let eff = Decimal.pow(base, pow).max(1);

                if (hasUpgrade("ab", 21)) eff = eff.times(upgradeEffect("ab", 21));

                eff = eff.times(tmp.ab.timeSpeed);

                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Generates " + format(data.effect) + " Davzatium per second" +
                   "<br> <br> (Abomination by Davz)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        12: {
            title() {
                if (hasUpgrade("ab", 114)) {
                    return "Reckoning-Bringer Littina";
                }

                return "Littina";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(3).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);

                if (hasUpgrade("ab", 114)) base = base.times(upgradeEffect("ab", 114));

                base = base.times(tmp.ab.buyables[13].effect.second);
                
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.5);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Divides Abominatium cost by /" + format(data.effect) + " (Doesn't work on first Abominatium)" +
                   "<br> <br> (Abomination by Davz)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        13: {
            title: "Little Man",
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(3).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return {first: new Decimal(1), second: new Decimal(1)};
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow1 = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.2);
                let pow2 = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.9);

                let eff = {};

                eff.first = Decimal.pow(base.add(1), pow1).max(1);
                eff.second = Decimal.pow(base.add(1), pow2).max(1);
                
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts Shnilli's effect base by " + format(data.effect.first) + "x and Littina's effect base by " + format(data.effect.second) + "x" +
                   "<br> <br> (Abomination by Davz)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },

        21: {
            title: "The Bean",
            title() {
                if (hasUpgrade("ab", 121)) {
                    return "The Bean<br>(Inner Bean)";
                }

                return "The Bean";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.7);

                if (hasUpgrade("ab", 121)) pow = pow.times(2);

                if (hasUpgrade("f", 33)) base = base.times(2.7);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Farm base by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Starry)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        22: {
            title: "The Machine",
            title() {
                if (hasUpgrade("ab", 123)) {
                    return "The Machine (Overclocked)";
                }

                return "The Machine";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(3.5).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.7);

                if (hasUpgrade("ab", 123)) pow = pow.times(2);

                if (hasUpgrade("sg", 33)) base = base.times(4);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Sapling Generator base by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Boss)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },

        31: {
            title() {
                if (hasUpgrade("ab", 131)) {
                    return "HoneyBot";
                }

                return "Honey";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.7);

                if (hasUpgrade("ab", 131)) pow = pow.times(upgradeEffect("ab", 131));

                let eff = Decimal.pow(base.add(1), pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Bot effect bases by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Goodnerwus)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        32: {
            title: "The Cheese",
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.7);

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Lunar Colony effect base by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Tribot)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },

        41: {
            title() {
                if (hasUpgrade("ab", 141)) {
                    return "Giant Robotic Peanut";
                }

                return "Giant Humanoid Peanut";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(1.5);

                if (hasUpgrade("ab", 141)) pow = pow.times(upgradeEffect("ab", 141));

                let eff = Decimal.pow(base, pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts peanut production by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Davz)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        42: {
            title() {
                if (hasUpgrade("ab", 142)) {
                    return "The Pickle (Twisted)";
                }

                return "The Pickle";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.6);

                if (hasUpgrade("ab", 142)) base = base.times(upgradeEffect("ab", 142));

                let eff = Decimal.pow(base.add(1), pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Abominatium effect base by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Davz)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },

        51: {
            title() {
                return "The Clock";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                levels = levels.add(tmp.ab.buyables[52].effect);

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.6);

                let eff = Decimal.pow(base.add(1), pow).max(1);

                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts time speed by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Mira The Cat)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        52: {
            title() {
                return "The Spreadsheet";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;
                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(0);
                }

                let base = tmp.ab.abominationBaseEffects[this.id];
                let mult = x.plus(tmp.ab.buyables[this.id].freeLevels);

                let eff = base.times(mult);

                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Adds +" + formatWhole(data.effect) + " extra levels to the previous Abominations" +
                   "<br> <br> (Abomination by Mira The Cat)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },

        61: {
            title() {
                return "The Pea";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.7);

                let eff = Decimal.pow(base.add(1), pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Nation effect base by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Davz)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        62: {
            title() {
                return "The Macrophage";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.6);

                let eff = Decimal.pow(base.add(1), pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Spell effect bases by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by UMM)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
        63: {
            title() {
                return "The Planet";
            },
            cost(x = player.ab.buyables[this.id]) {
                let base = tmp.ab.abominationBaseCosts[this.id];
                
                let cost = base.pow(x.div(4).add(1)).div(tmp.ab.divAbominationCosts).floor();

                return cost;
            },
            freeLevels() {
                let levels = tmp.ab.freeAbominations;

                return levels;
            },
            effect(x = player.ab.buyables[this.id]) {
                if (!x.plus(tmp.ab.buyables[this.id].freeLevels).gt(0) || !tmp.ab.buyables[this.id].unlocked) {
                    return new Decimal(1);
                }

                let base = tmp.ab.abominationBaseEffects[this.id].times(tmp.ab.abominationBaseMult);
                let pow = x.plus(tmp.ab.buyables[this.id].freeLevels).pow(0.6);

                let eff = Decimal.pow(base.add(1), pow).max(1);
                return eff;
            },
            display() {
                let data = tmp.ab.buyables[this.id]
                return "Cost: " + formatWhole(data.cost) + " Davzatium" + "\n\
                    Level: " + formatWhole(player.ab.buyables[this.id]) + (data.freeLevels.gt(0) ? (" + " + formatWhole(data.freeLevels)) : "") + "\n\
                   " + "Boosts the Planet effect base by " + format(data.effect) + "x" +
                   "<br> <br> (Abomination by Mira The Cat)"
            },
            canAfford() {
                return player.ab.davzatium.gte(tmp.ab.buyables[this.id].cost);
            },
            buy() {
                cost = tmp.ab.buyables[this.id].cost

                if (!tmp.ab.abominationsCostNothing) {
                    player.ab.davzatium = player.ab.davzatium.sub(cost)
                }

                player.ab.buyables[this.id] = player.ab.buyables[this.id].add(1)
            },
            style: {
                'height': '100px'
            },
        },
    },
})

addLayer("o", {
    name: "Ocean", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "O", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
        total: new Decimal(0),
        best: new Decimal(0),
        unspent: new Decimal(0),
        auto: false,
    }},
    color: "#3b38ff",
    requires() {
        return (player.o.points.eq(0)) ? new Decimal("1e9000") : new Decimal("1e9250");
    }, // Can be a function that takes requirement increases into account
    roundUpCost: true,
    resource: "knowledge of the ocean", // Name of prestige currency
    baseResource: "peanuts", // Name of resource prestige is based on
    branches: ["n", "l", "s", "b"],
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type() {
        return "static"
    },
    exponent: 1, // Prestige currency exponent
    gainMult() {
        let mult = new Decimal(1)
        return mult;
    },

    automate() {},
    resetsNothing() {
        return false
    },

    autoPrestige() {
        return false;
    },

    base() {
        return new Decimal("1e900");
    },
    canBuyMax() {
        return false;
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(0.5);

        if (player.o.points.gte(10)) exp = exp.div(player.o.points.sub(9).times(0.05).add(1));
        if (player.o.points.gte(14)) exp = exp.div(player.o.points.sub(12).times(0.05).add(1));
        if (player.o.points.gte(20)) exp = exp.div(player.o.points.sub(18).times(0.05).add(1));
        if (player.o.points.gte(24)) exp = exp.div(player.o.points.sub(20).times(0.08).add(1));

        return exp;
    },
    row: 4, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "o", description: "O: Perform an Ocean reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown() {
        return true
    },
    effect() {
        if (!player.o.points.gt(0)) {
            return new Decimal(1);
        }
        
        let base = new Decimal("1e20");

        base = base.pow(tmp.n.clickables[52].effect);

        let eff = base.pow(player.o.points.sqrt()).times("1e30");

        return eff;
    },
    effectDescription() {
        return "which is boosting Peanut Production by " + format(tmp.o.effect) + "x"
    },

    doReset(resettingLayer) {
        let keep = [];
        keep.push("auto");

        if (resettingLayer == "o") {
            player.o.unspent = player.o.unspent.add(1);
        }

        if (layers[resettingLayer].row > this.row)
            layerDataReset("o", keep)
    },

    tabFormat: {
        "Milestones": {
            unlocked() {
                return true
            },
            content: ["main-display", "prestige-button", ["display-text", function() {
                return "You have " + formatWhole(player.points) + " peanuts "
            }
            , {}], "blank", ["display-text", function() {
                return 'You have obtained a total of ' + formatWhole(player.o.total) + ' Knowledge of the Ocean <br> ' + formatWhole(player.o.unspent) + " of them have not yet been spent"
            }
            , {}], "blank", "milestones",],
        },
        "Ocean Exploration": {
            unlocked() {
                return true
            },
            content: ["main-display", ["display-text", function() {
                return 'You have obtained a total of ' + formatWhole(player.o.total) + ' Knowledge of the Ocean <br> ' + formatWhole(player.o.unspent) + " of them have not yet been spent"
            }
            , {}], "blank", ["infobox", "lore"], "blank", "upgrades",],
        },
    },

    infoboxes: {
        "lore": {
            title: "Ocean Exploration",
            body: "Ocean Exploration is the main feature of the Ocean layer. <br> <br>" +
            "Here, you use your unspent Knowledge of the Ocean to buy different upgrades that will unlock " +
            "more stuff in the earlier layers. <br> <br>" +
            "You can choose the order of upgrades bought yourself, but you have to buy all upgrades in one row " +
            "before you can buy any in the next row.",
        }
    },

    milestones: {
        0: {
            requirementDescription: "1 Knowledge of the Ocean",
            done() {
                return player.o.best.gte(1)
            },
            effectDescription: "Unlock Ocean Exploration",
        },
        1: {
            requirementDescription: "5 Knowledge of the Ocean",
            done() {
                return player.o.best.gte(5)
            },
            effectDescription: "Autobuy Lunar Colony buyables and Lunar Colony buyables cost nothing",
            toggles: [["l", "autoBuyables"]],
        },
        2: {
            requirementDescription: "10 Knowledge of the Ocean",
            done() {
                return player.o.best.gte(10)
            },
            effectDescription: "Unlock Row 4 in the Ocean",
        },
        3: {
            requirementDescription: "15 Knowledge of the Ocean",
            done() {
                return player.o.best.gte(15)
            },
            toggles: [["l", "auto"]],
            effectDescription: "Autobuy Lunar Colonies, Lunar Colonies reset nothing and keep Spaceships on all resets",
        },
    },

    /* Upgrade Ideas:

    - More upgrades for layers 1-3 - Done: C, F, SG
    - Ocean boosts MSPaintium Hardcap - X
    - More Zones - Asteroid Belt, Ocean Floor
    - More Spells - ???
    - Unlock more Lunar Colony buyables - Row 4?
    - More Bots - THE DESTROYER - THE DESTRUCTOR upgrade later? - X
    
    Row 2: e11 200 -> e12 850 -> e14 000

    */

    upgrades: {
        11: {
            title: "Back to the Beginning",
            description: "Unlock more Coin upgrades",
            cost: new Decimal(1),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            effect() {
                return 0.5;
            },
            style: { margin: "10px" },
        },

        21: {
            title: "Kelp Farms",
            description: "Unlock more Farm upgrades",
            cost: new Decimal(1),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 11);
            },

            effect() {
                return 0.5;
            },
            branches() {
                if (!hasUpgrade("o", 11)) return [[11, 2]];
                
                return [[11, 1]];
            },
            style: { margin: "10px" },
        },
        22: {
            title: "Seagrass Generators",
            description: "Unlock more Sapling Generator upgrades",
            cost: new Decimal(1),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 11);
            },

            effect() {
                return 0.5;
            },
            branches() {
                if (!hasUpgrade("o", 11)) return [[11, 2]];
                
                return [[11, 1]];
            },
            style: { margin: "10px" },
        },

        31: {
            title: "Sea Villages",
            description: "Unlock more Town upgrades",
            cost: new Decimal(1),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 21) && hasUpgrade("o", 22);
            },

            effect() {
                return 0.5;
            },
            branches() {
                if (!hasUpgrade("o", 21)) return [[21, 2]];
                
                return [[21, 1]];
            },
            style: { margin: "10px" },
        },
        32: {
            title: "Sea Mines",
            description: "Your Knowledge of the Ocean will also boost the MSPaintium Hardcap",
            cost: new Decimal(1),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 21) && hasUpgrade("o", 22) && hasUpgrade("o", 31) && hasUpgrade("o", 33);
            },

            effect() {
                return new Decimal(4).pow(player.o.points);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" }, // Add formatting to the effect

            branches() {
                let branches = [];

                branches.push((hasUpgrade("o", 21)) ? [21, 1] : [21, 2]);
                branches.push((hasUpgrade("o", 22)) ? [22, 1] : [22, 2]);
                branches.push((hasUpgrade("o", 31)) ? [31, 1] : [31, 2]);
                branches.push((hasUpgrade("o", 33)) ? [33, 1] : [33, 2]);
                
                return branches;
            },
            style: { margin: "10px" },
        },
        33: {
            title: "Watermills",
            description: "Unlock more Factory upgrades",
            cost: new Decimal(1),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 21) && hasUpgrade("o", 22);
            },

            effect() {
                return 0.5;
            },
            branches() {
                if (!hasUpgrade("o", 22)) return [[22, 2]];
                
                return [[22, 1]];
            },
            style: { margin: "10px" },
        },

        41: {
            title: "Research of the Ocean Floor",
            description: "Unlock more Zones",
            cost: new Decimal(2),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 31) && hasUpgrade("o", 32) && hasUpgrade("o", 33);
            },

            effect() {
                return 0.5;
            },
            branches() {
                let branches = [];

                branches.push((hasUpgrade("o", 31)) ? [31, 1] : [31, 2]);
                branches.push((hasUpgrade("o", 32)) ? [32, 1] : [32, 2]);
                
                return branches;
            },
            style: { margin: "10px" },
        },
        42: {
            title: "Lunar Terraforming",
            description: "Unlock more Lunar Colony buyables",
            cost: new Decimal(3),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 41) && hasUpgrade("o", 44);
            },

            effect() {
                return 0.5;
            },
            branches() {
                let branches = [];

                branches.push((hasUpgrade("o", 41)) ? [41, 1] : [41, 2]);
                branches.push((hasUpgrade("o", 32)) ? [32, 1] : [32, 2]);
                
                return branches;
            },
            style: { margin: "10px" },
        },
        43: {
            title: "Secret Ocean Recipes",
            description: "Unlock more Spells",
            cost: new Decimal(3),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 41) && hasUpgrade("o", 44);
            },

            effect() {
                return 0.5;
            },
            branches() {
                let branches = [];

                branches.push((hasUpgrade("o", 44)) ? [44, 1] : [44, 2]);
                branches.push((hasUpgrade("o", 32)) ? [32, 1] : [32, 2]);
                
                return branches;
            },
            style: { margin: "10px" },
        },
        44: {
            title: "Water-Proof Bot Models",
            description: "Unlock a new Bot",
            cost: new Decimal(2),

            currencyDisplayName: "unspent knowledge of the ocean",
            currencyInternalName: "unspent",
            currencyLayer: "o",

            canAfford() {
                return hasUpgrade("o", 31) && hasUpgrade("o", 32) && hasUpgrade("o", 33);
            },

            effect() {
                return 0.5;
            },
            branches() {
                let branches = [];

                branches.push((hasUpgrade("o", 33)) ? [33, 1] : [33, 2]);
                branches.push((hasUpgrade("o", 32)) ? [32, 1] : [32, 2]);
                
                return branches;
            },
            style: { margin: "10px" },
        },
    },

    buyables: {
        
    },
})

/* ===== ACHIEVEMENTS ===== */

addLayer("a", {
    startData() {
        return {
            unlocked: true,
        }
    },
    color: "#f5ec42",
    row: "side",
    layerShown() {
        return true
    },
    tooltip() {
        return ("Achievements")
    },
    achievements: {
        11: {
            name: "The Beginning of an Adventure",
            done() {
                return hasUpgrade("c", 11)
            },
            tooltip: "Begin farming Peanuts",
        },

        12: {
            name: "Handful of Peanuts",
            done() {
                return player.points.gte(25)
            },
            tooltip: "Reach 25 peanuts",
        },

        13: {
            name: "Handful of Coins",
            done() {
                return player.c.points.gte(20)
            },
            tooltip: "Reach 20 coins",
        },

        14: {
            name: "All the Upgrades!",
            done() {
                return upgradeCount("c") >= 6
            },
            tooltip: "Buy the 6 first Coin upgrades",
        },

       21: {
            name: "Next Row, please!",
            done() {
                return player.f.unlocked || player.sg.unlocked
            },
            tooltip: "Perform a Row 2 reset",
        },

        22: {
            name: "I choose Both!",
            done() {
                return player.f.unlocked && player.sg.unlocked
            },
            tooltip: "Unlock both Farms and Sapling Generators",
        },

        23: {
            name: "Billionaire",
            done() {
                return player.c.points.gte("1e9")
            },
            tooltip: "Reach 1e9 Coins <br> Reward: Boost both Row 2 effects by 9x if you have 7 or more of each!",
        },

        24: {
            name: "Peanut Monopoly",
            done() {
                return player.points.gte("2e25")
            },
            tooltip: "Reach 2e25 Peanuts <br> Reward: Unlock Row 3!",
        },

        31: {
            name: "Down we go!",
            done() {
                return player.t.unlocked || player.fa.unlocked
            },
            tooltip: "Perform a Row 3 reset",
        },

        32: {
            name: "Settlements",
            done() {
                return player.t.points.gte(4) && player.fa.points.gte(4)
            },
            tooltip: "Reach 4 Towns and Factories",
        },

        33: {
            name: "Peanut Empire",
            done() {
                return player.points.gte("1e150")
            },
            tooltip: "Reach 1e150 peanuts <br> Reward: Multiply the Coin gain exponent by 1.1!",
        },

        34: {
            name: "Who needs Row 2?",
            done() {
                return !player.f.points.gt(0) && !player.sg.points.gt(0) && player.c.points.gte("1e50") && hasMilestone("t", 1) && hasMilestone("fa", 1)
            },
            tooltip: "Reach 1e50 Coins without any Farms or Sapling Generators <br> Reward: Always keep Coin upgrades on all resets!",
        },

        41: {
            name: "A pretty strange Ore",
            done() {
                return player.ms.unlocked
            },
            tooltip: "Unlock MSPaintium",
        },

        42: {
            name: "Enhancements & Enrichments",
            done() {
                return player.ms.buyables[11].gte(1) && player.ms.buyables[12].gte(1)
            },
            tooltip: "Unlock both MSPaintium buyables <br> Reward: Sapling effect exponent is 1/2 instead of 1/3!",
        },

        43: {
            name: "Mass Enhancement",
            done() {
                return tmp.ms.buyables[11].effect.percent.gte(50)
            },
            tooltip: "Reach a Tool Enhancement percent of at least 50%",
        },

        44: {
            name: "MSPaintium Mine",
            done() {
                return player.ms.points.gte(30000)
            },
            tooltip: "Reach 30 000 MSPaintium <br> Reward: Unlock Row 4!",
        },

        51: {
            name: "Yet another Row",
            done() {
                return player.n.unlocked || player.b.unlocked;
            },
            tooltip: "Perform a Row 4 reset <br> Reward: Always keep Farm and Sapling Generator milestones on all resets!",
        },

        52: {
            name: "Automation",
            done() {
                return player.b.buyables[11].gt(0);
            },
            tooltip: "Buy your first Bot!",
        },

        53: {
            name: "I have a solution!",
            done() {
                return hasChallenge("b", 11);
            },
            tooltip: "Complete the first Bot Part Challenge",
        },

        54: {
            name: "Science!",
            done() {
                return hasUpgrade("n", 14);
            },
            tooltip: "Unlock Researchers!",
        },

        61: {
            name: "Maximum Efficiency",
            done() {
                return player.n.zoneTravels[11].gte(10);
            },
            tooltip: "Reach a Farm visit count of at least 10! Reward: Increase the Researching speed by 25%!",
        },

        62: {
            name: "Science Club",
            done() {
                return player.n.researchers.gte(4);
            },
            tooltip: "Have a total of 4 Researchers <br> Reward: Boost all Zone bases by the amount of Reseachers! ",
        },

        63: {
            name: "I Have Seen The World",
            done() {
                return player.n.upgradeLevels[44].gte(4);
            },
            tooltip: "Unlock the 8 first Zones <br> Reward: Unlock more Bot Part upgrades!",
        },

        64: {
            name: "Magic",
            done() {
                return player.s.unlocked;
            },
            tooltip: "Unlock Spells",
        },

        71: {
            name: "Infinite Possibilities",
            done() {
                return hasUpgrade("ms", 21) && hasUpgrade("ms", 23);
            },
            tooltip: "Unlock Refined and Unstable MSPaintium <br> Reward: Unlock more Bot Part upgrades!",
        },

        72: {
            name: "True Explorer",
            done() {
                return player.n.upgradeLevels[44].gte(6) && hasUpgrade("b", 52);
            },
            tooltip: "Unlock all 12 Zones",
        },

        73: {
            name: "Empowerment",
            done() {
                return hasUpgrade("ms", 24);
            },
            tooltip: "Buy the Astral Star upgrade <br> Reward: Unlock more Nation upgrades!",
        },

        74: {
            name: "Fly me to the Moon...",
            done() {
                return player.l.unlocked;
            },
            tooltip: "Unlock Lunar Colonies",
        },

        81: {
            name: "Millinillio- naire",
            done() {
                return player.c.points.gte("e3000");
            },
            tooltip: "Reach 1e3000 Coins",
        },

        82: {
            name: "Large-Scale Terraforming",
            done() {
                return player.l.buyables[11].gte(10);
            },
            tooltip: "Get a level of at least 10 on the first Lunar Colony buyable <br> Reward: Get a free Spaceship",
        },

        83: {
            name: "The Moon is a Peanut",
            done() {
                return hasUpgrade("l", 25);
            },
            tooltip: "Unlock all 6 Lunar Colony buyables <br> Reward: Lunar Colony buyables cost nothing",
        },

        84: {
            name: "Lunar Factories",
            done() {
                return player.l.buyables[23].gte(6);
            },
            tooltip: "Get a level of at least 6 on the sixth Lunar Colony buyable <br> Reward: Unlock Row 5!",
        },

        91: {
            name: "Far, far Down",
            done() {
                return player.p.unlocked || player.ab.unlocked;
            },
            tooltip: "Perform a Row 5 reset <br> Reward: Boost researching speed by 10x, and keep the two first Nation & Bot Part milestones on all resets!",
        },
        92: {
            name: "Abom-ination..?",
            done() {
                return player.ab.buyables[11].gte(1);
            },
            tooltip: "Buy your first Abomination!",
        },
        93: {
            name: "We must protecc",
            done() {
                return hasUpgrade("ab", 112);
            },
            tooltip: "Boost Shnilli with the \"Tiny Armor\" upgrade <br> Reward: Unlock more Abominatium upgrades!",
        },
        94: {
            name: "Actual Space Travel",
            done() {
                return hasMilestone("p", 1);
            },
            tooltip: "Unlock the Solar System",
        },

        101: {
            name: "Earth\'s Twin",
            done() {
                return player.p.planetsBought[21];
            },
            tooltip: "Buy Venus <br> Reward: Researching speed is boosted by 10x again, and unlock more Abominatium upgrades!",
        },
        102: {
            name: "Coffee Bean?",
            done() {
                return player.ab.buyables[21].gte(1);
            },
            tooltip: "Buy The Bean",
        },
        103: {
            name: "Automated Automation",
            done() {
                return player.ab.buyables[22].gte(1);
            },
            tooltip: "Buy The Machine <br> Reward: Unlock Planet upgrades!",
        },
        104: {
            name: "Into the Deep",
            done() {
                return player.o.unlocked;
            },
            tooltip: "Unlock the Ocean <br> Reward: Divide the Town requirement by 1.17",
        },

        111: {
            name: "The Red Planet",
            done() {
                return player.p.planetsBought[41];
            },
            tooltip: "Unlock Mars",
        },
        112: {
            name: "First Dive",
            done() {
                return hasUpgrade("f", 33) && hasUpgrade("sg", 33);
            },
            tooltip: "Fully upgrade both Row 2 layers in the Ocean <br> Reward: Unlock more Abominatium upgrades!",
        },

        113: {
            name: "Straight from the Hive!",
            done() {
                return player.ab.buyables[31].gte(1);
            },
            tooltip: "Buy Honey",
        },

        114: {
            name: "Popular Pizza Topping",
            done() {
                return player.ab.buyables[32].gte(1);
            },
            tooltip: "Buy The Cheese <br> Reward: Unlock Row 3 layers in the Ocean!",
        },

        121: {
            name: "Underwater Colonization",
            done() {
                return hasUpgrade("t", 34) && hasUpgrade("fa", 24);
            },
            tooltip: "Fully upgrade both the Town and the Factory layers in the Ocean <br> Reward: Nations are now slightly cheaper!",
        },

        122: {
            name: "Diving Trainee",
            done() {
                return hasUpgrade("o", 32);
            },
            tooltip: "Upgrade all Row 3 layers in the Ocean <br> Reward: Unlock more Abominatium upgrades!",
        },

        123: {
            name: "The True King of Peanuts",
            done() {
                return player.ab.buyables[41].gte(1);
            },
            tooltip: "Buy Giant Humanoid Peanut <br> Reward: Unlock more Planet upgrades!",
        },

        124: {
            name: "Intermediate Diver",
            done() {
                return hasUpgrade("o", 41) && hasUpgrade("o", 44);
            },
            tooltip: "Upgrade both the Nation and Bot Part layers in the Ocean <br> Reward: Towns are slightly cheaper and unlock more Abominatium upgrades!",
        },

        131: {
            name: "Twists and Turns",
            done() {
                return hasUpgrade("ab", 142);
            },
            tooltip: "Unlock The Twisted Pickle <br> Reward: Unlock two more Planet upgrades!",
        },

        132: {
            name: "Diving Expertise",
            done() {
                return hasUpgrade("o", 42) && hasUpgrade("o", 43);
            },
            tooltip: "Fully upgrade all Row 4 layers in the Ocean <br> Reward: Planets are now slightly cheaper!",
        },

        133: {
            name: "The Bright Ice Giant",
            done() {
                return player.p.planetsBought[71];
            },
            tooltip: "Unlock Uranus <br> Reward: Unlock more Abominatium upgrades!",
        },
        134: {
            name: "Abomination Omniscience",
            done() {
                return player.ab.buyables[52].gte(1);
            },
            tooltip: "Unlock The Spreadsheet <br> Reward: Divide the Nation cost base by 1.005!",
        },

        141: {
            name: "The Windy Blue Planet",
            done() {
                return player.p.planetsBought[81];
            },
            tooltip: "Unlock Neptune <br> Reward: Unlock more Abominatium upgrades and unlock a new Lunar Colony milestone!",
        },
        142: {
            name: "The True Ninth Planet",
            done() {
                return player.ab.buyables[63].gte(1);
            },
            tooltip: "Unlock The Planet <br> Reward: Unlock more Planet upgrades!",
        },
        143: {
            name: "A Dwarf among Planets",
            done() {
                return player.p.planetsBought[91];
            },
            tooltip: "Unlock Pluto",
        },
        144: {
            name: "Expert of The Ocean",
            done() {
                return player.o.points.gte(25);
            },
            tooltip: "Reach 25 Knowledge of the Ocean",
        },
       
    },
    tabFormat: ["blank", ["display-text", function() {
        return "Achievements: " + player.a.achievements.length + "/" + (Object.keys(tmp.a.achievements).length - 2)
    }
    ], "blank", "blank", "achievements", ],
})

/* Fusion:

Hydrogen -> Helium -> Carbon -> Neon -> Oxygen -> Silicon -> Iron

Progress (v0.4):

Layers (x3): 3 / 3
Upgrades: 55 / 65                   - 
Main Items (x2): 23 / 23            - 

Total Score: 120 / 120 - 100%

Progress per Day: 8.5% - 5.1% - 9.3%
Time until finished: 2-4 days of testing
*/