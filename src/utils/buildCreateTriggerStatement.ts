import { buildTriggerName } from './buildTriggerName';

export const buildCreateTriggerStatement = (
  independentTableName: string,
  independentTableColumnName: string,
  dependentTableName: string,
  dependentTableColumnName: string,
): string => /* sql */ `
  CREATE TRIGGER ${buildTriggerName(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName)}
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
