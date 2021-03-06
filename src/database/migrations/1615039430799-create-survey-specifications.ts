import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class createSurveySpecifications1615039430799 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'survey_specifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'survey_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
            enum: ['A', 'G']
          },
          {
            name: 'value',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'weight',
            type: 'float4',
            isNullable: false
          }
        ],
        foreignKeys: [
          {
            columnNames: ['survey_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'surveys',
            onDelete: 'CASCADE'
          }
        ]
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('survey_specifications')
  }
}
