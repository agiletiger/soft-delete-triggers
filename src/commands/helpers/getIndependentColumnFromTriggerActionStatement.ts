export const getIndependentColumnFromTriggerActionStatement = (actionSatement: string) => actionSatement.match(/NEW\`\.\`(.*)\`;/)?.[1] ?? '';
