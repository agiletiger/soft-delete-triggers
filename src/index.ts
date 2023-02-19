import { QueryInterface } from 'sequelize';
import { addColumn, ADD_COLUMN_COMMAND_NAME } from './commands/addColumn';
import { createTable, CREATE_TABLE_COMMAND_NAME } from './commands/createTable';
import { dropTable, DROP_TABLE_COMMAND_NAME } from './commands/dropTable';
import { removeColumn, REMOVE_COLUMN_COMMAND_NAME } from './commands/removeColumn';
import { renameColumn, RENAME_COLUMN_COMMAND_NAME } from './commands/renameColumn';
import { renameTable, RENAME_TABLE_COMMAND_NAME } from './commands/renameTable';
import {
  AddColumnParameters,
  CreateTableParameters,
  DropTableParameters,
  Options,
  RemoveColumnParameters,
  RenameColumnParameters,
  RenameTableParameters,
} from './types';

export const queryInterfaceDecorator = (queryInterface: QueryInterface, options?: Options) =>
  new Proxy(queryInterface, {
    get(target, propKey, _receiver) {
      if (propKey === 'sequelize') {
        return target[propKey];
      }
      const command = String(propKey);
      const origMethod = (target as Record<string, any>)[command];
      return async (
        ...args:
          | CreateTableParameters
          | RenameTableParameters
          | DropTableParameters
          | AddColumnParameters
          | RenameColumnParameters
          | RemoveColumnParameters
          | RenameTableParameters
      ): Promise<void> => {
        // here we may add a triggers to set the deletedAt field on the table being modified or created
        // when the referenced table is paranoid deleted
        if (command === ADD_COLUMN_COMMAND_NAME) {
          return addColumn(target, args as AddColumnParameters, options);
        }

        if (command === RENAME_COLUMN_COMMAND_NAME) {
          return renameColumn(target, args as RenameColumnParameters);
        }

        if (command === REMOVE_COLUMN_COMMAND_NAME) {
          return removeColumn(target, args as RemoveColumnParameters);
        }

        if (command === CREATE_TABLE_COMMAND_NAME) {
          return createTable(target, args as CreateTableParameters, options);
        }

        if (command === RENAME_TABLE_COMMAND_NAME) {
          return renameTable(target, args as RenameTableParameters);
        }

        if (command === DROP_TABLE_COMMAND_NAME) {
          return dropTable(target, args as DropTableParameters);
        }

        return Reflect.apply(origMethod, target, args);
      };
    },
  });
