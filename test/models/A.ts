import { DataTypes } from 'sequelize';
import { Column, HasMany, Table } from 'sequelize-typescript';
import B from './B';
import ParanoidModel from './base/ParanoidModel';

@Table({ tableName: 'a', modelName: 'a' })
class A extends ParanoidModel {
  @Column({ type: DataTypes.INTEGER, primaryKey: true })
  id: number;

  @HasMany(() => B)
  bs: B[];
}

export default A;
