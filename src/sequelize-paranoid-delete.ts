#!/usr/bin/env node

import * as readline from 'node:readline';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';


import { Sequelize } from 'sequelize-typescript';
import { QueryInterface, QueryTypes } from 'sequelize';
import { ForeignKeyReferenceNames } from './types';
import { buildCreateTriggerStatement } from './utils/buildCreateTriggerStatement';
import { getSoftDeleteTableNames } from './utils/getSoftDeleteTableNames';
import { getForeignKeysTableRelations } from './utils/getForeignKeysTableRelations';
import { unwrapSelectOneValue } from './utils/unwrapSelect';
import { buildExistTriggerStatement } from './utils/buildExistTriggerStatement';

type Options = {
  dbname: string,
  schema: string;
  username: string,
  password: string,
  host: string,
  port: number,
  dialect: 'mysql',
  allowListTables: string[] | null,
  denyListTables: string[] | null,
  tenantColumns: string[] | null
};

const getNextRelation = async (tableRelations: ForeignKeyReferenceNames[], queryInterface: QueryInterface): Promise<ForeignKeyReferenceNames | null> => {
  const relation = tableRelations[0];
  if (!relation) {
    return null;
  }

  const triggerExists = !!unwrapSelectOneValue(
    await queryInterface.sequelize.query(buildExistTriggerStatement(relation.independentTableName, relation.independentTableColumnName, relation.dependentTableName, relation.dependentTableColumnName), {
      type: QueryTypes.SELECT,
    }),
  );

  if (triggerExists) {
    tableRelations.shift();
    return getNextRelation(tableRelations, queryInterface);
  }

  return relation;
}

const askForNextRelation = async (rl: readline.Interface, tableRelations: ForeignKeyReferenceNames[], queryInterface: QueryInterface) => {
  const relation = await getNextRelation(tableRelations, queryInterface);
  if (!relation) {
    rl.close();
    return;
  }
  rl.setPrompt(`What do you want to do with ${relation.dependentTableName} when ${relation.independentTableName} is deleted [c,na,sn,st,s,q,?]? `);
  rl.prompt();
}

const getTableRelations = async (options: Options, queryInterface: QueryInterface) => {
  const softDeleteTableNames = (
    await getSoftDeleteTableNames(options.schema, queryInterface)
  )
  .filter((tableName) => {
    if (options.allowListTables) {
      return options.allowListTables.includes(tableName);
    }
    if (options.denyListTables) {
      return !options.denyListTables.includes(tableName);
    }
    return true;
  });

  return (
    await getForeignKeysTableRelations(softDeleteTableNames, options.schema, queryInterface)
  )
  .filter(({ independentTableColumnName }) => {
    if (options.tenantColumns) {
      return !options.tenantColumns.includes(independentTableColumnName);
    }
    return true;
  });
}

const up = async (options: Options) => {
  const {dbname, schema, username, password, host, port, dialect} = options;
  const sequelize = new Sequelize(dbname, username, password, {
    dialect,
    host,
    port,
    schema,
    logging: false,
  });
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Database will be scanned for tables with deletedAt column. Do you want to continue? (y/n) ',
  });

  rl.prompt();

  let tableRelations: ForeignKeyReferenceNames[] = [];
  let scanned = false;

  rl.on('line', async (line) => {
    switch (line.trim()) {
      case 'y':
        if (scanned) {
          console.error('Invalid option.')
          rl.prompt();
          break;
        } else {
          scanned = true;
          tableRelations = await getTableRelations(options, queryInterface);
        }
        await askForNextRelation(rl, tableRelations, queryInterface);
        break;
      case 'c':
        if (!scanned) {
          console.error('Invalid option.')
          rl.prompt();
          break;
        }
        try {
          const { dependentTableName: tableName, dependentTableColumnName: columnName, independentTableName: referencedTableName, independentTableColumnName: referencedColumnName } = tableRelations[0];
          const triggerStatement = buildCreateTriggerStatement(referencedTableName, referencedColumnName, tableName, columnName);
          await queryInterface.sequelize.query(triggerStatement);
          console.info(`Created trigger for ${tableName} when ${referencedTableName} is marked as deleted.`);
        } catch (error) {
          console.error(error);
        } finally {
          tableRelations.shift();
          await askForNextRelation(rl, tableRelations, queryInterface);
        }
        break;
      case 'na':
        if (!scanned) {
          console.error('Invalid option.')
        } else {
          console.warn('Not implemented yet.');
        }
        rl.prompt();
        break;
      case 'sn':
        if (!scanned) {
          console.error('Invalid option.')
        } else {
          console.warn('Not implemented yet.');
        }
        rl.prompt();
        break;
      case 'st':
        if (!scanned) {
          console.error('Invalid option.')
        } else {
          console.warn('Not implemented yet.');
        }
        rl.prompt();
        break;
      case 's':
        if (!scanned) {
          console.error('Invalid option.')
          rl.prompt();
          break;
        }
        tableRelations.shift();
        await askForNextRelation(rl, tableRelations, queryInterface);
        break;
      case '?':
        if (!scanned) {
          console.error('Invalid option.')
        } else {
          console.info('c - cascade.');
          console.info('na - no action.');
          console.info('sn - set null.');
          console.info('st - set default.');
          console.info('s - skip.');
        }
        rl.prompt();
        break;
      case 'n':
        if (scanned) {
          console.error('Invalid option.')
          rl.prompt();
          break;
        }
        rl.close();
        break;
      case 'q':
        if (!scanned) {
          console.error('Invalid option.')
          rl.prompt();
          break;
        }
        rl.close();
        break;
      default:
        console.error('Invalid option.');
        rl.prompt();
        break;
    }
  }).on('close', () => {
    console.info('There are no more relations to process. Exiting...');
    process.exit(0);
  });
};

(async () => {
  const configPath = path.join(process.cwd(), './.spdrc');
  const config = await readFile(configPath, { encoding: 'utf8' });
  const options = JSON.parse(config) as unknown as Options
  if (options.allowListTables && options.denyListTables) {
    throw new Error('You can only use either allowListTables or denyListTables, not both');
  }
  await up(options);
})();
