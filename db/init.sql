CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users(id BIGSERIAL PRIMARY KEY,name VARCHAR(120) NOT NULL,email VARCHAR(180) UNIQUE NOT NULL,password_hash TEXT NOT NULL,role VARCHAR(20) NOT NULL DEFAULT 'EDITOR' CHECK(role IN('ADMIN','EDITOR')),active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS site_settings(key VARCHAR(80) PRIMARY KEY,value TEXT NOT NULL DEFAULT '',updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS activities(id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,description TEXT DEFAULT '',event_date TIMESTAMPTZ,location VARCHAR(180) DEFAULT '',image_url TEXT,published BOOLEAN DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS studies(id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,summary TEXT DEFAULT '',content TEXT DEFAULT '',image_url TEXT,published BOOLEAN DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS testimonies(id BIGSERIAL PRIMARY KEY,author_name VARCHAR(120) NOT NULL,title VARCHAR(180) DEFAULT '',content TEXT NOT NULL,image_url TEXT,published BOOLEAN DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS videos(id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,description TEXT DEFAULT '',video_url TEXT NOT NULL,thumbnail_url TEXT,published BOOLEAN DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS songs(id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,artist VARCHAR(120) DEFAULT '',audio_url TEXT NOT NULL,cover_url TEXT,published BOOLEAN DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS quizzes(id BIGSERIAL PRIMARY KEY,title VARCHAR(180) NOT NULL,description TEXT DEFAULT '',published BOOLEAN DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS quiz_questions(id BIGSERIAL PRIMARY KEY,quiz_id BIGINT REFERENCES quizzes(id) ON DELETE CASCADE,question TEXT NOT NULL,sort_order INT DEFAULT 0);
CREATE TABLE IF NOT EXISTS quiz_options(id BIGSERIAL PRIMARY KEY,question_id BIGINT REFERENCES quiz_questions(id) ON DELETE CASCADE,option_text TEXT NOT NULL,is_correct BOOLEAN DEFAULT FALSE,sort_order INT DEFAULT 0);
INSERT INTO site_settings(key,value) VALUES
('site_name','Ministerio Redención y Vida'),('site_subtitle','Un lugar de fe, esperanza, redención y vida'),
('hero_title','Bienvenidos al Ministerio Redención y Vida'),('hero_text','Creemos en la Palabra, en la restauración de las familias y en una vida transformada por Dios.'),
('whatsapp_number','18090000000'),('whatsapp_message','Hola, quiero comunicarme con el Ministerio Redención y Vida.'),
('donation_title','Apoya la obra del Ministerio'),('donation_text','Tu aporte ayuda a sostener las actividades y proyectos del ministerio.'),('donation_url',''),
('donation_cash_enabled','true'),('donation_cash_title','Donación en efectivo'),('donation_cash_text','Puedes realizar tu aporte en efectivo durante los horarios de reunión de la iglesia. Consulta la ubicación y los horarios publicados.'),
('donation_bank_enabled','true'),('donation_bank_title','Transferencia bancaria · República Dominicana'),('donation_bank_name',''),('donation_bank_account_holder',''),('donation_bank_account_type','Cuenta corriente / ahorro'),('donation_bank_account_number',''),('donation_bank_id',''),('donation_bank_currency','DOP'),('donation_bank_swift',''),('donation_bank_instructions',''),
('donation_online_enabled','false'),('donation_online_title','Donación en línea'),('donation_online_text',''),('donation_online_url',''),
('donation_other_enabled','false'),('donation_other_title','Otro medio de donación'),('donation_other_text',''),
('verse_enabled','true'),('verse_title','Versículo del día'),('verse_reference','Juan 3:16'),('verse_text','Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'),('verse_explanation','Este versículo presenta el amor de Dios como iniciativa de salvación y esperanza. La fe cristiana entiende que ese amor invita a recibir la vida nueva que Dios ofrece.'),
('church_name','Ministerio Redención y Vida'),('church_address',''),('church_city',''),('church_schedule',''),('church_phone',''),('church_map_url',''),('church_directions_url',''),('church_map_embed_url',''),
('contact_email','contacto@ministerio.local'),('facebook_url','#'),('youtube_url','#'),('instagram_url','#')
ON CONFLICT(key) DO NOTHING;
INSERT INTO activities(title,description,event_date,location) SELECT 'Culto de Adoración','Celebración, palabra y oración comunitaria.',NOW()+INTERVAL '2 days','Templo Principal' WHERE NOT EXISTS(SELECT 1 FROM activities);
INSERT INTO studies(title,summary,content) SELECT 'La esperanza que transforma','Estudio bíblico de introducción.','Este contenido puede reemplazarse desde Administración.' WHERE NOT EXISTS(SELECT 1 FROM studies);
INSERT INTO testimonies(author_name,title,content) SELECT 'Comunidad','Historias de fe','Este espacio está preparado para testimonios autorizados.' WHERE NOT EXISTS(SELECT 1 FROM testimonies);
INSERT INTO videos(title,description,video_url) SELECT 'Mensaje de bienvenida','Video de presentación del ministerio.','https://www.youtube.com/watch?v=dQw4w9WgXcQ' WHERE NOT EXISTS(SELECT 1 FROM videos);
INSERT INTO quizzes(title,description) SELECT 'Conociendo la Palabra','Cuestionario bíblico interactivo de ejemplo.' WHERE NOT EXISTS(SELECT 1 FROM quizzes);
INSERT INTO quiz_questions(quiz_id,question,sort_order) SELECT id,'¿Qué libro contiene los Salmos?',1 FROM quizzes WHERE title='Conociendo la Palabra' AND NOT EXISTS(SELECT 1 FROM quiz_questions);
INSERT INTO quiz_options(question_id,option_text,is_correct,sort_order)
SELECT q.id,'Salmos',TRUE,1 FROM quiz_questions q WHERE q.question='¿Qué libro contiene los Salmos?'
UNION ALL SELECT q.id,'Éxodo',FALSE,2 FROM quiz_questions q WHERE q.question='¿Qué libro contiene los Salmos?'
UNION ALL SELECT q.id,'Rut',FALSE,3 FROM quiz_questions q WHERE q.question='¿Qué libro contiene los Salmos?';
