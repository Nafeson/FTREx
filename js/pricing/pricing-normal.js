/*
* Factory Toughened Rooflights
* pricing-normal.js
*
* LIVE NORMAL END-USER PRODUCT PRICES
*
* Final PRODUCT prices only. Customer delivery is separate.
*
* CURRENT NORMAL RULES
* - Refreshed 100mm Toughened prices are the base selling-price anchors.
* - Pricing size band is determined from the 100mm-border REFERENCE external size:
* reference external width = internal width + 200mm
* reference external length = internal length + 200mm
* - If reference external size is up to and including 1200 x 2200mm:
* Laminated = equivalent Toughened price +15%.
* 125mm border = equivalent 100mm price +12%.
* 150mm border = 125mm price +8% further
* (100mm x 1.12 x 1.08 = x1.2096).
* - If reference external size is above 1200 x 2200mm in either dimension:
* Laminated = equivalent Toughened price +8%.
* 125mm border = equivalent 100mm price +8%.
* 150mm border = 125mm price +5% further
* (100mm x 1.08 x 1.05 = x1.134).
* - Custom calculator = interpolated configured price +7%.
* - Retail prices round to nearest £5.
*
* SELF CLEANING
* - Separate add-on; never baked into the base product price.
* - Same add-on for DG and TG.
* - Same add-on across Cheap / Normal / Expensive.
* - Standard sizes use their exact SC add-on.
* - Custom sizes use the SC add-on of the SINGLE nearest standard size.
* - SC itself is NOT increased by custom, border or laminated uplifts.
*
* TOUGHENED_PRICES_100 row column order:
* 0 Clear DG, 1 Clear TG,
* 2 Grey DG, 3 Grey TG,
* 4 Blue DG, 5 Blue TG,
* 6 Satin DG, 7 Satin TG.
*
* Public PRICE_MATRIX exposes the historic 16-column layout:
* 0 Clear Toughened DG 1 Clear Toughened TG
* 2 Clear Laminated DG 3 Clear Laminated TG
* 4 Grey Toughened DG 5 Grey Toughened TG
* 6 Grey Laminated DG 7 Grey Laminated TG
* 8 Blue Toughened DG 9 Blue Toughened TG
* 10 Blue Laminated DG 11 Blue Laminated TG
* 12 Satin Toughened DG 13 Satin Toughened TG
* 14 Satin Laminated DG 15 Satin Laminated TG
*/

