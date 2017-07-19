SHELL:=/bin/bash
source_files=$(shell find . -type l -o -type f -a \( -name '*.md' -o -name '*.css' -o -name '*.txt' \) )
built_files=$(source_files:.md=.html)
dest_folder=/srv/http

.PHONY: all clean install

all: $(built_files)

%.html: %.md Makefile
	(echo "<html>"; cat head.template; echo "<body>"; markdown $<; echo "</body>"; echo "</html>") > $@

install: all | $(dest_folder)
	@echo Invoking sudo to copy files...
	sudo rsync --verbose --links --relative $(built_files) $(dest_folder)

clean:
	rm -f $(shell find . -type f -name '*.html')

diff:
	comm -3 <(cd $(dest_folder); find . -not -type d | sort) <(printf '%s\n' $(built_files) | sort)
