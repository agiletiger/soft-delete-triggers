import { QueryInterface, QueryTypes } from "sequelize";
import { ForeignKeyReferenceNames, GetForeignKeyQueryResult } from "../types";
import { getPrimaryKeyName } from "./getPrimaryKeyName";

export const getForeignKeysTableRelations = async (
  tableNames: string[],
  schema: string,
  queryInterface: QueryInterface,
): Promise<ForeignKeyReferenceNames[]> => (
  await Promise.all(
    tableNames.map(async (tableName) => {
      const primaryKeyName = await getPrimaryKeyName(
        tableName,
        queryInterface,
      );

      if (!primaryKeyName) {
        // views for example do not have primary keys
        return [];
      }
      return (await queryInterface.sequelize.query<GetForeignKeyQueryResult>(
        // @ts-expect-error queryGenerator has no types and getForeignKeyQuery is private
        queryInterface.queryGenerator.getForeignKeyQuery(
          { schema, tableName },
          primaryKeyName,
        ),
        { type: QueryTypes.SELECT },
        // remove extra fields
      )).map(({ referencedTableName, referencedColumnName, tableName, columnName }) => ({independentTableName: referencedTableName, independentTableColumnName: referencedColumnName, dependentTableName: tableName, dependentTableColumnName: columnName}));
    }),
  )
).flat();
