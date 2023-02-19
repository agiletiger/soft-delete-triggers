// MYSQL has a limit of 63 chars on triggers name
// if table 'big' we remove the vowels hoping the trigger name will fit in 63 chars
const MAX_TABLE_NAME_LENGTH = 16;

export const buildTriggerName = (primaryTable: string, foreignTable: string): string =>
  `on_${
    primaryTable.length > MAX_TABLE_NAME_LENGTH
      ? primaryTable.replace(/[aeiou]/gi, '')
      : primaryTable
  }_del_upd_${
    foreignTable.length > MAX_TABLE_NAME_LENGTH
      ? foreignTable.replace(/[aeiou]/gi, '')
      : foreignTable
  }`;
