DELETE FROM public.vaishnav_events;

INSERT INTO public.vaishnav_events (title, event_date, event_type, description) VALUES
-- ===== EKADASHIS 2026 (24 dates) — verified from Drik Panchang ISKCON list =====
('Shat-tila Ekadashi',          '2026-01-14', 'ekadashi', 'Madhava Masa (Magha), Krishna Paksha. Fast from grains till sunrise next day.'),
('Bhaimi Ekadashi (Trisparsha Mahadvadashi)', '2026-01-29', 'ekadashi', 'Madhava Masa (Magha), Gaura Paksha. Special observance.'),
('Vijaya Ekadashi',             '2026-02-13', 'ekadashi', 'Govinda Masa (Phalguna), Krishna Paksha.'),
('Amalaki Vrata Ekadashi',      '2026-02-27', 'ekadashi', 'Govinda Masa (Phalguna), Gaura Paksha.'),
('Papamochani Ekadashi',        '2026-03-14', 'ekadashi', 'Vishnu Masa (Chaitra), Krishna Paksha.'),
('Kamada Ekadashi',             '2026-03-29', 'ekadashi', 'Vishnu Masa (Chaitra), Gaura Paksha.'),
('Varuthini Ekadashi',          '2026-04-13', 'ekadashi', 'Madhusudana Masa (Vaishakha), Krishna Paksha.'),
('Mohini Ekadashi',             '2026-04-27', 'ekadashi', 'Madhusudana Masa (Vaishakha), Gaura Paksha.'),
('Apara Ekadashi',              '2026-05-13', 'ekadashi', 'Trivikrama Masa (Jyeshtha), Krishna Paksha.'),
('Padmini Ekadashi (Vyanjuli Mahadvadashi)', '2026-05-27', 'ekadashi', 'Adhika/Trivikrama Masa, Gaura Paksha.'),
('Parama Ekadashi',             '2026-06-11', 'ekadashi', 'Adhika/Trivikrama Masa, Krishna Paksha.'),
('Pandava Nirjala Ekadashi',    '2026-06-25', 'ekadashi', 'Trivikrama Masa (Jyeshtha), Gaura Paksha. Waterless fast.'),
('Yogini Ekadashi',             '2026-07-11', 'ekadashi', 'Vamana Masa (Ashadha), Krishna Paksha.'),
('Sayana Ekadashi (Devshayani)','2026-07-25', 'ekadashi', 'Vamana Masa (Ashadha), Gaura Paksha. Lord Vishnu begins yogic sleep — Chaturmasya begins.'),
('Kamika Ekadashi (Trisparsha Mahadvadashi)', '2026-08-09', 'ekadashi', 'Shridhara Masa (Shravana), Krishna Paksha.'),
('Pavitropana Ekadashi (Paksha Vardhini Mahadvadashi)', '2026-08-24', 'ekadashi', 'Shridhara Masa (Shravana), Gaura Paksha.'),
('Annada Ekadashi',             '2026-09-07', 'ekadashi', 'Hrishikesha Masa (Bhadra), Krishna Paksha.'),
('Parshva Ekadashi (Parivartini)', '2026-09-22', 'ekadashi', 'Hrishikesha Masa (Bhadra), Gaura Paksha. Lord Vishnu turns over in His sleep.'),
('Indira Ekadashi',             '2026-10-06', 'ekadashi', 'Padmanabha Masa (Ashvina), Krishna Paksha.'),
('Pashankusha Ekadashi',        '2026-10-22', 'ekadashi', 'Padmanabha Masa (Ashvina), Gaura Paksha.'),
('Rama Ekadashi',               '2026-11-05', 'ekadashi', 'Damodara Masa (Kartika), Krishna Paksha.'),
('Utthana Ekadashi (Prabodhini)','2026-11-20', 'ekadashi', 'Damodara Masa (Kartika), Gaura Paksha. Lord Vishnu awakens — Chaturmasya ends.'),
('Utpanna Ekadashi',            '2026-12-04', 'ekadashi', 'Keshava Masa (Margashirsha), Krishna Paksha. Birth of Goddess Ekadashi.'),
('Mokshada Ekadashi (Gita Jayanti)', '2026-12-20', 'ekadashi', 'Keshava Masa (Margashirsha), Gaura Paksha. Day Bhagavad-gita was spoken.'),

-- ===== MAJOR FESTIVALS & APPEARANCE / DISAPPEARANCE DAYS 2026 =====
('Sri Krishna Pushya Abhishek',     '2026-01-03', 'festival', 'Auspicious abhishek of Lord Sri Krishna.'),
('Appearance — Srila Gopala Bhatta Goswami', '2026-01-07', 'appearance', 'One of the Six Goswamis of Vrindavan.'),
('Disappearance — Sri Jayadeva Goswami', '2026-01-08', 'disappearance', 'Author of Sri Gita Govinda.'),
('Disappearance — Srila Locana Dasa Thakura', '2026-01-09', 'disappearance', 'Author of Sri Caitanya Mangala.'),
('Vasanta Panchami / Sri Visnupriya Devi Appearance', '2026-01-23', 'festival', 'Appearance of Sri Sri Visnupriya Devi, Srila Pundarika Vidyanidhi, Srila Raghunatha Dasa Goswami.'),