(function (globalScope, factory) {
const api = factory();

if (typeof module !== "undefined" && module.exports) {
module.exports = api;
}

if (globalScope) {
globalScope.FactoryRooflightsPricingNormal = api;
}
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
"use strict";

const STRATEGY_ID = "normal";
const STRATEGY_LABEL = "Normal";
const STRATEGY_VERSION = "2026-09-08-4";
const PRICE_UNAVAILABLE = "PRICE_UNAVAILABLE";

const NORMAL_OVER_CHEAP_PROFIT_MULTIPLIER = 1.30;

const NORMAL_FINISH_PROFIT_MULTIPLIERS = Object.freeze({
clear: 1.00,
satin: 1.15,
grey: 1.17,
blue: 1.20
});

// Retained as strategy metadata for backwards compatibility.
const TYPE_PROFIT_MULTIPLIERS = Object.freeze({
toughened: 1.00,
laminated: 1.00
});

/*
* Backwards-compatible public shape:
* - .laminated represents the <=1200x2200 reference-external band.
* - .laminatedAboveReference is used above that band.
*/
const TYPE_PRICE_MULTIPLIERS = Object.freeze({
toughened: 1.00,
laminated: 1.15,
laminatedAboveReference: 1.08
});

/*
* Backwards-compatible public shape:
* top-level 100/125/150 represent the <=1200x2200 band.
*/
const BORDER_PRICE_MULTIPLIERS = Object.freeze({
"100": 1.00,
"125": 1.12,
"150": 1.12 * 1.08,

aboveReference: Object.freeze({
"100": 1.00,
"125": 1.08,
"150": 1.08 * 1.05
})
});

const PRICE_SIZE_BAND_CONFIG = Object.freeze({
referenceBorder: 100,
externalAdditionPerDimension: 200,
maxExternalWidth: 1200,
maxExternalLength: 2200,
withinReferenceId: "within-reference",
aboveReferenceId: "above-reference"
});

const PROVISIONAL_RATE_POLICY = Object.freeze({
missingBlue8mmSafetyFactor: 1.05,
missingGrey8mmSafetyFactor: 1.05
});

const SUPPORTED_BORDER_RANGE = Object.freeze({
min: 100,
max: 150,
anchors: Object.freeze([100, 125, 150])
});

const CUSTOM_PRICING_CONFIG = Object.freeze({
enabled: true,
method: "inverse-distance",
neighbourCount: 4,
distancePower: 2,
retailRoundTo: 5,
exactStandardSizeUsesExactPrice: true,
customPriceMultiplier: 1.07
});

const VARIANT_INDEX = Object.freeze({
clear: Object.freeze({
toughened: Object.freeze({
double: 0,
triple: 1
}),
laminated: Object.freeze({
double: 2,
triple: 3
})
}),

grey: Object.freeze({
toughened: Object.freeze({
double: 4,
triple: 5
}),
laminated: Object.freeze({
double: 6,
triple: 7
})
}),

blue: Object.freeze({
toughened: Object.freeze({
double: 8,
triple: 9
}),
laminated: Object.freeze({
double: 10,
triple: 11
})
}),

satin: Object.freeze({
toughened: Object.freeze({
double: 12,
triple: 13
}),
laminated: Object.freeze({
double: 14,
triple: 15
})
})
});

const TOUGHENED_BASE_100 = Object.freeze({
"300x800": Object.freeze([
180, 220, 215, 255, 230, 270, 210, 255
]),

"300x1000": Object.freeze([
220, 250, 260, 290, 275, 305, 250, 285
]),

"300x1200": Object.freeze([
245, 285, 285, 330, 300, 345, 275, 325
]),

"300x1500": Object.freeze([
280, 340, 330, 390, 350, 410, 325, 385
]),

"400x800": Object.freeze([
190, 235, 225, 275, 240, 290, 220, 265
]),

"400x1000": Object.freeze([
240, 280, 280, 325, 300, 345, 275, 320
]),

"400x1200": Object.freeze([
265, 315, 310, 365, 330, 385, 300, 360
]),

"400x1500": Object.freeze([
355, 395, 410, 455, 435, 485, 405, 445
]),

"400x1800": Object.freeze([
410, 465, 470, 530, 495, 560, 465, 520
]),

"500x800": Object.freeze([
230, 260, 270, 305, 285, 320, 260, 300
]),

"500x1000": Object.freeze([
250, 290, 295, 340, 315, 360, 290, 335
]),

"500x1200": Object.freeze([
280, 355, 330, 410, 355, 430, 325, 400
]),

"500x1500": Object.freeze([
345, 425, 405, 490, 435, 520, 400, 480
]),

"500x2000": Object.freeze([
425, 555, 500, 640, 535, 675, 490, 630
]),

"500x2500": Object.freeze([
530, 600, 640, 690, 695, 735, 655, 680
]),

"600x600": Object.freeze([
220, 255, 260, 295, 275, 310, 250, 285
]),

"600x900": Object.freeze([
255, 285, 305, 330, 325, 355, 300, 325
]),

"600x1200": Object.freeze([
350, 465, 405, 520, 435, 550, 400, 515
]),

"600x1500": Object.freeze([
420, 515, 485, 580, 515, 615, 475, 575
]),

"600x1800": Object.freeze([
460, 570, 535, 650, 575, 695, 530, 640
]),

"600x2000": Object.freeze([
495, 610, 605, 705, 660, 745, 615, 695
]),

"600x2500": Object.freeze([
590, 670, 725, 775, 785, 825, 740, 760
]),

"800x800": Object.freeze([
290, 320, 340, 370, 365, 395, 335, 365
]),

"800x1000": Object.freeze([
335, 385, 390, 440, 420, 470, 385, 435
]),

"800x1200": Object.freeze([
360, 420, 425, 485, 460, 520, 420, 480
]),

"800x1500": Object.freeze([
460, 520, 560, 600, 615, 640, 575, 590
]),

"800x1800": Object.freeze([
530, 595, 655, 690, 710, 740, 670, 675
]),

"800x2000": Object.freeze([
570, 665, 700, 770, 765, 820, 715, 760
]),

"800x2500": Object.freeze([
705, 825, 865, 945, 940, 1010, 880, 930
]),

"1000x1000": Object.freeze([
350, 405, 420, 475, 450, 515, 410, 470
]),

"1000x1200": Object.freeze([
440, 505, 520, 585, 560, 620, 510, 575
]),

"1000x1500": Object.freeze([
535, 625, 655, 720, 715, 765, 670, 710
]),

"1000x1800": Object.freeze([
590, 670, 730, 780, 800, 835, 745, 770
]),

"1000x2000": Object.freeze([
615, 705, 755, 815, 835, 875, 780, 805
]),

"1000x2500": Object.freeze([
775, 960, 990, 1180, 1105, 1290, 1020, 1205
]),

"1000x3000": Object.freeze([
980, 1285, 1180, 1480, 1285, 1580, 1210, 1495
]),

"1200x1200": Object.freeze([
480, 565, 605, 665, 660, 710, 615, 650
]),

"1200x1500": Object.freeze([
590, 705, 725, 815, 800, 870, 745, 805
]),

"1200x1800": Object.freeze([
695, 815, 855, 945, 935, 1005, 870, 930
]),

"1200x2000": Object.freeze([
775, 915, 985, 1075, 1090, 1165, 1015, 1060
]),

"1200x2500": Object.freeze([
970, 1175, 1215, 1435, 1350, 1570, 1255, 1470
]),

"1500x1500": Object.freeze([
750, 875, 955, 1035, 1055, 1120, 975, 1015
]),

"1500x1800": Object.freeze([
875, 1085, 1110, 1325, 1230, 1445, 1145, 1360
]),

"1500x2000": Object.freeze([
1125, 1485, 1385, 1755, 1510, 1885, 1420, 1790
]),

"1500x2500": Object.freeze([
1445, 1700, 1780, 2030, 1955, 2195, 1860, 2070
]),

"1500x3000": Object.freeze([
1795, 1975, 2190, 2375, 2395, 2585, 2280, 2470
])
});

const STANDARD_SIZE_KEYS = Object.freeze(
Object.keys(TOUGHENED_BASE_100)
);

const TOUGHENED_PRICES_100 = Object.freeze(
STANDARD_SIZE_KEYS.map(
size => TOUGHENED_BASE_100[size]
)
);

const NORMAL_BASE_PRICES_100 = Object.freeze(
STANDARD_SIZE_KEYS.reduce(
(map, size) => {
const row =
TOUGHENED_BASE_100[size];

map[size] =
Object.freeze({
double: row[0],
triple: row[1]
});

return map;
},
{}
)
);

const SELF_CLEANING_POLICY = Object.freeze({
sameForDoubleAndTriple: true,
sameAcrossStrategies: true,
includedInBasePrice: false,
customUsesNearestStandardSize: true,
customInterpolatesSelfCleaning: false
});

const SELF_CLEANING_ADDONS = Object.freeze({
"300x800": 25,
"300x1000": 25,
"300x1200": 30,
"300x1500": 35,

"400x800": 25,
"400x1000": 25,
"400x1200": 35,
"400x1500": 40,
"400x1800": 50,

"500x800": 25,
"500x1000": 25,
"500x1200": 25,
"500x1500": 35,
"500x2000": 40,
"500x2500": 55,

"600x600": 20,
"600x900": 25,
"600x1200": 30,
"600x1500": 35,
"600x1800": 50,
"600x2000": 55,
"600x2500": 60,

"800x800": 30,
"800x1000": 35,
"800x1200": 35,
"800x1500": 35,
"800x1800": 40,
"800x2000": 45,
"800x2500": 70,

"1000x1000": 35,
"1000x1200": 35,
"1000x1500": 50,
"1000x1800": 50,
"1000x2000": 50,
"1000x2500": 100,
"1000x3000": 135,

"1200x1200": 55,
"1200x1500": 55,
"1200x1800": 70,
"1200x2000": 80,
"1200x2500": 100,

"1500x1500": 80,
"1500x1800": 90,
"1500x2000": 125,
"1500x2500": 125,
"1500x3000": 150
});

const SIZE_INDEX = Object.freeze(
STANDARD_SIZE_KEYS.reduce(
(map, size, index) => {
map[size] = index;
return map;
},
{}
)
);

function normalizeDimensionPair(
width,
length
) {
const first =
Number(width);

const second =
Number(length);

if (
!Number.isFinite(first) ||
!Number.isFinite(second) ||
first <= 0 ||
second <= 0
) {
return null;
}

return {
width:
Math.min(
first,
second
),

length:
Math.max(
first,
second
)
};
}

function parseSizeKey(
sizeKey
) {
const parts =
String(sizeKey ?? "")
.trim()
.toLowerCase()
.replace(/mm/g, "")
.replace(/×/g, "x")
.replace(/\s+/g, "")
.split("x")
.map(Number);

if (
parts.length !== 2
) {
return null;
}

return normalizeDimensionPair(
parts[0],
parts[1]
);
}

function normalizeSize(
sizeOrWidth,
maybeLength
) {
let dimensions;

if (
maybeLength !== undefined &&
maybeLength !== null
) {
dimensions =
normalizeDimensionPair(
sizeOrWidth,
maybeLength
);
}
else if (
sizeOrWidth &&
typeof sizeOrWidth === "object"
) {
dimensions =
normalizeDimensionPair(
sizeOrWidth.width ??
sizeOrWidth.internalWidth,

sizeOrWidth.length ??
sizeOrWidth.internalLength
);
}
else {
dimensions =
parseSizeKey(
sizeOrWidth
);
}

if (!dimensions) {
return null;
}

return (
`${dimensions.width}x${dimensions.length}`
);
}

function normalizeGlazing(
glazing
) {
const value =
String(glazing ?? "")
.trim()
.toLowerCase()
.replace(/[\s_-]+/g, "");

if (
value === "double" ||
value === "doubleglazed" ||
value === "dg" ||
value === "2"
) {
return "double";
}

if (
value === "triple" ||
value === "tripleglazed" ||
value === "tg" ||
value === "3"
) {
return "triple";
}

return null;
}

function normalizeFinish(
finish
) {
const value =
String(
finish ?? "clear"
)
.trim()
.toLowerCase()
.replace(/[\s_-]+/g, "");

if (
value === "clear"
) {
return "clear";
}

if (
value === "grey" ||
value === "gray" ||
value === "solargrey" ||
value === "solargray"
) {
return "grey";
}

if (
value === "blue" ||
value === "solarblue"
) {
return "blue";
}

if (
value === "satin" ||
value === "privacy"
) {
return "satin";
}

return null;
}

function normalizeType(
type
) {
const value =
String(
type ?? "toughened"
)
.trim()
.toLowerCase()
.replace(/[\s_-]+/g, "");

if (
value === "toughened" ||
value === "tough" ||
value === "tgh"
) {
return "toughened";
}

if (
value === "laminated" ||
value === "lam" ||
value === "laminatedsoftcoat"
) {
return "laminated";
}

return null;
}

function normalizeBorder(
border
) {
const value =
Number(
border ?? 100
);

if (
!Number.isFinite(value) ||
value <
SUPPORTED_BORDER_RANGE.min ||
value >
SUPPORTED_BORDER_RANGE.max
) {
return null;
}

return value;
}

function getVariantIndex(
finish,
type,
glazing
) {
const f =
normalizeFinish(finish);

const t =
normalizeType(type);

const g =
normalizeGlazing(glazing);

const index =
f && t && g
? VARIANT_INDEX[f]?.[t]?.[g]
: null;

return Number.isInteger(
index
)
? index
: null;
}

function roundToIncrement(
value,
increment
) {
const number =
Number(value);

const step =
Number(increment);

if (
!Number.isFinite(number) ||
!Number.isFinite(step) ||
step <= 0
) {
return null;
}

return (
Math.round(
number / step
) *
step
);
}

function roundRetailPrice(
value
) {
return roundToIncrement(
value,
CUSTOM_PRICING_CONFIG.retailRoundTo
);
}

function hasStandardSize(
sizeOrWidth,
maybeLength
) {
const sizeKey =
normalizeSize(
sizeOrWidth,
maybeLength
);

return Boolean(
sizeKey &&
Object.prototype.hasOwnProperty.call(
SIZE_INDEX,
sizeKey
)
);
}

function getReferenceExternalDimensions(
sizeOrWidth,
maybeLength
) {
const sizeKey =
normalizeSize(
sizeOrWidth,
maybeLength
);

const dimensions =
sizeKey
? parseSizeKey(
sizeKey
)
: null;

if (!dimensions) {
return null;
}

return {
width:
dimensions.width +
PRICE_SIZE_BAND_CONFIG
.externalAdditionPerDimension,

length:
dimensions.length +
PRICE_SIZE_BAND_CONFIG
.externalAdditionPerDimension
};
}

function getPricingSizeBand(
sizeOrWidth,
maybeLength
) {
const external =
getReferenceExternalDimensions(
sizeOrWidth,
maybeLength
);

if (!external) {
return null;
}

if (
external.width <=
PRICE_SIZE_BAND_CONFIG
.maxExternalWidth &&
external.length <=
PRICE_SIZE_BAND_CONFIG
.maxExternalLength
) {
return (
PRICE_SIZE_BAND_CONFIG
.withinReferenceId
);
}

return (
PRICE_SIZE_BAND_CONFIG
.aboveReferenceId
);
}

function getBorderAnchors(
border
) {
const value =
normalizeBorder(
border
);

if (
value === null
) {
return null;
}

if (
value === 100 ||
value === 125 ||
value === 150
) {
return {
lower:
value,

upper:
value,

ratio:
0
};
}

if (
value < 125
) {
return {
lower:
100,

upper:
125,

ratio:
(value - 100) / 25
};
}

return {
lower:
125,

upper:
150,

ratio:
(value - 125) / 25
};
}

function getBorderMultiplierTable(
pricingSizeBand
) {
return (
pricingSizeBand ===
PRICE_SIZE_BAND_CONFIG
.aboveReferenceId
)
? BORDER_PRICE_MULTIPLIERS
.aboveReference

: BORDER_PRICE_MULTIPLIERS;
}

function getBorderPriceMultiplier(
border,
sizeOrWidth = null,
maybeLength = null
) {
const value =
normalizeBorder(
border
);

if (
value === null
) {
return null;
}

/*
* Legacy one-argument calls default to
* the <=1200 x 2200 reference band.
*
* All live internal calls pass a size
* so the correct band is used.
*/
const pricingSizeBand =
getPricingSizeBand(
sizeOrWidth,
maybeLength
) ||
PRICE_SIZE_BAND_CONFIG
.withinReferenceId;

const table =
getBorderMultiplierTable(
pricingSizeBand
);

if (
value <= 125
) {
const ratio =
(value - 100) /
25;

return (
table["100"] +
(
table["125"] -
table["100"]
) *
ratio
);
}

const ratio =
(value - 125) /
25;

return (
table["125"] +
(
table["150"] -
table["125"]
) *
ratio
);
}

function getToughenedSourceIndex(
variantIndex
) {
if (
!Number.isInteger(
variantIndex
) ||
variantIndex < 0 ||
variantIndex > 15
) {
return null;
}

return (
Math.floor(
variantIndex / 4
) *
2 +
(
variantIndex %
2
)
);
}

function isLaminatedVariant(
variantIndex
) {
return (
Number.isInteger(
variantIndex
) &&
variantIndex >= 0 &&
variantIndex <= 15 &&
variantIndex % 4 >= 2
);
}

function getTypeMultiplierForVariantIndex(
variantIndex,
sizeOrWidth = null,
maybeLength = null
) {
if (
!Number.isInteger(
variantIndex
) ||
variantIndex < 0 ||
variantIndex > 15
) {
return null;
}

if (
!isLaminatedVariant(
variantIndex
)
) {
return (
TYPE_PRICE_MULTIPLIERS
.toughened
);
}

const pricingSizeBand =
getPricingSizeBand(
sizeOrWidth,
maybeLength
) ||
PRICE_SIZE_BAND_CONFIG
.withinReferenceId;

return (
pricingSizeBand ===
PRICE_SIZE_BAND_CONFIG
.aboveReferenceId
)
? TYPE_PRICE_MULTIPLIERS
.laminatedAboveReference

: TYPE_PRICE_MULTIPLIERS
.laminated;
}

function getAnchorPriceAtBorder(
sizeKey,
variantIndex,
border,
pricingSizeReference = null
) {
const sourceIndex =
getToughenedSourceIndex(
variantIndex
);

const reference =
pricingSizeReference ||
sizeKey;

const borderMultiplier =
getBorderPriceMultiplier(
border,
reference
);

const typeMultiplier =
getTypeMultiplierForVariantIndex(
variantIndex,
reference
);

const baseRow =
TOUGHENED_BASE_100[
sizeKey
];

if (
!baseRow ||
!Number.isInteger(
sourceIndex
) ||
!Number.isFinite(
borderMultiplier
) ||
!Number.isFinite(
typeMultiplier
)
) {
return null;
}

const baseToughenedPrice =
Number(
baseRow[
sourceIndex
]
);

if (
!Number.isFinite(
baseToughenedPrice
)
) {
return null;
}

return roundRetailPrice(
baseToughenedPrice *
borderMultiplier *
typeMultiplier
);
}

function buildPriceMatrix(
border
) {
return Object.freeze(
STANDARD_SIZE_KEYS.map(
sizeKey =>
Object.freeze(
Array.from(
{
length: 16
},

(
_,
variantIndex
) =>
getAnchorPriceAtBorder(
sizeKey,
variantIndex,
border
)
)
)
)
);
}

const PRICES_100 =
buildPriceMatrix(
100
);

const PRICES_125 =
buildPriceMatrix(
125
);

const PRICES_150 =
buildPriceMatrix(
150
);

const PRICE_MATRIX =
Object.freeze({
"100":
PRICES_100,

"125":
PRICES_125,

"150":
PRICES_150
});

function getRawMatrixPrice(
borderAnchor,
sizeKey,
variantIndex
) {
const sizeIndex =
SIZE_INDEX[
sizeKey
];

const rows =
PRICE_MATRIX[
String(
borderAnchor
)
];

if (
!Number.isInteger(
sizeIndex
) ||
!Array.isArray(
rows
) ||
!Number.isInteger(
variantIndex
)
) {
return null;
}

const value =
Number(
rows[
sizeIndex
]?.[
variantIndex
]
);

return Number.isFinite(
value
)
? value
: null;
}

const STANDARD_SIZE_ANCHORS =
Object.freeze(
STANDARD_SIZE_KEYS.map(
sizeKey => {
const dimensions =
parseSizeKey(
sizeKey
);

return Object.freeze({
size:
sizeKey,

width:
dimensions.width,

length:
dimensions.length
});
}
)
);

function getRelativeAnchorDistance(
targetWidth,
targetLength,
anchorWidth,
anchorLength
) {
const widthScale =
Math.max(
targetWidth,
1
);

const lengthScale =
Math.max(
targetLength,
1
);

const widthDifference =
(
anchorWidth -
targetWidth
) /
widthScale;

const lengthDifference =
(
anchorLength -
targetLength
) /
lengthScale;

return Math.sqrt(
widthDifference ** 2 +
lengthDifference ** 2
);
}

function getNearestStandardSizeAnchor(
width,
length
) {
const dimensions =
normalizeDimensionPair(
width,
length
);

if (!dimensions) {
return null;
}

return (
STANDARD_SIZE_ANCHORS
.map(
(
anchor,
index
) => ({
...anchor,

index,

distance:
getRelativeAnchorDistance(
dimensions.width,
dimensions.length,
anchor.width,
anchor.length
)
})
)
.sort(
(
first,
second
) => {
const distanceDifference =
first.distance -
second.distance;

if (
distanceDifference !==
0
) {
return (
distanceDifference
);
}

return (
first.index -
second.index
);
}
)[0] ||
null
);
}

function getStandardSelfCleaningAddOn(
options = {}
) {
const sizeKey =
options.size
? normalizeSize(
options.size
)
: normalizeSize(
options.width ??
options.internalWidth,

options.length ??
options.internalLength
);

const amount =
sizeKey &&
hasStandardSize(
sizeKey
)
? Number(
SELF_CLEANING_ADDONS[
sizeKey
]
)
: NaN;

if (
!Number.isFinite(
amount
)
) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"standard-self-cleaning",

reasonCode:
PRICE_UNAVAILABLE,

size:
sizeKey,

selfCleaningAddOn:
null,

amount:
null
};
}

return {
available:
true,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

strategyVersion:
STRATEGY_VERSION,

source:
"standard-self-cleaning",

reasonCode:
null,

size:
sizeKey,

nearestStandardSize:
sizeKey,

distance:
0,

selfCleaningAddOn:
amount,

amount
};
}

