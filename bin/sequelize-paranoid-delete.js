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
const buildTriggerName_1 = require("./commands/helpers/buildTriggerName");
const getSoftDeleteTableNames_1 = require("./utils/getSoftDeleteTableNames");
const getForeignKeysTableRelations_1 = require("./utils/getForeignKeysTableRelations");
const dedupe = (array, hasher) => {
    const uniques = {};
    array.forEach((item) => (uniques[hasher(item)] = item));
    return Object.values(uniques);
};
const askForNextRelation = (rl, relation) => {
    rl.setPrompt(`Do you want to mark ${relation.tableName} as deleted when ${relation.referencedTableName} is deleted? (y/n) `);
    rl.prompt();
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
    const softDeleteTableNames = (await (0, getSoftDeleteTableNames_1.getSoftDeleteTableNames)(schema, queryInterface))
        .filter((tableName) => {
        if (options.allowListTables) {
            return options.allowListTables.includes(tableName);
        }
        if (options.denyListTables) {
            return !options.denyListTables.includes(tableName);
        }
        return true;
    });
    const foreignKeysTableRelations = (await (0, getForeignKeysTableRelations_1.getForeignKeysTableRelations)(softDeleteTableNames, schema, queryInterface))
        .filter(({ referencedColumnName }) => {
        if (options.tenantColumns) {
            return !options.tenantColumns.includes(referencedColumnName);
        }
        return true;
    });
    const uniqueForeignKeys = dedupe(foreignKeysTableRelations, ({ referencedTableName, tableName }) => (0, buildTriggerName_1.buildTriggerName)(referencedTableName, tableName));
    console.log(uniqueForeignKeys.pop());
    console.log(uniqueForeignKeys.pop());
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'Database will be scanned for tables with deletedAt column. Do you want to continue? (y/n) ',
    });
    rl.prompt();
    rl.on('line', (line) => {
        switch (line.trim()) {
            case 'y':
                if (uniqueForeignKeys.length) {
                    askForNextRelation(rl, uniqueForeignKeys.pop());
                }
                else {
                    console.log('Finished');
                }
                break;
            case 'n':
                rl.close();
                break;
            default:
                console.log(`Say what? I might have heard '${line.trim()}'`);
                break;
        }
    }).on('close', () => {
        console.log('Have a great day!');
        process.exit(0);
    });
    // await Promise.all(
    //   uniqueForeignKeys
    //     .filter(({ referencedTableName }) =>
    //       tables.find((t) => t.primaryTableName === referencedTableName),
    //     )
    //     .map(({ tableName, columnName, referencedTableName, referencedColumnName }) =>
    //       sequelize.query(
    //         buildCreateTriggerStatement(
    //           referencedTableName,
    //           referencedColumnName,
    //           tableName,
    //           columnName,
    //         ),
    //       ).then(() => console.log(`Created trigger for ${tableName}.${columnName} and ${referencedTableName}.${referencedColumnName}`)),
    //     ),
    // );
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
