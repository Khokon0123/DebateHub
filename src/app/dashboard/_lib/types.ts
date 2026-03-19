export type TournamentStatus = "pending" | "approved" | "rejected" | string;
export type TournamentFormat = "BP" | "AP" | "WSDC" | "KP" | null;

export type TournamentRow = {
  id: string;
  user_id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  type: "In-Person" | "Online" | "Hybrid" | null;
  team_cap: number | null;
  registered_teams: number | null;
  registration_open: boolean | null;
  registration_link: string | null;
  updated_at: string | null;

  // fields used in edit modal
  rounds: number | null;
  fee: string | null;
  registration_deadline: string | null;
  address: string | null;
  maps_link: string | null;
  description: string | null;
  rules: string | null;
  prizes: string | null;
};

