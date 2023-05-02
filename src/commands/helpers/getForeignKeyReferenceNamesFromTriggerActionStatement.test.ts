import { expect } from 'chai';
import { getForeignKeyReferenceNamesFromTriggerActionStatement } from './getForeignKeyReferenceNamesFromTriggerActionStatement';

describe('getForeignKeyReferenceNamesFromTriggerActionStatement', () => {

  const actionSatement = `
    BEGIN
      -- begin paranoid sequelize delete metadata
      -- independentTableName: scale_ticket_material
      -- independentTableColumnName: scaleTicketMaterialId
      -- dependentTableName: scale_ticket_material
      -- dependentTableColumnName: reversedScaleTicketMaterialId
      -- end paranoid sequelize delete metadata
      IF \`OLD\`.\`deletedAt\` IS NULL AND \`NEW\`.\`deletedAt\` IS NOT NULL THEN
        UPDATE \`scale_ticket_material\`
          SET \`scale_ticket_material\`.\`deletedAt\` = NOW()
        WHERE \`scale_ticket_material\`.\`reversedScaleTicketMaterialId\` = \`NEW\`.\`scaleTicketMaterialId\`;
      END IF;
    END
  `;

  it('should parse all the names', function () {
    const names = getForeignKeyReferenceNamesFromTriggerActionStatement(actionSatement);

    expect(names.independentTableName).to.be.eql('scale_ticket_material');
    expect(names.independentTableColumnName).to.be.eql('scaleTicketMaterialId');
    expect(names.dependentTableName).to.be.eql('scale_ticket_material');
    expect(names.dependentTableColumnName).to.be.eql('reversedScaleTicketMaterialId');
  });
});
