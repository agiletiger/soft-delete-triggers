import { QueryInterface, QueryTypes } from 'sequelize';
import { ForeignKeyFields } from '../../types';
import { buildExistTriggerStatement } from './buildExistTriggerStatement';
import { unwrapSelectOneValue } from './unwrapSelect';

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
