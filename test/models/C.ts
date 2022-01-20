import { DataTypes } from 'sequelize';
import { BelongsTo, Column, ForeignKey, Table } from 'sequelize-typescript';
import A from './A';
import B from './B';
import ParanoidModel from './base/ParanoidModel';

@Table({ tableName: 'c', modelName: 'c' })
class C extends ParanoidModel {
  @Column({ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true })
  c_id!: number;

  @Column({ type: DataTypes.INTEGER })
  value!: number;

  @Column({ type: DataTypes.INTEGER })
  @ForeignKey(() => A)
  a_id!: number;

  @Column({ type: DataTypes.INTEGER })
  @ForeignKey(() => B)
  b_id!: number;

  @BelongsTo(() => A)
  a!: A;

  @BelongsTo(() => B)
  b!: A;
}

export default C;
