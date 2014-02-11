#!/bin/sh

# This script creates a virtualenv to execute the project in isolation

env_path="env"
while getopts e: opt
do
  case $opt in
  e) env_path=$OPTARG
     ;;
  esac
done

echo "---------------------------------------------------------"
echo "* Creating the project's environment..."
virtualenv-2.7 $env_path --python=python2.7 --no-site-packages
echo "* Now run: source env/bin/activate"
echo "---------------------------------------------------------"
