/*
* Factory Toughened Rooflights
* master-pricing.js
*
* MASTER SITEWIDE PRICE ROUTER
*
* PURPOSE
* - Reads the active strategy from site-pricing-config.js.
* - Routes every product-price request to exactly one live strategy file:
* pricing-cheap.js
* pricing-normal.js
* pricing-expensive.js
* - Supports both standard Order Page prices and custom-calculator prices.
* - Routes Self Cleaning add-on requests to the active strategy.
* - Returns final customer PRODUCT prices only.
* - Customer delivery remains separate in master-delivery-rates.js.
*
* IMPORTANT
* - This file does NOT contain supplier glass costs.
* - This file does NOT calculate manufacturing costs.
* - This file does NOT calculate Stripe fees.
* - This file does NOT calculate VAT / retained-revenue allowances.
* - This file does NOT calculate customer delivery charges.
* - This file does NOT calculate actual delivery costs.
* - This file does NOT alter the prices returned by a strategy file.
* - Self Cleaning remains a separate strategy-owned add-on and is not baked
* into the base product price by this router.
* - There is NO automatic fallback to another pricing strategy.
*
* EXPECTED BROWSER LOAD ORDER
*
* 1. pricing-cheap.js
* 2. pricing-normal.js
* 3. pricing-expensive.js
* 4. site-pricing-config.js
* 5. master-pricing.js
*
* pricing-expensive.js currently depends on pricing-normal.js, so Normal must
* be loaded before Expensive.
*
* SITEWIDE STRATEGY SWITCH
*
* Change only the active strategy in site-pricing-config.js:
*
* "cheap"
* "normal"
* "expensive"
*
* Both the standard Order Page and custom calculator should call THIS file,
* rather than calling a strategy file directly.
*/

