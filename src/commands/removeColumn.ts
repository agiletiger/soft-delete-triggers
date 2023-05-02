import { QueryInterface, QueryTypes } from 'sequelize';
import { RemoveColumnParameters } from '../types';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { getTriggersInformation } from '../utils/getTriggersInformation';
import { unwrapSelectMany } from '../utils/unwrapSelect';
import { getForeignKeyReferenceNamesFromTriggerActionStatement } from './helpers/getForeignKeyReferenceNamesFromTriggerActionStatement';

export const REMOVE_COLUMN_COMMAND_NAME = 'removeColumn';

export const removeColumn = async (target: QueryInterface, parameters: RemoveColumnParameters) => {
  const [tableName, columnName] = parameters;

  const foreignKeyReferenceNamesPointingToTable = (unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        '%',
        '%',
        tableName as string,
        columnName,
      ),
      { type: QueryTypes.SELECT }
    )) as {ACTION_STATEMENT: string}[])
    .map(({ ACTION_STATEMENT }) => getForeignKeyReferenceNamesFromTriggerActionStatement(ACTION_STATEMENT));


  const foreignKeyReferenceNamesPointedToTable = (unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        tableName as string,
        columnName,
        '%',
        '%',
      ),
      { type: QueryTypes.SELECT }
      )) as {ACTION_STATEMENT: string}[]).map(({ ACTION_STATEMENT }) => getForeignKeyReferenceNamesFromTriggerActionStatement(ACTION_STATEMENT));

  await Reflect.apply(
    (target as Record<string, any>)[REMOVE_COLUMN_COMMAND_NAME],
    target,
    parameters,
  );

  // table acting as a dependent table
  if (foreignKeyReferenceNamesPointingToTable.length) {
    console.log('foreignKeyReferenceNamesPointingToTable', foreignKeyReferenceNamesPointingToTable)
    await Promise.all(
      foreignKeyReferenceNamesPointingToTable.map(({ independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName }) =>
        target.sequelize.query(buildDropTriggerStatement(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName))
      ),
    );
  }

  // acting as a independent table implementation
  if (foreignKeyReferenceNamesPointedToTable.length) {
    await Promise.all(
      foreignKeyReferenceNamesPointedToTable.map(({ independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName }) =>
        target.sequelize.query(buildDropTriggerStatement(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName))
      ),
    );
  }
};