function getCustomSelfCleaningAddOn(
options = {}
) {
const dimensions =
options.size
? parseSizeKey(
options.size
)
: normalizeDimensionPair(
options.width ??
options.internalWidth,

options.length ??
options.internalLength
);

if (!dimensions) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"custom-self-cleaning-nearest-size",

reasonCode:
PRICE_UNAVAILABLE,

selfCleaningAddOn:
null,

amount:
null
};
}

const nearest =
getNearestStandardSizeAnchor(
dimensions.width,
dimensions.length
);

const amount =
nearest
? Number(
SELF_CLEANING_ADDONS[
nearest.size
]
)
: NaN;

if (
!nearest ||
!Number.isFinite(
amount
)
) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"custom-self-cleaning-nearest-size",

reasonCode:
PRICE_UNAVAILABLE,

selfCleaningAddOn:
null,

amount:
null
};
}

return {
available:
true,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

strategyVersion:
STRATEGY_VERSION,

source:
"custom-self-cleaning-nearest-size",

reasonCode:
null,

size:
normalizeSize(
dimensions.width,
dimensions.length
),

width:
dimensions.width,

length:
dimensions.length,

nearestStandardSize:
nearest.size,

distance:
nearest.distance,

selfCleaningAddOn:
amount,

amount
};
}

