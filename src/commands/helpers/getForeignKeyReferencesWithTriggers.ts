import { QueryInterface, QueryTypes } from 'sequelize';
import { ForeignKeyReferenceNames, GetForeignKeyReferencesForTableResult } from '../../types';
import { buildExistTriggerStatement } from '../../utils/buildExistTriggerStatement';
import { unwrapSelectOneValue } from '../../utils/unwrapSelect';

/**
 * We look for tables that are referenced by this table (acting as a dependent table)
 * @param tableName the table where the foreign keys are defined
 * @param target query interface
 * @returns a list of foreign key fields.
 * Each containing the name of the referenced table and the name of the referenced column.
 */
export const getForeignKeyReferencesWithTriggers = async (
  tableName: string,
  target: QueryInterface,
) => {
  const foreignKeysNames: ForeignKeyReferenceNames[] = (await target.getForeignKeyReferencesForTable(
    tableName,
  ) as GetForeignKeyReferencesForTableResult[])
  .map(({ referencedTableName, referencedColumnName, tableName, columnName }) => ({independentTableName: referencedTableName, independentTableColumnName: referencedColumnName, dependentTableName: tableName, dependentTableColumnName: columnName}));

  return (
    await Promise.all(
      foreignKeysNames.map(async ({ independentTableName, independentTableColumnName, dependentTableColumnName }) => {
        const triggerExists = !!unwrapSelectOneValue(
          await target.sequelize.query(buildExistTriggerStatement(independentTableName, independentTableColumnName, tableName, dependentTableColumnName), {
            type: QueryTypes.SELECT,
          }),
        );
        return triggerExists ? { independentTableName, independentTableColumnName, dependentTableName: tableName, dependentTableColumnName } : null;
      }),
    )
  ).filter((field) => !!field) as ForeignKeyReferenceNames[];
};
