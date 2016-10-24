md_files=$(shell find . -type f -name '*.md')
html_files=$(md_files:.md=.html)
dest_folder=/var/www/khyperia.com

.PHONY: all clean install

all: $(html_files)

%.html: %.md
	pandoc -s -f markdown -t html -o $@ $<

install: all | $(dest_folder)
	@echo Invoking sudo to copy files...
	sudo cp --parents $(html_files) $(dest_folder)

clean:
	rm -f $(shell find . -type f -name '*.html')