function getSelfCleaningAddOn(
options = {}
) {
const mode =
String(
options.pricingMode ??
options.mode ??
""
)
.trim()
.toLowerCase();

if (
mode ===
"standard"
) {
return (
getStandardSelfCleaningAddOn(
options
)
);
}

if (
mode ===
"custom"
) {
return (
getCustomSelfCleaningAddOn(
options
)
);
}

const sizeKey =
options.size
? normalizeSize(
options.size
)
: normalizeSize(
options.width ??
options.internalWidth,

options.length ??
options.internalLength
);

if (
sizeKey &&
hasStandardSize(
sizeKey
)
) {
return (
getStandardSelfCleaningAddOn({
...options,
size:
sizeKey
})
);
}

return (
getCustomSelfCleaningAddOn(
options
)
);
}

function getSelfCleaningAddOnValue(
options = {}
) {
const result =
getSelfCleaningAddOn(
options
);

return result.available
? result.selfCleaningAddOn
: null;
}

function getStandardPrice(
options = {}
) {
const sizeKey =
options.size
? normalizeSize(
options.size
)
: normalizeSize(
options.width ??
options.internalWidth,

options.length ??
options.internalLength
);

const glazing =
normalizeGlazing(
options.glazing ??
options.glazingType ??
options.unitType
);

const finish =
normalizeFinish(
options.finish ??
options.tint ??
"clear"
);

const type =
normalizeType(
options.type ??
options.bottomType ??
"toughened"
);

const border =
normalizeBorder(
options.border ??
100
);

const variantIndex =
getVariantIndex(
finish,
type,
glazing
);

if (
!sizeKey ||
!hasStandardSize(
sizeKey
) ||
!glazing ||
!finish ||
!type ||
border === null ||
variantIndex === null
) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"standard",

reasonCode:
PRICE_UNAVAILABLE,

price:
null
};
}

