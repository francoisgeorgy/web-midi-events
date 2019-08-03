#!/usr/bin/env bash

DEST=~/dev/projects/sysex.io/midi-baby/editor

cd ~/dev/projects/midi-baby-editor

rm -rf ${DEST}/static ${DEST}/*.js ${DEST}/*.html
#rm -rf ${DEST}/*.js
#rm -rf ${DEST}/*.html

rsync -av --exclude=.DS_Store build/ ${DEST}/

# rsync -av --exclude=.DS_Store ${DEST}/ kimsufi:/home/sites/sysex.io/midi-baby/editor/
rsync -avi --delete --exclude=.DS_Store build/ kimsufi:/home/sites/sysex.io/midi-baby/editor/