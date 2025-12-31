-- 病院管理システム データベース初期化スクリプト

-- 診療科マスタテーブル
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 999,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 病棟マスタテーブル
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 999,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 外来患者記録テーブル（日次集計）
CREATE TABLE IF NOT EXISTS outpatient_records (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    new_patients_count INTEGER NOT NULL DEFAULT 0,
    returning_patients_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, department_id)
);

-- 入院患者記録テーブル（日次集計）
CREATE TABLE IF NOT EXISTS inpatient_records (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    ward_id INTEGER NOT NULL REFERENCES wards(id),
    department_id INTEGER NOT NULL REFERENCES departments(id),
    current_patient_count INTEGER NOT NULL DEFAULT 0,
    new_admission_count INTEGER NOT NULL DEFAULT 0,
    discharge_count INTEGER NOT NULL DEFAULT 0,
    transfer_out_count INTEGER NOT NULL DEFAULT 0,
    transfer_in_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, ward_id, department_id)
);

-- インデックス作成
CREATE INDEX idx_outpatient_date ON outpatient_records(date);
CREATE INDEX idx_outpatient_department ON outpatient_records(department_id);
CREATE INDEX idx_inpatient_date ON inpatient_records(date);
CREATE INDEX idx_inpatient_ward ON inpatient_records(ward_id);
CREATE INDEX idx_inpatient_department ON inpatient_records(department_id);

-- テストデータ: 診療科マスタ
INSERT INTO departments (code, name, display_order) VALUES
    ('01', '内科', 1),
    ('10', '小児科', 2),
    ('11', '外科', 3),
    ('12', '整形外科', 4),
    ('13', '形成外科', 5),
    ('24', '耳鼻咽喉科', 6),
    ('31', '泌尿器科', 7),
    ('75', '皮膚科', 8),
    ('39', '口腔外科', 9)
ON CONFLICT (code) DO NOTHING;

-- テストデータ: 病棟マスタ
INSERT INTO wards (code, name, capacity, display_order) VALUES
    ('003', '3階病棟', 50, 1),
    ('004', '4階病棟', 45, 2),
    ('005', '5階病棟', 60, 3)
ON CONFLICT (code) DO NOTHING;

-- テストデータ: 外来患者記録（過去30日分）
DO $$
DECLARE
    rec_date DATE := CURRENT_DATE - INTERVAL '30 days';
    dept_id INTEGER;
BEGIN
    WHILE rec_date <= CURRENT_DATE LOOP
        FOR dept_id IN SELECT id FROM departments LOOP
            INSERT INTO outpatient_records (date, department_id, new_patients_count, returning_patients_count)
            VALUES (
                rec_date,
                dept_id,
                FLOOR(RANDOM() * 20 + 5)::INTEGER,  -- 初診: 5-25人
                FLOOR(RANDOM() * 50 + 20)::INTEGER  -- 再診: 20-70人
            )
            ON CONFLICT (date, department_id) DO NOTHING;
        END LOOP;
        rec_date := rec_date + INTERVAL '1 day';
    END LOOP;
END $$;

-- テストデータ: 入院患者記録（過去30日分）
DO $$
DECLARE
    rec_date DATE := CURRENT_DATE - INTERVAL '30 days';
    w_id INTEGER;
    dept_id INTEGER;
    current_count INTEGER;
BEGIN
    WHILE rec_date <= CURRENT_DATE LOOP
        FOR w_id IN SELECT id FROM wards LOOP
            -- 各病棟に3-5診療科を割り当て
            FOR dept_id IN (SELECT id FROM departments ORDER BY RANDOM() LIMIT (FLOOR(RANDOM() * 3 + 3)::INTEGER)) LOOP
                current_count := FLOOR(RANDOM() * 15 + 10)::INTEGER;
                
                INSERT INTO inpatient_records (
                    date, ward_id, department_id,
                    current_patient_count,
                    new_admission_count,
                    discharge_count,
                    transfer_out_count,
                    transfer_in_count
                )
                VALUES (
                    rec_date,
                    w_id,
                    dept_id,
                    current_count,                              -- 在院: 10-25人
                    FLOOR(RANDOM() * 5 + 1)::INTEGER,          -- 新入院: 1-6人
                    FLOOR(RANDOM() * 5 + 1)::INTEGER,          -- 退院: 1-6人
                    FLOOR(RANDOM() * 3)::INTEGER,              -- 転出: 0-3人
                    FLOOR(RANDOM() * 3)::INTEGER               -- 転入: 0-3人
                )
                ON CONFLICT (date, ward_id, department_id) DO NOTHING;
            END LOOP;
        END LOOP;
        rec_date := rec_date + INTERVAL '1 day';
    END LOOP;
END $$;

-- データ確認用ビュー
CREATE OR REPLACE VIEW v_daily_outpatient_summary AS
SELECT 
    date,
    SUM(new_patients_count) as total_new,
    SUM(returning_patients_count) as total_returning,
    SUM(new_patients_count + returning_patients_count) as total_patients
FROM outpatient_records
GROUP BY date
ORDER BY date DESC;

CREATE OR REPLACE VIEW v_daily_inpatient_summary AS
SELECT 
    date,
    SUM(current_patient_count) as total_current,
    SUM(new_admission_count) as total_new_admission,
    SUM(discharge_count) as total_discharge,
    SUM(transfer_out_count) as total_transfer_out,
    SUM(transfer_in_count) as total_transfer_in
FROM inpatient_records
GROUP BY date
ORDER BY date DESC;