const price =
getAnchorPriceAtBorder(
sizeKey,
variantIndex,
border
);

if (
!Number.isFinite(
price
)
) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"standard",

reasonCode:
PRICE_UNAVAILABLE,

price:
null
};
}

const selfCleaningResult =
getStandardSelfCleaningAddOn({
size:
sizeKey
});

const referenceExternalDimensions =
getReferenceExternalDimensions(
sizeKey
);

return {
available:
true,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

strategyVersion:
STRATEGY_VERSION,

source:
"standard",

reasonCode:
null,

size:
sizeKey,

glazing,
finish,
type,
border,

pricingSizeBand:
getPricingSizeBand(
sizeKey
),

referenceExternalDimensions,

price,

basePrice:
price,

selfCleaningAddOn:
selfCleaningResult.available
? selfCleaningResult
.selfCleaningAddOn
: null
};
}

function getNearestPriceAnchors(
width,
length,
variantIndex,
border,
neighbourCount =
CUSTOM_PRICING_CONFIG
.neighbourCount
) {
const dimensions =
normalizeDimensionPair(
width,
length
);

const normalizedBorder =
normalizeBorder(
border
);

if (
!dimensions ||
normalizedBorder === null ||
!Number.isInteger(
variantIndex
)
) {
return [];
}

const count =
Math.max(
1,

Math.floor(
Number(
neighbourCount
) ||
1
)
);

return (
STANDARD_SIZE_ANCHORS
.map(
anchor => ({
...anchor,

/*
* For CUSTOM pricing, the border and laminated
* size-band multipliers are determined by the
* TARGET custom dimensions, not each neighbour.
*/
price:
getAnchorPriceAtBorder(
anchor.size,
variantIndex,
normalizedBorder,
dimensions
),

distance:
getRelativeAnchorDistance(
dimensions.width,
dimensions.length,
anchor.width,
anchor.length
)
})
)
.filter(
anchor =>
Number.isFinite(
anchor.price
)
)
.sort(
(
first,
second
) =>
first.distance -
second.distance
)
.slice(
0,
count
)
);
}

