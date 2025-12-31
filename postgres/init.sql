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

-- 権限テーブル
CREATE TABLE IF NOT EXISTS permissions (
    job_type_code VARCHAR(2) PRIMARY KEY,
    job_type_name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL DEFAULT 10
);

-- 職員テーブル
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    job_type_code VARCHAR(2) NOT NULL REFERENCES permissions(job_type_code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 医師テーブル
CREATE TABLE IF NOT EXISTS doctors (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) NOT NULL REFERENCES departments(code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 売上テーブル
CREATE TABLE IF NOT EXISTS sales (
    doctor_code VARCHAR(20) NOT NULL REFERENCES doctors(code),
    year_month VARCHAR(7) NOT NULL,
    outpatient_sales BIGINT NOT NULL DEFAULT 0,
    inpatient_sales BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (doctor_code, year_month)
);

-- インデックス作成
CREATE INDEX idx_outpatient_date ON outpatient_records(date);
CREATE INDEX idx_outpatient_department ON outpatient_records(department_id);
CREATE INDEX idx_inpatient_date ON inpatient_records(date);
CREATE INDEX idx_inpatient_ward ON inpatient_records(ward_id);
CREATE INDEX idx_inpatient_department ON inpatient_records(department_id);
CREATE INDEX idx_staff_job_type ON staff(job_type_code);
CREATE INDEX idx_doctors_department ON doctors(department_code);
CREATE INDEX idx_sales_year_month ON sales(year_month);
CREATE INDEX idx_sales_doctor ON sales(doctor_code);

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

-- テストデータ: 権限マスタ
INSERT INTO permissions (job_type_code, job_type_name, level) VALUES
    ('10', '医師', 10),
    ('11', '歯科医師', 10),
    ('80', 'その他', 10),
    ('90', 'システム管理者', 99),
    ('99', '事務部長', 90)
ON CONFLICT (job_type_code) DO NOTHING;

-- テストデータ: 職員マスタ
INSERT INTO staff (id, name, job_type_code) VALUES
    ('admin001', '管理者 太郎', '90'),
    ('director001', '事務部長 花子', '99'),
    ('doctor001', '山田 一郎', '10'),
    ('doctor002', '佐藤 二郎', '10'),
    ('dentist001', '鈴木 三郎', '11'),
    ('staff001', '田中 四郎', '80')
ON CONFLICT (id) DO NOTHING;

-- テストデータ: 医師マスタ
INSERT INTO doctors (code, name, department_code) VALUES
    ('D001', '山田 一郎', '01'),
    ('D002', '佐藤 次郎', '01'),
    ('D003', '鈴木 三郎', '10'),
    ('D004', '高橋 四郎', '11'),
    ('D005', '田中 五郎', '11'),
    ('D006', '伊藤 六郎', '12'),
    ('D007', '渡辺 七郎', '13'),
    ('D008', '山本 八郎', '24'),
    ('D009', '中村 九郎', '31'),
    ('D010', '小林 十郎', '75')
ON CONFLICT (code) DO NOTHING;

-- テストデータ: 売上データ（過去24ヶ月分）
DO $$
DECLARE
    target_month DATE := CURRENT_DATE - INTERVAL '24 months';
    year_month_str VARCHAR(7);
    doc_code VARCHAR(20);
BEGIN
    WHILE target_month <= CURRENT_DATE LOOP
        year_month_str := TO_CHAR(target_month, 'YYYY-MM');
        
        FOR doc_code IN SELECT code FROM doctors LOOP
            INSERT INTO sales (doctor_code, year_month, outpatient_sales, inpatient_sales)
            VALUES (
                doc_code,
                year_month_str,
                FLOOR(RANDOM() * 5000000 + 1000000)::BIGINT,  -- 外来: 100万〜600万円
                FLOOR(RANDOM() * 10000000 + 2000000)::BIGINT  -- 入院: 200万〜1200万円
            )
            ON CONFLICT (doctor_code, year_month) DO NOTHING;
        END LOOP;
        
        target_month := target_month + INTERVAL '1 month';
    END LOOP;
END $$;

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
