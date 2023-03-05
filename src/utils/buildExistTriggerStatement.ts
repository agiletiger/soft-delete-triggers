import { buildTriggerName } from './buildTriggerName';

export const buildExistTriggerStatement = (
  primaryTable: string,
  foreignTable: string,
): string => /* sql */ `
SELECT
  EXISTS (
    SELECT
      1
    FROM
      INFORMATION_SCHEMA.TRIGGERS
    WHERE
      EVENT_OBJECT_TABLE = '${primaryTable}'
      AND TRIGGER_NAME = '${buildTriggerName(primaryTable, foreignTable)}'
  )
`;
