Installing RAMS locally
===

* Install python 3 and sqlite
* Install (using pip or your package manager): virtualenv, paver, distribute
* `git clone https://github.com/magfest/sideboard`
* `cd sideboard`
* `git clone https://github.com/magfest/ubersystem plugins/uber`
* (the above *must* be a dir named uber, not ubersystem)
* `paver make_venv`
* `paver install_deps` # maybe not needed??
* Init the DB, and create test admin account: `./env/bin/sep reset_uber_db`
* Run the stuff and the things! `./env/bin/python sideboard/run_server.py`
* (note the clone dir is probably `sideboard`, so it's `.../sideboard/sideboard/run_server.py`)
