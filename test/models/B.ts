import { DataTypes } from 'sequelize';
import { BelongsTo, Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import A from './A';
import ParanoidModel from './base/ParanoidModel';

@Table({ tableName: 'b', modelName: 'b' })
class B extends ParanoidModel {
  @Column({ type: DataTypes.INTEGER, primaryKey: true })
  id: number;

  @Column({ type: DataTypes.INTEGER })
  @ForeignKey(() => A)
  a_id: number;

  @BelongsTo(() => A)
  a: A;
}

export default B;
