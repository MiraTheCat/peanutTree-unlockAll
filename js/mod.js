let modInfo = {
	name: "The Peanut Tree UnlockAll",
	id: "thePeanutTreeUA",
	author: "Mira The Cat",
	pointsName: "peanuts",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(0), // Used for hard resets and new players
	offlineLimit: 0.5,  // In hours
}

// Set your version in num and name
let VERSION = {
	num: "0.4",
	name: "Abnormal Space Travel",
}

let changelog = `<h1>Changelog:</h1><br>
<br>
<h3>v0.4 - Abnormal Space Travel</h3><br><br>
Added Row 5 with 3 new layers<br>
Endgame: 1e223,000 peanuts<br>
<br>
<h3>v0.3 - Scientific Exploration</h3><br><br>
Added Row 4 with 4 new layers<br>
Made some changes to the earlier layers for balancing<br>
Endgame: 1e5400 peanuts<br>
<br>
<h3>v0.2 - The Industrial Revolution</h3><br><br>
Added Row 3 with 3 new layers<br>
Added Achievements<br>
Endgame: 1e415 peanuts<br>
<br>
<h3>v0.1 - A Humble Beginning</h3><br><br>
Added Row 1 and 2, with 3 layers in total<br>
Endgame: 1e26 peanuts<br>
<br>
<h1>Tips:</h1><br><br>
If you have to click something a lot of times, try to instead just click it once and hold down enter.
This will make the button be autoclicked so that you don't have to spam it<br>
`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything", "castAllSpells", "buy10", "buy100"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints(){
	return hasUpgrade('c', 11)
}

// Calculate points/sec!
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(1)

	if (hasUpgrade('c', 12)) gain = gain.times(2);
	if (hasUpgrade('c', 13)) gain = gain.times(upgradeEffect('c', 13));
	if (hasUpgrade('c', 22)) gain = gain.times(4);
	if (hasUpgrade('c', 23)) gain = gain.times(upgradeEffect('c', 23));
	if (hasUpgrade('c', 31)) gain = gain.times(upgradeEffect('c', 31));
	if (hasUpgrade("sg", 11)) gain = gain.times(upgradeEffect("sg", 11));
	if (hasUpgrade("fa", 23)) gain = gain.times(upgradeEffect("fa", 23));

	if (player.f.unlocked) gain = gain.times(tmp.f.effect);
	if (player.sg.unlocked) gain = gain.times(tmp.sg.saplingEff);
	if (player.fa.unlocked) gain = gain.times(tmp.fa.workerEff);
	if (player.ms.unlocked) gain = gain.times(tmp.ms.effect);
	if (player.o.unlocked) gain = gain.times(tmp.o.effect);

	if (tmp.b.buyables[11].unlocked) gain = gain.times(tmp.b.buyables[11].effect);
	if (player.s.unlocked) gain = gain.times(tmp.s.buyables[13].effect);
	if (player.l.unlocked) gain = gain.times(tmp.l.buyables[11].effect);
	if (player.n.unlocked) gain = gain.times(tmp.n.clickables[21].effect);
	if (player.ab.unlocked) gain = gain.times(tmp.ab.buyables[41].effect);
	if (player.ab.unlocked) gain = gain.times(tmp.ab.timeSpeed);

	if (inChallenge("b", 11)) gain = gain.sqrt();

	return gain;
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
}}

// Display extra things at the top of the page
var displayThings = [
	"Current Endgame: 1e223,000 peanuts"
]

// Determines when the game "ends"
function isEndgame() {
	return player.points.gte(new Decimal("e223000"));
}



// Less important things beyond this point!

