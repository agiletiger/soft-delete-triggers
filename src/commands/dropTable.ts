import { QueryInterface } from 'sequelize';
import { DropTableParameters, Options } from '../types';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { getForeignKeyReferencesWithTriggers } from './helpers/getForeignKeyReferencesWithTriggers';

export const DROP_TABLE_COMMAND_NAME = 'dropTable';

export const dropTable = async (
  target: QueryInterface,
  parameters: DropTableParameters,
  options?: Options,
) => {
  const [tableName] = parameters;

  const foreignKeyReferencesWithTriggers = await getForeignKeyReferencesWithTriggers(
    tableName as string,
    target,
  );

  await Reflect.apply(
    (target as Record<string, any>)[DROP_TABLE_COMMAND_NAME],
    target,
    parameters,
  );

  await Promise.all(
    foreignKeyReferencesWithTriggers.map(({ referencedTableName, referencedColumnName, columnName }) =>
      target.sequelize.query(buildDropTriggerStatement(referencedTableName, referencedColumnName, tableName as string, columnName)),
    ),
  );
};