function interpolateCustomPrice(
width,
length,
variantIndex,
border,
options = {}
) {
const dimensions =
normalizeDimensionPair(
width,
length
);

const normalizedBorder =
normalizeBorder(
border
);

if (
!dimensions ||
normalizedBorder === null ||
!Number.isInteger(
variantIndex
)
) {
return null;
}

const sizeKey =
normalizeSize(
dimensions.width,
dimensions.length
);

if (
CUSTOM_PRICING_CONFIG
.exactStandardSizeUsesExactPrice &&
hasStandardSize(
sizeKey
)
) {
const exactPrice =
getAnchorPriceAtBorder(
sizeKey,
variantIndex,
normalizedBorder,
dimensions
);

if (
!Number.isFinite(
exactPrice
)
) {
return null;
}

return {
source:
"exact-standard-size",

rawPrice:
exactPrice,

price:
exactPrice,

size:
sizeKey,

width:
dimensions.width,

length:
dimensions.length,

border:
normalizedBorder,

pricingSizeBand:
getPricingSizeBand(
dimensions
),

anchors:
Object.freeze([
Object.freeze({
size:
sizeKey,

width:
dimensions.width,

length:
dimensions.length,

price:
exactPrice,

distance:
0,

weight:
1
})
])
};
}

const neighbourCount =
options.neighbourCount ??
CUSTOM_PRICING_CONFIG
.neighbourCount;

const distancePower =
Math.max(
0.0001,

Number(
options.distancePower ??
CUSTOM_PRICING_CONFIG
.distancePower
) ||
2
);

const anchors =
getNearestPriceAnchors(
dimensions.width,
dimensions.length,
variantIndex,
normalizedBorder,
neighbourCount
);

if (
!anchors.length
) {
return null;
}

const exactAnchor =
anchors.find(
anchor =>
anchor.distance ===
0
);

if (
exactAnchor
) {
return {
source:
"exact-anchor",

rawPrice:
exactAnchor.price,

price:
exactAnchor.price,

size:
exactAnchor.size,

width:
dimensions.width,

length:
dimensions.length,

border:
normalizedBorder,

pricingSizeBand:
getPricingSizeBand(
dimensions
),

anchors:
Object.freeze([
Object.freeze({
...exactAnchor,
weight:
1
})
])
};
}

const weightedAnchors =
anchors.map(
anchor => ({
...anchor,

weight:
1 /
Math.pow(
Math.max(
anchor.distance,
0.000001
),

distancePower
)
})
);

const totalWeight =
weightedAnchors.reduce(
(
total,
anchor
) =>
total +
anchor.weight,

0
);

if (
!Number.isFinite(
totalWeight
) ||
totalWeight <= 0
) {
return null;
}

const rawPrice =
weightedAnchors.reduce(
(
total,
anchor
) =>
total +
(
anchor.price *
anchor.weight
),

0
) /
totalWeight;

return {
source:
"custom-interpolation",

rawPrice,

price:
roundRetailPrice(
rawPrice
),

size:
sizeKey,

width:
dimensions.width,

length:
dimensions.length,

border:
normalizedBorder,

pricingSizeBand:
getPricingSizeBand(
dimensions
),

anchors:
Object.freeze(
weightedAnchors.map(
anchor =>
Object.freeze({
...anchor
})
)
)
};
}

