import { expect } from 'chai';

import * as Support from '../../test/support';
import { queryInterfaceDecorator } from '../index';
import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';
import { buildExistTriggerStatement } from '../utils/buildExistTriggerStatement';
import { unwrapSelectOneValue } from '../utils/unwrapSelect';
import { getTriggersInformation } from '../utils/getTriggersInformation';

describe(Support.getTestDialectTeaser('renameColumn'), () => {
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

      a_id1: {
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

  it('supports renaming a dependent table column', async function () {
    await queryInterface.renameColumn('b', 'a_id', 'z_id');
    const oldTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'a_id', 'b', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    const otherTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'a_id', 'b', 'a_id1'), {
        type: QueryTypes.SELECT,
      }),
    );
    const triggerNameWasUpdated = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'a_id', 'b', 'z_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    const actionStatement = unwrapSelectOneValue(
      await queryInterface.sequelize.query(getTriggersInformation('a', 'a_id', 'b', 'z_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    expect(oldTriggerExists).to.be.false;
    expect(otherTriggerExists).to.be.true;
    expect(triggerNameWasUpdated).to.be.true;
    expect(actionStatement).to.contain(`WHERE \`b\`.\`z_id\` = \`NEW\`.\`a_id\`;`);
  });

  it('supports renaming an independent table column', async function () {
    // need to remove foreign key constraint first
    await queryInterface.removeConstraint('b', 'b_ibfk_1');
    await queryInterface.removeConstraint('b', 'b_ibfk_2');

    await queryInterface.renameColumn('a', 'a_id', 'z_id');
    const oldTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'a_id', 'b', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    const otherTriggerExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'z_id', 'b', 'a_id1'), {
        type: QueryTypes.SELECT,
      }),
    );
    const triggerNameWasUpdated = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'z_id', 'b', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    const actionStatement = unwrapSelectOneValue(
      await queryInterface.sequelize.query(getTriggersInformation('a', 'z_id', 'b', 'a_id'), {
        type: QueryTypes.SELECT,
      }),
    );
    expect(oldTriggerExists).to.be.false;
    expect(otherTriggerExists).to.be.true;
    expect(triggerNameWasUpdated).to.be.true;
    expect(actionStatement).to.contain(`WHERE \`b\`.\`a_id\` = \`NEW\`.\`z_id\`;`);
  });
});
