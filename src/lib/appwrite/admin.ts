import { Client, Users, Account } from "node-appwrite";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env \`${name}\``);
  return v;
}

export function getAppwriteAdmin() {
  const client = new Client()
    .setEndpoint(mustEnv("APPWRITE_ENDPOINT"))
    .setProject(mustEnv("APPWRITE_PROJECT_ID"))
    .setKey(mustEnv("APPWRITE_API_KEY"));

  return {
    client,
    users: new Users(client),
    account: new Account(client),
  };
}

