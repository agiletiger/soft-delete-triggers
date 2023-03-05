import { buildTriggerName } from './buildTriggerName';

export const getTriggersInformation = (
  primaryTable: string,
  foreignTable: string,
): string => /* sql */ `
  SELECT
    ACTION_STATEMENT, EVENT_OBJECT_TABLE
  FROM
    INFORMATION_SCHEMA.TRIGGERS
  WHERE
    TRIGGER_NAME LIKE '${buildTriggerName(primaryTable, foreignTable)}'
`;
