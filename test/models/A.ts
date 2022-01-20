import { DataTypes } from 'sequelize';
import { Column, HasMany, Table } from 'sequelize-typescript';
import B from './B';
import ParanoidModel from './base/ParanoidModel';
import C from './C';

@Table({ tableName: 'a', modelName: 'a' })
class A extends ParanoidModel {
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  a_id!: number;

  @HasMany(() => B)
  bs!: B[];

  @HasMany(() => C)
  cs!: C[];
}

export default A;
