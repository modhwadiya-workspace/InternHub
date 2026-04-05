-- Seed data for InternHub
-- This file is safe to run multiple times.

BEGIN;

-- Shared bcrypt hash for password: Admin@123
-- Keep this aligned with app auth (bcrypt compare in lib/auth.ts).
WITH constants AS (
  SELECT '$2b$12$/nl1FYCZ3u2yRjazLBw4JunaAydvb7aYLZ2T0uPe4BZlH9n0Gpjz6'::text AS password_hash
), dept_data(name) AS (
  VALUES
    ('SAP.Net'),
    ('.Net-JIA'),
    ('Mobile'),
    ('AI'),
    ('QC'),
    ('PHP'),
    ('.Net-GUDM'),
    ('RPA'),
    ('Java'),
    ('Odoo'),
    ('.Net-MEA'),
    ('General')
)
INSERT INTO public.departments (name)
SELECT d.name
FROM dept_data d
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments existing WHERE existing.name = d.name
);

WITH constants AS (
  SELECT '$2b$12$/nl1FYCZ3u2yRjazLBw4JunaAydvb7aYLZ2T0uPe4BZlH9n0Gpjz6'::text AS password_hash
)
INSERT INTO public.users (name, email, password, role, department_id, gender, contact_number)
SELECT
  'Administrator',
  'admin@internhub.com',
  c.password_hash,
  'admin',
  NULL,
  'male',
  '9000000000'
FROM constants c
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  department_id = EXCLUDED.department_id,
  gender = EXCLUDED.gender,
  contact_number = EXCLUDED.contact_number;

WITH constants AS (
  SELECT '$2b$12$/nl1FYCZ3u2yRjazLBw4JunaAydvb7aYLZ2T0uPe4BZlH9n0Gpjz6'::text AS password_hash
), manager_data(name, email, department_name, contact_number) AS (
  VALUES
    ('Manager SAP.Net', 'sapnet.manager@internhub.com', 'SAP.Net', '9000000001'),
    ('Manager .Net-JIA', 'dotnetjia.manager@internhub.com', '.Net-JIA', '9000000002'),
    ('Manager Mobile', 'mobile.manager@internhub.com', 'Mobile', '9000000003'),
    ('Manager AI', 'ai.manager@internhub.com', 'AI', '9000000004'),
    ('Manager QC', 'qc.manager@internhub.com', 'QC', '9000000005'),
    ('Manager PHP', 'php.manager@internhub.com', 'PHP', '9000000006'),
    ('Manager .Net-GUDM', 'dotnetgudm.manager@internhub.com', '.Net-GUDM', '9000000007'),
    ('Manager RPA', 'rpa.manager@internhub.com', 'RPA', '9000000008'),
    ('Manager Java', 'java.manager@internhub.com', 'Java', '9000000009'),
    ('Manager Odoo', 'odoo.manager@internhub.com', 'Odoo', '9000000010'),
    ('Manager .Net-MEA', 'dotnetmea.manager@internhub.com', '.Net-MEA', '9000000011'),
    ('Manager General', 'general.manager@internhub.com', 'General', '9000000012')
)
INSERT INTO public.users (name, email, password, role, department_id, gender, contact_number)
SELECT
  m.name,
  m.email,
  c.password_hash,
  'manager',
  d.id,
  'male',
  m.contact_number
FROM manager_data m
JOIN public.departments d ON d.name = m.department_name
CROSS JOIN constants c
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  department_id = EXCLUDED.department_id,
  gender = EXCLUDED.gender,
  contact_number = EXCLUDED.contact_number;