function getCustomPrice(
options = {}
) {
const dimensions =
normalizeDimensionPair(
options.width ??
options.internalWidth,

options.length ??
options.internalLength
);

const glazing =
normalizeGlazing(
options.glazing ??
options.glazingType ??
options.unitType
);

const finish =
normalizeFinish(
options.finish ??
options.tint ??
"clear"
);

const type =
normalizeType(
options.type ??
options.bottomType ??
"toughened"
);

const border =
normalizeBorder(
options.border ??
100
);

const variantIndex =
getVariantIndex(
finish,
type,
glazing
);

if (
!dimensions ||
!glazing ||
!finish ||
!type ||
border === null ||
variantIndex === null
) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"custom",

reasonCode:
PRICE_UNAVAILABLE,

price:
null
};
}

const result =
interpolateCustomPrice(
dimensions.width,
dimensions.length,
variantIndex,
border,
options.interpolation ||
{}
);

if (
!result ||
!Number.isFinite(
result.rawPrice
)
) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"custom",

reasonCode:
PRICE_UNAVAILABLE,

price:
null
};
}

/*
* CUSTOM +7%
*
* Border and laminated uplifts are already
* represented in the configured anchor prices
* using the TARGET custom unit's size band.
*/
const price =
roundRetailPrice(
result.rawPrice *
CUSTOM_PRICING_CONFIG
.customPriceMultiplier
);

