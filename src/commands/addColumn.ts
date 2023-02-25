import { ModelAttributeColumnOptions, QueryInterface } from 'sequelize';
import { AddColumnParameters, Options } from '../types';
import { buildCreateTriggerStatement } from './helpers/buildCreateTriggerStatement';
import { getPrimaryTableProps } from './helpers/getPrimaryTableProps';
import { hasParanoidCascadeOnDelete } from './helpers/hasParanoidCascadeOnDelete';

export const ADD_COLUMN_COMMAND_NAME = 'addColumn';

export const addColumn = async (
  target: QueryInterface,
  parameters: AddColumnParameters,
  options?: Options,
) => {
  const [foreignTable, foreignKey, columnDescription] = parameters;
  if (hasParanoidCascadeOnDelete(columnDescription)) {
    const { primaryTable, primaryKey } = getPrimaryTableProps(
      columnDescription as ModelAttributeColumnOptions,
      options?.getPrimaryKey,
    );

    // 'PARANOID CASCADE' is not a REAL accepted SQL value
    delete (columnDescription as ModelAttributeColumnOptions).onDelete;

    await Reflect.apply(
      (target as Record<string, any>)[ADD_COLUMN_COMMAND_NAME],
      target,
      parameters,
    );

    const statement = buildCreateTriggerStatement(
      primaryTable,
      primaryKey!,
      foreignTable as string,
      foreignKey,
    );

    await target.sequelize.query(statement);
  }
};
