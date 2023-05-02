import { buildTriggerName } from './buildTriggerName';

export const getTriggersInformation = (
  independentTableName: string,
  independentTableColumnName: string,
  dependentTableName: string,
  dependentTableColumnName: string,
): string => /* sql */ `
  SELECT
    ACTION_STATEMENT, EVENT_OBJECT_TABLE
  FROM
    INFORMATION_SCHEMA.TRIGGERS
  WHERE
    TRIGGER_NAME LIKE '${buildTriggerName(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName)}'
`;
