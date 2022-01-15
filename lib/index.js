const createParanoidDeleteTriggerStatement = (primaryTable, primaryKey, foreignTable, foreignKey) => /* sql */ `
  CREATE TRIGGER on_${primaryTable}_delete_update_${foreignTable}
  AFTER UPDATE
  ON ${primaryTable} FOR EACH ROW
  BEGIN
    IF OLD.deletedAt IS NULL AND NEW.deletedAt IS NOT NULL THEN
      UPDATE ${foreignTable}
        SET ${foreignTable}.deletedAt = NOW()
      WHERE ${foreignTable}.${foreignKey} = NEW.${primaryKey};
    END IF;
  END;
`;
const getPrimaryTableProps = (options, getPrimaryKey) => {
    if (typeof options === 'object' &&
        'onDelete' in options &&
        options.onDelete === 'PARANOID CASCADE') {
        if ('references' in options) {
            const { references } = options;
            if (typeof references === 'string') {
                return { primaryTable: references, primaryKey: getPrimaryKey?.(references) ?? 'id' };
            }
            const model = references.model;
            return {
                primaryTable: model,
                primaryKey: references?.key ?? getPrimaryKey?.(model) ?? 'id',
            };
        }
    }
    return null;
};
export const queryInterfaceDecorator = (queryInterface, options) => new Proxy(queryInterface, {
    get(target, propKey, _receiver) {
        if (propKey === 'sequelize') {
            return target[propKey];
        }
        const command = String(propKey);
        const origMethod = target[command];
        return async (...args) => {
            const commandPromise = Reflect.apply(origMethod, target, args);
            // here we may add a triggers to set the deletedAt field on the table being modified or created
            // when the referenced table is paranoid deleted
            if (command === 'addColumn') {
                const addColumnArgs = args;
                const { primaryTable, primaryKey } = getPrimaryTableProps(addColumnArgs?.[2], options?.getPrimaryKey) ?? {};
                if (primaryTable) {
                    const foreignTable = addColumnArgs[0];
                    const foreignKey = addColumnArgs[1];
                    const commandResult = await commandPromise;
                    const statement = createParanoidDeleteTriggerStatement(primaryTable, primaryKey, foreignTable, foreignKey);
                    await target.sequelize.query(statement);
                    return commandResult;
                }
            }
            if (command === 'createTable') {
                const [newTable, columns] = args;
                const commandResult = await commandPromise;
                await Promise.all([
                    ...Object.entries(columns)
                        .map(([columnName, columnDescription]) => ({
                        columnName,
                        primaryTableProps: getPrimaryTableProps(columnDescription, options?.getPrimaryKey),
                    }))
                        .filter(({ primaryTableProps }) => primaryTableProps !== null)
                        .map(({ columnName: foreignKey, primaryTableProps }) => target.sequelize.query(createParanoidDeleteTriggerStatement(primaryTableProps.primaryTable, primaryTableProps.primaryKey, newTable, foreignKey))),
                ]);
                return commandResult;
            }
            return commandPromise;
        };
    },
});
//# sourceMappingURL=index.js.map