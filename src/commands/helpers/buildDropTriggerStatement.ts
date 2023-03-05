import { buildTriggerName } from '../../utils/buildTriggerName';

export const buildDropTriggerStatement = (
  primaryTable: string,
  foreignTable: string,
): string => /* sql */ `
  DROP TRIGGER ${buildTriggerName(primaryTable, foreignTable)}
`;
