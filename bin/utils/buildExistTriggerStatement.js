"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExistTriggerStatement = void 0;
const buildTriggerName_1 = require("./buildTriggerName");
const buildExistTriggerStatement = (independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName) => /* sql */ `
SELECT
  EXISTS (
    SELECT
      1
    FROM
      INFORMATION_SCHEMA.TRIGGERS
    WHERE
      EVENT_OBJECT_TABLE = '${independentTableName}'
      AND TRIGGER_NAME LIKE '${(0, buildTriggerName_1.buildTriggerName)(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName)}'

  )
`;
exports.buildExistTriggerStatement = buildExistTriggerStatement;
