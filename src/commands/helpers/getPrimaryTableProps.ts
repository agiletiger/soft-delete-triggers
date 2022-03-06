import { ModelAttributeColumnOptions } from 'sequelize';

export const getPrimaryTableProps = (
  options: ModelAttributeColumnOptions,
  getPrimaryKey?: (primaryTable: string) => string,
): { primaryTable: string; primaryKey: string } => {
  const { references } = options;
  if (typeof references === 'string') {
    return { primaryTable: references, primaryKey: getPrimaryKey?.(references) ?? 'id' };
  }
  const model = references!.model as string;
  return {
    primaryTable: model,
    primaryKey: references?.key ?? getPrimaryKey?.(model) ?? 'id',
  };
};
