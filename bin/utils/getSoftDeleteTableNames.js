"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSoftDeleteTableNames = void 0;
const sequelize_1 = require("sequelize");
const getSoftDeleteTableNames = async (schema, target) => (await target.sequelize.query(
/* sql */ `
  SELECT DISTINCT
    (TABLE_NAME) AS tableName
  FROM
    INFORMATION_SCHEMA.COLUMNS
  WHERE
    -- we assume for now the default name of the deletedAt column
    COLUMN_NAME = 'deletedAt'
    AND TABLE_SCHEMA = '${schema}'
`, {
    type: sequelize_1.QueryTypes.SELECT,
})).map(({ tableName }) => tableName);
exports.getSoftDeleteTableNames = getSoftDeleteTableNames;
