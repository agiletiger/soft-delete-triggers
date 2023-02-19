import { expect } from 'chai';

import * as Support from '../../test/support';
import { queryInterfaceDecorator } from '../index';
import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';
import { buildExistTriggerStatement } from './helpers/buildExistTriggerStatement';
import { unwrapSelectOneValue } from './helpers/unwrapSelect';
import { getTriggersInformation } from './helpers/getTriggersInformation';

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
    const triggerStillExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );
    const actionStatement = unwrapSelectOneValue(
      await queryInterface.sequelize.query(getTriggersInformation('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );
    expect(triggerStillExists).to.be.true;
    expect(actionStatement).to.contain(`WHERE \`b\`.\`z_id\` = \`NEW\`.\`a_id\`;`);
  });

  it('supports renaming an independent table column', async function () {
    // need to remove foreign key constraint first
    await queryInterface.removeConstraint('b', 'b_ibfk_1');

    await queryInterface.renameColumn('a', 'a_id', 'z_id');
    const triggerStillExists = !!unwrapSelectOneValue(
      await queryInterface.sequelize.query(buildExistTriggerStatement('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );
    const actionStatement = unwrapSelectOneValue(
      await queryInterface.sequelize.query(getTriggersInformation('a', 'b'), {
        type: QueryTypes.SELECT,
      }),
    );
    expect(triggerStillExists).to.be.true;
    expect(actionStatement).to.contain(`WHERE \`b\`.\`a_id\` = \`NEW\`.\`z_id\`;`);
  });
});
