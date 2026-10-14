-- Only one StudyVille item can sit on a tile. The app checks this too, but
-- the unique key keeps two quick clicks from stacking items on one spot.
ALTER TABLE usercitylayout
    ADD UNIQUE KEY uq_city_tile (user_id, position_x, position_y);
