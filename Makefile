SHELL:=/bin/bash
md_files:=$(shell find . -type f -a -name '*.md')
built_html_files:=$(source_files:.md=.html) fractals.html
dest_folder:=/srv/http
excluded:=--exclude=*.md --exclude=.*
rsync_args:=--verbose --copy-links --times --recursive --delete --delete-excluded --link-dest=$(PWD) $(excluded)

.PHONY: all clean install diff

title = $(if $(subst /index,,/$(1)),$(subst /index,,/$(1)),khyperia.com)

all: $(built_html_files)

%.html: %.md Makefile
	@echo "$< -> $@"
	@(echo "<html>"; TITLE="&#10084; $(call title,$*)" envsubst < head.template; echo "<body>"; markdown $<; echo "</body>"; echo "</html>") > $@

install: all | $(dest_folder)
	@echo Invoking sudo to copy files...
	sudo rsync $(rsync_args) $(PWD)/ $(dest_folder)

#sed 's/!\[](\(.*\)\/\(.*\))/[![](\/image\/\2)](\1\/\2)/' -i $(shell find . -type f -name '*.md')

fractals.md: fractals.py fractals/*
	./fractals.py > fractals.md

# Imagemagick uses /tmp when it runs out of memory... but /tmp is a ramdisk.
convert: fractals.md
	rg '^.*\[!\[\]\(/?(.*)\)\]\(/?(.*)\).*$$' --no-ignore-vcs --replace='if [ ! -e "$$1" ]; then; echo "$$2" && convert "$$2" -resize 750x-1 "$$1" || echo "failed!"; fi' -g '*.md' --no-filename | zsh -
