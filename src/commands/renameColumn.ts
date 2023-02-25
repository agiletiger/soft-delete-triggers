import { QueryInterface, QueryTypes } from 'sequelize';
import { RenameColumnParameters } from '../types';
import { buildCreateTriggerStatement } from './helpers/buildCreateTriggerStatement';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { getDependentColumnFromTriggerActionStatement } from './helpers/getDependentColumnFromTriggerActionStatement';
import { getDependentTableFromTriggerActionStatement } from './helpers/getDependentTableFromTriggerActionStatement';
import { getIndependentColumnFromTriggerActionStatement } from './helpers/getIndependentColumnFromTriggerActionStatement';
import { getTriggersInformation } from './helpers/getTriggersInformation';
import { unwrapSelectMany } from './helpers/unwrapSelect';

export const RENAME_COLUMN_COMMAND_NAME = 'renameColumn';

export const renameColumn = async (target: QueryInterface, parameters: RenameColumnParameters) => {
  const [tableName, _oldColumnName, newColumnName] = parameters;

  const triggersActionStatementsPointingToTable = unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        '%',
        tableName as string,
      ),
      { type: QueryTypes.SELECT }
    )) as {EVENT_OBJECT_TABLE: string; ACTION_STATEMENT: string}[];


  const triggersActionStatementsPointedToTable = unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        tableName as string,
        '%',
      ),
      { type: QueryTypes.SELECT }
      )) as {ACTION_STATEMENT: string}[];


  await Reflect.apply(
    (target as Record<string, any>)[RENAME_COLUMN_COMMAND_NAME],
    target,
    parameters,
  );

  // table acting as a dependent table
  if (triggersActionStatementsPointingToTable.length) {
    await Promise.all(
      triggersActionStatementsPointingToTable.map(({ EVENT_OBJECT_TABLE }) =>
        target.sequelize.query(buildDropTriggerStatement(EVENT_OBJECT_TABLE, tableName as string))
      ),
    );

    await Promise.all(
      triggersActionStatementsPointingToTable.map(({ EVENT_OBJECT_TABLE, ACTION_STATEMENT }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(
            EVENT_OBJECT_TABLE,
            getIndependentColumnFromTriggerActionStatement(ACTION_STATEMENT),
            tableName as string,
            newColumnName,
          ),
        ),
      ),
    );
  }

  // acting as a independent table implementation
  if (triggersActionStatementsPointedToTable.length) {
    await Promise.all(
      triggersActionStatementsPointedToTable.map(({ ACTION_STATEMENT }) =>
        target.sequelize.query(buildDropTriggerStatement(tableName as string, getDependentTableFromTriggerActionStatement(ACTION_STATEMENT)))
      ),
    );

    await Promise.all(
      triggersActionStatementsPointedToTable.map(({ ACTION_STATEMENT }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(
            tableName as string,
            newColumnName,
            getDependentTableFromTriggerActionStatement(ACTION_STATEMENT),
            getDependentColumnFromTriggerActionStatement(ACTION_STATEMENT),
          ),
        ),
      ),
    );
  }
};
