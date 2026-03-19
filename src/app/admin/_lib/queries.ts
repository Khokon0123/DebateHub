"use client";

import type { AdminTournamentRow } from "./types";

export const TOURNAMENT_SELECT_WITH_ORGANIZER =
  "id,user_id,name,format,status,city,country,venue,start_date,end_date,created_at,updated_at,team_cap,registered_teams,registration_deadline,registration_link,registration_open,fee,rounds,type,description,rules,prizes,payment_info,judges,whatsapp,facebook,address,maps_link,profiles:profiles!tournaments_user_id_fkey(full_name,organization,email,whatsapp)";

export function mapOrganizer(row: any): AdminTournamentRow {
  const organizer = row?.profiles ?? null;
  const r: AdminTournamentRow = {
    ...row,
    organizer: organizer
      ? {
          full_name: organizer.full_name ?? null,
          organization: organizer.organization ?? null,
          email: organizer.email ?? null,
          whatsapp: organizer.whatsapp ?? null,
        }
      : null,
  };
  return r;
}

