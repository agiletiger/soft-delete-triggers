import { QueryInterface, QueryTypes } from "sequelize";

export const getSoftDeleteTableNames = async (
  schema: string,
  target: QueryInterface,
): Promise<string[]> => (await target.sequelize.query<{ tableName: string }>(
  /* sql */ `
  SELECT DISTINCT
    (TABLE_NAME) AS tableName
  FROM
    INFORMATION_SCHEMA.COLUMNS
  WHERE
    -- we assume for now the default name of the deletedAt column
    COLUMN_NAME = 'deletedAt'
    AND TABLE_SCHEMA = '${schema}'
`,
  {
    type: QueryTypes.SELECT,
  },
)).map(({ tableName }) => tableName);
