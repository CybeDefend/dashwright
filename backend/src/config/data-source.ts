import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";

config();

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "dashwright",
  password: process.env.DB_PASSWORD || "changeme",
  database: process.env.DB_DATABASE || "dashwright",
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  synchronize: false,
  logging: false,
  migrationsRun: true, // Run migrations automatically on startup
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