// Style for the background, can be a function
var backgroundStyle = {

}

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(3600) // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
	if (oldVersion == "0.2") {
		if (player.t.points.gte(20)) {
			player.points = new Decimal("1e415");
			player.c.points = new Decimal("1e345");
			player.f.points = new Decimal(129);
			player.sg.points = new Decimal(129);
			player.sg.saplings = new Decimal(1e82);
			player.fa.workers = new Decimal(1e21);
			player.ms.points = new Decimal(40000);
			player.t.buyables[11] = new Decimal(27);

		} else if (player.t.points.gte(18)) {
			player.points = new Decimal("1e328");
			player.c.points = new Decimal("1e272");
			player.f.points = new Decimal(111);
			player.sg.points = new Decimal(111);
			player.sg.saplings = new Decimal(1e64);
			player.fa.workers = new Decimal(1e20);
			player.ms.points = new Decimal(110);
			player.t.buyables[11] = new Decimal(24);

		} else if (player.t.points.gte(17)) {
			player.points = new Decimal("1e263");
			player.c.points = new Decimal("1e220");
			player.f.points = new Decimal(97);
			player.sg.points = new Decimal(97);
			player.sg.saplings = new Decimal(1e53);
			player.fa.workers = new Decimal(1e19);
			player.ms.points = new Decimal(0);
			player.t.buyables[11] = new Decimal(22);

		} else if (player.t.points.gte(15)) {
			player.points = new Decimal("1e270");
			player.c.points = new Decimal("1e180");
			player.f.points = new Decimal(83);
			player.sg.points = new Decimal(83);
			player.sg.saplings = new Decimal(1e49);
			player.fa.workers = new Decimal(1e18);
			player.ms.points = new Decimal(0);
			player.t.buyables[11] = new Decimal(20);

		} else if (player.t.points.gte(13)) {
			player.points = new Decimal("1e162");
			player.c.points = new Decimal("1e140");
			player.f.points = new Decimal(71);
			player.sg.points = new Decimal(71);
			player.sg.saplings = new Decimal(1e43);
			player.fa.workers = new Decimal(1e13);
			player.t.buyables[11] = new Decimal(18);
			
		} else if (player.t.points.gte(12)) {
			player.points = new Decimal("1e135");
			player.c.points = new Decimal("1e108");
			player.f.points = new Decimal(63);
			player.sg.points = new Decimal(63);
			player.sg.saplings = new Decimal(1e36);
			player.fa.workers = new Decimal(3000);
			player.t.buyables[11] = new Decimal(17);
			
		} else if (player.t.points.gte(10)) {
			player.points = new Decimal("1e101");
			player.c.points = new Decimal("1e84");
			player.f.points = new Decimal(53);
			player.sg.points = new Decimal(53);
			player.sg.saplings = new Decimal(1e21);
			player.fa.workers = new Decimal(1000);
			player.t.buyables[11] = new Decimal(16);
			
		} else if (player.t.points.gte(8)) {
			player.points = new Decimal("1e82");
			player.c.points = new Decimal("1e68");
			player.f.points = new Decimal(43);
			player.sg.points = new Decimal(43);
			player.sg.saplings = new Decimal(1e16);
			player.fa.workers = new Decimal(1000);
			player.t.buyables[11] = new Decimal(15);
			
		} else if (player.t.points.gte(7)) {
			player.points = new Decimal("1e73");
			player.c.points = new Decimal("1e60");
			player.f.points = new Decimal(40);
			player.sg.points = new Decimal(40);
			player.sg.saplings = new Decimal(1e15);
			player.fa.workers = new Decimal(950);
			player.t.buyables[11] = new Decimal(14);
			
		} else if (player.t.points.gte(6)) {
			player.points = new Decimal("1e55");
			player.c.points = new Decimal("1e44");
			player.f.points = new Decimal(34);
			player.sg.points = new Decimal(34);
			player.sg.saplings = new Decimal(1e15);
			player.fa.workers = new Decimal(950);
			player.t.buyables[11] = new Decimal(11);
			
		} else if (player.t.points.gte(5)) {
			player.points = new Decimal("1e58");
			player.c.points = new Decimal("1e48");
			player.f.points = new Decimal(33);
			player.sg.points = new Decimal(33);
			player.sg.saplings = new Decimal(1e15);
			player.fa.workers = new Decimal(950);
			player.t.buyables[11] = new Decimal(10);
			
		} else if (player.t.points.gte(4)) {
			player.points = new Decimal("1e46");
			player.c.points = new Decimal("1e35");
			player.f.points = new Decimal(30);
			player.sg.points = new Decimal(30);
			player.sg.saplings = new Decimal(1e13);
			player.fa.workers = new Decimal(300);
			player.t.buyables[11] = new Decimal(10);
			
		} else if (player.t.points.gte(3)) {
			player.points = new Decimal("1e39");
			player.c.points = new Decimal("1e29");
			player.f.points = new Decimal(27);
			player.sg.points = new Decimal(27);
			player.sg.saplings = new Decimal(1e12);
			player.fa.workers = new Decimal(232);
			player.t.buyables[11] = new Decimal(7);
			
		} else if (player.t.points.gte(2)) {
			player.points = new Decimal("1e33");
			player.c.points = new Decimal("1e24");
			player.f.points = new Decimal(25);
			player.sg.points = new Decimal(25);
			player.sg.saplings = new Decimal(1e11);
			player.fa.workers = new Decimal(166);
			player.t.buyables[11] = new Decimal(4);
			
		} else if (player.t.points.gte(1) || player.fa.points.gte(1)) {
			player.points = new Decimal("1e28");
			player.c.points = new Decimal("1e20");
			player.f.points = new Decimal(21);
			player.sg.points = new Decimal(21);
			player.sg.saplings = new Decimal(1e11);
			player.fa.workers = new Decimal(100);
			player.t.buyables[11] = new Decimal(0);
			
		} else {
			player.points = new Decimal("5e25");
			player.c.points = new Decimal("2e18");
			player.f.points = new Decimal(20);
			player.sg.points = new Decimal(20);
			player.sg.saplings = new Decimal(1e10);
			
		}
	}
}