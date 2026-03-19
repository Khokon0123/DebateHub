export type TournamentStatus = "pending" | "approved" | "rejected" | string;
export type TournamentFormat = "BP" | "AP" | "WSDC" | "KP" | null;

export type AdminTournamentRow = {
  id: string;
  user_id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  city: string | null;
  country: string | null;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  team_cap: number | null;
  registered_teams: number | null;
  registration_deadline: string | null;
  registration_link: string | null;
  registration_open: boolean | null;
  fee: string | null;
  rounds: number | null;
  type: "In-Person" | "Online" | "Hybrid" | null;
  description: string | null;
  rules: string | null;
  prizes: string | null;
  payment_info: string | null;
  judges: string | null;
  whatsapp: string | null;
  facebook: string | null;
  address: string | null;
  maps_link: string | null;

  // joined organizer profile (via tournaments.user_id -> profiles.id)
  organizer?: {
    full_name: string | null;
    organization: string | null;
    email: string | null;
    whatsapp: string | null;
  } | null;
};

