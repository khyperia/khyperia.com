SHELL:=/bin/bash
source_files=$(shell find . -type f -a \( -name '*.md' -o -name '*.css' -o -name '*.txt' \) )
built_files=$(source_files:.md=.html)
dest_folder=/srv/http

.PHONY: all clean install

all: $(built_files)

%.html: %.md pandoc.css Makefile
	pandoc -s -c /pandoc.css -f markdown -t html -o $@ $<

install: all | $(dest_folder)
	@echo Invoking sudo to copy files...
	sudo cp --parents $(built_files) $(dest_folder)

clean:
	rm -f $(shell find . -type f -name '*.html')

diff:
	comm -23 <(cd $(dest_folder); find . -type f | sort) <(printf '%s\n' $(built_files) | sort)
