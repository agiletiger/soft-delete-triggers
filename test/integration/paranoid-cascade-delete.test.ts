'use strict';

import { expect } from 'chai';

import * as Support from '../support';
import { queryInterfaceDecorator } from '../../src/index';
import { QueryInterface, DataTypes } from 'sequelize';
import A from '../models/A';
import B from '../models/B';

describe(Support.getTestDialectTeaser('ParanoidCascadeDelete'), () => {
  let queryInterface: QueryInterface;
  before(function () {
    this.sequelize.addModels([A, B]);
  });
  beforeEach(async function () {
    queryInterface = queryInterfaceDecorator(this.sequelize.getQueryInterface());
    await queryInterface.createTable('a', {
      a_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      createdAt: {
        type: DataTypes.DATE,
      },

      updatedAt: {
        type: DataTypes.DATE,
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

      value: {
        type: DataTypes.INTEGER,
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

      createdAt: {
        type: DataTypes.DATE,
      },

      updatedAt: {
        type: DataTypes.DATE,
      },

      deletedAt: {
        type: DataTypes.DATE,
      },
    });
  });

  afterEach(async function () {
    await queryInterface.dropAllTables();
  });

  beforeEach(async function () {
    await A.create(
      {
        bs: [{ value: 1 }, { value: 2 }],
      },
      { include: [{ model: B, as: 'bs' }] },
    );
  });

  it('supports cascade', async function () {
    await A.destroy({ where: {} });
    const bs = await B.findAll({ paranoid: false });
    expect(bs.filter((b) => !!b.deletedAt)).to.not.be.empty;
  });
});
