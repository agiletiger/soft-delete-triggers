"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCreateTriggerStatement = void 0;
const buildTriggerName_1 = require("./buildTriggerName");
const buildCreateTriggerStatement = (primaryTable, primaryKey, foreignTable, foreignKey) => /* sql */ `
  CREATE TRIGGER ${(0, buildTriggerName_1.buildTriggerName)(primaryTable, foreignTable)}
  AFTER UPDATE
  ON \`${primaryTable}\` FOR EACH ROW
  BEGIN
    IF \`OLD\`.\`deletedAt\` IS NULL AND \`NEW\`.\`deletedAt\` IS NOT NULL THEN
      UPDATE \`${foreignTable}\`
        SET \`${foreignTable}\`.\`deletedAt\` = NOW()
      WHERE \`${foreignTable}\`.\`${foreignKey}\` = \`NEW\`.\`${primaryKey}\`;
    END IF;
  END;
`;
exports.buildCreateTriggerStatement = buildCreateTriggerStatement;
