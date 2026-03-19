-- Drop all conflicting duplicate policies on tournaments table
DROP POLICY IF EXISTS "Restrict tournament deletions by role" ON tournaments;
DROP POLICY IF EXISTS "Restrict Tournament Deletion" ON tournaments;
DROP POLICY IF EXISTS "Tournament delete access control" ON tournaments;
DROP POLICY IF EXISTS "Organizers can delete own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admin can delete any tournament" ON tournaments;

-- Now create ONE clean set of policies
-- Public can read approved tournaments
CREATE POLICY "Public read approved tournaments"
ON tournaments FOR SELECT
USING (status = 'approved');

-- Logged in users can insert tournaments
CREATE POLICY "Organizers can insert tournaments"
ON tournaments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Organizers can update their own tournaments
CREATE POLICY "Organizers can update own tournaments"
ON tournaments FOR UPDATE
USING (auth.uid() = user_id);

-- Organizers can delete their own tournaments
CREATE POLICY "Organizers can delete own tournaments"
ON tournaments FOR DELETE
USING (auth.uid() = user_id);

-- Admin can do everything
CREATE POLICY "Admin full access"
ON tournaments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

