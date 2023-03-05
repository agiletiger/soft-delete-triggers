"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTriggersInformation = void 0;
const buildTriggerName_1 = require("./buildTriggerName");
const getTriggersInformation = (primaryTable, foreignTable) => /* sql */ `
  SELECT
    ACTION_STATEMENT, EVENT_OBJECT_TABLE
  FROM
    INFORMATION_SCHEMA.TRIGGERS
  WHERE
    TRIGGER_NAME LIKE '${(0, buildTriggerName_1.buildTriggerName)(primaryTable, foreignTable)}'
`;
exports.getTriggersInformation = getTriggersInformation;
