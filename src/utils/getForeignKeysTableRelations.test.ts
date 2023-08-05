import { expect } from 'chai';

import * as Support from '../../test/support';
import { QueryInterface, DataTypes } from 'sequelize';
import { getForeignKeysTableRelations } from './getForeignKeysTableRelations';

describe(Support.getTestDialectTeaser('getForeignKeysTableRelations'), () => {
  let queryInterface: QueryInterface;
  beforeEach(async function () {
    queryInterface = this.sequelize.getQueryInterface();
    await queryInterface.createTable('a', {
      a_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    });

    await queryInterface.createTable('b', {
      b_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      a_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'a',
          key: 'a_id',
        },
        allowNull: false,
      },
    });

    await queryInterface.createTable('c', {
      c_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      a_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'a',
          key: 'a_id',
        },
        allowNull: false,
      },

      b_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'b',
          key: 'b_id',
        },
        allowNull: false,
      },
    });
  });

  afterEach(async function () {
    await queryInterface.dropAllTables();
  });

  it('should get the tables that reference a', async function () {
    // TODO take schema name from config
    const foreignKeysTableRelations = await getForeignKeysTableRelations(['a'], 'soft_delete_triggers_test', queryInterface);

    expect(foreignKeysTableRelations).to.be.eql([
      { dependentTableName: 'b', dependentTableColumnName: 'a_id', independentTableName: 'a', independentTableColumnName: 'a_id' },
      { dependentTableName: 'c', dependentTableColumnName: 'a_id', independentTableName: 'a', independentTableColumnName: 'a_id' }
    ]);
  });

  it('should get the tables that reference b', async function () {
    // TODO take schema name from config
    const foreignKeysTableRelations = await getForeignKeysTableRelations(['b'], 'soft_delete_triggers_test', queryInterface);

    expect(foreignKeysTableRelations).to.be.eql([{ dependentTableName: 'c', dependentTableColumnName: 'b_id', independentTableName: 'b', independentTableColumnName: 'b_id' }]);
  });

  it('should get the tables that reference c', async function () {
    // TODO take schema name from config
    const foreignKeysTableRelations = await getForeignKeysTableRelations(['c'], 'soft_delete_triggers_test', queryInterface);

    expect(foreignKeysTableRelations).to.be.eql([]);
  });

  it('should get the sum of relations if we query all tables', async function () {
    // TODO take schema name from config
    const foreignKeysTableRelations = await getForeignKeysTableRelations(['a', 'b', 'c'], 'soft_delete_triggers_test', queryInterface);

    expect(foreignKeysTableRelations).to.have.lengthOf(3);
  });
});
