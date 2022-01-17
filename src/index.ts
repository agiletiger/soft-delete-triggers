import { ModelAttributeColumnOptions, QueryInterface } from 'sequelize';

type CreateTableParameters = Parameters<typeof QueryInterface.prototype.createTable>;

type AddColumnParameters = Parameters<typeof QueryInterface.prototype.addColumn>;

type AddColumnAttributeParameter = AddColumnParameters[2];

type Options = {
  getPrimaryKey?: (primaryTable: string) => string;
};

const createParanoidDeleteTriggerStatement = (
  primaryTable: string,
  primaryKey: string,
  foreignTable: string,
  foreignKey: string,
): string => /* sql */ `
  CREATE TRIGGER on_${primaryTable}_delete_update_${foreignTable}
  AFTER UPDATE
  ON ${primaryTable} FOR EACH ROW
  BEGIN
    IF OLD.deletedAt IS NULL AND NEW.deletedAt IS NOT NULL THEN
      UPDATE ${foreignTable}
        SET ${foreignTable}.deletedAt = NOW()
      WHERE ${foreignTable}.${foreignKey} = NEW.${primaryKey};
    END IF;
  END;
`;

const hasParanoidCascadeOnDelete = (options: AddColumnAttributeParameter) =>
  typeof options === 'object' && 'onDelete' in options && options.onDelete === 'PARANOID CASCADE';

const getPrimaryTableProps = (
  options: ModelAttributeColumnOptions,
  getPrimaryKey?: (primaryTable: string) => string,
): { primaryTable: string; primaryKey: string } => {
  const { references } = options;
  if (typeof references === 'string') {
    return { primaryTable: references, primaryKey: getPrimaryKey?.(references) ?? 'id' };
  }
  const model = references!.model as string;
  return {
    primaryTable: model,
    primaryKey: references?.key ?? getPrimaryKey?.(model) ?? 'id',
  };
};

export const queryInterfaceDecorator = (queryInterface: QueryInterface, options?: Options) =>
  new Proxy(queryInterface, {
    get(target, propKey, _receiver) {
      if (propKey === 'sequelize') {
        return target[propKey];
      }
      const command = String(propKey);
      const origMethod = (target as Record<string, any>)[command];
      return async (...args: CreateTableParameters | AddColumnParameters): Promise<void> => {
        // here we may add a triggers to set the deletedAt field on the table being modified or created
        // when the referenced table is paranoid deleted
        if (command === 'addColumn') {
          const [foreignTable, foreignKey, columnDescription] = args as AddColumnParameters;
          if (hasParanoidCascadeOnDelete(columnDescription)) {
            const { primaryTable, primaryKey } = getPrimaryTableProps(
              columnDescription as ModelAttributeColumnOptions,
              options?.getPrimaryKey,
            );

            // 'PARANOID CASCADE' is not a REAL accepted SQL value
            delete (columnDescription as ModelAttributeColumnOptions).onDelete;

            const commandResult = await Reflect.apply(origMethod, target, args);

            const statement = createParanoidDeleteTriggerStatement(
              primaryTable,
              primaryKey!,
              foreignTable as string,
              foreignKey,
            );

            await target.sequelize.query(statement);

            return commandResult;
          }
        }

        if (command === 'createTable') {
          const [newTable, columns] = args as CreateTableParameters;

          const createTriggers: string[] = [];

          Object.entries(columns).forEach(([foreignKey, columnDescription]) => {
            if (hasParanoidCascadeOnDelete(columnDescription)) {
              const { primaryTable, primaryKey } = getPrimaryTableProps(
                columnDescription as ModelAttributeColumnOptions,
                options?.getPrimaryKey,
              );
              createTriggers.push(
                createParanoidDeleteTriggerStatement(
                  primaryTable,
                  primaryKey,
                  newTable as string,
                  foreignKey,
                ),
              );

              // 'PARANOID CASCADE' is not a REAL accepted SQL value
              delete (columnDescription as ModelAttributeColumnOptions).onDelete;
            }
          });

          const commandResult = await Reflect.apply(origMethod, target, args);

          await Promise.all(createTriggers.map((t) => target.sequelize.query(t)));

          return commandResult;
        }

        return Reflect.apply(origMethod, target, args);
      };
    },
  });
