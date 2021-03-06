import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class createSurveyOptions1615038927846 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'survey_options',
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
            name: 'option',
            type: 'varchar',
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
    await queryRunner.dropTable('survey_options')
  }
}
