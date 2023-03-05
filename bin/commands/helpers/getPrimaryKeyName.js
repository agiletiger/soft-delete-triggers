"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrimaryKeyName = void 0;
const getPrimaryKeyName = async (tableName, target) => {
    const columnsDescription = await target.describeTable(tableName);
    return Object.entries(columnsDescription).find(([_, description]) => description.primaryKey)?.[0];
};
exports.getPrimaryKeyName = getPrimaryKeyName;
