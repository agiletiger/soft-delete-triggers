import { QueryInterface, QueryTypes } from 'sequelize';
import { RemoveColumnParameters } from '../types';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { getDependentTableFromTriggerActionStatement } from './helpers/getDependentTableFromTriggerActionStatement';
import { getTriggersInformation } from './helpers/getTriggersInformation';
import { unwrapSelectMany } from './helpers/unwrapSelect';

export const REMOVE_COLUMN_COMMAND_NAME = 'removeColumn';

export const removeColumn = async (target: QueryInterface, parameters: RemoveColumnParameters) => {
  const [tableName] = parameters;

  const triggersActionStatementsPointingToTable = unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        '%',
        tableName as string,
      ),
      { type: QueryTypes.SELECT }
    )) as {EVENT_OBJECT_TABLE: string}[];


  const triggersActionStatementsPointedToTable = unwrapSelectMany(
    await target.sequelize.query(
      getTriggersInformation(
        tableName as string,
        '%',
      ),
      { type: QueryTypes.SELECT }
      )) as {ACTION_STATEMENT: string}[];

  const commandResult = await Reflect.apply(
    (target as Record<string, any>)[REMOVE_COLUMN_COMMAND_NAME],
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
  }

  // acting as a independent table implementation
  if (triggersActionStatementsPointedToTable.length) {
    await Promise.all(
      triggersActionStatementsPointedToTable.map(({ ACTION_STATEMENT }) =>
        target.sequelize.query(buildDropTriggerStatement(tableName as string, getDependentTableFromTriggerActionStatement(ACTION_STATEMENT)))
      ),
    );
  }

  return commandResult;
};
