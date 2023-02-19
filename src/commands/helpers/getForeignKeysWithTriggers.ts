import { QueryInterface, QueryTypes } from 'sequelize';
import { ForeignKeyFields } from '../../types';
import { buildExistTriggerStatement } from './buildExistTriggerStatement';
import { unwrapSelectOneValue } from './unwrapSelect';

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
  const foreignKeys = (await target.sequelize.query(
    // @ts-expect-error queryGenerator has no types and getForeignKeyQuery is private
    target.queryGenerator.getForeignKeyQuery(tableName, primaryKey),
    { type: QueryTypes.SELECT },
  )) as ForeignKeyFields[];

  return (
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
};
