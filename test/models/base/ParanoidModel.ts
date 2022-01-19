import { DataTypes } from 'sequelize';
import { Column, Model, Table } from 'sequelize-typescript';

@Table({ paranoid: true })
abstract class ParanoidModel extends Model {
  @Column({ type: DataTypes.DATE })
  createdAt!: Date;

  @Column({ type: DataTypes.DATE })
  updatedAt!: Date;

  @Column({ type: DataTypes.DATE })
  deletedAt!: Date;
}

export default ParanoidModel;
