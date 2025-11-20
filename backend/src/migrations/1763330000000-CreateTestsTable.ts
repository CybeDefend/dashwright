import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateTestsTable1763330000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "tests",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "500",
          },
          {
            name: "status",
            type: "enum",
            enum: ["passed", "failed", "skipped", "flaky"],
          },
          {
            name: "duration",
            type: "int",
            isNullable: true,
          },
          {
            name: "errorMessage",
            type: "text",
            isNullable: true,
          },
          {
            name: "errorStack",
            type: "text",
            isNullable: true,
          },
          {
            name: "retries",
            type: "int",
            default: 1,
          },
          {
            name: "testRunId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "tests",
      new TableForeignKey({
        columnNames: ["testRunId"],
        referencedColumnNames: ["id"],
        referencedTableName: "test_runs",
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("tests");
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("testRunId") !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey("tests", foreignKey);
      }
    }
    await queryRunner.dropTable("tests");
  }
}
