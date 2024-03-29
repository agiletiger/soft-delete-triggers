# soft-delete-triggers

soft-delete-triggers enables emulating db behavior through triggers when doing soft deletes

## Highlights

- Written in TypeScript
- Extremely easy to use
- Database agnostic (WIP, working for MySQL now)
- Integrates with Umzug and any othe library for running migrations with sequelize
- CLI to generate triggers for existing database

## Use Cases:

- [x] support createTable (create trigger)
- [x] support renameTable (rename trigger)
- [x] support dropTable (remove trigger in referenced table)
- [x] support addColumn (create trigger)
- [X] support renameColumn (rewrite trigger body)
- [X] support removeColumn (remove trigger in referenced table)
- [ ] support for all the ON DELETE reference_options (currently CASCADE only)
- [ ] maybe another?

### Minimal Example (using Umzug)

The following example uses a MySql database through sequelize and persists the migration data in the database itself through the sequelize storage.

```js
// index.js
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const { queryInterfaceDecorator } = require('soft-delete-triggers');

const sequelize = new Sequelize({ dialect: 'mysql', storage: './db.mysql' });

const umzug = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  // as simple as the following line
  context: queryInterfaceDecorator(sequelize.getQueryInterface()),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});
```

```js
// migrations/00_initial.js
const { Sequelize } = require('sequelize');

async function up({ context: queryInterface }) {
  await queryInterface.createTable('resources', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      // here we specify the behavior
      onDelete: 'PARANOID CASCADE',
    }
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
}
```

This is going to create a trigger in the users table, when a user gets "deleted", the resource will be marked as deleted as well.

If the table was already created, you can use addColumn as well.

```js
const { Sequelize } = require('sequelize');

async function up({ context: queryInterface }) {
  await queryInterface.addColumn('resources', 'userId', {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    // here we specify the behavior
    onDelete: 'PARANOID CASCADE',
  });
}
```

### Usage

#### Installation

soft-delete-triggers is available on npm by specifying the correct tag:

```bash
npm install @agiletiger/soft-delete-triggers
```

OR

```bash
yarn add @agiletiger/soft-delete-triggers
```

#### Configuration file for CLI

Put configuration options in a file named `.sdtrc` in your working directory.

The expected structure of the file is the following:

```json
{
  "dbname": "",
  "schema": "",
  "username": "",
  "password": "",
  "host": "",
  "port": "",
  "dialect": "mysql",
  "allowListTables": null,
  "denyListTables": null,
  "tenantColumns": null
}
```

Allow list tables, deny list tables and tenant columns are optional.

First two are for configuring which tables you DO want to scan or you do NOT want to scan (specify only one).

Tenant columns is to prevent scanning relations between tenant foreign keys.

```bash
npx soft-delete-triggers
```

### Debug Tests

`yarn node --inspect-brk ./node_modules/.bin/ts-mocha -p lib.tsconfig.json src/**/*.test.ts`

## License

See the [LICENSE file](./LICENSE.md)
