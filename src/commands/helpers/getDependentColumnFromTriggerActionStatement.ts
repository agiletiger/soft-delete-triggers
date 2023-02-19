export const getDependentColumnFromTriggerActionStatement = (actionSatement: string) => actionSatement.match(/WHERE \`\w+\`\.\`(\w+)\`/)?.[1] ?? '';
