var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    var _a, _b, _c;
    if (typeof options === 'object' &&
        'onDelete' in options &&
        options.onDelete === 'PARANOID CASCADE') {
        if ('references' in options) {
            const { references } = options;
            if (typeof references === 'string') {
                return { primaryTable: references, primaryKey: (_a = getPrimaryKey === null || getPrimaryKey === void 0 ? void 0 : getPrimaryKey(references)) !== null && _a !== void 0 ? _a : 'id' };
            }
            const model = references.model;
            return {
                primaryTable: model,
                primaryKey: (_c = (_b = references === null || references === void 0 ? void 0 : references.key) !== null && _b !== void 0 ? _b : getPrimaryKey === null || getPrimaryKey === void 0 ? void 0 : getPrimaryKey(model)) !== null && _c !== void 0 ? _c : 'id',
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
        return (...args) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const commandPromise = Reflect.apply(origMethod, target, args);
            // here we may add a triggers to set the deletedAt field on the table being modified or created
            // when the referenced table is paranoid deleted
            if (command === 'addColumn') {
                const addColumnArgs = args;
                const { primaryTable, primaryKey } = (_a = getPrimaryTableProps(addColumnArgs === null || addColumnArgs === void 0 ? void 0 : addColumnArgs[2], options === null || options === void 0 ? void 0 : options.getPrimaryKey)) !== null && _a !== void 0 ? _a : {};
                if (primaryTable) {
                    const foreignTable = addColumnArgs[0];
                    const foreignKey = addColumnArgs[1];
                    const commandResult = yield commandPromise;
                    const statement = createParanoidDeleteTriggerStatement(primaryTable, primaryKey, foreignTable, foreignKey);
                    yield target.sequelize.query(statement);
                    return commandResult;
                }
            }
            if (command === 'createTable') {
                const [newTable, columns] = args;
                const commandResult = yield commandPromise;
                yield Promise.all([
                    ...Object.entries(columns)
                        .map(([columnName, columnDescription]) => ({
                        columnName,
                        primaryTableProps: getPrimaryTableProps(columnDescription, options === null || options === void 0 ? void 0 : options.getPrimaryKey),
                    }))
                        .filter(({ primaryTableProps }) => primaryTableProps !== null)
                        .map(({ columnName: foreignKey, primaryTableProps }) => target.sequelize.query(createParanoidDeleteTriggerStatement(primaryTableProps.primaryTable, primaryTableProps.primaryKey, newTable, foreignKey))),
                ]);
                return commandResult;
            }
            return commandPromise;
        });
    },
});
//# sourceMappingURL=index.js.map