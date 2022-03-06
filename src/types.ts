import { QueryInterface } from 'sequelize';

export type CreateTableParameters = Parameters<typeof QueryInterface.prototype.createTable>;

export type AddColumnParameters = Parameters<typeof QueryInterface.prototype.addColumn>;

export type AddColumnAttributeParameter = AddColumnParameters[2];

export type Options = {
  getPrimaryKey?: (primaryTable: string) => string;
};
