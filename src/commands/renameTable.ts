import { QueryInterface } from 'sequelize';
import { RenameTableParameters } from '../types';
import { getPrimaryKeyName } from '../utils/getPrimaryKeyName';
import { buildCreateTriggerStatement } from '../utils/buildCreateTriggerStatement';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { getForeignKeyReferencesWithTriggers } from './helpers/getForeignKeyReferencesWithTriggers';
import { getForeignKeysWithTriggers } from './helpers/getForeignKeysWithTriggers';

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

  await Reflect.apply(
    (target as Record<string, any>)[RENAME_TABLE_COMMAND_NAME],
    target,
    parameters,
  );

  // table acting as a dependent table
  if (foreignKeyReferencesWithTriggers.length) {
    await Promise.all(
      foreignKeyReferencesWithTriggers.map(({ referencedTableName, referencedColumnName, columnName }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(
            referencedTableName,
            referencedColumnName,
            newName as string,
            columnName,
          ),
        ),
      ),
    );

    await Promise.all(
      foreignKeyReferencesWithTriggers.map(({ referencedTableName, referencedColumnName, columnName }) =>
        target.sequelize.query(buildDropTriggerStatement(referencedTableName, referencedColumnName, oldName as string, columnName)),
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
      foreignKeysWithTriggers.map(({ tableName, columnName }) =>
        target.sequelize.query(buildDropTriggerStatement(oldName as string, primaryKey as string, tableName, columnName)),
      ),
    );
  }
};
