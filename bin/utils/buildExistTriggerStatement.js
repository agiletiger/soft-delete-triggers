"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExistTriggerStatement = void 0;
const buildTriggerName_1 = require("./buildTriggerName");
const buildExistTriggerStatement = (primaryTable, foreignTable) => /* sql */ `
SELECT
  EXISTS (
    SELECT
      1
    FROM
      INFORMATION_SCHEMA.TRIGGERS
    WHERE
      EVENT_OBJECT_TABLE = '${primaryTable}'
      AND TRIGGER_NAME = '${(0, buildTriggerName_1.buildTriggerName)(primaryTable, foreignTable)}'
  )
`;
exports.buildExistTriggerStatement = buildExistTriggerStatement;
