import { QueryInterface } from 'sequelize';
import { addColumn, ADD_COLUMN_COMMAND_NAME } from './commands/addColumn';
import { createTable, CREATE_TABLE_COMMAND_NAME } from './commands/createTable';
import { AddColumnParameters, CreateTableParameters, Options } from './types';

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
        if (command === ADD_COLUMN_COMMAND_NAME) {
          return addColumn(target, args as AddColumnParameters, options);
        }

        if (command === CREATE_TABLE_COMMAND_NAME) {
          return createTable(target, args as CreateTableParameters, options);
        }

        return Reflect.apply(origMethod, target, args);
      };
    },
  });