if (
!Number.isFinite(
price
)
) {
return {
available:
false,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

source:
"custom",

reasonCode:
PRICE_UNAVAILABLE,

price:
null
};
}

const selfCleaningResult =
getCustomSelfCleaningAddOn({
width:
dimensions.width,

length:
dimensions.length,

pricingMode:
"custom"
});

return {
available:
true,

strategy:
STRATEGY_ID,

strategyLabel:
STRATEGY_LABEL,

strategyVersion:
STRATEGY_VERSION,

source:
result.source,

reasonCode:
null,

size:
result.size,

width:
result.width,

length:
result.length,

glazing,
finish,
type,
border,

pricingSizeBand:
result.pricingSizeBand,

referenceExternalDimensions:
getReferenceExternalDimensions(
dimensions
),

price,

basePrice:
price,

customPriceMultiplier:
CUSTOM_PRICING_CONFIG
.customPriceMultiplier,

priceBeforeCustomUplift:
roundRetailPrice(
result.rawPrice
),

selfCleaningAddOn:
selfCleaningResult.available
? selfCleaningResult
.selfCleaningAddOn
: null,

selfCleaningNearestStandardSize:
selfCleaningResult.available
? selfCleaningResult
.nearestStandardSize
: null,

selfCleaningReasonCode:
selfCleaningResult.available
? null
: selfCleaningResult
.reasonCode,

interpolationAnchors:
result.anchors
};
}

function getPrice(
options = {}
) {
const mode =
String(
options.pricingMode ??
options.mode ??
""
)
.trim()
.toLowerCase();

if (
mode ===
"standard"
) {
return getStandardPrice(
options
);
}

if (
mode ===
"custom"
) {
return getCustomPrice(
options
);
}

const sizeKey =
options.size
? normalizeSize(
options.size
)
: normalizeSize(
options.width ??
options.internalWidth,

options.length ??
options.internalLength
);

if (
sizeKey &&
hasStandardSize(
sizeKey
)
) {
return getStandardPrice({
...options,
size:
sizeKey
});
}

return getCustomPrice(
options
);
}

function getPriceValue(
options = {}
) {
const result =
getPrice(
options
);

return result.available
? result.price
: null;
}

function getStandardPriceValue(
options = {}
) {
const result =
getStandardPrice(
options
);

return result.available
? result.price
: null;
}

function getCustomPriceValue(
options = {}
) {
const result =
getCustomPrice(
options
);

return result.available
? result.price
: null;
}

return Object.freeze({
STRATEGY_ID,
STRATEGY_LABEL,
STRATEGY_VERSION,
PRICE_UNAVAILABLE,

NORMAL_OVER_CHEAP_PROFIT_MULTIPLIER,
NORMAL_FINISH_PROFIT_MULTIPLIERS,
TYPE_PROFIT_MULTIPLIERS,
TYPE_PRICE_MULTIPLIERS,
BORDER_PRICE_MULTIPLIERS,
PRICE_SIZE_BAND_CONFIG,
PROVISIONAL_RATE_POLICY,

SUPPORTED_BORDER_RANGE,
CUSTOM_PRICING_CONFIG,
VARIANT_INDEX,

STANDARD_SIZE_KEYS,
NORMAL_BASE_PRICES_100,
SELF_CLEANING_POLICY,
SELF_CLEANING_ADDONS,
TOUGHENED_PRICES_100,
STANDARD_SIZE_ANCHORS,
SIZE_INDEX,
PRICE_MATRIX,

normalizeDimensionPair,
parseSizeKey,
normalizeSize,
normalizeGlazing,
normalizeFinish,
normalizeType,
normalizeBorder,

getVariantIndex,
roundToIncrement,
roundRetailPrice,
hasStandardSize,

getReferenceExternalDimensions,
getPricingSizeBand,
getBorderAnchors,
getBorderPriceMultiplier,
getRawMatrixPrice,
getAnchorPriceAtBorder,

getStandardSelfCleaningAddOn,
getNearestStandardSizeAnchor,
getCustomSelfCleaningAddOn,
getSelfCleaningAddOn,
getSelfCleaningAddOnValue,

getStandardPrice,

getRelativeAnchorDistance,
getNearestPriceAnchors,
interpolateCustomPrice,
getCustomPrice,

getPrice,

getStandardPriceValue,
getCustomPriceValue,
getPriceValue
});
});
