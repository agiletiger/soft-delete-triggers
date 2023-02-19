import { buildTriggerName } from './buildTriggerName';

export const buildCreateTriggerStatement = (
  primaryTable: string,
  primaryKey: string,
  foreignTable: string,
  foreignKey: string,
): string => /* sql */ `
  CREATE TRIGGER ${buildTriggerName(primaryTable, foreignTable)}
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
