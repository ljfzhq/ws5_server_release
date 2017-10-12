@echo off
title Restore WS5 DB
if not "%1"=="" goto startrs1
@echo Usage:
@echo restore_script.bat $port  OR  restore_script.bat $port info
@echo e.g.   restore_script.bat 27017   OR  restore_script.bat 27017 info
goto end
:startrs1
if "%WS5Data%"=="" set WS5Data=%WS5%
IF EXIST "%WS5Data%\lib\backupdb" goto startrs2
@echo Please make sure the db backup files under the folder %WS5Data%\lib\backupdb
pause
:startrs2
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c site --jsonArray --upsert --file %WS5Data%\lib\backupdb\site.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c schedule --jsonArray --upsert --file %WS5Data%\lib\backupdb\schedule.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c player --jsonArray --upsert --file %WS5Data%\lib\backupdb\player.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c task --jsonArray --upsert --file %WS5Data%\lib\backupdb\task.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c privilege --jsonArray --upsert --file %WS5Data%\lib\backupdb\privilege.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c role --jsonArray --upsert --file %WS5Data%\lib\backupdb\role.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c config --jsonArray --upsert --file %WS5Data%\lib\backupdb\config.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c account --jsonArray --upsert --file %WS5Data%\lib\backupdb\account.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c publish --jsonArray --upsert --file %WS5Data%\lib\backupdb\publish.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c media --jsonArray --upsert --file %WS5Data%\lib\backupdb\media.txt
%WS5%\exe\mongodb\mongoimport -h 127.0.0.1 --port %1 -d websignage -c channel --jsonArray --upsert --file %WS5Data%\lib\backupdb\channel.txt
@if "%2"=="info" goto showInfo
goto end
:showInfo
@echo ________________________________________
@echo ----------------------------------------
@echo Finished!!
pause
:end
