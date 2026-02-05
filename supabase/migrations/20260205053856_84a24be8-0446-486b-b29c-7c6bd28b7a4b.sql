-- Insert default homepage sections if they don't exist
INSERT INTO homepage_content (section_key, title, content, display_order, is_visible)
VALUES
  ('hero', '45-Book Reading Challenge', 'Fiction as a Mirror of Humanity - A year-long literary adventure designed to awaken curiosity, empathy, and imagination.', 1, true),
  ('goals', 'Our Goals', 'Through this challenge, MYP5 and DP1 learners will journey across worlds, voices, and experiences.', 2, true),
  ('categories', '30 Reading Categories', 'Choose from fiction, non-fiction, poetry, or plays — any work that reflects an aspect of the human experience.', 3, true),
  ('ib_connections', 'IB Connections', 'This challenge connects deeply with IB frameworks and learner development.', 4, true),
  ('outcomes', 'Expected Outcomes', 'By the end of this challenge, you will have achieved meaningful reading goals.', 5, true),
  ('points', 'Points System', 'Every page you read earns points for you, your class, and your house.', 6, true),
  ('footer', '45-Book Reading Challenge', 'Every story is a mirror; when we read, we find not only the world but also ourselves.', 7, true)
ON CONFLICT (section_key) DO NOTHING;