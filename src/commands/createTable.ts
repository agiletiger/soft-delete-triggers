import { ModelAttributeColumnOptions, QueryInterface } from 'sequelize';
import { CreateTableParameters, Options } from '../types';
import { buildCreateTriggerStatement } from './helpers/buildCreateTriggerStatement';
import { getPrimaryTableProps } from './helpers/getPrimaryTableProps';
import { hasParanoidCascadeOnDelete } from './helpers/hasParanoidCascadeOnDelete';

export const CREATE_TABLE_COMMAND_NAME = 'createTable';

export const createTable = async (
  target: QueryInterface,
  parameters: CreateTableParameters,
  options?: Options,
) => {
  const [newTable, columns] = parameters;

  const createTriggers: string[] = [];

  Object.entries(columns).forEach(([foreignKey, columnDescription]) => {
    if (hasParanoidCascadeOnDelete(columnDescription)) {
      const { primaryTable, primaryKey } = getPrimaryTableProps(
        columnDescription as ModelAttributeColumnOptions,
        options?.getPrimaryKey,
      );
      createTriggers.push(
        buildCreateTriggerStatement(primaryTable, primaryKey, newTable as string, foreignKey),
      );

      // 'PARANOID CASCADE' is not a REAL accepted SQL value
      delete (columnDescription as ModelAttributeColumnOptions).onDelete;
    }
  });

  await Reflect.apply(
    (target as Record<string, any>)[CREATE_TABLE_COMMAND_NAME],
    target,
    parameters,
  );

  await Promise.all(createTriggers.map((t) => target.sequelize.query(t)));
};