(function (globalScope, factory) {
let config = null;
let cheap = null;
let normal = null;
let expensive = null;

if (globalScope) {
config =
globalScope.FactoryRooflightsSitePricingConfig ||
null;

cheap =
globalScope.FactoryRooflightsPricingCheap ||
null;

normal =
globalScope.FactoryRooflightsPricingNormal ||
null;

expensive =
globalScope.FactoryRooflightsPricingExpensive ||
null;
}

if (
typeof module !== "undefined" &&
module.exports &&
typeof require === "function"
) {
if (!cheap) {
cheap = require("./pricing-cheap.js");
}

if (!normal) {
normal = require("./pricing-normal.js");
}

if (!expensive) {
expensive = require("./pricing-expensive.js");
}

if (!config) {
config = require("./site-pricing-config.js");
}
}

const api = factory({
config,
cheap,
normal,
expensive
});

if (typeof module !== "undefined" && module.exports) {
module.exports = api;
}

if (globalScope) {
globalScope.FactoryRooflightsMasterPricing = api;
}
})(typeof globalThis !== "undefined" ? globalThis : this, function (dependencies) {
"use strict";

const MASTER_ID = "master-pricing";
const MASTER_VERSION = "2026-09-08-1";

const PRICE_UNAVAILABLE = "PRICE_UNAVAILABLE";
const STRATEGY_UNAVAILABLE = "STRATEGY_UNAVAILABLE";
const INVALID_PRICING_REQUEST = "INVALID_PRICING_REQUEST";

const config = dependencies?.config || null;

const STRATEGIES = Object.freeze({
cheap: dependencies?.cheap || null,
normal: dependencies?.normal || null,
expensive: dependencies?.expensive || null
});

const ALLOWED_STRATEGIES = Object.freeze([
"cheap",
"normal",
"expensive"
]);

/* =========================================
* INITIAL VALIDATION
* ========================================= */

function normalizeStrategy(strategy) {
const value = String(strategy ?? "")
.trim()
.toLowerCase();

return ALLOWED_STRATEGIES.includes(value)
? value
: null;
}

function validateStrategyModule(
strategyId,
strategyModule
) {
if (
!strategyModule ||
typeof strategyModule !== "object"
) {
return false;
}

if (
strategyModule.STRATEGY_ID !==
strategyId
) {
return false;
}

if (
typeof strategyModule.getPrice !==
"function"
) {
return false;
}

if (
typeof strategyModule.getStandardPrice !==
"function"
) {
return false;
}

if (
typeof strategyModule.getCustomPrice !==
"function"
) {
return false;
}

return true;
}

function assertDependencies() {
if (
!config ||
typeof config !== "object"
) {
throw new Error(
"master-pricing.js requires site-pricing-config.js to be loaded first."
);
}

const configuredStrategy =
normalizeStrategy(
config.activeStrategy ??
(
typeof config.getActiveStrategy ===
"function"
? config.getActiveStrategy()
: null
)
);

if (!configuredStrategy) {
throw new Error(
"master-pricing.js could not resolve a valid active pricing strategy."
);
}

ALLOWED_STRATEGIES.forEach(
strategyId => {
const strategyModule =
STRATEGIES[strategyId];

if (
!validateStrategyModule(
strategyId,
strategyModule
)
) {
throw new Error(
`master-pricing.js requires a valid ${strategyId} pricing strategy module.`
);
}
}
);
}

assertDependencies();

/* =========================================
* ACTIVE STRATEGY
* ========================================= */

function getActiveStrategyId() {
const configuredStrategy =
typeof config.getActiveStrategy ===
"function"
? config.getActiveStrategy()
: config.activeStrategy;

return normalizeStrategy(
configuredStrategy
);
}

function getStrategyModule(strategy) {
const strategyId =
normalizeStrategy(strategy);

if (!strategyId) {
return null;
}

const strategyModule =
STRATEGIES[strategyId];

return validateStrategyModule(
strategyId,
strategyModule
)
? strategyModule
: null;
}

function getActiveStrategyModule() {
return getStrategyModule(
getActiveStrategyId()
);
}

function getActiveStrategyLabel() {
const strategy =
getActiveStrategyModule();

return (
strategy?.STRATEGY_LABEL ||
null
);
}

/* =========================================
* REQUEST NORMALISATION
* ========================================= */

function normalizePricingMode(mode) {
const value = String(mode ?? "")
.trim()
.toLowerCase();

if (value === "standard") {
return "standard";
}

if (value === "custom") {
return "custom";
}

return null;
}

function normalizeRequest(options = {}) {
if (
!options ||
typeof options !== "object"
) {
return null;
}

return {
...options,

pricingMode:
normalizePricingMode(
options.pricingMode ??
options.mode
) || undefined
};
}

/* =========================================
* MASTER RESULT HELPERS
* ========================================= */

function buildUnavailableResult({
strategyId = null,
pricingMode = null,
reasonCode = PRICE_UNAVAILABLE,
reason = "Price unavailable.",
strategyResult = null,
request = null
} = {}) {
return {
available: false,

master: MASTER_ID,
masterVersion: MASTER_VERSION,

strategy: strategyId,

strategyLabel:
getStrategyModule(
strategyId
)?.STRATEGY_LABEL ||
null,

pricingMode,

source:
strategyResult?.source ||
null,

reasonCode,
reason,

price: null,

request,
strategyResult
};
}

function wrapStrategyResult({
strategyId,
pricingMode,
request,
strategyResult
}) {
if (
!strategyResult ||
strategyResult.available !== true ||
!Number.isFinite(
Number(strategyResult.price)
)
) {
return buildUnavailableResult({
strategyId,
pricingMode,

reasonCode:
strategyResult?.reasonCode ||
PRICE_UNAVAILABLE,

reason:
strategyResult?.reason ||
"The selected pricing strategy could not return a price for this product.",

strategyResult,
request
});
}

const price =
Number(
strategyResult.price
);

const basePriceCandidate =
Number(
strategyResult.basePrice
);

const selfCleaningAddOnCandidate =
Number(
strategyResult.selfCleaningAddOn
);

return {
available: true,

master: MASTER_ID,
masterVersion: MASTER_VERSION,

strategy: strategyId,

strategyLabel:
strategyResult.strategyLabel ||
getStrategyModule(
strategyId
)?.STRATEGY_LABEL ||
null,

strategyVersion:
strategyResult.strategyVersion ||
getStrategyModule(
strategyId
)?.STRATEGY_VERSION ||
null,

pricingMode,

source:
strategyResult.source ||
pricingMode,

reasonCode: null,
reason: null,

size:
strategyResult.size ??
null,

width:
strategyResult.width ??
null,

length:
strategyResult.length ??
null,

glazing:
strategyResult.glazing ??
null,

finish:
strategyResult.finish ??
null,

type:
strategyResult.type ??
null,

border:
strategyResult.border ??
null,

price,

basePrice:
Number.isFinite(
basePriceCandidate
)
? basePriceCandidate
: price,

selfCleaningAddOn:
Number.isFinite(
selfCleaningAddOnCandidate
)
? selfCleaningAddOnCandidate
: null,

selfCleaningNearestStandardSize:
strategyResult.selfCleaningNearestStandardSize ??
strategyResult.nearestStandardSize ??
null,

selfCleaningReasonCode:
strategyResult.selfCleaningReasonCode ??
null,

pricingSizeBand:
strategyResult.pricingSizeBand ??
null,

referenceExternalDimensions:
strategyResult.referenceExternalDimensions ??
null,

customPriceMultiplier:
strategyResult.customPriceMultiplier ??
null,

priceBeforeCustomUplift:
strategyResult.priceBeforeCustomUplift ??
null,

interpolationAnchors:
strategyResult.interpolationAnchors ??
null,

request,
strategyResult
};
}

function buildUnavailableSelfCleaningResult({
strategyId = null,
pricingMode = null,
reasonCode = PRICE_UNAVAILABLE,
reason = "Self Cleaning price unavailable.",
strategyResult = null,
request = null
} = {}) {
return {
available: false,

master: MASTER_ID,
masterVersion: MASTER_VERSION,

strategy: strategyId,

strategyLabel:
getStrategyModule(
strategyId
)?.STRATEGY_LABEL ||
null,

strategyVersion:
getStrategyModule(
strategyId
)?.STRATEGY_VERSION ||
null,

pricingMode,

source:
strategyResult?.source ||
`${pricingMode || "self-cleaning"}-self-cleaning`,

reasonCode,
reason,

selfCleaningAddOn: null,
addOn: null,
addon: null,
amount: null,
price: null,

nearestStandardSize:
strategyResult?.nearestStandardSize ??
strategyResult?.selfCleaningNearestStandardSize ??
null,

request,
strategyResult
};
}

function wrapSelfCleaningStrategyResult({
strategyId,
pricingMode,
request,
strategyResult
}) {
if (
!strategyResult ||
strategyResult.available !== true
) {
return buildUnavailableSelfCleaningResult({
strategyId,
pricingMode,

reasonCode:
strategyResult?.reasonCode ||
PRICE_UNAVAILABLE,

reason:
strategyResult?.reason ||
"The selected pricing strategy could not return a Self Cleaning price.",

strategyResult,
request
});
}

const amountCandidates = [
strategyResult.selfCleaningAddOn,
strategyResult.addOn,
strategyResult.addon,
strategyResult.addOnPrice,
strategyResult.addonPrice,
strategyResult.selfCleaningPrice,
strategyResult.surcharge,
strategyResult.amount,
strategyResult.price
];

const amount =
amountCandidates
.map(Number)
.find(
candidate =>
Number.isFinite(candidate) &&
candidate > 0
);

if (
!Number.isFinite(
amount
)
) {
return buildUnavailableSelfCleaningResult({
strategyId,
pricingMode,

reasonCode:
strategyResult.reasonCode ||
PRICE_UNAVAILABLE,

reason:
strategyResult.reason ||
"The selected pricing strategy did not return a valid Self Cleaning add-on.",

strategyResult,
request
});
}

return {
available: true,

master: MASTER_ID,
masterVersion: MASTER_VERSION,

strategy: strategyId,

strategyLabel:
strategyResult.strategyLabel ||
getStrategyModule(
strategyId
)?.STRATEGY_LABEL ||
null,

strategyVersion:
strategyResult.strategyVersion ||
getStrategyModule(
strategyId
)?.STRATEGY_VERSION ||
null,

pricingMode,

source:
strategyResult.source ||
`${pricingMode || "self-cleaning"}-self-cleaning`,

reasonCode: null,
reason: null,

size:
strategyResult.size ??
request?.size ??
null,

width:
strategyResult.width ??
request?.width ??
request?.internalWidth ??
null,

length:
strategyResult.length ??
request?.length ??
request?.internalLength ??
null,

nearestStandardSize:
strategyResult.nearestStandardSize ??
strategyResult.selfCleaningNearestStandardSize ??
null,

distance:
strategyResult.distance ??
null,

selfCleaningAddOn:
amount,

addOn:
amount,

addon:
amount,

amount:
amount,

price:
amount,

request,
strategyResult
};
}

/* =========================================
* ROUTING
* ========================================= */

function resolveStrategyId(options = {}) {
/*
* By default ALL live site pricing uses
* site-pricing-config.js.
*
* strategyOverride exists only for deliberate
* admin/testing use.
*
* Normal Order Page / Custom Calculator code
* should NOT send strategyOverride.
*/

if (
options.strategyOverride !==
undefined
) {
return normalizeStrategy(
options.strategyOverride
);
}

return getActiveStrategyId();
}

function routePriceRequest(
options = {},
forcedMode = null
) {
const request =
normalizeRequest(options);

if (!request) {
return buildUnavailableResult({
strategyId:
getActiveStrategyId(),

pricingMode:
forcedMode,

reasonCode:
INVALID_PRICING_REQUEST,

reason:
"Invalid pricing request.",

request: null
});
}

const strategyId =
resolveStrategyId(request);

const strategy =
getStrategyModule(
strategyId
);

if (
!strategyId ||
!strategy
) {
return buildUnavailableResult({
strategyId,

pricingMode:
forcedMode ||
request.pricingMode ||
null,

reasonCode:
STRATEGY_UNAVAILABLE,

reason:
"The requested pricing strategy is unavailable.",

request
});
}

const requestedMode =
forcedMode ||
request.pricingMode ||
null;

let strategyResult;
let resolvedMode =
requestedMode;

try {
if (
requestedMode ===
"standard"
) {
strategyResult =
strategy.getStandardPrice({
...request,
pricingMode: "standard"
});
}
else if (
requestedMode ===
"custom"
) {
strategyResult =
strategy.getCustomPrice({
...request,
pricingMode: "custom"
});
}
else {
strategyResult =
strategy.getPrice(
request
);

if (
strategyResult?.source ===
"standard"
) {
resolvedMode =
"standard";
}
else if (
strategyResult?.source ===
"custom" ||
strategyResult?.source ===
"custom-interpolation" ||
strategyResult?.source ===
"exact-standard-size" ||
strategyResult?.source ===
"exact-anchor"
) {
resolvedMode =
"custom";
}
}
}
catch (error) {
return buildUnavailableResult({
strategyId,

pricingMode:
requestedMode,

reasonCode:
PRICE_UNAVAILABLE,

reason:
error instanceof Error
? error.message
: "The selected pricing strategy failed to calculate a price.",

request
});
}

return wrapStrategyResult({
strategyId,
pricingMode:
resolvedMode,
request,
strategyResult
});
}

/* =========================================
* SELF CLEANING ROUTING
*
* The active strategy remains authoritative.
* No cross-strategy fallback is used.
* ========================================= */

function inferSelfCleaningPricingMode(
request,
forcedMode = null
) {
if (
forcedMode === "standard" ||
forcedMode === "custom"
) {
return forcedMode;
}

const explicitMode =
normalizePricingMode(
request?.pricingMode ??
request?.mode
);

if (explicitMode) {
return explicitMode;
}

const source =
String(
request?.source ??
""
)
.trim()
.toLowerCase();

if (
source === "standard" ||
source === "standard-self-cleaning"
) {
return "standard";
}

if (
source === "custom" ||
source === "custom-self-cleaning" ||
source === "custom-self-cleaning-nearest-size"
) {
return "custom";
}

if (
request?.custom === true
) {
return "custom";
}

return null;
}

function getStrategySelfCleaningMethod(
strategy,
pricingMode
) {
if (!strategy) {
return null;
}

if (
pricingMode === "standard" &&
typeof strategy.getStandardSelfCleaningAddOn ===
"function"
) {
return {
name:
"getStandardSelfCleaningAddOn",

method:
strategy.getStandardSelfCleaningAddOn
};
}

if (
pricingMode === "custom" &&
typeof strategy.getCustomSelfCleaningAddOn ===
"function"
) {
return {
name:
"getCustomSelfCleaningAddOn",

method:
strategy.getCustomSelfCleaningAddOn
};
}

if (
typeof strategy.getSelfCleaningAddOn ===
"function"
) {
return {
name:
"getSelfCleaningAddOn",

method:
strategy.getSelfCleaningAddOn
};
}

if (
typeof strategy.getSelfCleaningAddOnValue ===
"function"
) {
return {
name:
"getSelfCleaningAddOnValue",

method:
strategy.getSelfCleaningAddOnValue
};
}

return null;
}

function routeSelfCleaningRequest(
options = {},
forcedMode = null
) {
const request =
normalizeRequest(options);

if (!request) {
return buildUnavailableSelfCleaningResult({
strategyId:
getActiveStrategyId(),

pricingMode:
forcedMode,

reasonCode:
INVALID_PRICING_REQUEST,

reason:
"Invalid Self Cleaning pricing request.",

request: null
});
}

const strategyId =
resolveStrategyId(request);

const strategy =
getStrategyModule(
strategyId
);

const pricingMode =
inferSelfCleaningPricingMode(
request,
forcedMode
);

if (
!strategyId ||
!strategy
) {
return buildUnavailableSelfCleaningResult({
strategyId,
pricingMode,

reasonCode:
STRATEGY_UNAVAILABLE,

reason:
"The requested pricing strategy is unavailable.",

request
});
}

const strategyMethod =
getStrategySelfCleaningMethod(
strategy,
pricingMode
);

if (!strategyMethod) {
return buildUnavailableSelfCleaningResult({
strategyId,
pricingMode,

reasonCode:
PRICE_UNAVAILABLE,

reason:
"The active pricing strategy does not expose Self Cleaning pricing.",

request
});
}

let strategyResult;

try {
strategyResult =
strategyMethod.method.call(
strategy,
{
...request,

pricingMode:
pricingMode ||
request.pricingMode,

mode:
pricingMode ||
request.mode,

custom:
pricingMode === "custom"
? true
: request.custom
}
);
}
catch (error) {
return buildUnavailableSelfCleaningResult({
strategyId,
pricingMode,

reasonCode:
PRICE_UNAVAILABLE,

reason:
error instanceof Error
? error.message
: "The selected pricing strategy failed to calculate the Self Cleaning add-on.",

request
});
}

/*
* Some strategy modules may expose a numeric
* value helper. Convert that into the same
* object shape used by the full add-on methods.
*/
if (
Number.isFinite(
Number(
strategyResult
)
)
) {
strategyResult = {
available:
Number(
strategyResult
) > 0,

source:
`${pricingMode || "self-cleaning"}-self-cleaning`,

selfCleaningAddOn:
Number(
strategyResult
),

amount:
Number(
strategyResult
)
};
}

return wrapSelfCleaningStrategyResult({
strategyId,
pricingMode,
request,
strategyResult
});
}

/* =========================================
* PUBLIC PRICE METHODS
* ========================================= */

function getPrice(options = {}) {
return routePriceRequest(
options
);
}

function getStandardPrice(
options = {}
) {
return routePriceRequest(
options,
"standard"
);
}

function getCustomPrice(
options = {}
) {
return routePriceRequest(
options,
"custom"
);
}

function getPriceValue(
options = {}
) {
const result =
getPrice(options);

return result.available
? result.price
: null;
}

function getStandardPriceValue(
options = {}
) {
const result =
getStandardPrice(options);

return result.available
? result.price
: null;
}

function getCustomPriceValue(
options = {}
) {
const result =
getCustomPrice(options);

return result.available
? result.price
: null;
}

/* =========================================
* PUBLIC SELF CLEANING METHODS
*
* The ...Price aliases are intentionally
* exposed because existing Order Page code
* checks those names first. They return the
* Self Cleaning ADD-ON result, not a full
* product price.
* ========================================= */

function getStandardSelfCleaningAddOn(
options = {}
) {
return routeSelfCleaningRequest(
options,
"standard"
);
}

function getCustomSelfCleaningAddOn(
options = {}
) {
return routeSelfCleaningRequest(
options,
"custom"
);
}

function getSelfCleaningAddOn(
options = {}
) {
return routeSelfCleaningRequest(
options
);
}

function getStandardSelfCleaningAddOnValue(
options = {}
) {
const result =
getStandardSelfCleaningAddOn(
options
);

return result.available
? result.selfCleaningAddOn
: null;
}

function getCustomSelfCleaningAddOnValue(
options = {}
) {
const result =
getCustomSelfCleaningAddOn(
options
);

return result.available
? result.selfCleaningAddOn
: null;
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

function getStandardSelfCleaningPrice(
options = {}
) {
return getStandardSelfCleaningAddOn(
options
);
}

function getCustomSelfCleaningPrice(
options = {}
) {
return getCustomSelfCleaningAddOn(
options
);
}

function getSelfCleaningPrice(
options = {}
) {
return getSelfCleaningAddOn(
options
);
}

function getSelfCleaningAddon(
options = {}
) {
return getSelfCleaningAddOn(
options
);
}

/* =========================================
* STRATEGY COMPARISON / ADMIN HELPERS
*
* These do NOT change the active strategy.
* Useful for internal checking only.
* ========================================= */

function getPriceForStrategy(
strategy,
options = {}
) {
const strategyId =
normalizeStrategy(
strategy
);

if (!strategyId) {
return buildUnavailableResult({
strategyId: null,

pricingMode:
normalizePricingMode(
options.pricingMode ??
options.mode
),

reasonCode:
STRATEGY_UNAVAILABLE,

reason:
"Invalid pricing strategy.",

request:
options
});
}

return routePriceRequest({
...options,
strategyOverride:
strategyId
});
}

function getSelfCleaningAddOnForStrategy(
strategy,
options = {}
) {
const strategyId =
normalizeStrategy(
strategy
);

if (!strategyId) {
return buildUnavailableSelfCleaningResult({
strategyId: null,

pricingMode:
normalizePricingMode(
options.pricingMode ??
options.mode
),

reasonCode:
STRATEGY_UNAVAILABLE,

reason:
"Invalid pricing strategy.",

request:
options
});
}

return routeSelfCleaningRequest({
...options,
strategyOverride:
strategyId
});
}

function compareStrategies(
options = {}
) {
return Object.freeze({
cheap:
getPriceForStrategy(
"cheap",
options
),

normal:
getPriceForStrategy(
"normal",
options
),

expensive:
getPriceForStrategy(
"expensive",
options
)
});
}

function compareSelfCleaningStrategies(
options = {}
) {
return Object.freeze({
cheap:
getSelfCleaningAddOnForStrategy(
"cheap",
options
),

normal:
getSelfCleaningAddOnForStrategy(
"normal",
options
),

expensive:
getSelfCleaningAddOnForStrategy(
"expensive",
options
)
});
}

/* =========================================
* STATUS / DEBUG HELPERS
* ========================================= */

function strategyHasSelfCleaningSupport(
strategyModule
) {
return Boolean(
strategyModule &&
(
typeof strategyModule.getSelfCleaningAddOn ===
"function" ||
typeof strategyModule.getStandardSelfCleaningAddOn ===
"function" ||
typeof strategyModule.getCustomSelfCleaningAddOn ===
"function" ||
typeof strategyModule.getSelfCleaningAddOnValue ===
"function"
)
);
}

function getSystemStatus() {
const activeStrategy =
getActiveStrategyId();

return Object.freeze({
master:
MASTER_ID,

masterVersion:
MASTER_VERSION,

activeStrategy,

activeStrategyLabel:
getActiveStrategyLabel(),

allowedStrategies:
ALLOWED_STRATEGIES,

strategies:
Object.freeze({
cheap:
Object.freeze({
loaded:
validateStrategyModule(
"cheap",
STRATEGIES.cheap
),

selfCleaning:
strategyHasSelfCleaningSupport(
STRATEGIES.cheap
),

version:
STRATEGIES.cheap
?.STRATEGY_VERSION ||
null
}),

normal:
Object.freeze({
loaded:
validateStrategyModule(
"normal",
STRATEGIES.normal
),

selfCleaning:
strategyHasSelfCleaningSupport(
STRATEGIES.normal
),

version:
STRATEGIES.normal
?.STRATEGY_VERSION ||
null
}),

expensive:
Object.freeze({
loaded:
validateStrategyModule(
"expensive",
STRATEGIES.expensive
),

selfCleaning:
strategyHasSelfCleaningSupport(
STRATEGIES.expensive
),

version:
STRATEGIES.expensive
?.STRATEGY_VERSION ||
null
})
})
});
}

/* =========================================
* PUBLIC API
* ========================================= */

return Object.freeze({
MASTER_ID,
MASTER_VERSION,

PRICE_UNAVAILABLE,
STRATEGY_UNAVAILABLE,
INVALID_PRICING_REQUEST,

ALLOWED_STRATEGIES,

normalizeStrategy,
normalizePricingMode,
normalizeRequest,

getActiveStrategyId,
getActiveStrategyLabel,
getStrategyModule,
getActiveStrategyModule,

getPrice,
getStandardPrice,
getCustomPrice,

getPriceValue,
getStandardPriceValue,
getCustomPriceValue,

getStandardSelfCleaningAddOn,
getCustomSelfCleaningAddOn,
getSelfCleaningAddOn,

getStandardSelfCleaningAddOnValue,
getCustomSelfCleaningAddOnValue,
getSelfCleaningAddOnValue,

getStandardSelfCleaningPrice,
getCustomSelfCleaningPrice,
getSelfCleaningPrice,
getSelfCleaningAddon,

getPriceForStrategy,
getSelfCleaningAddOnForStrategy,
compareStrategies,
compareSelfCleaningStrategies,

getSystemStatus
});
});
