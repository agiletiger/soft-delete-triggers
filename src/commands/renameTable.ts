import { QueryInterface } from 'sequelize';
import { RenameTableParameters } from '../types';
import { buildCreateTriggerStatement } from './helpers/buildCreateTriggerStatement';
import { buildDropTriggerStatement } from './helpers/buildDropTriggerStatement';
import { buildExistTriggerStatement } from './helpers/buildExistTriggerStatement';

export const RENAME_TABLE_COMMAND_NAME = 'renameTable';

type ForeignKeyReference = {
  referencedTableName: string;
  referencedColumnName: string;
};

export const renameTable = async (target: QueryInterface, parameters: RenameTableParameters) => {
  const [oldName, newName] = parameters;

  const foreignKeyReferences = (await target.getForeignKeyReferencesForTable(
    oldName,
  )) as ForeignKeyReference[];

  const foreignKeyReferencesWithTriggers = (
    await Promise.all(
      foreignKeyReferences.map(async ({ referencedTableName, referencedColumnName }) => {
        const exists = await target.sequelize.query(
          buildExistTriggerStatement(referencedTableName, oldName as string),
        );
        return exists ? { referencedTableName, referencedColumnName } : null;
      }),
    )
  ).filter((references) => !!references) as ForeignKeyReference[];

  const commandResult = await Reflect.apply(
    (target as Record<string, any>)[RENAME_TABLE_COMMAND_NAME],
    target,
    parameters,
  );

  if (foreignKeyReferencesWithTriggers.length) {
    const columnsDescription = await target.describeTable(oldName);

    const primaryKey = Object.entries(columnsDescription).find(
      ([_, description]) => description.primaryKey,
    )?.[0];

    await Promise.all(
      foreignKeyReferencesWithTriggers.map(({ referencedTableName, referencedColumnName }) =>
        target.sequelize.query(
          buildCreateTriggerStatement(
            referencedTableName,
            referencedColumnName,
            newName as string,
            primaryKey as string,
          ),
        ),
      ),
    );

    await Promise.all(
      foreignKeyReferencesWithTriggers.map(({ referencedTableName }) =>
        target.sequelize.query(buildDropTriggerStatement(referencedTableName, oldName as string)),
      ),
    );
  }
  return commandResult;
};
