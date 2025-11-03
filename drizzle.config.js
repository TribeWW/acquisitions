import "dotenv/config";

export default {
  dialect: "postgresql",
  schema: "./src/models/*.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
