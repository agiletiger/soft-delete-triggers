import { AddColumnAttributeParameter } from '../../types';

export const hasParanoidCascadeOnDelete = (options: AddColumnAttributeParameter) =>
  typeof options === 'object' && 'onDelete' in options && options.onDelete === 'PARANOID CASCADE';
