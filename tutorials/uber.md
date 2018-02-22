Installing RAMS locally
===

* Install python 3 and sqlite
* Install (via package manager or `pip install --user`): virtualenv, paver
* `git clone https://github.com/magfest/sideboard`
* `cd sideboard`
* `git clone https://github.com/magfest/ubersystem plugins/uber`
    * (the above *must* be a dir named uber, not ubersystem)
* `paver make_venv` (may be at `~/.local/bin/paver`, depending on install)
* `./bin/env/paver install_deps`
* Init the DB, and create test admin account: `./env/bin/sep reset_uber_db`
* Run the stuff and the things! `./env/bin/python sideboard/run_server.py`
* RAMS is now running on `localhost:8282`!
