import { QueryInterface, QueryTypes } from 'sequelize';
import { RenameTableParameters } from '../types';
import { buildCreateTriggerStatement } from './helpers/buildCreateTriggerStatement';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { buildExistTriggerStatement } from './helpers/buildExistTriggerStatement';
import { unwrapSelectOneValue } from './helpers/unwrapSelectOneValue';

export const RENAME_TABLE_COMMAND_NAME = 'renameTable';

type ForeignKeyFields = {
  tableName: string;
  columnName: string;
  referencedTableName: string;
  referencedColumnName: string;
};

export const renameTable = async (target: QueryInterface, parameters: RenameTableParameters) => {
  const [oldName, newName] = parameters;

  // we look for tables that are referenced by this table (acting as a dependent table)
  const foreignKeyReferences = (await target.getForeignKeyReferencesForTable(
    oldName,
  )) as ForeignKeyFields[];

  const foreignKeyReferencesWithTriggers = (
    await Promise.all(
      foreignKeyReferences.map(async ({ referencedTableName, referencedColumnName }) => {
        const triggerExists = !!unwrapSelectOneValue(
          await target.sequelize.query(
            buildExistTriggerStatement(referencedTableName, oldName as string),
            { type: QueryTypes.SELECT },
          ),
        );
        return triggerExists ? { referencedTableName, referencedColumnName } : null;
      }),
    )
  ).filter((field) => !!field) as ForeignKeyFields[];

  const columnsDescription = await target.describeTable(oldName);

  const primaryKey = Object.entries(columnsDescription).find(
    ([_, description]) => description.primaryKey,
  )?.[0];

  // we look for tables that reference this table (acting as a independent table)
  const foreignKeys = (await target.sequelize.query(
    // @ts-expect-error queryGenerator has no types and getForeignKeyQuery is private
    target.queryGenerator.getForeignKeyQuery(oldName, primaryKey),
    { type: QueryTypes.SELECT },
  )) as ForeignKeyFields[];

  const foreignKeysWithTriggers = (
    await Promise.all(
      foreignKeys.map(async ({ referencedTableName, tableName, columnName }) => {
        const triggerExists = !!unwrapSelectOneValue(
          await target.sequelize.query(buildExistTriggerStatement(referencedTableName, tableName), {
            type: QueryTypes.SELECT,
          }),
        );
        return triggerExists ? { tableName, columnName } : null;
      }),
    )
  ).filter((field) => !!field) as ForeignKeyFields[];

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
