import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["knex", "pg", "sqlite3"]
};

export default nextConfig;
