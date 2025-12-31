# テストデータ投入ガイド

画面は表示されているが、データが表示されない場合の対処法です。

## 方法1: Dockerコンテナ経由でSQLを実行

PostgreSQLコンテナが起動している場合：

```bash
# プロジェクトディレクトリに移動
cd /path/to/your/project

# PostgreSQLコンテナ内でSQLを実行
docker compose exec postgres psql -U hospital_user -d hospital_db -f /docker-entrypoint-initdb.d/init.sql

# または、直接psqlに接続してSQLをコピー&ペースト
docker compose exec postgres psql -U hospital_user -d hospital_db
```

## 方法2: ホストからPostgreSQLに接続して実行

```bash
# プロジェクトディレクトリに移動
cd /path/to/your/project

# psqlコマンドでSQLファイルを実行
PGPASSWORD=hospital_pass psql -h localhost -p 5432 -U hospital_user -d hospital_db -f postgres/init.sql
```

## 方法3: データベースを完全にリセット

```bash
# コンテナとボリュームを削除
docker compose down -v

# 再起動（初期化スクリプトが自動実行される）
docker compose up -d

# ログで初期化を確認
docker compose logs postgres
```

## 方法4: GraphQL Playgroundから確認

1. ブラウザで http://localhost:4000/graphql にアクセス
2. 以下のクエリを実行してデータを確認：

```graphql
query {
  departments {
    id
    name
    code
  }
}
```

データが返ってこない場合は、以下で診療科マスタのみ投入：

```bash
docker compose exec postgres psql -U hospital_user -d hospital_db -c "
INSERT INTO departments (code, name) VALUES
    ('INT', '内科'),
    ('SUR', '外科'),
    ('PED', '小児科'),
    ('ORT', '整形外科'),
    ('OBS', '産婦人科'),
    ('OPH', '眼科'),
    ('ENT', '耳鼻咽喉科'),
    ('DER', '皮膚科'),
    ('PSY', '精神科'),
    ('RAD', '放射線科')
ON CONFLICT (code) DO NOTHING;
"
```

## 方法5: 手動でテーブル確認とデータ投入

```bash
# PostgreSQLに接続
docker compose exec postgres psql -U hospital_user -d hospital_db

# テーブル一覧を確認
\dt

# データ件数確認
SELECT COUNT(*) FROM departments;
SELECT COUNT(*) FROM wards;
SELECT COUNT(*) FROM outpatient_records;
SELECT COUNT(*) FROM inpatient_records;

# データが0件の場合、以下を実行
```

### 診療科マスタ投入
```sql
INSERT INTO departments (code, name) VALUES
    ('INT', '内科'),
    ('SUR', '外科'),
    ('PED', '小児科'),
    ('ORT', '整形外科'),
    ('OBS', '産婦人科'),
    ('OPH', '眼科'),
    ('ENT', '耳鼻咽喉科'),
    ('DER', '皮膚科'),
    ('PSY', '精神科'),
    ('RAD', '放射線科')
ON CONFLICT (code) DO NOTHING;
```

### 病棟マスタ投入
```sql
INSERT INTO wards (code, name, capacity) VALUES
    ('W1', '第1病棟', 50),
    ('W2', '第2病棟', 45),
    ('W3', '第3病棟', 60),
    ('W4', '第4病棟', 40),
    ('ICU', 'ICU', 20),
    ('CCU', 'CCU', 15)
ON CONFLICT (code) DO NOTHING;
```

### 外来患者データ投入（過去30日分）
```sql
DO $$
DECLARE
    current_date DATE := CURRENT_DATE - INTERVAL '30 days';
    dept_id INTEGER;
BEGIN
    WHILE current_date <= CURRENT_DATE LOOP
        FOR dept_id IN SELECT id FROM departments LOOP
            INSERT INTO outpatient_records (date, department_id, new_patients_count, returning_patients_count)
            VALUES (
                current_date,
                dept_id,
                FLOOR(RANDOM() * 20 + 5)::INTEGER,
                FLOOR(RANDOM() * 50 + 20)::INTEGER
            )
            ON CONFLICT (date, department_id) DO NOTHING;
        END LOOP;
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END $$;
```

### 入院患者データ投入（過去30日分）
```sql
DO $$
DECLARE
    current_date DATE := CURRENT_DATE - INTERVAL '30 days';
    w_id INTEGER;
    dept_id INTEGER;
    current_count INTEGER;
BEGIN
    WHILE current_date <= CURRENT_DATE LOOP
        FOR w_id IN SELECT id FROM wards LOOP
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
                    current_date,
                    w_id,
                    dept_id,
                    current_count,
                    FLOOR(RANDOM() * 5 + 1)::INTEGER,
                    FLOOR(RANDOM() * 5 + 1)::INTEGER,
                    FLOOR(RANDOM() * 3)::INTEGER,
                    FLOOR(RANDOM() * 3)::INTEGER
                )
                ON CONFLICT (date, ward_id, department_id) DO NOTHING;
            END LOOP;
        END LOOP;
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END $$;
```

### データ投入確認
```sql
-- 診療科数確認
SELECT COUNT(*) FROM departments;  -- 10件

-- 病棟数確認
SELECT COUNT(*) FROM wards;  -- 6件

-- 外来患者記録確認
SELECT COUNT(*) FROM outpatient_records;  -- 約310件（31日×10診療科）

-- 入院患者記録確認
SELECT COUNT(*) FROM inpatient_records;  -- 数百件

-- 最新データ確認
SELECT * FROM outpatient_records ORDER BY date DESC LIMIT 10;
SELECT * FROM inpatient_records ORDER BY date DESC LIMIT 10;
```

## トラブルシューティング

### エラー: relation "departments" does not exist
テーブルが作成されていません。`postgres/init.sql`の最初の部分を実行してください。

### エラー: duplicate key value violates unique constraint
データが既に存在しています。問題ありません。

### データは投入されたが画面に表示されない
1. ブラウザのコンソール（F12）でエラーを確認
2. GraphQL APIが正しく動作しているか確認：http://localhost:4000/graphql
3. ダッシュボードの環境変数を確認：`dashboard/.env`の`VITE_GRAPHQL_URL`

### GraphQL APIが起動しない
```bash
# GraphQLサーバーのログ確認
docker compose logs graphql-server

# データベース接続確認
docker compose exec graphql-server ping postgres
```

## 確認用GraphQLクエリ

データが正しく投入されたか確認：

```graphql
# 診療科一覧
query {
  departments {
    id
    name
    code
  }
}

# 外来患者サマリー（過去7日）
query {
  outpatientSummary(
    startDate: "2025-12-24"
    endDate: "2025-12-31"
  ) {
    date
    totalNew
    totalReturning
    totalPatients
  }
}

# 入院患者サマリー（過去7日）
query {
  inpatientSummary(
    startDate: "2025-12-24"
    endDate: "2025-12-31"
  ) {
    date
    totalCurrent
    totalNewAdmission
    totalDischarge
  }
}
```

これらのクエリでデータが返ってくれば、ダッシュボードにも表示されるはずです。
