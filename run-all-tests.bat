@echo off
REM Hospital Dashboard - All Tests Runner (Windows)
REM このスクリプトはすべてのテストを順次実行します

setlocal enabledelayedexpansion

echo ==========================================
echo 🧪 Hospital Dashboard - All Tests Runner
echo ==========================================
echo.

set ROOT_DIR=%CD%
set TESTS_PASSED=0
set TESTS_FAILED=0

REM A. サーバーのユニットテスト
echo.
echo ==========================================
echo 🧪 Running: Server Unit Tests
echo ==========================================
cd "%ROOT_DIR%\graphql-server"
call npm run test:unit
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server Unit Tests PASSED
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Server Unit Tests FAILED
    set /a TESTS_FAILED+=1
)
cd "%ROOT_DIR%"

REM B. サーバーの統合テスト
echo.
echo ==========================================
echo 🧪 Running: Server Integration Tests
echo ==========================================
cd "%ROOT_DIR%\graphql-server"
call npm run test:integration
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server Integration Tests PASSED
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Server Integration Tests FAILED
    set /a TESTS_FAILED+=1
)
cd "%ROOT_DIR%"

REM C. クライアントのコンポーネントテスト
echo.
echo ==========================================
echo 🧪 Running: Client Component Tests
echo ==========================================
cd "%ROOT_DIR%\dashboard"
call npm test
if %ERRORLEVEL% EQU 0 (
    echo ✅ Client Component Tests PASSED
    set /a TESTS_PASSED+=1
) else (
    echo ❌ Client Component Tests FAILED
    set /a TESTS_FAILED+=1
)
cd "%ROOT_DIR%"

REM D. E2Eテスト（Dockerが起動している必要があります）
echo.
echo ==========================================
echo 🔍 Checking Docker services...
echo ==========================================
docker compose ps | findstr "Up" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker services are running
    echo.
    echo ==========================================
    echo 🧪 Running: E2E Tests
    echo ==========================================
    cd "%ROOT_DIR%\e2e-tests"
    call npm test
    if !ERRORLEVEL! EQU 0 (
        echo ✅ E2E Tests PASSED
        set /a TESTS_PASSED+=1
    ) else (
        echo ❌ E2E Tests FAILED
        set /a TESTS_FAILED+=1
    )
    cd "%ROOT_DIR%"
) else (
    echo ⚠️  Docker services are not running
    echo Skipping E2E tests. Start Docker with: docker compose up -d
    echo.
)

REM 結果サマリー
echo.
echo ==========================================
echo 📊 Test Results Summary
echo ==========================================
echo ✅ Passed: %TESTS_PASSED%
echo ❌ Failed: %TESTS_FAILED%
echo.

if %TESTS_FAILED% EQU 0 (
    echo 🎉 All tests passed!
    exit /b 0
) else (
    echo 💥 Some tests failed!
    exit /b 1
)
