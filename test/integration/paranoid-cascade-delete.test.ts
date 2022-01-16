'use strict';

import { expect } from 'chai';

import * as Support from '../support';
import { queryInterfaceDecorator } from '../../src/index';
import { QueryInterface, DataTypes } from 'sequelize';

describe(Support.getTestDialectTeaser('ParanoidCascadeDelete'), () => {
  let queryInterface: QueryInterface;
  beforeEach(async function () {
    queryInterface = queryInterfaceDecorator(this.sequelize.getQueryInterface());
    await queryInterface.createTable('a', {
      a_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },

      deletedAt: {
        type: DataTypes.DATE,
      },
    });

    await queryInterface.createTable('b', {
      b_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
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
    await queryInterface.dropSchema('testschema');
  });

  beforeEach(async function () {
    this.User = this.sequelize.define(
      'User',
      {
        aNumber: { type: DataTypes.INTEGER },
      },
      {
        schema: 'testschema',
      },
    );

    await this.User.sync({ force: true });
  });

  it('supports increment', async function () {
    const user0 = await this.User.create({ aNumber: 1 });
    const result = await user0.increment('aNumber', { by: 3 });
    const user = await result.reload();
    expect(user).to.be.ok;
    expect(user.aNumber).to.be.equal(4);
  });

  it('supports decrement', async function () {
    const user0 = await this.User.create({ aNumber: 10 });
    const result = await user0.decrement('aNumber', { by: 3 });
    const user = await result.reload();
    expect(user).to.be.ok;
    expect(user.aNumber).to.be.equal(7);
  });
});
