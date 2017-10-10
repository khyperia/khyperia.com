SHELL:=/bin/bash
source_files:=$(shell find . -type l -o -type f -a \( -name '*.md' -o -name '*.css' -o -name '*.txt' -o -name '*.jpg' \) )
mlpds_html_files:=$(shell find ./mlpds -type f -name '*.html')
f_files:=$(shell find ./f -type f)
built_files:=$(source_files:.md=.html) $(mlpds_html_files) $(f_files)
dest_folder:=/srv/http

.PHONY: all clean install diff

all: $(built_files)

%.html: %.md Makefile
	@echo "$< -> $@"
	@(echo "<html>"; TITLE=$* envsubst < head.template; echo "<body>"; markdown $<; echo "</body>"; echo "</html>") > $@

install: all | $(dest_folder)
	@echo Invoking sudo to copy files...
	sudo rsync --verbose --links --relative $(built_files) $(dest_folder)

diff:
	comm -3 <(cd $(dest_folder); find . -not -type d | sort) <(printf '%s\n' $(built_files) | sort)
