@echo off
echo Building and running TaskMaster To-Do List Application...

:: Create build directory if it doesn't exist
if not exist backend\build mkdir backend\build

:: Navigate to build directory
cd backend\build

:: Generate build files with CMake
echo Generating build files with CMake...
cmake ..

:: Build the project
echo Building the project...
cmake --build . --config Release

:: Check if build was successful
if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Please check the error messages above.
    pause
    exit /b %ERRORLEVEL%
)

:: Run the server
echo Starting the server...
start Release\server.exe

:: Open the application in the default browser
echo Opening application in browser...
timeout /t 2 /nobreak > nul
start http://localhost:8080

echo.
echo TaskMaster is now running!
echo Server: http://localhost:8080
echo Press Ctrl+C in the server window to stop the server when done.
echo.

pause