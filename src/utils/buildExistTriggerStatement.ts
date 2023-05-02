import { buildTriggerName } from './buildTriggerName';

export const buildExistTriggerStatement = (
  independentTableName: string,
  independentTableColumnName: string,
  dependentTableName: string,
  dependentTableColumnName: string,
): string => /* sql */ `
SELECT
  EXISTS (
    SELECT
      1
    FROM
      INFORMATION_SCHEMA.TRIGGERS
    WHERE
      EVENT_OBJECT_TABLE = '${independentTableName}'
      AND TRIGGER_NAME LIKE '${buildTriggerName(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName)}'

  )
`;
