import { buildTriggerName } from './buildTriggerName';

export const buildDropTriggerStatement = (
  primaryTable: string,
  foreignTable: string,
): string => /* sql */ `
  DROP TRIGGER ${buildTriggerName(primaryTable, foreignTable)}
`;
