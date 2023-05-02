import { QueryInterface, QueryTypes } from 'sequelize';
import { RenameColumnParameters } from '../types';
import { buildCreateTriggerStatement } from '../utils/buildCreateTriggerStatement';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { getTriggersInformation } from '../utils/getTriggersInformation';
import { unwrapSelectMany } from '../utils/unwrapSelect';
import { getForeignKeyReferenceNamesFromTriggerActionStatement } from './helpers/getForeignKeyReferenceNamesFromTriggerActionStatement';

export const RENAME_COLUMN_COMMAND_NAME = 'renameColumn';

export const renameColumn = async (target: QueryInterface, parameters: RenameColumnParameters) => {
  const [tableName, oldColumnName, newColumnName] = parameters;

  const foreignKeyReferenceNamesPointingToTable = (unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        '%',
        '%',
        tableName as string,
        oldColumnName,
      ),
      { type: QueryTypes.SELECT }
      )) as {ACTION_STATEMENT: string}[]).map(({ ACTION_STATEMENT }) => getForeignKeyReferenceNamesFromTriggerActionStatement(ACTION_STATEMENT));


  const foreignKeyReferenceNamesPointedToTable = (unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        tableName as string,
        oldColumnName,
        '%',
        '%',
      ),
      { type: QueryTypes.SELECT }
      )) as {ACTION_STATEMENT: string}[]).map(({ ACTION_STATEMENT }) => getForeignKeyReferenceNamesFromTriggerActionStatement(ACTION_STATEMENT));


  await Reflect.apply(
    (target as Record<string, any>)[RENAME_COLUMN_COMMAND_NAME],
    target,
    parameters,
  );

  // table acting as a dependent table
  if (foreignKeyReferenceNamesPointingToTable.length) {
    await Promise.all(
      foreignKeyReferenceNamesPointingToTable.map(({ independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName }) =>
        target.sequelize.query(buildDropTriggerStatement(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName))
      ),
    );

    await Promise.all(
      foreignKeyReferenceNamesPointingToTable.map(({ independentTableName, independentTableColumnName, dependentTableName }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(independentTableName, independentTableColumnName, dependentTableName, newColumnName),
        ),
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

    await Promise.all(
      foreignKeyReferenceNamesPointedToTable.map(({ independentTableName, dependentTableName, dependentTableColumnName }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(independentTableName, newColumnName, dependentTableName, dependentTableColumnName),
        ),
      ),
    );
  }
};
