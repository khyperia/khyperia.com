md_files=$(shell find . -type f -name '*.md')
html_files=$(md_files:.md=.html)
extra_files=pandoc.css
all_files=$(html_files) $(extra_files)
dest_folder=/srv/http

.PHONY: all clean install

all: $(all_files)

%.html: %.md pandoc.css Makefile
	pandoc -s --self-contained -c pandoc.css -f markdown -t html -o $@ $<

install: all | $(dest_folder)
	@echo Invoking sudo to copy files...
	sudo cp --parents $(all_files) $(dest_folder)

clean:
	rm -f $(shell find . -type f -name '*.html')
