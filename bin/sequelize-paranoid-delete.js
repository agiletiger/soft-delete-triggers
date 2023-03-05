#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("node:readline"));
const promises_1 = require("node:fs/promises");
const path = __importStar(require("node:path"));
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const buildCreateTriggerStatement_1 = require("./utils/buildCreateTriggerStatement");
const getSoftDeleteTableNames_1 = require("./utils/getSoftDeleteTableNames");
const getForeignKeysTableRelations_1 = require("./utils/getForeignKeysTableRelations");
const unwrapSelect_1 = require("./utils/unwrapSelect");
const buildExistTriggerStatement_1 = require("./utils/buildExistTriggerStatement");
const getNextRelation = async (tableRelations, queryInterface) => {
    const relation = tableRelations[0];
    if (!relation) {
        return null;
    }
    const triggerExists = !!(0, unwrapSelect_1.unwrapSelectOneValue)(await queryInterface.sequelize.query((0, buildExistTriggerStatement_1.buildExistTriggerStatement)(relation.referencedTableName, relation.tableName), {
        type: sequelize_1.QueryTypes.SELECT,
    }));
    if (triggerExists) {
        tableRelations.shift();
        return getNextRelation(tableRelations, queryInterface);
    }
    return relation;
};
const askForNextRelation = async (rl, tableRelations, queryInterface) => {
    const relation = await getNextRelation(tableRelations, queryInterface);
    if (!relation) {
        rl.close();
        return;
    }
    rl.setPrompt(`What do you want to do with ${relation.tableName} when ${relation.referencedTableName} is deleted [c,na,sn,st,s,q,?]? `);
    rl.prompt();
};
const getTableRelations = async (options, queryInterface) => {
    const softDeleteTableNames = (await (0, getSoftDeleteTableNames_1.getSoftDeleteTableNames)(options.schema, queryInterface))
        .filter((tableName) => {
        if (options.allowListTables) {
            return options.allowListTables.includes(tableName);
        }
        if (options.denyListTables) {
            return !options.denyListTables.includes(tableName);
        }
        return true;
    });
    return (await (0, getForeignKeysTableRelations_1.getForeignKeysTableRelations)(softDeleteTableNames, options.schema, queryInterface))
        .filter(({ referencedColumnName }) => {
        if (options.tenantColumns) {
            return !options.tenantColumns.includes(referencedColumnName);
        }
        return true;
    });
};
const up = async (options) => {
    const { dbname, schema, username, password, host, port, dialect } = options;
    const sequelize = new sequelize_typescript_1.Sequelize(dbname, username, password, {
        dialect,
        host,
        port,
        schema,
        logging: false,
    });
    const queryInterface = sequelize.getQueryInterface();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'Database will be scanned for tables with deletedAt column. Do you want to continue? (y/n) ',
    });
    rl.prompt();
    let tableRelations = [];
    let scanned = false;
    rl.on('line', async (line) => {
        switch (line.trim()) {
            case 'y':
                if (scanned) {
                    console.error('Invalid option.');
                    rl.prompt();
                    break;
                }
                else {
                    scanned = true;
                    tableRelations = await getTableRelations(options, queryInterface);
                }
                await askForNextRelation(rl, tableRelations, queryInterface);
                break;
            case 'c':
                if (!scanned) {
                    console.error('Invalid option.');
                    rl.prompt();
                    break;
                }
                try {
                    const { tableName, columnName, referencedTableName, referencedColumnName } = tableRelations[0];
                    const triggerStatement = (0, buildCreateTriggerStatement_1.buildCreateTriggerStatement)(referencedTableName, referencedColumnName, tableName, columnName);
                    await queryInterface.sequelize.query(triggerStatement);
                    console.info(`Created trigger for ${tableName} when ${referencedTableName} is marked as deleted.`);
                }
                catch (error) {
                    console.error(error);
                }
                finally {
                    tableRelations.shift();
                    await askForNextRelation(rl, tableRelations, queryInterface);
                }
                break;
            case 'na':
                if (!scanned) {
                    console.error('Invalid option.');
                }
                else {
                    console.warn('Not implemented yet.');
                }
                rl.prompt();
                break;
            case 'sn':
                if (!scanned) {
                    console.error('Invalid option.');
                }
                else {
                    console.warn('Not implemented yet.');
                }
                rl.prompt();
                break;
            case 'st':
                if (!scanned) {
                    console.error('Invalid option.');
                }
                else {
                    console.warn('Not implemented yet.');
                }
                rl.prompt();
                break;
            case 's':
                if (!scanned) {
                    console.error('Invalid option.');
                    rl.prompt();
                    break;
                }
                tableRelations.shift();
                await askForNextRelation(rl, tableRelations, queryInterface);
                break;
            case '?':
                if (!scanned) {
                    console.error('Invalid option.');
                }
                else {
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
                    console.error('Invalid option.');
                    rl.prompt();
                    break;
                }
                rl.close();
                break;
            case 'q':
                if (!scanned) {
                    console.error('Invalid option.');
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
    const config = await (0, promises_1.readFile)(configPath, { encoding: 'utf8' });
    const options = JSON.parse(config);
    if (options.allowListTables && options.denyListTables) {
        throw new Error('You can only use either allowListTables or denyListTables, not both');
    }
    await up(options);
})();
