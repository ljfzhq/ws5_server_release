@echo off
title Backup WS5 DB
if not "%1"=="" goto startbk1
@echo Usage:
@echo backup_script.bat $port  OR  backup_script.bat $port info
@echo e.g.   backup_script.bat 27017   OR  backup_script.bat 27017 info
goto end
:startbk1
if "%WS5Data%"=="" set WS5Data=%WS5%
IF EXIST "%WS5Data%\lib\backupdb" goto startbk2
mkdir "%WS5Data%\lib\backupdb"
:startbk2
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c site --jsonArray > %WS5Data%\lib\backupdb\site.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c schedule --jsonArray > %WS5Data%\lib\backupdb\schedule.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c player --jsonArray > %WS5Data%\lib\backupdb\player.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c task --jsonArray > %WS5Data%\lib\backupdb\task.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c privilege --jsonArray > %WS5Data%\lib\backupdb\privilege.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c role --jsonArray > %WS5Data%\lib\backupdb\role.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c config --jsonArray > %WS5Data%\lib\backupdb\config.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c account --jsonArray > %WS5Data%\lib\backupdb\account.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c publish --jsonArray > %WS5Data%\lib\backupdb\publish.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c media --jsonArray > %WS5Data%\lib\backupdb\media.txt
%WS5%\exe\mongodb\mongoexport -h 127.0.0.1 --port %1 --db websignage -c channel --jsonArray > %WS5Data%\lib\backupdb\channel.txt
@if "%2"=="info" goto showInfo
goto end
:showInfo
@echo ________________________________________
@echo ----------------------------------------
@echo Finished!!
@echo If there is no error, all backup files are under the folder %WS5Data%\lib\backupdb
pause
:end



