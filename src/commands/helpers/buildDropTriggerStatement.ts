import { buildTriggerName } from '../../utils/buildTriggerName';

export const buildDropTriggerStatement = (
  independentTableName: string,
  independentTableColumnName: string,
  dependentTableName: string,
  dependentTableNameColumnName: string,
): string => /* sql */ `
  DROP TRIGGER ${buildTriggerName(independentTableName, independentTableColumnName, dependentTableName, dependentTableNameColumnName)}
`;
