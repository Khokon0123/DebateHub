import { Client, Account } from "appwrite";

export function getAppwriteAccount() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) return null;

  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  return new Account(client);
}

