"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTriggerName = void 0;
// MYSQL has a limit of 63 chars on triggers name
// if larger we remove the vowels hoping the trigger name will fit in 63 chars
const MAX_TRIGGER_NAME_LENGTH = 63;
const buildTriggerName = (independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName) => `on_${independentTableName.replace(/[aeiou]/gi, '')}_${independentTableColumnName.replace(/[aeiou]/gi, '')}_del_upd_${dependentTableName.replace(/[aeiou]/gi, '')}_${dependentTableColumnName.replace(/[aeiou]/gi, '')}`.substring(0, MAX_TRIGGER_NAME_LENGTH);
exports.buildTriggerName = buildTriggerName;
