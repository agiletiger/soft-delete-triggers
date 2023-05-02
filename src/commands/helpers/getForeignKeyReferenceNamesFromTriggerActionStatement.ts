//TODO return ForeignKeyReferenceNames
export const getForeignKeyReferenceNamesFromTriggerActionStatement = (actionSatement: string) => ({
    independentTableName: actionSatement.match(/-- independentTableName: (\w+)/)?.[1] ?? '',
    independentTableColumnName: actionSatement.match(/-- independentTableColumnName: (\w+)/)?.[1] ?? '',
    dependentTableName: actionSatement.match(/-- dependentTableName: (\w+)/)?.[1] ?? '',
    dependentTableColumnName: actionSatement.match(/-- dependentTableColumnName: (\w+)/)?.[1] ?? '',
});
