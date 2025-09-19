-- Add user roles and permissions system
-- This migration adds role-based access control to the polling app

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  permission VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Insert default permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('user', 'create_poll'),
  ('user', 'vote_poll'),
  ('user', 'view_poll'),
  ('user', 'share_poll'),
  ('moderator', 'create_poll'),
  ('moderator', 'vote_poll'),
  ('moderator', 'view_poll'),
  ('moderator', 'share_poll'),
  ('moderator', 'moderate_poll'),
  ('moderator', 'delete_comment'),
  ('admin', 'create_poll'),
  ('admin', 'vote_poll'),
  ('admin', 'view_poll'),
  ('admin', 'share_poll'),
  ('admin', 'moderate_poll'),
  ('admin', 'delete_comment'),
  ('admin', 'manage_users'),
  ('admin', 'delete_poll'),
  ('admin', 'view_analytics'),
  ('admin', 'manage_roles')
ON CONFLICT (role, permission) DO NOTHING;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_roles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = user_uuid 
    AND rp.permission = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(user_uuid UUID, role_name VARCHAR(20))
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (user_uuid, role_name)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = role_name,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission VARCHAR(50)) AS $$
BEGIN
  RETURN QUERY
  SELECT rp.permission
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role = rp.role
  WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can assign roles
CREATE POLICY "Only admins can assign roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add RLS policies for role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view permissions
CREATE POLICY "Authenticated users can view permissions" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);

-- Create trigger to automatically assign 'user' role to new users
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT ON role_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(UUID, VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_role(UUID, VARCHAR(20)) TO authenticated;
