"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForeignKeysTableRelations = void 0;
const sequelize_1 = require("sequelize");
const getPrimaryKeyName_1 = require("./getPrimaryKeyName");
const getForeignKeysTableRelations = async (tableNames, schema, queryInterface) => (await Promise.all(tableNames.map(async (tableName) => {
    const primaryKeyName = await (0, getPrimaryKeyName_1.getPrimaryKeyName)(tableName, queryInterface);
    if (!primaryKeyName) {
        // views for example do not have primary keys
        return [];
    }
    return (await queryInterface.sequelize.query(
    // @ts-expect-error queryGenerator has no types and getForeignKeyQuery is private
    queryInterface.queryGenerator.getForeignKeyQuery({ schema, tableName }, primaryKeyName), { type: sequelize_1.QueryTypes.SELECT })).map(({ referencedTableName, referencedColumnName, tableName, columnName }) => ({ independentTableName: referencedTableName, independentTableColumnName: referencedColumnName, dependentTableName: tableName, dependentTableColumnName: columnName }));
}))).flat();
exports.getForeignKeysTableRelations = getForeignKeysTableRelations;
