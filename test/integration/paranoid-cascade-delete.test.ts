'use strict';

import { expect } from 'chai';

import * as Support from '../support';
import { queryInterfaceDecorator } from '../../src/index';
import { QueryInterface, DataTypes } from 'sequelize';
import A from '../models/A';
import B from '../models/B';
import C from '../models/C';

describe(Support.getTestDialectTeaser('ParanoidCascadeDelete'), () => {
  let queryInterface: QueryInterface;
  before(function () {
    this.sequelize.addModels([A, B, C]);
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

    await queryInterface.createTable('c', {
      c_id: {
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

      b_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'b',
          key: 'b_id',
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
    const a = await A.create({});
    await B.bulkCreate(
      [
        { a_id: a.a_id, value: 1, cs: [{ a_id: a.a_id, value: 3 }] },
        { a_id: a.a_id, value: 2 },
      ],
      {
        include: [{ model: C, as: 'cs' }],
      },
    );
  });

  it('supports cascade', async function () {
    await B.destroy({ where: {} });
    const cs = await C.findAll({ paranoid: false });
    expect(cs.filter((c) => !!c.deletedAt)).to.not.be.empty;
  });

  it('supports nested cascade', async function () {
    await A.destroy({ where: {} });
    const bs = await B.findAll({ paranoid: false });
    expect(bs.filter((b) => !!b.deletedAt)).to.not.be.empty;
    const cs = await C.findAll({ paranoid: false });
    expect(cs.filter((c) => !!c.deletedAt)).to.not.be.empty;
  });
});
