import { expect } from 'chai';

import * as Support from '../../test/support';
import { queryInterfaceDecorator } from '../index';
import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';
import { buildExistTriggerStatement } from '../utils/buildExistTriggerStatement';
import { unwrapSelectOneValue } from '../utils/unwrapSelect';

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

  it('supports renaming a dependent table', async function () {
    await queryInterface.renameTable('b', 'z');
    const newTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'a_id', 'z', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    const oldTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'a_id', 'b', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    expect(newTriggerExists).to.be.true;
    expect(oldTriggerExists).to.be.false;
  });

  it('supports renaming an independent table', async function () {
    await queryInterface.renameTable('a', 'z');
    const newTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('z', 'a_id', 'b', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    const oldTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'a_id', 'b', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    expect(newTriggerExists).to.be.true;
    expect(oldTriggerExists).to.be.false;
  });
});
