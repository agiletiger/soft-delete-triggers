import { QueryInterface } from 'sequelize';

export type CreateTableParameters = Parameters<typeof QueryInterface.prototype.createTable>;

export type RenameTableParameters = Parameters<typeof QueryInterface.prototype.renameTable>;

export type DropTableParameters = Parameters<typeof QueryInterface.prototype.dropTable>;

export type AddColumnParameters = Parameters<typeof QueryInterface.prototype.addColumn>;

export type RenameColumnParameters = Parameters<typeof QueryInterface.prototype.renameColumn>;

export type RemoveColumnParameters = Parameters<typeof QueryInterface.prototype.removeColumn>;

export type AddColumnAttributeParameter = AddColumnParameters[2];

export type Options = {
  getPrimaryKey?: (primaryTable: string) => string;
};

//TODO rename to ForeignKeyReferenceNames
export type ForeignKeyFields = {
  tableName: string; //TODO: rename to dependentTableName
  columnName: string; //TODO: rename to dependentTableColumnName
  referencedTableName: string; //TODO: rename to independentTableName
  referencedColumnName: string; //TODO: rename to independentTableColumnName
};
