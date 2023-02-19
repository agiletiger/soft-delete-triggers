export const getDependentTableFromTriggerActionStatement = (actionStatement: string) => actionStatement.match(/UPDATE \`(\w+)\`/)?.[1] ?? '';