('Sri Gaura Purnima — Appearance of Sri Chaitanya Mahaprabhu', '2026-03-03', 'festival', 'Most important festival of the Gaudiya Vaishnava year. Fast till moonrise.'),
('Festival of Jagannatha Misra',    '2026-03-04', 'festival', 'Father of Sri Caitanya Mahaprabhu — celebration the day after Gaura Purnima.'),
('Sri Rama Navami',                 '2026-03-27', 'festival', 'Appearance of Lord Sri Ramachandra. Fasting till sunset.'),

('Hanuman Jayanti',                 '2026-04-02', 'festival', 'Appearance day of Sri Hanuman.'),
('Beginning of Salagrama & Tulasi Jala-Dana', '2026-04-14', 'festival', 'Daily offering of water to Tulasi Devi & Salagrama begins.'),
('Akshaya Tritiya & Chandan Yatra begins', '2026-04-20', 'festival', 'Sri Srinivasa Govinda Chandan Yatra begins.'),
('Nrsimha Caturdasi — Appearance of Lord Nrsimhadeva', '2026-04-30', 'festival', 'Fasting till dusk; offer abhishek to Lord Nrsimha.'),

('End of Salagrama & Tulasi Jala-Dana', '2026-05-14', 'festival', 'Concludes one month of water-offering to Tulasi Devi.'),
('Srila Prabhupada Eka-Diksha-Guru Vijayotsava', '2026-05-16', 'festival', 'Vishvaguru observance.'),

('Panihati Chida-Dahi Utsava',      '2026-06-27', 'festival', 'Famous chipped-rice and yogurt festival of Sri Raghunatha Dasa Goswami.'),
('Jagannatha Snana Yatra',          '2026-06-29', 'festival', 'Bathing festival of Lord Jagannatha.'),

('Disappearance — Srila Bhaktivinoda Thakura', '2026-07-14', 'disappearance', 'Founder of modern Gaudiya Vaishnava preaching.'),
('Sri Jagannatha Ratha Yatra',      '2026-07-16', 'festival', 'Lord Jagannatha, Baladeva & Subhadra Devi travel to Gundicha temple.'),
('Sudarshana Jayanti',              '2026-07-21', 'festival', 'Appearance of the Sudarshana Chakra.'),
('Bahuda Ratha Yatra (Return)',     '2026-07-24', 'festival', 'Lord Jagannatha returns from Gundicha to Sri Mandir.'),
('First month of Chaturmasya begins','2026-07-29', 'festival', 'Fast from leafy vegetables (shak) for one month.'),

('Jhulan Yatra begins',             '2026-08-23', 'festival', 'Swing festival of Sri Sri Radha-Krishna.'),
('Sri Balarama Jayanti / Jhulan Yatra ends', '2026-08-28', 'festival', 'Appearance of Lord Balarama. Second month of Chaturmasya begins (fast from yogurt). Fast till noon.'),

('Sri Krishna Janmashtami',         '2026-09-04', 'festival', 'Appearance of Lord Sri Krishna. Fast till midnight.'),
('Nandotsava & Srila Prabhupada Vyasa Puja', '2026-09-05', 'festival', 'Appearance of His Divine Grace A.C. Bhaktivedanta Swami Srila Prabhupada. Fast till noon.'),
('Sri Radhastami — Appearance of Srimati Radharani', '2026-09-19', 'festival', 'Fast till noon.'),
('Vamana Jayanti — Appearance of Lord Vamanadeva', '2026-09-23', 'festival', 'Fast observed previous day till noon.'),
('Appearance — Srila Bhaktivinoda Thakura', '2026-09-24', 'appearance', 'Fast till noon.'),
('Third month of Chaturmasya begins','2026-09-26', 'festival', 'Fast from milk for one month.'),

('Vijaya Dashami (Dasara)',         '2026-10-21', 'festival', 'Victory of Lord Rama over Ravana.'),
('Fourth month of Chaturmasya / Karthika Deepotsava begins', '2026-10-26', 'festival', 'Fast from urad dal; daily lamp offering to Sri Damodara begins.'),

('Govardhana Puja & Go Puja',       '2026-11-10', 'festival', 'Worship of Sri Giri-Govardhana and the cows. Annakuta offering.'),
('Disappearance — Srila Prabhupada','2026-11-13', 'disappearance', 'Disappearance day of His Divine Grace A.C. Bhaktivedanta Swami Srila Prabhupada. Fast till noon.'),
('Disappearance — Srila Gaura Kishora Dasa Babaji', '2026-11-21', 'disappearance', 'Diksha-guru of Srila Bhaktisiddhanta Saraswati Thakura.'),
('Last day of Chaturmasya & Deepotsava', '2026-11-24', 'festival', 'Concludes the four months of austerity.'),

('Srila Prabhupada Diksha Diwasa',  '2026-12-01', 'festival', 'Initiation day of Srila Prabhupada.'),
('Disappearance — Srila Bhaktisiddhanta Saraswati Thakura', '2026-12-27', 'disappearance', 'Spiritual master of Srila Prabhupada. Fast till noon.');
