import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class addStatusColumnToSurveys1615145298070 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('surveys', 'is_active')
    await queryRunner.addColumn(
      'surveys',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        isNullable: false,
        enum: ['D', 'P', 'C']
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('surveys', 'status')
    await queryRunner.addColumn(
      'surveys',
      new TableColumn({
        name: 'is_active',
        type: 'bool',
        isNullable: false,
        default: true
      })
    )
  }
}
