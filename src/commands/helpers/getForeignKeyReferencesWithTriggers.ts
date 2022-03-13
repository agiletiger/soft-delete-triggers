import { QueryInterface, QueryTypes } from 'sequelize';
import { ForeignKeyFields } from '../../types';
import { buildExistTriggerStatement } from './buildExistTriggerStatement';
import { unwrapSelectOneValue } from './unwrapSelectOneValue';

export const getForeignKeyReferencesWithTriggers = async (
  tableName: string,
  target: QueryInterface,
) => {
  // we look for tables that are referenced by this table (acting as a dependent table)
  const foreignKeyReferences = (await target.getForeignKeyReferencesForTable(
    tableName,
  )) as ForeignKeyFields[];

  return (
    await Promise.all(
      foreignKeyReferences.map(async ({ referencedTableName, referencedColumnName }) => {
        const triggerExists = !!unwrapSelectOneValue(
          await target.sequelize.query(buildExistTriggerStatement(referencedTableName, tableName), {
            type: QueryTypes.SELECT,
          }),
        );
        return triggerExists ? { referencedTableName, referencedColumnName } : null;
      }),
    )
  ).filter((field) => !!field) as ForeignKeyFields[];
};
