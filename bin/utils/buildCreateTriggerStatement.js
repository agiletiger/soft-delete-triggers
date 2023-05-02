"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCreateTriggerStatement = void 0;
const buildTriggerName_1 = require("./buildTriggerName");
const buildCreateTriggerStatement = (independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName) => /* sql */ `
  CREATE TRIGGER ${(0, buildTriggerName_1.buildTriggerName)(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName)}
  AFTER UPDATE
  ON \`${independentTableName}\` FOR EACH ROW
  BEGIN
    -- begin paranoid sequelize delete metadata
    -- independentTableName: ${independentTableName}
    -- independentTableColumnName: ${independentTableColumnName}
    -- dependentTableName: ${dependentTableName}
    -- dependentTableColumnName: ${dependentTableColumnName}
    -- end paranoid sequelize delete metadata
    IF \`OLD\`.\`deletedAt\` IS NULL AND \`NEW\`.\`deletedAt\` IS NOT NULL THEN
      UPDATE \`${dependentTableName}\`
        SET \`${dependentTableName}\`.\`deletedAt\` = NOW()
      WHERE \`${dependentTableName}\`.\`${dependentTableColumnName}\` = \`NEW\`.\`${independentTableColumnName}\`;
    END IF;
  END;
`;
exports.buildCreateTriggerStatement = buildCreateTriggerStatement;
