import { expect } from 'chai';

import * as Support from '../../test/support';
import { queryInterfaceDecorator } from '../index';
import { QueryInterface, DataTypes } from 'sequelize';
import { getSoftDeleteTableNames } from './getSoftDeleteTableNames';

describe(Support.getTestDialectTeaser('getSoftDeleteTableNames'), () => {
  let queryInterface: QueryInterface;
  beforeEach(async function () {
    queryInterface = queryInterfaceDecorator(this.sequelize.getQueryInterface());
    await queryInterface.createTable('a', {
      a_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      deletedAt: {
        type: DataTypes.DATE,
      },
    });

    await queryInterface.createTable('b', {
      b_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    });
  });

  afterEach(async function () {
    await queryInterface.dropAllTables();
  });

  it('should only list table names with the soft delete column', async function () {
    // TODO take schema name from config
    const softDeleteTableNames = await getSoftDeleteTableNames('sequelize_cascade_paranoid_test', queryInterface);

    expect(softDeleteTableNames).to.be.eql([{ tableName: 'a' }]);
  });
});
