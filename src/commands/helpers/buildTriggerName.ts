export const buildTriggerName = (primaryTable: string, foreignTable: string): string =>
  `on_${primaryTable}_delete_update_${foreignTable}`;
