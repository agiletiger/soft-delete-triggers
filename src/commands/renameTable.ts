import { QueryInterface } from 'sequelize';
import { RenameTableParameters } from '../types';
import { buildCreateTriggerStatement } from './helpers/buildCreateTriggerStatement';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { getForeignKeyReferencesWithTriggers } from './helpers/getForeignKeyReferencesWithTriggers';
import { getForeignKeysWithTriggers } from './helpers/getForeignKeysWithTriggers';
import { getPrimaryKeyName } from './helpers/getPrimaryKeyName';

export const RENAME_TABLE_COMMAND_NAME = 'renameTable';

export const renameTable = async (target: QueryInterface, parameters: RenameTableParameters) => {
  const [oldName, newName] = parameters;

  const foreignKeyReferencesWithTriggers = await getForeignKeyReferencesWithTriggers(
    oldName as string,
    target,
  );

  const primaryKey = await getPrimaryKeyName(oldName as string, target);

  const foreignKeysWithTriggers = await getForeignKeysWithTriggers(
    oldName as string,
    primaryKey!,
    target,
  );

  const commandResult = await Reflect.apply(
    (target as Record<string, any>)[RENAME_TABLE_COMMAND_NAME],
    target,
    parameters,
  );

  // table acting as a dependent table
  if (foreignKeyReferencesWithTriggers.length) {
    await Promise.all(
      foreignKeyReferencesWithTriggers.map(({ referencedTableName, referencedColumnName }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(
            referencedTableName,
            referencedColumnName,
            newName as string,
            primaryKey as string,
          ),
        ),
      ),
    );

    await Promise.all(
      foreignKeyReferencesWithTriggers.map(({ referencedTableName }) =>
        target.sequelize.query(buildDropTriggerStatement(referencedTableName, oldName as string)),
      ),
    );
  }

  // acting as a independent table implementation
  if (foreignKeysWithTriggers.length) {
    await Promise.all(
      foreignKeysWithTriggers.map(({ tableName, columnName }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(
            newName as string,
            primaryKey as string,
            tableName,
            columnName,
          ),
        ),
      ),
    );

    await Promise.all(
      foreignKeysWithTriggers.map(({ tableName }) =>
        target.sequelize.query(buildDropTriggerStatement(oldName as string, tableName)),
      ),
    );
  }

  return commandResult;
};
