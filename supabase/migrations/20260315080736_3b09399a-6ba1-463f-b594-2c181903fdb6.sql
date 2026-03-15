
-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'chairperson', 'treasurer', 'secretary', 'discipline_leader');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Authenticated users can view user_roles"
  ON public.user_roles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert user_roles"
  ON public.user_roles FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete user_roles"
  ON public.user_roles FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- Leader invitations table (admin registers leaders by email)
CREATE TABLE public.leader_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  full_name TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leader_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invitations"
  ON public.leader_invitations FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert invitations"
  ON public.leader_invitations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update invitations"
  ON public.leader_invitations FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete invitations"
  ON public.leader_invitations FOR DELETE USING (auth.role() = 'authenticated');

-- Auto-assign role when invited leader signs up
CREATE OR REPLACE FUNCTION public.handle_leader_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation RECORD;
BEGIN
  SELECT * INTO invitation
  FROM public.leader_invitations
  WHERE email = NEW.email AND accepted = false
  LIMIT 1;

  IF invitation IS NOT NULL THEN
    -- Assign the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invitation.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Mark invitation as accepted
    UPDATE public.leader_invitations
    SET accepted = true, accepted_at = now()
    WHERE id = invitation.id;

    -- Update profile name
    UPDATE public.profiles
    SET full_name = invitation.full_name
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_leader_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_leader_signup();
