# sequelize-paranoid-delete

sequelize-paranoid-delete enables onDelete when using paranoid mode in sequelize

## Highlights

- Written in TypeScript
- Extrely easy to use
- Database agnostic (in progress, working for MySQL now)
- Integrates with Umzug and any othe library for running migrations with sequelize

## Use Cases:

- [x] support createTable (create trigger)
- [ ] support renameTable (rename trigger)
- [ ] support dropTable (remove trigger in referenced table)
- [x] support addColumn (create trigger)
- [ ] support renameColumn (rename trigger)
- [ ] support dropColumn (remove trigger in referenced table)
- [ ] support for adding extra conditions to the triggers (multi tenant support)
- [ ] maybe another?

### Minimal Example (using Umzug)

The following example uses a MySql database through sequelize and persists the migration data in the database itself through the sequelize storage.

```js
// index.js
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const { queryInterfaceDecorator } = require('sequelize-paranoid-delete');

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

sequelize-paranoid-delete is available on npm by specifying the correct tag:

```bash
npm install sequelize-paranoid-delete
```

OR

```bash
yarn add sequelize-paranoid-delete
```

## License

See the [LICENSE file](./LICENSE.md)
