import { expect } from 'chai';

import * as Support from '../../test/support';
import { queryInterfaceDecorator } from '../index';
import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';
import { buildExistTriggerStatement } from './helpers/buildExistTriggerStatement';
import { unwrapSelectOneValue } from './helpers/unwrapSelect';

describe(Support.getTestDialectTeaser('removeColumn'), () => {
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

  it('supports removing a dependent table column', async function () {
    await queryInterface.removeColumn('b', 'a_id');
    const triggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );

    expect(triggerExists).to.be.false;
  });

  it('supports removing an independent table column', async function () {
    // need to remove foreign key constraint first
    await queryInterface.removeConstraint('b', 'b_ibfk_1');

    await queryInterface.removeColumn('a', 'a_id');
    const triggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );

    expect(triggerExists).to.be.false;
  });
});