WITH constants AS (
  SELECT '$2b$12$/nl1FYCZ3u2yRjazLBw4JunaAydvb7aYLZ2T0uPe4BZlH9n0Gpjz6'::text AS password_hash
), intern_data(name, email, department_name, college, date_of_birth, degree, contact_number) AS (
  VALUES
    ('Krishna Thakker', 'krishna.thakker.g1@internhub.com', 'SAP.Net', 'GEC Patan', '2004-09-18', 'B.E. Computer Engineering', '9010000001'),
    ('Aditya Valand', 'aditya.valand.g1@internhub.com', '.Net-JIA', 'GEC Rajkot', '2005-01-22', 'B.E. Computer Engineering', '9010000002'),
    ('Vala Parimal Nareshbhai', 'vala.parimal.g1@internhub.com', 'Mobile', 'GEC Bhavnagar', '2004-07-14', 'B.E. Computer Engineering', '9010000003'),
    ('Bhargav Rajeshbhai Dungrani', 'bhargav.dungrani.g1@internhub.com', 'AI', 'Charusat University', '2005-03-03', 'B.E. Computer Engineering', '9010000004'),
    ('Jadeja Maitri', 'jadeja.maitri.g1@internhub.com', 'QC', 'GLS', '2004-11-09', 'B.E. Computer Engineering', '9010000005'),

    ('Hetvi Zora', 'hetvi.zora.g2@internhub.com', 'PHP', 'GEC Patan', '2005-02-11', 'B.E. Computer Engineering', '9010000006'),
    ('Neelkumar Thumar', 'neelkumar.thumar.g2@internhub.com', '.Net-GUDM', 'GEC Rajkot', '2004-08-29', 'B.E. Computer Engineering', '9010000007'),
    ('Muhammadhassan Gadhawala', 'muhammadhassan.gadhawala.g2@internhub.com', 'Mobile', 'GEC Modasa', '2005-01-08', 'B.E. Computer Engineering', '9010000008'),
    ('Harsh Bharatbhai Parsaniya', 'harsh.parsaniya.g2@internhub.com', 'SAP.Net', 'Charusat University', '2004-06-27', 'B.E. Computer Engineering', '9010000009'),
    ('Ranpara Viraj', 'ranpara.viraj.g2@internhub.com', 'QC', 'GEC Morbi', '2005-03-19', 'B.E. Computer Engineering', '9010000010'),

    ('Manish Yadav', 'manish.yadav.g3@internhub.com', 'RPA', 'GEC Patan', '2004-10-05', 'B.E. Computer Engineering', '9010000011'),
    ('Krish Odhaviya', 'krish.odhaviya.g3@internhub.com', 'Java', 'GEC Rajkot', '2005-02-24', 'B.E. Computer Engineering', '9010000012'),
    ('Jethwani Nitin Bhagwandas', 'jethwani.nitin.g3@internhub.com', 'PHP', 'GEC Bhavnagar', '2004-09-02', 'B.E. Computer Engineering', '9010000013'),
    ('Devkumar Hareshbhai Bhimani', 'devkumar.bhimani.g3@internhub.com', 'AI', 'Charusat University', '2005-01-30', 'B.E. Computer Engineering', '9010000014'),
    ('Anshu Niketbhai Bhatt', 'anshu.bhatt.g3@internhub.com', 'QC', 'GLS', '2004-07-21', 'B.E. Computer Engineering', '9010000015'),

    ('Dhrumil Asodiya', 'dhrumil.asodiya.g4@internhub.com', 'Java', 'GEC Patan', '2005-03-12', 'B.E. Computer Engineering', '9010000016'),
    ('Yogesh Sondagar', 'yogesh.sondagar.g4@internhub.com', 'SAP.Net', 'GEC Bhavnagar', '2004-05-30', 'B.E. Computer Engineering', '9010000017'),
    ('Sachaniya Bhavin Vipulbhai', 'sachaniya.bhavin.g4@internhub.com', 'PHP', 'SSEC Bhavnagar', '2005-01-15', 'B.E. Computer Engineering', '9010000018'),
    ('Rahul Bhailabhai Prajapati', 'rahul.prajapati.g4@internhub.com', 'AI', 'VGEC', '2004-12-01', 'B.E. Computer Engineering', '9010000019'),
    ('Twinkle Dhananjay Singh', 'twinkle.singh.g4@internhub.com', 'QC', 'DDU', '2005-02-06', 'B.E. Computer Engineering', '9010000020'),

    ('Keval Bambhaniya', 'keval.bambhaniya.g5@internhub.com', 'Odoo', 'GEC Patan', '2004-08-12', 'B.E. Computer Engineering', '9010000021'),
    ('Krish Patel', 'krish.patel.g5@internhub.com', 'Java', 'GEC Modasa', '2005-03-27', 'B.E. Computer Engineering', '9010000022'),
    ('Nihir Mukeshbhai Kotadiya', 'nihir.kotadiya.g5@internhub.com', 'PHP', 'Charusat University', '2004-07-08', 'B.E. Computer Engineering', '9010000023'),
    ('Popat Modhwadiya', 'popat.modhwadiya.g5@internhub.com', 'AI', 'LDCE', '2005-01-19', 'B.E. Computer Engineering', '9010000024'),
    ('Bhargavi Karangiya', 'bhargavi.karangiya.g5@internhub.com', 'QC', 'GEC Morbi', '2004-10-23', 'B.E. Computer Engineering', '9010000025'),

    ('Vidhika Mahida', 'vidhika.mahida.g6@internhub.com', 'Java', 'MBIT', '2005-02-14', 'B.E. Computer Engineering', '9010000026'),
    ('Jay Odedra', 'jay.odedra.g6@internhub.com', 'PHP', 'GEC Bhavnagar', '2004-11-16', 'B.E. Computer Engineering', '9010000027'),
    ('Meet Akbari', 'meet.akbari.g6@internhub.com', '.Net-MEA', 'Darshan University', '2005-03-05', 'B.E. Computer Engineering', '9010000028'),
    ('Parkhiya Parth', 'parkhiya.parth.g6@internhub.com', 'AI', 'VGEC', '2004-09-25', 'B.E. Computer Engineering', '9010000029'),
    ('Mandeep Jadeja', 'mandeep.jadeja.g6@internhub.com', 'QC', 'GEC Bhavnagar', '2005-01-11', 'B.E. Computer Engineering', '9010000030'),

    ('Kashish Modi', 'kashish.modi.g7@internhub.com', 'SAP.Net', 'GEC Dahod', '2004-06-18', 'B.E. Computer Engineering', '9010000031'),
    ('Jay Kanjariya', 'jay.kanjariya.g7@internhub.com', 'PHP', 'GEC Bhavnagar', '2005-03-09', 'B.E. Computer Engineering', '9010000032'),
    ('Darshan Shaileshbhai Zatakiya', 'darshan.zatakiya.g7@internhub.com', 'Java', 'Charusat University', '2004-08-03', 'B.E. Computer Engineering', '9010000033'),
    ('Raj Satishbhai Patel', 'raj.patel.g7@internhub.com', 'AI', 'VGEC', '2005-02-01', 'B.E. Computer Engineering', '9010000034'),
    ('Chudasama Aviraj Dipakbhai', 'aviraj.chudasama.g7@internhub.com', 'QC', 'GEC Bhavnagar', '2004-12-15', 'B.E. Computer Engineering', '9010000035'),

    ('Khushi Patel', 'khushi.patel.g8@internhub.com', '.Net-GUDM', 'GEC Patan', '2005-01-26', 'B.E. Computer Engineering', '9010000036'),
    ('Kachhadiya Harshil Kishorbhai', 'harshil.kachhadiya.g8@internhub.com', '.Net-JIA', 'SSEC Bhavnagar', '2004-10-10', 'B.E. Computer Engineering', '9010000037'),
    ('Meet Dipakbhai Prajapati', 'meet.prajapati.g8@internhub.com', 'Mobile', 'Charusat University', '2005-02-20', 'B.E. Computer Engineering', '9010000038'),
    ('Dankhara Prachi Maganbhai', 'prachi.dankhara.g8@internhub.com', 'AI', 'VGEC', '2004-07-28', 'B.E. Computer Engineering', '9010000039'),
    ('Harsh Sarvaiya', 'harsh.sarvaiya.g8@internhub.com', 'QC', 'GEC Bhavnagar', '2005-03-17', 'B.E. Computer Engineering', '9010000040'),

    ('Utsavi Hetukkumar Patel', 'utsavi.patel.g9@internhub.com', 'PHP', 'Charusat University', '2004-09-11', 'B.E. Computer Engineering', '9010000041'),
    ('Harsh Sonagara', 'harsh.sonagara.g9@internhub.com', 'PHP', 'GEC Morbi', '2005-02-07', 'B.E. Computer Engineering', '9010000042'),
    ('Bhargav Vadhiya', 'bhargav.vadhiya.g9@internhub.com', 'Java', 'GEC Morbi', '2004-06-24', 'B.E. Computer Engineering', '9010000043'),
    ('Prince Rankaja', 'prince.rankaja.g9@internhub.com', 'PHP', 'ADIT', '2005-01-03', 'B.E. Computer Engineering', '9010000044'),
    ('Harsh Laljibhai Butani', 'harsh.butani.g9@internhub.com', '.Net-GUDM', 'Charusat University', '2004-11-22', 'B.E. Computer Engineering', '9010000045'),
    ('Krish Patel', 'krish.patel.g9@internhub.com', 'General', 'Independent', '2005-03-01', 'B.E. Computer Engineering', '9010000046'),

    ('Shreya Nareshbhai Vekariya', 'shreya.vekariya.g10@internhub.com', 'PHP', 'Charusat University', '2004-08-17', 'B.E. Computer Engineering', '9010000047'),
    ('Rishi Rajeshbhai Patel', 'rishi.patel.g10@internhub.com', 'PHP', 'Charusat University', '2005-02-13', 'B.E. Computer Engineering', '9010000048'),
    ('Panara Harsh', 'panara.harsh.g10@internhub.com', 'PHP', 'Darshan University', '2004-12-09', 'B.E. Computer Engineering', '9010000049'),
    ('Zalavadiya Nand Shaileshbhai', 'nand.zalavadiya.g10@internhub.com', 'SAP.Net', 'Darshan University', '2005-01-28', 'B.E. Computer Engineering', '9010000050'),
    ('Vaibhavi Chauhan', 'vaibhavi.chauhan.g10@internhub.com', 'General', 'Independent', '2004-10-31', 'B.E. Computer Engineering', '9010000051'),
    ('Het Sutariaya', 'het.sutariaya.g10@internhub.com', 'General', 'Independent', '2005-03-22', 'B.E. Computer Engineering', '9010000052')
)
INSERT INTO public.users (name, email, password, role, department_id, gender, contact_number)
SELECT
  i.name,
  i.email,
  c.password_hash,
  'intern',
  d.id,
  CASE
    WHEN i.name IN (
      'Jadeja Maitri',
      'Hetvi Zora',
      'Twinkle Dhananjay Singh',
      'Bhargavi Karangiya',
      'Vidhika Mahida',
      'Kashish Modi',
      'Khushi Patel',
      'Dankhara Prachi Maganbhai',
      'Utsavi Hetukkumar Patel',
      'Shreya Nareshbhai Vekariya',
      'Vaibhavi Chauhan'
    ) THEN 'female'
    ELSE 'male'
  END,
  i.contact_number
