"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapSelectMany = exports.unwrapSelectOneValue = void 0;
const unwrapSelectOneValue = (res) => Object.values(res[0])[0];
exports.unwrapSelectOneValue = unwrapSelectOneValue;
const unwrapSelectMany = (res) => res;
exports.unwrapSelectMany = unwrapSelectMany;
