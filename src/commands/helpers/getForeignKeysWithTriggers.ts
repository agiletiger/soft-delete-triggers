import { QueryInterface, QueryTypes } from 'sequelize';
import { ForeignKeyReferenceNames, GetForeignKeyQueryResult } from '../../types';
import { buildExistTriggerStatement } from '../../utils/buildExistTriggerStatement';
import { unwrapSelectOneValue } from '../../utils/unwrapSelect';

/**
 * We look for tables that reference this table (acting as a independent table)
 * @param tableName the table that is referenced
 * @param target query interface
 * @returns a list of foreign key fields.
 * Each containing the name of the table and the name of the column.
 */
export const getForeignKeysWithTriggers = async (
  tableName: string,
  primaryKey: string,
  target: QueryInterface,
) => {
  const foreignKeysNames: ForeignKeyReferenceNames[] = (await target.sequelize.query<GetForeignKeyQueryResult>(
    // @ts-expect-error queryGenerator has no types and getForeignKeyQuery is private
    target.queryGenerator.getForeignKeyQuery(tableName, primaryKey),
    { type: QueryTypes.SELECT },
  ))
  .map(({ referencedTableName, referencedColumnName, tableName, columnName }) => ({independentTableName: referencedTableName, independentTableColumnName: referencedColumnName, dependentTableName: tableName, dependentTableColumnName: columnName}));

  return (
    await Promise.all(
      foreignKeysNames.map(async ({ independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName }) => {
        const triggerExists = !!unwrapSelectOneValue(
          await target.sequelize.query(buildExistTriggerStatement(independentTableName, independentTableColumnName, dependentTableName, dependentTableColumnName), {
            type: QueryTypes.SELECT,
          }),
        );
        return triggerExists ? { dependentTableName, dependentTableColumnName } : null;
      }),
    )
  ).filter((field) => !!field) as ForeignKeyReferenceNames[];
};
