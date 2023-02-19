import { QueryInterface } from 'sequelize';

export const getPrimaryKeyName = async (tableName: string, target: QueryInterface) => {
  const columnsDescription = await target.describeTable(tableName);

  return Object.entries(columnsDescription).find(([_, description]) => description.primaryKey)?.[0];
};
