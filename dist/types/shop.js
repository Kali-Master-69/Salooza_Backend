"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopStatus = void 0;
var ShopStatus;
(function (ShopStatus) {
    ShopStatus["DRAFT"] = "DRAFT";
    ShopStatus["READY"] = "READY";
    ShopStatus["ACTIVE"] = "ACTIVE";
    ShopStatus["PAUSED"] = "PAUSED";
    ShopStatus["HIDDEN"] = "HIDDEN"; // Explicitly hidden or system-downgraded
})(ShopStatus || (exports.ShopStatus = ShopStatus = {}));
