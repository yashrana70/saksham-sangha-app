CREATE TABLE public.todo_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  email text,
  phone text,
  whatsapp text,
  devotee_level text,
  facilitator_name text,
  spiritual_friend_name text,
  gender text,
  dob date,
  education text,
  profession text,
  marital_status text,
  address text,
  photo_url text,
  family jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  bhakti_vriksha_level integer,
  parent_id uuid
);

CREATE TABLE public.vaishnav_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date NOT NULL,
  event_type text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sadhna_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  japa_rounds integer DEFAULT 0,
  hearing_minutes integer DEFAULT 0,
  reading_minutes integer DEFAULT 0,
  seva_minutes integer DEFAULT 0,
  association_minutes integer DEFAULT 0,
  wake_up_time time without time zone,
  sleep_time time without time zone,
  notes text,
  facilitator_name text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  hearing_topic text,
  reading_topic text,
  devotee_name text,
  chanting_completion_time time without time zone,
  day_rest_minutes integer DEFAULT 0,
  target_rounds integer DEFAULT 16,
  total_marks integer,
  study_hours numeric DEFAULT 0,
  exercise_minutes integer DEFAULT 0,
  morning_japa_attended boolean DEFAULT false,
  morning_japa_duration integer DEFAULT 0,
  positive_chetna text[] DEFAULT '{}'::text[],
  negative_chetna text[] DEFAULT '{}'::text[],
  weekly_bonus integer DEFAULT 0,
  service_details text
);

CREATE TABLE public.hierarchy_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'devotee'::text,
  parent_id uuid,
  linked_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'devotee'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
