import { expect } from 'chai';

import * as Support from '../../test/support';
import { queryInterfaceDecorator } from '../index';
import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';
import { buildExistTriggerStatement } from './helpers/buildExistTriggerStatement';
import { unwrapSelectOneValue } from './helpers/unwrapSelect';

describe(Support.getTestDialectTeaser('renameTable'), () => {
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

      a_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'a',
          key: 'a_id',
        },
        allowNull: false,
        onDelete: 'PARANOID CASCADE',
      },

      deletedAt: {
        type: DataTypes.DATE,
      },
    });
  });

  afterEach(async function () {
    await queryInterface.dropAllTables();
  });

  it('supports dropping a dependent table', async function () {
    await queryInterface.dropTable('b');
    const oldTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );

    expect(oldTriggerExists).to.be.false;
  });

  it('supports dropping an independent table', async function () {
    await queryInterface.removeConstraint('b', 'b_ibfk_1');
    await queryInterface.dropTable('a');
    const oldTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );
    expect(oldTriggerExists).to.be.false;
  });
});
