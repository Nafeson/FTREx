/*
* Factory Toughened Rooflights
* master-makeup-logic.js
*
* Single source of truth for current rooflight unit make-up / glass specification rules.
*
* IMPORTANT:
* - These are current business make-up / estimating rules, not structural engineering certification.
* - Selling-price logic does not belong in this file.
* - Customer dimensions are INTERNAL visible glass dimensions in millimetres.
*
* SOLAR CONTROL:
* - Supported as a separate finish for make-up identification.
* - Solar Control applies to the external TOP pane only.
* - Existing Double / Triple thickness rules are retained.
* - Supplier availability of the selected Solar Control top-pane thickness
* must be confirmed separately before accepting an order.
*/

(function (globalScope, factory) {
const api = factory();

if (typeof module !== "undefined" && module.exports) {
module.exports = api;
}

if (globalScope) {
globalScope.MasterMakeupLogic = api;
}
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
"use strict";

const DEFAULT_BORDER_MM = 100;

const UNIT_RULES = Object.freeze({
double: Object.freeze({
top8FromExternalArea: 1.70,
top10AboveExternalArea: 4.00,
toughenedBottom8AboveInternalArea: 4.00,
laminatedBottom8_8AboveInternalArea: 4.00
}),

triple: Object.freeze({
middle6AboveExternalArea: 2.00,
top8AboveExternalArea: 3.20,
top10AboveExternalArea: 5.00,
toughenedBottomThickness: 6,
laminatedBottomThickness: 6.4
})
});

const SUPPLIER_CHARGEABLE_AREA_RULES = Object.freeze({
standardToughened: Object.freeze({
minimumArea: 0.25,
confirmed: true,
note: "Confirmed supplier minimum chargeable area per individual standard Toughened pane."
}),

laminated: Object.freeze({
minimumArea: 0.35,
confirmed: false,
note: "Unconfirmed supplier price-list minimum. Only apply when explicitly opted in."
})
});

const SUPPORTED_GLAZING = Object.freeze([
"double",
"triple"
]);

const SUPPORTED_FINISHES = Object.freeze([
"clear",
"blue",
"grey",
"satin",
"solarcontrol"
]);

const SUPPORTED_BOTTOM_TYPES = Object.freeze([
"tough",
"lam"
]);

function normaliseNumber(value, fieldName, options = {}) {
const {
allowZero = false
} = options;

const numeric = Number(value);
const minimumIsValid = allowZero ? numeric >= 0 : numeric > 0;

if (!Number.isFinite(numeric) || !minimumIsValid) {
throw new TypeError(
`${fieldName} must be a finite ${allowZero ? "non-negative" : "positive"} number.`
);
}

return numeric;
}

function normaliseChoice(value, allowedValues, fieldName) {
const normalised = String(value ?? "")
.trim()
.toLowerCase();

if (!allowedValues.includes(normalised)) {
throw new TypeError(
`${fieldName} must be one of: ${allowedValues.join(", ")}.`
);
}

return normalised;
}

function calculateAreaFromMillimetres(width, length) {
const safeWidth = normaliseNumber(width, "width");
const safeLength = normaliseNumber(length, "length");

return (safeWidth * safeLength) / 1000000;
}

function calculateExternalDimensions(
internalWidth,
internalLength,
border = DEFAULT_BORDER_MM
) {
const safeInternalWidth = normaliseNumber(internalWidth, "internalWidth");
const safeInternalLength = normaliseNumber(internalLength, "internalLength");
const safeBorder = normaliseNumber(border, "border", { allowZero: true });

return {
width: safeInternalWidth + (safeBorder * 2),
length: safeInternalLength + (safeBorder * 2),
border: safeBorder
};
}

function calculateInternalArea(internalWidth, internalLength) {
return calculateAreaFromMillimetres(internalWidth, internalLength);
}

function calculateExternalArea(
internalWidth,
internalLength,
border = DEFAULT_BORDER_MM
) {
const external = calculateExternalDimensions(
internalWidth,
internalLength,
border
);

return calculateAreaFromMillimetres(external.width, external.length);
}

function getDoubleTopThickness(externalArea) {
const area = normaliseNumber(externalArea, "externalArea");
const rules = UNIT_RULES.double;

if (area < rules.top8FromExternalArea) {
return 6;
}

if (area <= rules.top10AboveExternalArea) {
return 8;
}

return 10;
}

function getDoubleBottomSpecification(internalArea, bottomType = "tough") {
const area = normaliseNumber(internalArea, "internalArea");
const type = normaliseChoice(
bottomType,
SUPPORTED_BOTTOM_TYPES,
"bottomType"
);

if (type === "lam") {
const thickness =
area <= UNIT_RULES.double.laminatedBottom8_8AboveInternalArea
? 6.4
: 8.8;

return {
thickness,
material: "laminated-softcoat",
construction: "laminated",
softcoat: true,
label: `${thickness}mm Laminated Softcoat`
};
}

const thickness =
area <= UNIT_RULES.double.toughenedBottom8AboveInternalArea
? 6
: 8;

return {
thickness,
material: "toughened-softcoat",
construction: "toughened",
softcoat: true,
label: `${thickness}mm Toughened Softcoat`
};
}

function getTripleSpecification(externalArea, bottomType = "tough") {
const area = normaliseNumber(externalArea, "externalArea");
const type = normaliseChoice(
bottomType,
SUPPORTED_BOTTOM_TYPES,
"bottomType"
);

const rules = UNIT_RULES.triple;

let topThickness = 6;
let middleThickness = 4;

if (area > rules.middle6AboveExternalArea) {
middleThickness = 6;
}

if (area > rules.top8AboveExternalArea) {
topThickness = 8;
}

if (area > rules.top10AboveExternalArea) {
topThickness = 10;
}

const bottomThickness =
type === "lam"
? rules.laminatedBottomThickness
: rules.toughenedBottomThickness;

return {
top: {
thickness: topThickness
},
middle: {
thickness: middleThickness
},
bottom: {
thickness: bottomThickness,
material: type === "lam"
? "laminated-softcoat"
: "toughened-softcoat",
construction: type === "lam"
? "laminated"
: "toughened",
softcoat: true,
label: type === "lam"
? `${bottomThickness}mm Laminated Softcoat`
: `${bottomThickness}mm Toughened Softcoat`
}
};
}

function normaliseChargeableAreaCategory(category) {
const normalised = String(category ?? "standard-toughened")
.trim()
.toLowerCase()
.replace(/[\s_]+/g, "-");

if (
normalised === "standard-toughened" ||
normalised === "standardtoughened" ||
normalised === "toughened"
) {
return "standardToughened";
}

if (
normalised === "laminated" ||
normalised === "lam" ||
normalised === "laminated-softcoat"
) {
return "laminated";
}

throw new TypeError(
"glassCategory must be standard-toughened or laminated."
);
}

function getChargeableAreaDetails(
actualPaneArea,
glassCategory = "standard-toughened",
options = {}
) {
const actualArea = normaliseNumber(actualPaneArea, "actualPaneArea");
const category = normaliseChargeableAreaCategory(glassCategory);

if (category === "standardToughened") {
const rule = SUPPLIER_CHARGEABLE_AREA_RULES.standardToughened;
const chargeableArea = Math.max(actualArea, rule.minimumArea);

return {
actualArea,
chargeableArea,
minimumArea: rule.minimumArea,
minimumApplied: chargeableArea > actualArea,
ruleConfirmed: rule.confirmed,
category: "standard-toughened",
note: rule.note
};
}

const laminatedRule = SUPPLIER_CHARGEABLE_AREA_RULES.laminated;
const useUnconfirmedLaminatedMinimum =
options.useUnconfirmedLaminatedMinimum === true;

const configuredLaminatedMinimum =
options.laminatedMinimumArea === undefined
? laminatedRule.minimumArea
: normaliseNumber(
options.laminatedMinimumArea,
"laminatedMinimumArea",
{ allowZero: true }
);

const chargeableArea = useUnconfirmedLaminatedMinimum
? Math.max(actualArea, configuredLaminatedMinimum)
: actualArea;

return {
actualArea,
chargeableArea,
minimumArea: configuredLaminatedMinimum,
minimumApplied:
useUnconfirmedLaminatedMinimum && chargeableArea > actualArea,
ruleConfirmed: false,
unconfirmedMinimumOptedIn: useUnconfirmedLaminatedMinimum,
category: "laminated",
note: laminatedRule.note
};
}

function getChargeableArea(
actualPaneArea,
glassCategory = "standard-toughened",
options = {}
) {
return getChargeableAreaDetails(
actualPaneArea,
glassCategory,
options
).chargeableArea;
}

function getTopPaneFinish(finish) {
if (finish === "blue") {
return "blue";
}

if (finish === "grey") {
return "grey";
}

if (finish === "solarcontrol") {
return "solarcontrol";
}

return "clear";
}

function getBottomPaneFinish(finish) {
return finish === "satin" ? "satin" : "clear";
}

function getTopPaneMaterial(finish) {
if (finish === "blue") {
return {
material: "blue-toughened",
construction: "toughened",
materialLabel: "Blue Toughened"
};
}

if (finish === "grey") {
return {
material: "grey-toughened",
construction: "toughened",
materialLabel: "Grey Toughened"
};
}

if (finish === "solarcontrol") {
return {
material: "solar-control-toughened",
construction: "toughened",
materialLabel: "Solar Control Toughened"
};
}

return {
material: "clear-toughened",
construction: "toughened",
materialLabel: "Clear Toughened"
};
}

function createPane({
role,
thickness,
material,
construction,
materialLabel,
width,
length,
finish,
softcoat = false
}) {
return {
role,
thickness,
material,
construction,
materialLabel,
width,
length,
actualArea: calculateAreaFromMillimetres(width, length),
finish,
softcoat
};
}

function createUnsupportedResult(input, reason, details = {}) {
return {
supported: false,
reason,
input: {
internalWidth: input?.internalWidth ?? null,
internalLength: input?.internalLength ?? null,
border: input?.border ?? DEFAULT_BORDER_MM,
glazing: input?.glazing ?? null,
finish: input?.finish ?? null,
bottomType: input?.bottomType ?? null
},
...details
};
}

function getUnitMakeup(input = {}) {
try {
const internalWidth = normaliseNumber(
input.internalWidth,
"internalWidth"
);

const internalLength = normaliseNumber(
input.internalLength,
"internalLength"
);

const border =
input.border === undefined ||
input.border === null ||
input.border === ""
? DEFAULT_BORDER_MM
: normaliseNumber(
input.border,
"border",
{ allowZero: true }
);

const glazing = normaliseChoice(
input.glazing,
SUPPORTED_GLAZING,
"glazing"
);

const finish = normaliseChoice(
input.finish,
SUPPORTED_FINISHES,
"finish"
);

const bottomType = normaliseChoice(
input.bottomType,
SUPPORTED_BOTTOM_TYPES,
"bottomType"
);

const external = calculateExternalDimensions(
internalWidth,
internalLength,
border
);

const internalArea = calculateInternalArea(
internalWidth,
internalLength
);

const externalArea = calculateAreaFromMillimetres(
external.width,
external.length
);

const commonResult = {
internal: {
width: internalWidth,
length: internalLength,
area: internalArea
},

external: {
width: external.width,
length: external.length,
area: externalArea
},

border,
glazing,
finish,
bottomType
};

if (
finish === "satin" &&
bottomType === "lam"
) {
return {
...commonResult,
panes: null,
makeupLabel: null,
supported: false,
reason: "Satin Laminated is currently unavailable/unpriced. No make-up is defined for this combination."
};
}

const topMaterial =
getTopPaneMaterial(
finish
);

const topPaneFinish =
getTopPaneFinish(
finish
);

const bottomPaneFinish =
getBottomPaneFinish(
finish
);

if (
glazing === "double"
) {
const topThickness =
getDoubleTopThickness(
externalArea
);

const bottomSpecification =
getDoubleBottomSpecification(
internalArea,
bottomType
);

const top =
createPane({
role: "top",
thickness: topThickness,
material: topMaterial.material,
construction: topMaterial.construction,
materialLabel: topMaterial.materialLabel,
width: external.width,
length: external.length,
finish: topPaneFinish,
softcoat: false
});

const bottom =
createPane({
role: "bottom",
thickness: bottomSpecification.thickness,
material: bottomSpecification.material,
construction: bottomSpecification.construction,
materialLabel:
bottomSpecification.label.replace(
/^\d+(?:\.\d+)?mm\s+/,
""
),
width: internalWidth,
length: internalLength,
finish: bottomPaneFinish,
softcoat: true
});

const makeupLabel =
bottomType === "lam"
? `${topThickness} / ${bottomSpecification.thickness} Laminated Softcoat`
: `${topThickness} / ${bottomSpecification.thickness} Softcoat`;

return {
...commonResult,

panes: {
top,
middle: null,
bottom
},

makeupLabel,
supported: true,
reason: null
};
}

const tripleSpecification =
getTripleSpecification(
externalArea,
bottomType
);

const top =
createPane({
role: "top",
thickness:
tripleSpecification.top.thickness,
material:
topMaterial.material,
construction:
topMaterial.construction,
materialLabel:
topMaterial.materialLabel,
width:
external.width,
length:
external.length,
finish:
topPaneFinish,
softcoat:false
});

const middle =
createPane({
role:"middle",
thickness:
tripleSpecification.middle.thickness,
material:
"clear-toughened",
construction:
"toughened",
materialLabel:
"Clear Toughened",
width:
internalWidth,
length:
internalLength,
finish:
"clear",
softcoat:false
});

const bottom =
createPane({
role:"bottom",
thickness:
tripleSpecification.bottom.thickness,
material:
tripleSpecification.bottom.material,
construction:
tripleSpecification.bottom.construction,
materialLabel:
tripleSpecification.bottom.label.replace(
/^\d+(?:\.\d+)?mm\s+/,
""
),
width:
internalWidth,
length:
internalLength,
finish:
bottomPaneFinish,
softcoat:true
});

const makeupLabel =
bottomType === "lam"
? `${top.thickness} / ${middle.thickness} / ${bottom.thickness} Laminated Softcoat`
: `${top.thickness} / ${middle.thickness} / ${bottom.thickness} Softcoat`;

return {
...commonResult,

panes: {
top,
middle,
bottom
},

makeupLabel,
supported:true,
reason:null
};
}
catch (
error
) {
return createUnsupportedResult(
input,
error instanceof Error
? error.message
: "Invalid unit make-up input."
);
}
}

return Object.freeze({
DEFAULT_BORDER_MM,
UNIT_RULES,
SUPPLIER_CHARGEABLE_AREA_RULES,
calculateExternalDimensions,
calculateInternalArea,
calculateExternalArea,
getDoubleTopThickness,
getDoubleBottomSpecification,
getTripleSpecification,
getChargeableArea,
getChargeableAreaDetails,
getUnitMakeup
});
});
