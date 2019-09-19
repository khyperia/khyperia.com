SHELL:=/bin/bash
source_files:=$(shell find . -type l -o -type f -a \( -name '*.md' -o -name '*.css' -o -name '*.txt' -o -name '*.jpg' -o -name '*.png' -o -name '*.ico' \) )
kept_html_files:=$(shell find ./mlpds ./spacerunner4 ./acefrom.space -type f \( -name '*.html' -o -name '*.js' \))
f_files:=$(shell find ./f -type f)
built_files:=$(source_files:.md=.html) $(kept_html_files) $(f_files)
dest_folder:=/srv/http

.PHONY: all clean install diff

title = $(if $(subst /index,,/$(1)),$(subst /index,,/$(1)),khyperia.com)

all: $(built_files)

%.html: %.md Makefile
	@echo "$< -> $@"
	@(echo "<html>"; TITLE="&#10084; $(call title,$*)" envsubst < head.template; echo "<body>"; markdown $<; echo "</body>"; echo "</html>") > $@

install: all | $(dest_folder)
	@echo Invoking sudo to copy files...
	sudo rsync --verbose --copy-links --times --relative --recursive $(built_files) $(dest_folder)

diff:
	comm -3 <(cd $(dest_folder); find . -not -type d | sort) <(printf '%s\n' $(built_files) | sort)

#sed 's/!\[](\(.*\)\/\(.*\))/[![](\/image\/\2)](\1\/\2)/' -i $(shell find . -type f -name '*.md')

fractals.md: fractals.py fractals/*
	./fractals.py > fractals.md

# Imagemagick uses /tmp when it runs out of memory... but /tmp is a ramdisk.
convert: fractals.md
	rg '^.*\[!\[\]\(/?(.*)\)\]\(/?(.*)\).*$$' --no-ignore-vcs --replace='if [ ! -e "$$1" ]; then; echo "$$2" && convert -cache 128 "$$2" -resize 750x-1 "$$1" || echo "failed!"; fi' -g '*.md' --no-filename | zsh -