FROM intern_data i
JOIN public.departments d ON d.name = i.department_name
CROSS JOIN constants c
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  department_id = EXCLUDED.department_id,
  gender = EXCLUDED.gender,
  contact_number = EXCLUDED.contact_number;

WITH intern_data(email, college, date_of_birth, degree) AS (
  VALUES
    ('krishna.thakker.g1@internhub.com', 'GEC Patan', '2004-09-18'::date, 'B.E. Computer Engineering'),
    ('aditya.valand.g1@internhub.com', 'GEC Rajkot', '2005-01-22'::date, 'B.E. Computer Engineering'),
    ('vala.parimal.g1@internhub.com', 'GEC Bhavnagar', '2004-07-14'::date, 'B.E. Computer Engineering'),
    ('bhargav.dungrani.g1@internhub.com', 'Charusat University', '2005-03-03'::date, 'B.E. Computer Engineering'),
    ('jadeja.maitri.g1@internhub.com', 'GLS', '2004-11-09'::date, 'B.E. Computer Engineering'),
    ('hetvi.zora.g2@internhub.com', 'GEC Patan', '2005-02-11'::date, 'B.E. Computer Engineering'),
    ('neelkumar.thumar.g2@internhub.com', 'GEC Rajkot', '2004-08-29'::date, 'B.E. Computer Engineering'),
    ('muhammadhassan.gadhawala.g2@internhub.com', 'GEC Modasa', '2005-01-08'::date, 'B.E. Computer Engineering'),
    ('harsh.parsaniya.g2@internhub.com', 'Charusat University', '2004-06-27'::date, 'B.E. Computer Engineering'),
    ('ranpara.viraj.g2@internhub.com', 'GEC Morbi', '2005-03-19'::date, 'B.E. Computer Engineering'),
    ('manish.yadav.g3@internhub.com', 'GEC Patan', '2004-10-05'::date, 'B.E. Computer Engineering'),
    ('krish.odhaviya.g3@internhub.com', 'GEC Rajkot', '2005-02-24'::date, 'B.E. Computer Engineering'),
    ('jethwani.nitin.g3@internhub.com', 'GEC Bhavnagar', '2004-09-02'::date, 'B.E. Computer Engineering'),
    ('devkumar.bhimani.g3@internhub.com', 'Charusat University', '2005-01-30'::date, 'B.E. Computer Engineering'),
    ('anshu.bhatt.g3@internhub.com', 'GLS', '2004-07-21'::date, 'B.E. Computer Engineering'),
    ('dhrumil.asodiya.g4@internhub.com', 'GEC Patan', '2005-03-12'::date, 'B.E. Computer Engineering'),
    ('yogesh.sondagar.g4@internhub.com', 'GEC Bhavnagar', '2004-05-30'::date, 'B.E. Computer Engineering'),
    ('sachaniya.bhavin.g4@internhub.com', 'SSEC Bhavnagar', '2005-01-15'::date, 'B.E. Computer Engineering'),
    ('rahul.prajapati.g4@internhub.com', 'VGEC', '2004-12-01'::date, 'B.E. Computer Engineering'),
    ('twinkle.singh.g4@internhub.com', 'DDU', '2005-02-06'::date, 'B.E. Computer Engineering'),
    ('keval.bambhaniya.g5@internhub.com', 'GEC Patan', '2004-08-12'::date, 'B.E. Computer Engineering'),
    ('krish.patel.g5@internhub.com', 'GEC Modasa', '2005-03-27'::date, 'B.E. Computer Engineering'),
    ('nihir.kotadiya.g5@internhub.com', 'Charusat University', '2004-07-08'::date, 'B.E. Computer Engineering'),
    ('popat.modhwadiya.g5@internhub.com', 'LDCE', '2005-01-19'::date, 'B.E. Computer Engineering'),
    ('bhargavi.karangiya.g5@internhub.com', 'GEC Morbi', '2004-10-23'::date, 'B.E. Computer Engineering'),
    ('vidhika.mahida.g6@internhub.com', 'MBIT', '2005-02-14'::date, 'B.E. Computer Engineering'),
    ('jay.odedra.g6@internhub.com', 'GEC Bhavnagar', '2004-11-16'::date, 'B.E. Computer Engineering'),
    ('meet.akbari.g6@internhub.com', 'Darshan University', '2005-03-05'::date, 'B.E. Computer Engineering'),
    ('parkhiya.parth.g6@internhub.com', 'VGEC', '2004-09-25'::date, 'B.E. Computer Engineering'),
    ('mandeep.jadeja.g6@internhub.com', 'GEC Bhavnagar', '2005-01-11'::date, 'B.E. Computer Engineering'),
    ('kashish.modi.g7@internhub.com', 'GEC Dahod', '2004-06-18'::date, 'B.E. Computer Engineering'),
    ('jay.kanjariya.g7@internhub.com', 'GEC Bhavnagar', '2005-03-09'::date, 'B.E. Computer Engineering'),
    ('darshan.zatakiya.g7@internhub.com', 'Charusat University', '2004-08-03'::date, 'B.E. Computer Engineering'),
    ('raj.patel.g7@internhub.com', 'VGEC', '2005-02-01'::date, 'B.E. Computer Engineering'),
    ('aviraj.chudasama.g7@internhub.com', 'GEC Bhavnagar', '2004-12-15'::date, 'B.E. Computer Engineering'),
    ('khushi.patel.g8@internhub.com', 'GEC Patan', '2005-01-26'::date, 'B.E. Computer Engineering'),
    ('harshil.kachhadiya.g8@internhub.com', 'SSEC Bhavnagar', '2004-10-10'::date, 'B.E. Computer Engineering'),
    ('meet.prajapati.g8@internhub.com', 'Charusat University', '2005-02-20'::date, 'B.E. Computer Engineering'),
    ('prachi.dankhara.g8@internhub.com', 'VGEC', '2004-07-28'::date, 'B.E. Computer Engineering'),
    ('harsh.sarvaiya.g8@internhub.com', 'GEC Bhavnagar', '2005-03-17'::date, 'B.E. Computer Engineering'),
    ('utsavi.patel.g9@internhub.com', 'Charusat University', '2004-09-11'::date, 'B.E. Computer Engineering'),
    ('harsh.sonagara.g9@internhub.com', 'GEC Morbi', '2005-02-07'::date, 'B.E. Computer Engineering'),
    ('bhargav.vadhiya.g9@internhub.com', 'GEC Morbi', '2004-06-24'::date, 'B.E. Computer Engineering'),
    ('prince.rankaja.g9@internhub.com', 'ADIT', '2005-01-03'::date, 'B.E. Computer Engineering'),
    ('harsh.butani.g9@internhub.com', 'Charusat University', '2004-11-22'::date, 'B.E. Computer Engineering'),
    ('krish.patel.g9@internhub.com', 'Independent', '2005-03-01'::date, 'B.E. Computer Engineering'),
    ('shreya.vekariya.g10@internhub.com', 'Charusat University', '2004-08-17'::date, 'B.E. Computer Engineering'),
    ('rishi.patel.g10@internhub.com', 'Charusat University', '2005-02-13'::date, 'B.E. Computer Engineering'),
    ('panara.harsh.g10@internhub.com', 'Darshan University', '2004-12-09'::date, 'B.E. Computer Engineering'),
    ('nand.zalavadiya.g10@internhub.com', 'Darshan University', '2005-01-28'::date, 'B.E. Computer Engineering'),
    ('vaibhavi.chauhan.g10@internhub.com', 'Independent', '2004-10-31'::date, 'B.E. Computer Engineering'),
    ('het.sutariaya.g10@internhub.com', 'Independent', '2005-03-22'::date, 'B.E. Computer Engineering')
)
  INSERT INTO public.interns (user_id, college, joining_date, status, date_of_birth, degree)
SELECT
  u.id,
  i.college,
  '2026-01-15'::date,
  'active',
  i.date_of_birth,
  i.degree
FROM intern_data i
JOIN public.users u ON u.email = i.email
WHERE u.role = 'intern'
ON CONFLICT (user_id) DO UPDATE
SET
  college = EXCLUDED.college,
  joining_date = EXCLUDED.joining_date,
  status = EXCLUDED.status,
  date_of_birth = EXCLUDED.date_of_birth,
  degree = EXCLUDED.degree;

COMMIT;