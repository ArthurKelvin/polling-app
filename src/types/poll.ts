export interface PollOption {
  id: string;
  label: string;
  position: number;
  created_at: string;
}

export interface Poll {
  id: string;
  question: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  poll_options?: PollOption[];
}

export interface PollWithOptions extends Poll {
  poll_options: PollOption[];
}

export interface PollResults {
  poll_id: string;
  option_id: string;
  label: string;
  votes_count: number;
}

export interface CreatePollData {
  question: string;
  options: string[];
  is_public?: boolean;
}

export interface EditPollData {
  question: string;
  options: Array<{
    id?: string;
    label: string;
    position: number;
  }>;
  is_public?: boolean;
}

export interface VoteData {
  poll_id: string;
  option_id: string;
}
